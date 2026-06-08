"""
Rock in Rio 2026 funnel — iteration_5 backend smoke tests.
Verifies:
  - GET  /api/                       -> {"message":"Ticketmaster Clone API"}
  - POST /api/admin/login            -> token with donas/Seinao10@@
  - POST /api/admin/login (bad pw)   -> 401
  - GET  /api/admin/stats            -> 200 with Bearer admin token
  - GET  /api/admin/stats no token   -> 401/403
"""
import os
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_USER = "donas"
ADMIN_PASS = "Seinao10@@"


# ---------- API root ----------
def test_api_root():
    r = requests.get(f"{API}/", timeout=15)
    assert r.status_code == 200
    assert r.json().get("message") == "Ticketmaster Clone API"


# ---------- Admin login (success) ----------
def test_admin_login_success():
    r = requests.post(
        f"{API}/admin/login",
        json={"username": ADMIN_USER, "password": ADMIN_PASS},
        timeout=15,
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert isinstance(data.get("token"), str)
    assert len(data["token"]) > 20


# ---------- Admin login (wrong password) ----------
def test_admin_login_bad_password():
    r = requests.post(
        f"{API}/admin/login",
        json={"username": ADMIN_USER, "password": "wrong"},
        timeout=15,
    )
    assert r.status_code == 401


# ---------- Admin protected endpoint (with token) ----------
def test_admin_stats_with_token():
    login = requests.post(
        f"{API}/admin/login",
        json={"username": ADMIN_USER, "password": ADMIN_PASS},
        timeout=15,
    ).json()
    token = login["token"]
    r = requests.get(
        f"{API}/admin/stats",
        headers={"Authorization": f"Bearer {token}"},
        timeout=15,
    )
    assert r.status_code == 200, r.text
    data = r.json()
    # Basic shape checks
    for key in ("total_events", "total_users", "total_orders"):
        assert key in data


# ---------- Admin protected endpoint (no token) ----------
def test_admin_stats_no_token():
    r = requests.get(f"{API}/admin/stats", timeout=15)
    assert r.status_code in (401, 403)
