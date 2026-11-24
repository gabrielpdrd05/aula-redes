FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    CLIPIA_DATA_DIR=/data \
    HF_HOME=/data/modelos

# ffmpeg para editar, fuentes para los subtítulos
RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg fonts-montserrat fonts-dejavu-core ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Deno: yt-dlp lo necesita para descargar de YouTube
COPY --from=denoland/deno:bin-2.1.4 /deno /usr/local/bin/deno

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY app ./app
RUN useradd -m -u 1000 clipia && mkdir -p /data && chown clipia /data
USER clipia

EXPOSE 8000
HEALTHCHECK --interval=60s --timeout=5s CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/robots.txt')"
# Un solo proceso: la cola de trabajos vive en memoria
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips", "*"]
