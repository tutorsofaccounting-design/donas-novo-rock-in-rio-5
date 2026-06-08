"""
Rock in Rio 2 funnel — backend API smoke tests (iteration_4).
Covers Test 19 of the review_request: /api/, /api/destaques, /api/experiences,
/api/carousel, /api/auth/login (admin + auto-register).
"""
import os
import uuid
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@ticketmaster.com.br"
ADMIN_PASSWORD = "admin123"


# ---------- API root ----------
def test_api_root():
    r = requests.get(f"{API}/")
    assert r.status_code == 200
    assert r.json().get("message") == "Ticketmaster Clone API"


# ---------- Destaques ----------
def test_destaques_returns_list():
    r = requests.get(f"{API}/destaques")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    # request says ~10
    assert len(data) >= 9
    for item in data:
        for k in ("slug", "title", "image"):
            assert k in item


# ---------- Experiences ----------
def test_experiences_returns_list():
    r = requests.get(f"{API}/experiences")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) and len(data) >= 1
    for item in data:
        for k in ("slug", "title", "image"):
            assert k in item


# ---------- Carousel ----------
def test_carousel_returns_slides():
    r = requests.get(f"{API}/carousel")
    assert r.status_code == 200
    slides = r.json()
    assert isinstance(slides, list) and len(slides) >= 5
    for s in slides:
        assert "image" in s


# ---------- Auth: admin login ----------
def test_login_admin_success():
    r = requests.post(f"{API}/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    data = r.json()
    assert isinstance(data.get("token"), str) and len(data["token"]) > 20
    assert data["user"]["email"] == ADMIN_EMAIL
    assert data["user"]["role"] == "admin"


# ---------- Auth: auto-register on login with new email ----------
def test_login_auto_register_new_email():
    email = f"TEST_{uuid.uuid4().hex[:8]}@example.com"
    r = requests.post(f"{API}/auth/login",
                      json={"email": email, "password": "anyPass123"})
    assert r.status_code == 200, r.text
    data = r.json()
    assert "token" in data
    # backend normalizes email to lowercase
    assert data["user"]["email"].lower() == email.lower()
    assert data["user"]["role"] == "user"


# ---------- Auth: /me with token ----------
def test_auth_me_with_token():
    login = requests.post(f"{API}/auth/login",
                          json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}).json()
    token = login["token"]
    r = requests.get(f"{API}/auth/me",
                     headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["email"] == ADMIN_EMAIL


# ---------- Auth: /me without token must 401 ----------
def test_auth_me_without_token_401():
    r = requests.get(f"{API}/auth/me")
    assert r.status_code == 401
