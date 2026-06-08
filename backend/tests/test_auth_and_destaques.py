"""Backend tests for JWT auth + 9 new destaques events (sessions + sectors)."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://tudo-bem-19.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@ticketmaster.com.br"
ADMIN_PASSWORD = "admin123"

NEW_DESTAQUES_SLUGS = [
    "jackson-wang-sp",
    "la-lom-sp",
    "turne-tres-gracas",
    "henry-klauss-masters-of-magic",
    "lenine-tokio-marine",
    "nubya-garcia-sp",
    "rolex-6-horas-sp",
    "eagle-eye-cherry-sp",
    "sp2b-ibirapuera",
]


# ---------- Auth ----------
class TestAuth:
    def test_login_admin_success(self):
        r = requests.post(f"{API}/auth/login",
                          json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "token" in data and isinstance(data["token"], str) and len(data["token"]) > 10
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["role"] == "admin"

    def test_login_wrong_password(self):
        r = requests.post(f"{API}/auth/login",
                          json={"email": ADMIN_EMAIL, "password": "wrongpass"})
        assert r.status_code == 401

    def test_me_without_token(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_me_with_token(self):
        login = requests.post(f"{API}/auth/login",
                              json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}).json()
        token = login["token"]
        r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL

    def test_register_new_user(self):
        unique = f"test_{uuid.uuid4().hex[:8]}@example.com"
        r = requests.post(f"{API}/auth/register",
                          json={"name": "Test User", "email": unique, "password": "testpass123"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "token" in data
        assert data["user"]["email"] == unique
        assert data["user"]["role"] == "user"

        # Register with same email => 400
        r2 = requests.post(f"{API}/auth/register",
                           json={"name": "Another Name", "email": unique, "password": "abcdef"})
        assert r2.status_code == 400, r2.text

        # Login with the new user
        r3 = requests.post(f"{API}/auth/login",
                           json={"email": unique, "password": "testpass123"})
        assert r3.status_code == 200


# ---------- 9 new destaques events ----------
@pytest.mark.parametrize("slug", NEW_DESTAQUES_SLUGS)
def test_destaque_event_has_sessions_and_sectors(slug):
    r = requests.get(f"{API}/events/{slug}")
    assert r.status_code == 200, f"{slug} -> {r.status_code} {r.text[:200]}"
    ev = r.json()
    assert ev["slug"] == slug
    assert isinstance(ev.get("sessions"), list) and len(ev["sessions"]) >= 1, f"{slug} missing sessions"
    assert isinstance(ev.get("sectors"), list) and len(ev["sectors"]) >= 1, f"{slug} missing sectors"
    # Basic sector shape
    s0 = ev["sectors"][0]
    for key in ("name", "full_price", "half_price"):
        assert key in s0, f"{slug} sector missing {key}"


def test_destaques_list_contains_new_entries():
    r = requests.get(f"{API}/destaques")
    assert r.status_code == 200
    slugs = [d.get("slug") for d in r.json()]
    for s in NEW_DESTAQUES_SLUGS:
        assert s in slugs, f"{s} not in /api/destaques"


# ---------- Regression: carousel + events list ----------
def test_carousel_still_ok():
    r = requests.get(f"{API}/carousel")
    assert r.status_code == 200
    assert len(r.json()) >= 10


def test_events_list_ok():
    r = requests.get(f"{API}/events")
    assert r.status_code == 200
    slugs = [e["slug"] for e in r.json()]
    for s in NEW_DESTAQUES_SLUGS:
        assert s in slugs
