"""ClipIA: servidor web privado (una sola contraseña)."""
import hmac
import json
import re
import time
import zipfile
from collections import defaultdict
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

from .config import settings
from .jobs import JobStore, Worker
from .models import JobCreate, JobOptions

STATIC = Path(__file__).parent / "static"
MEDIA_NAME = re.compile(r"^clip_\d{2}\.(mp4|jpg|txt)$")
UPLOAD_EXT = {".mp4", ".mov", ".mkv", ".webm", ".m4v", ".avi", ".flv", ".ts"}

store = JobStore(settings.data_dir)
worker = Worker(store)


@asynccontextmanager
async def lifespan(_: FastAPI):
    if not settings.password:
        raise RuntimeError("Falta CLIPIA_PASSWORD. Ponla en el archivo .env antes de arrancar.")
    worker.start()
    worker.resume_pending()
    yield


app = FastAPI(title="ClipIA", lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)
app.add_middleware(SessionMiddleware, secret_key=settings.secret, session_cookie="clipia",
                   max_age=60 * 60 * 24 * 30, same_site="lax", https_only=settings.secure_cookies)
app.mount("/static", StaticFiles(directory=STATIC), name="static")


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "same-origin"
    response.headers["X-Robots-Tag"] = "noindex, nofollow"
    return response


# ---------- Acceso ----------
_failures: dict[str, list[float]] = defaultdict(list)


def _client_ip(request: Request) -> str:
    return request.client.host if request.client else "?"


def is_logged(request: Request) -> bool:
    return request.session.get("ok") is True


def require_login(request: Request) -> None:
    if not is_logged(request):
        raise HTTPException(401, "Inicia sesión")
    if request.method not in ("GET", "HEAD") and request.headers.get("x-clipia") != "1":
        raise HTTPException(403, "Petición no permitida")


@app.get("/login", response_class=HTMLResponse)
def login_page(request: Request):
    if is_logged(request):
        return RedirectResponse("/", 303)
    return HTMLResponse((STATIC / "login.html").read_text(encoding="utf-8"))


@app.post("/login")
def login(request: Request, password: str = Form(...)):
    ip = _client_ip(request)
    now = time.time()
    _failures[ip] = [t for t in _failures[ip] if now - t < 600]
    if len(_failures[ip]) >= 6:
        return RedirectResponse("/login?e=bloqueado", 303)
    if hmac.compare_digest(password.encode(), settings.password.encode()):
        _failures.pop(ip, None)
        request.session.clear()
        request.session["ok"] = True
        return RedirectResponse("/", 303)
    _failures[ip].append(now)
    time.sleep(1)
    return RedirectResponse("/login?e=1", 303)


@app.post("/logout")
def logout(request: Request):
    request.session.clear()
    return RedirectResponse("/login", 303)


@app.get("/", response_class=HTMLResponse)
def index(request: Request):
    if not is_logged(request):
        return RedirectResponse("/login", 303)
    return HTMLResponse((STATIC / "index.html").read_text(encoding="utf-8"))


@app.get("/robots.txt", response_class=HTMLResponse)
def robots():
    return HTMLResponse("User-agent: *\nDisallow: /\n", media_type="text/plain")


# ---------- API ----------
def _public(job: dict) -> dict:
    return {k: v for k, v in job.items() if k != "source_path"}


def _job_or_404(job_id: str) -> dict:
    job = store.get(job_id)
    if not job:
        raise HTTPException(404, "No existe ese trabajo")
    return job


@app.get("/api/status", dependencies=[Depends(require_login)])
def status():
    return {"ai": bool(settings.anthropic_key), "model": settings.claude_model if settings.anthropic_key else None,
            "whisper": settings.whisper_model, "max_live_minutes": settings.max_live_minutes,
            "cookies": bool(settings.cookies_file)}


@app.get("/api/jobs", dependencies=[Depends(require_login)])
def list_jobs():
    return [_public(j) for j in store.list()]


@app.post("/api/jobs", dependencies=[Depends(require_login)])
def create_job(body: JobCreate):
    url = body.url.strip()
    if not re.match(r"^https?://", url, re.I):
        raise HTTPException(400, "Pega un enlace que empiece por http:// o https://")
    body.options.max_live_minutes = min(body.options.max_live_minutes, settings.max_live_minutes)
    job = store.create(url, body.options)
    worker.submit(job["id"])
    return _public(job)


@app.post("/api/jobs/upload", dependencies=[Depends(require_login)])
async def upload_job(file: UploadFile = File(...), options: str = Form("{}")):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in UPLOAD_EXT:
        raise HTTPException(400, "Formato no soportado. Sube mp4, mov, mkv, webm…")
    try:
        opts = JobOptions(**json.loads(options or "{}"))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(400, f"Opciones inválidas: {exc}") from exc
    job = store.create("", opts, source_name=Path(file.filename).name[:200])
    dest = store.dir(job["id"]) / f"source{ext}"
    limit = settings.max_upload_mb * 1024 * 1024
    size = 0
    with dest.open("wb") as fh:
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)
            if size > limit:
                fh.close()
                store.delete(job["id"])
                raise HTTPException(413, f"El archivo pasa de {settings.max_upload_mb} MB")
            fh.write(chunk)
    worker.submit(job["id"])
    return _public(job)


@app.get("/api/jobs/{job_id}", dependencies=[Depends(require_login)])
def get_job(job_id: str):
    return _public(_job_or_404(job_id))


@app.post("/api/jobs/{job_id}/cancel", dependencies=[Depends(require_login)])
def cancel_job(job_id: str):
    _job_or_404(job_id)
    worker.cancel(job_id)
    return {"ok": True}


@app.post("/api/jobs/{job_id}/stop-recording", dependencies=[Depends(require_login)])
def stop_recording(job_id: str):
    _job_or_404(job_id)
    worker.stop_recording.add(job_id)
    return {"ok": True}


@app.post("/api/jobs/{job_id}/retry", dependencies=[Depends(require_login)])
def retry_job(job_id: str):
    job = _job_or_404(job_id)
    if job["status"] not in ("error", "cancelled"):
        raise HTTPException(400, "Solo se pueden reintentar trabajos con error o cancelados")
    if job.get("source_name") and not list(store.dir(job_id).glob("source.*")):
        raise HTTPException(400, "El archivo original ya no está; vuelve a subirlo")
    store.update(job_id, status="queued", stage="queued", progress=0, message="En cola…", error=None, clips=[])
    worker.submit(job_id)
    return {"ok": True}


@app.delete("/api/jobs/{job_id}", dependencies=[Depends(require_login)])
def delete_job(job_id: str):
    job = _job_or_404(job_id)
    if job["status"] not in ("done", "error", "cancelled"):
        worker.cancel(job_id)
        raise HTTPException(409, "Se está cancelando; bórralo en unos segundos")
    store.delete(job_id)
    return {"ok": True}


@app.get("/media/{job_id}/{name}", dependencies=[Depends(require_login)])
def media(job_id: str, name: str, download: int = 0):
    if not MEDIA_NAME.match(name):
        raise HTTPException(404)
    job = _job_or_404(job_id)
    path = store.dir(job_id) / name
    if not path.exists():
        raise HTTPException(404)
    filename = None
    if download:
        idx = int(name[5:7])
        clip = next((c for c in job["clips"] if c["index"] == idx), None)
        base = re.sub(r"[^\w\- ]+", "", (clip or {}).get("title", ""), flags=re.U).strip()[:60] or name[:7]
        filename = f"{idx:02d} - {base}{path.suffix}"
    return FileResponse(path, filename=filename, headers={"Cache-Control": "private, max-age=3600"})


@app.get("/api/jobs/{job_id}/zip", dependencies=[Depends(require_login)])
def download_zip(job_id: str):
    job = _job_or_404(job_id)
    if not job["clips"]:
        raise HTTPException(400, "Aún no hay clips")
    folder = store.dir(job_id)
    zpath = folder / "clips.zip"
    with zipfile.ZipFile(zpath, "w", compression=zipfile.ZIP_STORED) as z:
        for c in job["clips"]:
            base = re.sub(r"[^\w\- ]+", "", c["title"], flags=re.U).strip()[:60] or f"clip {c['index']}"
            for ext in ("mp4", "txt"):
                f = folder / f"clip_{c['index']:02d}.{ext}"
                if f.exists():
                    z.write(f, f"{c['index']:02d} - {base}.{ext}")
    title = re.sub(r"[^\w\- ]+", "", job.get("title") or "clips", flags=re.U).strip()[:50] or "clips"
    return FileResponse(zpath, filename=f"ClipIA - {title}.zip")


@app.exception_handler(HTTPException)
async def http_error(request: Request, exc: HTTPException):
    return JSONResponse({"detail": exc.detail}, status_code=exc.status_code)
