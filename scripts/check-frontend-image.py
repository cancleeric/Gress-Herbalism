"""Check only local nginx/static routing; never contact an API/auth/DB service."""
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def check(base):
    target = urllib.parse.urlsplit(base)
    if target.scheme != "http" or target.hostname != "127.0.0.1" or target.path not in ("", "/") or target.query or target.fragment or target.username or target.password:
        raise ValueError("Use the temporary container's http://127.0.0.1:port only")
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())
    checks = []

    def get(path):
        try:
            result = opener.open(base.rstrip("/") + path, timeout=5)
        except urllib.error.HTTPError as error:
            result = error
        with result:
            return result.status, result.headers, result.read()

    for path, status in [("/", 302), ("/herbalism", 301)]:
        code, headers, _ = get(path)
        assert code == status and headers["Location"] == "/herbalism/", path
        checks.append(path)
    code, _, body = get("/healthz")
    assert code == 200 and body == b"ok\n"
    checks.append("healthz")
    code, headers, index = get("/herbalism/index.html")
    assert code == 200 and "no-store" in headers.get("Cache-Control", "")
    assert b'<div id="root">' in index
    for path in ["/herbalism/", "/herbalism/fixture/deep-link"]:
        code, headers, body = get(path)
        assert code == 200 and body == index and "no-store" in headers.get("Cache-Control", ""), path
        checks.append(path)
    assets = re.findall(r'(?:src|href)="(/herbalism/static/[^"?#]+)"', index.decode())
    assert any(asset.endswith(".js") for asset in assets)
    assert any(asset.endswith(".css") for asset in assets)
    for asset in assets:
        code, headers, body = get(asset)
        assert code == 200 and body != index and body
        assert "immutable" in headers.get("Cache-Control", ""), asset
        assert "text/html" not in headers.get("Content-Type", ""), asset
        checks.append(asset)
    for path in ["/herbalism/static/js/missing.js", "/herbalism/static/css/missing.css", "/herbalism/missing.js"]:
        code, headers, body = get(path)
        assert code == 404 and body != index and "immutable" not in headers.get("Cache-Control", ""), path
        checks.append(path)
    code, headers, _ = get("/herbalism/asset-manifest.json")
    assert code == 200 and "no-cache" in headers.get("Cache-Control", "")
    checks.append("asset-manifest.json")
    return {"frontendImageHttp": True, "checks": checks, "scope": "Local static HTTP only; no browser, API, auth or DB acceptance"}


if __name__ == "__main__":
    print(json.dumps(check(sys.argv[1]), ensure_ascii=False, indent=2))
