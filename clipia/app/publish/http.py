import httpx

from . import PublishError

TIMEOUT = httpx.Timeout(60.0, read=600.0, write=600.0)


def client() -> httpx.Client:
    return httpx.Client(timeout=TIMEOUT, follow_redirects=False)


def check(resp: httpx.Response, what: str) -> dict:
    try:
        data = resp.json()
    except ValueError:
        data = {}
    if resp.status_code >= 400:
        err = data.get("error") if isinstance(data, dict) else None
        if isinstance(err, dict):
            detail = err.get("message") or err.get("error_user_msg") or err.get("code") or ""
        else:
            detail = data.get("error_description") or err or resp.text[:200]
        raise PublishError(f"{what}: {detail} (HTTP {resp.status_code})")
    return data
