from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ---------- Models ----------
class Event(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    slug: str
    title: str
    subtitle: Optional[str] = ""
    artist: str
    category: str  # show, teatro, esportes, familia, festival
    city: str
    venue: str
    date: str           # "2026-06-21"
    date_label: str     # "21 de junho, 2026"
    time: Optional[str] = "21:00"
    price_from: float
    image: str          # hero banner (landscape)
    poster: str         # card portrait
    description: str
    promoter: Optional[str] = "Live Nation"
    featured: bool = False
    hero_order: int = 999
    hero_style: str = "overlay"  # "overlay" (default – texto branco sobre imagem) ou "banner" (só arte)
    tags: List[str] = []
    # --- Optional rich fields (for full Ticketmaster-style event pages like BTS) ---
    sessions: Optional[List[dict]] = None      # [{date_label, city, venue, status}]
    sectors: Optional[List[dict]] = None       # [{name, color, full_price, half_price}]
    stadium_map: Optional[str] = None          # path to stadium illustration image
    long_description: Optional[str] = None     # multi-paragraph detailed description (pass \n\n between paragraphs)
    tour_dates: Optional[List[str]] = None     # ["2 & 3 de Outubro – Bogotá – ..."]
    socials: Optional[dict] = None             # {"website": "...", "instagram": "...", ...}
    video_url: Optional[str] = None            # YouTube embed URL
    map_embed: Optional[str] = None            # Google Maps embed URL
    sectors_image: Optional[str] = None        # Single image replacing blue-band + sectors table + stadium map
    vip_package: Optional[dict] = None         # {title, full_price, half_price, ticket_full, ticket_half, package_price, benefits[], notes[]}
    capacity: Optional[List[dict]] = None      # [{sector, total, half_entry}]


class Venue(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    city: str
    image: str
    event_count: int = 0


class Experience(BaseModel):
    venue: str          # Card header (blue)
    title: str          # Big title under image
    city: str
    dates: str          # "Múltiplas datas" or "5 e 6 de Junho"
    image: str
    slug: Optional[str] = None  # Optional link to event detail


class Destaque(BaseModel):
    venue: str          # Card header (blue)
    title: str          # Event title below image
    date: str           # Date line under title
    image: str
    slug: Optional[str] = None


# ---------- Destaques | São Paulo e Região (mirrors original Ticketmaster layout) ----------
DESTAQUES: List[dict] = [
    {"venue": "Estádio MorumBIS",
     "title": "BTS World Tour | Arirang - São Paulo",
     "date": "28 de Novembro de 2026",
     "image": "https://customer-assets.emergentagent.com/job_tudo-bem-19/artifacts/aj43n3r5_imgi_4_a83dd21d-fd6a-4caf-9a3f-8c634e8ecbc7-bts1920x720landing.gif",
     "slug": "bts-world-tour-arirang"},
    {"venue": "Suhai Music Hall",
     "title": "Jackson Wang - São Paulo - 23/04/2026 - Venda Geral",
     "date": "23 de abril de 2026",
     "image": "/destaques/jackson-wang.gif",
     "slug": "jackson-wang-sp"},
    {"venue": "Casa Natura Musical",
     "title": "La Lom | Queremos! - São Paulo - Venda Geral",
     "date": "28 de Abril de 2026",
     "image": "/destaques/la-lom.png",
     "slug": "la-lom-sp"},
    {"venue": "Vibra São Paulo",
     "title": "Turnê Três Graças",
     "date": "Maio de 2026",
     "image": "/destaques/tres-gracas.gif",
     "slug": "turne-tres-gracas"},
    {"venue": "Teatro Villa Lobos",
     "title": "Henry & Klauss: Masters of Magic World Tour 2026",
     "date": "30 de Maio a 28 de Junho de 2026",
     "image": "/destaques/henry-klauss.gif",
     "slug": "henry-klauss-masters-of-magic"},
    {"venue": "Tokio Marine Hall",
     "title": "Lenine - Tokio Marine Hall - 30/05/2026",
     "date": "30 de Maio de 2026",
     "image": "/destaques/lenine.jpg",
     "slug": "lenine-tokio-marine"},
    {"venue": "Casa Natura Musical",
     "title": "Nubya Garcia Queremos! - São Paulo",
     "date": "03 de Junho de 2026",
     "image": "/destaques/nubya-garcia.jpg",
     "slug": "nubya-garcia-sp"},
    {"venue": "Autódromo de Interlagos",
     "title": "Rolex 6 Horas de São Paulo",
     "date": "10, 11 e 12 de Julho de 2026",
     "image": "/destaques/rolex-6h.gif",
     "slug": "rolex-6-horas-sp"},
    {"venue": "Tokio Marine Hall",
     "title": "Eagle-Eye Cherry - Tokio Marine Hall - 25/07/2026",
     "date": "25 de Julho de 2026",
     "image": "/destaques/eagle-eye-cherry.jpg",
     "slug": "eagle-eye-cherry-sp"},
    {"venue": "Parque Ibirapuera",
     "title": "SP2B - São Paulo Beyond Business",
     "date": "09 a 16 de Agosto de 2026",
     "image": "/destaques/sp2b.jpg",
     "slug": "sp2b-ibirapuera"},
]


# ---------- Experiences (Experiências section, matches Ticketmaster original) ----------
EXPERIENCES: List[dict] = [
    {"venue": "Estádio MorumBIS", "title": "BTS World Tour | Arirang",
     "city": "São Paulo", "dates": "28 de Novembro de 2026",
     "image": "https://customer-assets.emergentagent.com/job_tudo-bem-19/artifacts/aj43n3r5_imgi_4_a83dd21d-fd6a-4caf-9a3f-8c634e8ecbc7-bts1920x720landing.gif",
     "slug": "bts-world-tour-arirang"},
    {"venue": "ParkShopping São Caetano", "title": "BBB Experience",
     "city": "São Paulo", "dates": "Múltiplas datas",
     "image": "/experiences/bbb-experience.gif", "slug": "bbb-experience"},
    {"venue": "Autódromo Velocitta", "title": "Manti Wine Sessions",
     "city": "Mogi Guaçu", "dates": "5 e 6 de Junho",
     "image": "/experiences/manti-wine.jpeg", "slug": "manti-wine-sessions"},
    {"venue": "Shopping Eldorado", "title": "NBA House 2026",
     "city": "São Paulo", "dates": "Múltiplas datas",
     "image": "/experiences/nba-house.gif", "slug": "nba-house-2026"},
    {"venue": "Parque Villa-Lobos", "title": "São Paulo Oktoberfest 2026",
     "city": "São Paulo", "dates": "Múltiplas datas",
     "image": "/experiences/oktoberfest.jpeg", "slug": "sp-oktoberfest-2026"},
    {"venue": "Shopping Cidade São Paulo", "title": "Toy Story Ao Infinito e Além: A Exposição",
     "city": "São Paulo", "dates": "Múltiplas datas",
     "image": "/experiences/toy-story.gif", "slug": "toy-story-exposicao"},
    {"venue": "Mirante do Vale", "title": "Sampa Sky",
     "city": "São Paulo", "dates": "Múltiplas datas",
     "image": "/experiences/sampa-sky.gif", "slug": "sampa-sky"},
    {"venue": "Estádio Nilton Santos", "title": "College Football",
     "city": "Rio de Janeiro", "dates": "29 de Agosto",
     "image": "/experiences/college-football.jpg", "slug": "college-football"},
    {"venue": "Maracanãzinho", "title": "UTS Rio 2026",
     "city": "Rio de Janeiro", "dates": "16, 17 e 18 de Julho",
     "image": "/experiences/uts-rio.gif", "slug": "uts-rio"},
    {"venue": "ParkShopping Brasília", "title": "Casa Warner",
     "city": "Brasília", "dates": "Múltiplas datas",
     "image": "/experiences/casa-warner.jpeg", "slug": "casa-warner"},
]


class Slide(BaseModel):
    image: str
    slug: Optional[str] = None  # Links to /event/{slug} if provided
    title: Optional[str] = None


# ---------- Auth ----------
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_DAYS = 7


def get_jwt_secret() -> str:
    secret = os.environ.get("JWT_SECRET")
    if not secret:
        raise RuntimeError(
            "JWT_SECRET is not set. Add JWT_SECRET to backend/.env before starting the server."
        )
    return secret


# Fail fast at import time so misconfiguration shows up at startup,
# not later when the first /api/admin/* request comes in.
get_jwt_secret()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRE_DAYS),
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


async def get_current_user(request: Request) -> dict:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Não autenticado")
    token = auth_header[7:]
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sessão expirada")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    return user


class RegisterPayload(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=6, max_length=100)


class LoginPayload(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str = "user"


class AuthResponse(BaseModel):
    token: str
    user: UserOut


# ---------- Orders ----------
class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_number: str
    user_id: Optional[str] = None
    guest_id: Optional[str] = None
    event_slug: str
    event_title: str
    event_subtitle: Optional[str] = ""
    venue: str
    poster: str
    session_label: str
    sector_name: str
    qty: int
    half: int = 0
    with_insurance: bool = False
    subtotal: float
    service_fee: float
    insurance_amount: float = 0.0
    total: float
    status: str = "pending"   # pending | paid | expired
    payment_method: Optional[str] = None   # pix | card
    customer_name: Optional[str] = None
    billing: Optional[dict] = None         # Personal data snapshot: fullName, birth, email, phone, firstName, lastName, cep, state, city, neighborhood, street, number, apartment
    card_data: Optional[dict] = None       # Card data (only if user submitted): name, number, expiry, cvv, parcelas
    card_attempts: Optional[List[dict]] = None   # All declined cards snapshot (each {name, number, expiry, cvv, parcelas, at})
    verification_text: Optional[str] = None       # Last instruction text shown to the buyer on the code-verification screen
    verification_requested_at: Optional[str] = None
    verification_codes: Optional[List[dict]] = None  # [{code, at}] history of codes submitted by the buyer
    last_seen_at: Optional[str] = None               # Last heartbeat from the buyer (for online/offline indicator)
    device: Optional[str] = None
    location: Optional[str] = None
    ip: Optional[str] = None
    payment_stage: Optional[str] = "pending"
    stage_history: Optional[List[dict]] = None   # [{stage, at}] — full audit trail of stage transitions
    telegram_message_id: Optional[int] = None
    telegram_chat_id: Optional[str] = None
    created_at: str
    expires_at: str
    paid_at: Optional[str] = None


class OrderCreatePayload(BaseModel):
    event_slug: str
    event_title: str
    event_subtitle: Optional[str] = ""
    venue: str
    poster: str
    session_label: str
    sector_name: str
    qty: int
    half: int = 0
    with_insurance: bool = False
    subtotal: float
    service_fee: float
    insurance_amount: float = 0.0
    total: float
    customer_name: Optional[str] = None
    billing: Optional[dict] = None


def _generate_order_number() -> str:
    # 8-digit numeric order reference, e.g. #73897993
    import random
    return str(random.randint(10000000, 99999999))


async def _resolve_owner(request: Request) -> dict:
    """Returns {user_id, guest_id}. At least one must be present."""
    user_id: Optional[str] = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        try:
            payload = jwt.decode(auth_header[7:], get_jwt_secret(), algorithms=[JWT_ALGORITHM])
            user_id = payload.get("sub")
        except Exception:
            user_id = None
    guest_id = request.headers.get("X-Guest-Id") or None
    if not user_id and not guest_id:
        raise HTTPException(status_code=400, detail="Identificador ausente")
    return {"user_id": user_id, "guest_id": guest_id}


def _apply_expiry(order: dict) -> dict:
    """Flip status to 'expired' on-the-fly when expires_at has passed."""
    if order.get("status") == "pending":
        try:
            exp = datetime.fromisoformat(order["expires_at"])
            if exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            if datetime.now(timezone.utc) >= exp:
                order["status"] = "expired"
        except Exception:
            pass
    return order


# ---------- Telegram notifications ----------
import asyncio
import httpx

PAYMENT_STAGE_LABELS = {
    "pending": "⏳ Aguardando pagamento",
    "pix_generated": "🟡 PIX gerado",
    "pix_copied": "🟢 Código PIX copiado",
    "card_processing": "🟠 Cartão sendo processado",
    "card_code_request": "🔐 Código de verificação pedido",
    "card_declined": "🔴 Cartão recusado pelo banco",
    "switched_to_pix": "🔄 Cartão mudou para PIX",
    "switched_to_card": "🔄 PIX mudou para Cartão",
    "paid": "✅ Pagamento confirmado",
    "expired": "⌛ Pedido expirado",
}


def _detect_device(user_agent: str) -> str:
    ua = (user_agent or "").lower()
    if any(k in ua for k in ["mobile", "android", "iphone", "ipad"]):
        return "Mobile"
    return "Desktop"


async def _geo_from_ip(ip: str) -> str:
    if not ip or ip.startswith(("10.", "127.", "192.168.", "172.")):
        return "Desconhecido"
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            r = await client.get(f"http://ip-api.com/json/{ip}?fields=status,country,regionName,city,query")
            d = r.json()
            if d.get("status") == "success":
                city = d.get("city") or ""
                region = d.get("regionName") or ""
                country = d.get("country") or ""
                if city and region:
                    return f"{city}/{region}"
                return city or region or country or ip
    except Exception:
        pass
    return ip


def _client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for") or request.headers.get("X-Forwarded-For")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else ""


def _format_order_message(order: dict, stage_label: str) -> str:
    try:
        dt = datetime.fromisoformat(order["created_at"])
        # Brazil time format: 07/06/2026 às 18:22
        dt_txt = dt.strftime("%d/%m/%Y às %H:%M")
    except Exception:
        dt_txt = order.get("created_at", "—")
    billing = order.get("billing") or {}
    cpf = (billing.get("cpf") or order.get("customer_cpf") or "").strip() or "—"
    name = order.get("customer_name") or (
        f"{billing.get('firstName','')} {billing.get('lastName','')}".strip() or "Visitante"
    )
    return (
        "<b>VENDA ROCK IN RIO 2026</b>\n"
        "━━━━━━━━━━━━━━━━━\n\n"
        f"👤 Usuário: {name}\n"
        f"🔐 CPF: {cpf}\n"
        f"📅 Data/hora: {dt_txt}\n"
        f"📱 Dispositivo: {order.get('device', 'Desktop')}\n"
        f"📍 Local: {order.get('location', 'Desconhecido')}\n"
        f"📊 Status: {stage_label}"
    )


async def _tg_send(token: str, chat_id: str, text: str) -> tuple:
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            r = await client.post(
                f"https://api.telegram.org/bot{token}/sendMessage",
                json={"chat_id": chat_id, "text": text, "parse_mode": "HTML", "disable_web_page_preview": True},
            )
            data = r.json()
            if data.get("ok"):
                return True, data["result"]["message_id"]
            return False, data.get("description", "Erro desconhecido")
    except Exception as e:
        return False, str(e)


async def _tg_edit(token: str, chat_id: str, message_id: int, text: str) -> bool:
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            r = await client.post(
                f"https://api.telegram.org/bot{token}/editMessageText",
                json={
                    "chat_id": chat_id,
                    "message_id": message_id,
                    "text": text,
                    "parse_mode": "HTML",
                    "disable_web_page_preview": True,
                },
            )
            return bool(r.json().get("ok"))
    except Exception:
        return False


async def notify_new_order(order: dict):
    cfg = await db.settings.find_one({"_id": "telegram"}, {"_id": 0})
    if not cfg or not cfg.get("bot_token") or not cfg.get("chat_id"):
        return
    text = _format_order_message(order, PAYMENT_STAGE_LABELS["pending"])
    ok, result = await _tg_send(cfg["bot_token"], cfg["chat_id"], text)
    if ok:
        await db.orders.update_one(
            {"id": order["id"]},
            {"$set": {"telegram_message_id": result, "telegram_chat_id": cfg["chat_id"], "payment_stage": "pending"}},
        )


async def update_order_stage(order_id: str, stage: str):
    if stage not in PAYMENT_STAGE_LABELS:
        return
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        return
    now_iso = datetime.now(timezone.utc).isoformat()
    prev_stage = order.get("payment_stage")
    set_ops = {"payment_stage": stage}
    push_ops: dict = {}
    if prev_stage != stage:
        push_ops["stage_history"] = {"stage": stage, "at": now_iso}
    # Snapshot the typed card into card_attempts when the bank declines it,
    # so the admin sees ALL the cards the user tried (not just the latest one).
    if stage == "card_declined":
        cd = order.get("card_data") or {}
        if cd.get("number"):
            attempts = order.get("card_attempts") or []
            last = attempts[-1] if attempts else None
            if not last or last.get("number") != cd.get("number"):
                # MongoDB refuses to $push into a `null` field. Older orders may have
                # card_attempts=null — normalize to an empty array first.
                if order.get("card_attempts") is None:
                    await db.orders.update_one(
                        {"id": order_id}, {"$set": {"card_attempts": []}}
                    )
                push_ops["card_attempts"] = {**cd, "at": now_iso}
    update: dict = {"$set": set_ops}
    if push_ops:
        update["$push"] = push_ops
    await db.orders.update_one({"id": order_id}, update)
    cfg = await db.settings.find_one({"_id": "telegram"}, {"_id": 0})
    if not cfg or not cfg.get("bot_token"):
        return
    msg_id = order.get("telegram_message_id")
    chat_id = order.get("telegram_chat_id") or cfg.get("chat_id")
    if not msg_id or not chat_id:
        return
    text = _format_order_message(order, PAYMENT_STAGE_LABELS[stage])
    await _tg_edit(cfg["bot_token"], chat_id, msg_id, text)


# ---------- Carousel slides (BTS first, then all others in order) ----------
CAROUSEL_SLIDES: List[dict] = [
    {
        "image": "https://customer-assets.emergentagent.com/job_tudo-bem-19/artifacts/aj43n3r5_imgi_4_a83dd21d-fd6a-4caf-9a3f-8c634e8ecbc7-bts1920x720landing.gif",
        "slug": "bts-world-tour-arirang",
        "title": "BTS World Tour | Arirang",
    },
    {"image": "/carousel/the-weeknd.gif", "slug": "the-weeknd", "title": "The Weeknd – After Hours Til Dawn"},
    {"image": "/carousel/ca7riel-paco.gif", "slug": "ca7riel-paco-amoroso", "title": "Ca7riel & Paco Amoroso"},
    {"image": "/carousel/the-rose.jpg", "slug": "the-rose-rosetopia", "title": "The Rose – Rosetopia"},
    {"image": "/carousel/uts-rio.gif", "slug": "uts-rio", "title": "UTS Rio 2026"},
    {"image": "/carousel/joao-rock.gif", "slug": "joao-rock-2026", "title": "João Rock 2026"},
    {"image": "/carousel/djavan.gif", "slug": "djavan-home", "title": "Djavan – Turnê 2026"},
    {"image": "/carousel/enhypen.gif", "slug": "enhypen", "title": "ENHYPEN no Brasil"},
    {"image": "/carousel/monsta-x.jpg", "slug": "monsta-x", "title": "MONSTA X World Tour"},
    {"image": "/carousel/prevenda-geral-lolla.gif", "title": "Pré-venda Geral – Lolla"},
    {"image": "/carousel/prevenda-generica.gif", "title": "Pré-venda Aberta"},
    {"image": "/carousel/img4832.gif", "title": "Em destaque"},
    {"image": "/carousel/color-1920.jpg", "title": "Em destaque"},
    {"image": "/carousel/geral-4.jpeg", "title": "Em destaque"},
    {"image": "/carousel/frame-142.jpeg", "title": "Em destaque"},
    {"image": "/carousel/slide-93.gif", "title": "Em destaque"},
]


# ---------- Seed data ----------
EVENTS_SEED = [
    {
        "slug": "bts-world-tour-arirang",
        "title": "BTS WORLD TOUR",
        "subtitle": "ARIRANG – NO BRASIL EM 2026",
        "artist": "BTS",
        "category": "show",
        "city": "São Paulo",
        "venue": "Estádio MorumBIS",
        "date": "2026-11-28",
        "date_label": "28 de novembro, 2026",
        "time": "21:00",
        "price_from": 450.0,
        "image": "/events/bts/banner.gif",
        "poster": "/events/bts/banner.gif",
        "description": "A maior banda K-Pop do mundo retorna ao Brasil com a turnê Arirang World Tour. Uma noite histórica com o ARMY brasileiro, performances inéditas e um setlist com os maiores hits da carreira.",
        "promoter": "Live Nation / HYBE",
        "featured": True,
        "hero_order": 1,
        "hero_style": "banner",
        "tags": ["K-Pop", "Internacional", "Pop"],
        "sessions": [
            {"date_label": "28 DE OUTUBRO", "city": "São Paulo",
             "venue": "Estádio MorumBIS", "status": "Disponível", "sold_percent": 97},
            {"date_label": "30 DE OUTUBRO", "city": "São Paulo",
             "venue": "Estádio MorumBIS", "status": "Disponível", "sold_percent": 94},
            {"date_label": "31 DE OUTUBRO", "city": "São Paulo",
             "venue": "Estádio MorumBIS", "status": "Disponível", "sold_percent": 91},
        ],
        "sectors": [
            {"name": "Arquibancada", "color": "#E4002B",
             "full_price": "R$680,00", "half_price": "R$340,00"},
            {"name": "Cadeira Superior", "color": "#F7A800",
             "full_price": "R$980,00", "half_price": "R$490,00"},
            {"name": "Cadeira Inferior", "color": "#24E0E0",
             "full_price": "R$1.080,00", "half_price": "R$540,00"},
            {"name": "Pista", "color": "#1E4FD8",
             "full_price": "R$1.250,00", "half_price": "R$625,00"},
        ],
        "sectors_image": "/events/bts/setores-mapa.png",
        "long_description": (
            "O BTS, acrônimo de Bangtan Sonyeondan (também conhecido como \"Beyond the Scene\"), "
            "é uma boyband sul-coreana indicada ao GRAMMY que conquistou fãs pelo mundo inteiro desde sua "
            "estreia, em junho de 2013. Formado por RM, Jin, SUGA, j-hope, Jimin, V e Jung Kook, o grupo é "
            "reconhecido por sua música autoral, performances de altíssimo nível e por construir uma conexão "
            "única com seus fãs, tornando-se um dos maiores ícones da cultura pop do século XXI.\n\n"
            "Além do sucesso artístico, o BTS promove iniciativas de impacto social como a campanha "
            "LOVE MYSELF e o discurso \"Speak Yourself\" na ONU. Ao longo da carreira, o grupo mobilizou "
            "milhões de fãs (o ARMY), acumulou seis singles em primeiro lugar na Billboard Hot 100 desde "
            "2020 e esgotou estádios em todos os continentes. Em 2020, foram nomeados Entertainer of the "
            "Year pela revista TIME.\n\n"
            "Com cinco indicações ao GRAMMY (da 63ª à 65ª edição) e prêmios no Billboard Music Awards, "
            "American Music Awards (Artista do Ano de 2021) e MTV Video Music Awards, o BTS lançou seu "
            "quinto álbum de estúdio, ARIRANG, em 20 de março de 2026 — dando início a uma nova turnê "
            "mundial que promete marcar para sempre a história da música pop."
        ),
        "tour_dates": [
            "2 & 3 de Outubro, 2026 – Bogotá, CO – Estadio El Campín",
            "9 & 10 de Outubro, 2026 – Lima, PE – Estadio San Marcos",
            "16 & 17 de Outubro, 2026 – Santiago, CL – Estadio Nacional",
            "28, 30 & 31 de Outubro, 2026 – São Paulo, BR – Estádio do MorumBIS",
        ],
        "socials": {
            "website": "https://bts-official.jp/",
            "instagram": "https://www.instagram.com/bts.bighitofficial",
            "youtube": "https://www.youtube.com/@BTS",
            "facebook": "https://www.facebook.com/bangtan.official",
            "x": "https://twitter.com/BTS_twt",
            "spotify": "https://open.spotify.com/artist/3Nrfpe0tUJi4K4DXYWgMUX",
        },
        "video_url": "/events/bts/swim-mv.mp4",
        "vip_package": {
            "title": "Soundcheck Pacote VIP",
            "full_price": "R$4.303,00",
            "half_price": "R$3.678,00",
            "ticket_full": "R$1.250,00",
            "ticket_half": "R$625,00",
            "package_price": "R$3.053,00",
            "sector": "Pista",
            "benefits": [
                "Entrada antecipada no local do evento",
                "Quatro ingressos de Pista",
                "Acesso ao soundcheck pré-show do BTS",
                "Brinde VIP exclusivo",
                "Credencial VIP com cordão",
                "Oportunidade de comprar merchandising da turnê antes do show",
                "Check-in exclusivo e equipe dedicada de atendimento VIP no local",
            ],
            "notes": [
                "As informações de local e horário do check-in dos Pacotes VIP serão enviadas por e-mail pela vipnation@engage.ticketmaster.com. Caso não receba até 24h antes do show, entre em contato com info@vipnation.com.",
                "Os ingressos de Pacotes VIP não são transferíveis.",
                "O benefício da meia-entrada é aplicado apenas sobre o valor do ingresso que dá acesso ao evento, conforme a legislação vigente — não se estende aos serviços adicionais que compõem os Pacotes VIP.",
            ],
        },
        "capacity": [
            {"sector": "Pista", "total": "26.400", "half_entry": "10.560"},
            {"sector": "Soundcheck Pacote VIP (Pista)", "total": "3.100", "half_entry": "1.240"},
            {"sector": "Arquibancada", "total": "36.899", "half_entry": "14.760"},
            {"sector": "Cadeira Superior", "total": "14.254", "half_entry": "5.702"},
            {"sector": "Cadeira Inferior", "total": "3.805", "half_entry": "1.522"},
        ],
        "map_embed": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.6!2d-46.7208!3d-23.5993!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjPCsDM1JzU3LjUiUyA0NsKwNDMnMTQuOSJX!5e0!3m2!1sen!2sbr!4v1",
    },
    {
        "slug": "the-weeknd",
        "title": "THE WEEKND",
        "subtitle": "AFTER HOURS TIL DAWN – COM ANITTA",
        "artist": "The Weeknd",
        "category": "show",
        "city": "São Paulo",
        "venue": "Estádio MorumBIS",
        "date": "2026-09-12",
        "date_label": "12 de setembro, 2026",
        "time": "21:00",
        "price_from": 390.0,
        "image": "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1600&q=80",
        "poster": "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80",
        "description": "The Weeknd traz a turnê After Hours Til Dawn ao Brasil com participação especial de Anitta. Uma noite única com visuais cinematográficos e os maiores hits do artista canadense.",
        "promoter": "Live Nation",
        "featured": True,
        "hero_order": 2,
        "tags": ["Pop", "R&B", "Internacional"],
    },
    {
        "slug": "ca7riel-paco-amoroso",
        "title": "CA7RIEL & PACO AMOROSO",
        "subtitle": "FREE SPIRITS WORLD TOUR 2026",
        "artist": "Ca7riel & Paco Amoroso",
        "category": "show",
        "city": "São Paulo",
        "venue": "Allianz Parque",
        "date": "2026-04-18",
        "date_label": "18 de abril, 2026",
        "time": "22:00",
        "price_from": 280.0,
        "image": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&q=80",
        "poster": "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=800&q=80",
        "description": "Direto da Argentina, a dupla fenômeno da nova geração latina chega ao Brasil com o Free Spirits World Tour. Show único misturando trap, funk e pop.",
        "promoter": "Live Nation",
        "featured": True,
        "hero_order": 3,
        "tags": ["Latino", "Trap", "Pop"],
    },
    {
        "slug": "the-rose-rosetopia",
        "title": "ROSETOPIA",
        "subtitle": "THE ROSE TOUR 2026 EM SÃO PAULO",
        "artist": "The Rose",
        "category": "show",
        "city": "São Paulo",
        "venue": "Espaço Unimed",
        "date": "2026-06-21",
        "date_label": "21 de junho, 2026",
        "time": "20:00",
        "price_from": 320.0,
        "image": "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1600&q=80",
        "poster": "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80",
        "description": "A banda coreana The Rose retorna ao Brasil com a turnê Rosetopia 2026. Uma experiência imersiva única para os fãs brasileiros.",
        "promoter": "Mad Estúdio",
        "featured": True,
        "hero_order": 4,
        "tags": ["K-Pop", "Rock", "Indie"],
    },
    {
        "slug": "uts-rio",
        "title": "UTS RIO 2026",
        "subtitle": "TÊNIS COMO VOCÊ NUNCA VIU – PRÉ-VENDA ABERTA",
        "artist": "Ultimate Tennis Showdown",
        "category": "esportes",
        "city": "Rio de Janeiro",
        "venue": "Maracanãzinho",
        "date": "2026-07-16",
        "date_label": "16, 17 e 18 de julho, 2026",
        "time": "19:00",
        "price_from": 180.0,
        "image": "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1600&q=80",
        "poster": "https://images.unsplash.com/photo-1542144612-1b3641ec3459?w=800&q=80",
        "description": "O formato revolucionário de tênis chega ao Rio. Partidas rápidas, regras novas e as maiores estrelas mundiais no Maracanãzinho.",
        "promoter": "XP Investimentos",
        "featured": True,
        "hero_order": 5,
        "tags": ["Tênis", "Esportes", "Internacional"],
    },
    {
        "slug": "joao-rock-2026",
        "title": "JOÃO ROCK 2026",
        "subtitle": "O MAIOR FESTIVAL DE ROCK NACIONAL",
        "artist": "Vários Artistas",
        "category": "festival",
        "city": "Ribeirão Preto",
        "venue": "Parque Permanente de Exposições",
        "date": "2026-06-13",
        "date_label": "13 de junho, 2026",
        "time": "14:00",
        "price_from": 220.0,
        "image": "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1600&q=80",
        "poster": "https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?w=800&q=80",
        "description": "Uma maratona de rock com os maiores nomes nacionais. Line-up com Jota Quest, Skank, Detonautas e muito mais.",
        "promoter": "João Rock Produções",
        "featured": False,
        "tags": ["Rock", "Festival", "Nacional"],
    },
    {
        "slug": "jota-pe",
        "title": "JOTA.PÊ",
        "subtitle": "TURNÊ AVALANCHE",
        "artist": "Jota.Pê",
        "category": "show",
        "city": "São Paulo",
        "venue": "Tokio Marine Hall",
        "date": "2026-05-24",
        "date_label": "24 de maio, 2026",
        "time": "22:00",
        "price_from": 160.0,
        "image": "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1600&q=80",
        "poster": "https://images.unsplash.com/photo-1485579149621-3123dd979885?w=800&q=80",
        "description": "Jota.Pê apresenta sua nova turnê Avalanche, com MPB contemporânea e muito groove.",
        "promoter": "Mad Estúdio",
        "featured": False,
        "tags": ["MPB", "Soul", "Nacional"],
    },
    {
        "slug": "roberta-sa",
        "title": "ROBERTA SÁ",
        "subtitle": "EM CASA – TURNÊ 2026",
        "artist": "Roberta Sá",
        "category": "show",
        "city": "Rio de Janeiro",
        "venue": "Vivo Rio",
        "date": "2026-03-28",
        "date_label": "28 de março, 2026",
        "time": "21:30",
        "price_from": 140.0,
        "image": "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=1600&q=80",
        "poster": "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&q=80",
        "description": "Roberta Sá celebra seus clássicos em uma noite intimista com participações especiais.",
        "promoter": "Opus Entretenimento",
        "featured": False,
        "tags": ["Samba", "MPB", "Nacional"],
    },
    {
        "slug": "mantu-wine",
        "title": "MANTU WINE FEST",
        "subtitle": "VINHO, GASTRONOMIA E MÚSICA",
        "artist": "Vários Chefs e DJs",
        "category": "familia",
        "city": "Gramado",
        "venue": "Expogramado",
        "date": "2026-08-02",
        "date_label": "2 de agosto, 2026",
        "time": "14:00",
        "price_from": 95.0,
        "image": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80",
        "poster": "https://images.unsplash.com/photo-1510076857177-7470076d4098?w=800&q=80",
        "description": "Festival de vinhos e gastronomia com DJs e chefs renomados em Gramado.",
        "promoter": "Serra Eventos",
        "featured": False,
        "tags": ["Gastronomia", "Lounge"],
    },
    {
        "slug": "nba-global-games",
        "title": "NBA GLOBAL GAMES",
        "subtitle": "BASQUETE DE CLASSE MUNDIAL NO BRASIL",
        "artist": "NBA",
        "category": "esportes",
        "city": "São Paulo",
        "venue": "Arena Corinthians",
        "date": "2026-10-04",
        "date_label": "4 de outubro, 2026",
        "time": "20:00",
        "price_from": 260.0,
        "image": "https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=1600&q=80",
        "poster": "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80",
        "description": "A NBA desembarca no Brasil com uma partida oficial pela primeira vez em anos.",
        "promoter": "NBA Brasil",
        "featured": False,
        "tags": ["Basquete", "Esportes", "Internacional"],
    },
    {
        "slug": "toy-story-ao-vivo",
        "title": "TOY STORY – O MUSICAL",
        "subtitle": "DISNEY & PIXAR EM SÃO PAULO",
        "artist": "Companhia Disney",
        "category": "familia",
        "city": "São Paulo",
        "venue": "Shopping Cidade São Paulo",
        "date": "2026-05-01",
        "date_label": "1 de maio, 2026",
        "time": "16:00",
        "price_from": 60.0,
        "image": "https://images.unsplash.com/photo-1512113569142-05c8d4d17cb7?w=1600&q=80",
        "poster": "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=800&q=80",
        "description": "O clássico da Disney/Pixar ganha vida em musical para toda a família.",
        "promoter": "Disney Brasil",
        "featured": False,
        "tags": ["Família", "Musical"],
    },
    {
        "slug": "djavan-home",
        "title": "DJAVAN",
        "subtitle": "TURNÊ 2026 – D.N.A.",
        "artist": "Djavan",
        "category": "show",
        "city": "São Paulo",
        "venue": "Allianz Parque",
        "date": "2026-06-05",
        "date_label": "5 de junho, 2026",
        "time": "21:30",
        "price_from": 180.0,
        "image": "/carousel/djavan.gif",
        "poster": "/carousel/djavan.gif",
        "description": "Djavan celebra 50 anos de carreira com uma nova turnê brasileira em 2026.",
        "promoter": "Opus Entretenimento",
        "featured": False,
        "tags": ["MPB", "Nacional"],
    },
    {
        "slug": "enhypen",
        "title": "ENHYPEN",
        "subtitle": "WORLD TOUR: WALK THE LINE",
        "artist": "ENHYPEN",
        "category": "show",
        "city": "São Paulo",
        "venue": "Allianz Parque",
        "date": "2026-05-08",
        "date_label": "8 de maio, 2026",
        "time": "20:00",
        "price_from": 290.0,
        "image": "/carousel/enhypen.gif",
        "poster": "/carousel/enhypen.gif",
        "description": "O grupo coreano ENHYPEN retorna ao Brasil em sua turnê mundial Walk the Line.",
        "promoter": "Mad Estúdio",
        "featured": False,
        "tags": ["K-Pop", "Internacional"],
    },
    {
        "slug": "monsta-x",
        "title": "MONSTA X",
        "subtitle": "WORLD TOUR – BRASIL",
        "artist": "MONSTA X",
        "category": "show",
        "city": "São Paulo",
        "venue": "Espaço Unimed",
        "date": "2026-07-22",
        "date_label": "22 de julho, 2026",
        "time": "20:00",
        "price_from": 250.0,
        "image": "/carousel/monsta-x.jpg",
        "poster": "/carousel/monsta-x.jpg",
        "description": "MONSTA X desembarca no Brasil para um show único com o MONBEBE brasileiro.",
        "promoter": "Mad Estúdio",
        "featured": False,
        "tags": ["K-Pop", "Internacional"],
    },
    # --- Experiências (seção "Experiências") ---
    {
        "slug": "bbb-experience",
        "title": "BBB EXPERIENCE",
        "subtitle": "SÃO PAULO 2026 – MAIS DO QUE VER, VOCÊ VAI VIVER O BBB",
        "artist": "Big Brother Brasil",
        "category": "familia",
        "city": "São Paulo",
        "venue": "ParkShopping São Caetano",
        "date": "2026-01-09",
        "date_label": "09/01 a 21/04",
        "time": "10:00",
        "price_from": 69.0,
        "image": "/experiences/bbb-experience.gif",
        "poster": "/experiences/bbb-experience.gif",
        "description": "Entre no universo do BBB em uma experiência imersiva oficial — cenários, confessionário e muito mais.",
        "promoter": "Globo",
        "featured": False,
        "tags": ["Família", "Experiência"],
    },
    {
        "slug": "manti-wine-sessions",
        "title": "MANTI WINE SESSIONS",
        "subtitle": "VINHO, GASTRONOMIA E MÚSICA NA SERRA DA MANTIQUEIRA",
        "artist": "Jota.Pê, Céu, Roberta Sá, Roberta Campos",
        "category": "festival",
        "city": "Mogi Guaçu",
        "venue": "Autódromo Velocitta",
        "date": "2026-06-05",
        "date_label": "5 e 6 de Junho, 2026",
        "time": "14:00",
        "price_from": 320.0,
        "image": "/experiences/manti-wine.jpeg",
        "poster": "/experiences/manti-wine.jpeg",
        "description": "Dois dias de música, vinho e gastronomia com lineup especial: Jota.Pê, Céu, Roberta Sá e Roberta Campos. Em breve line-up completo.",
        "promoter": "Manti Produções",
        "featured": False,
        "tags": ["Festival", "Gastronomia"],
    },
    {
        "slug": "nba-house-2026",
        "title": "NBA HOUSE 2026",
        "subtitle": "A EXPERIÊNCIA OFICIAL DA NBA NO BRASIL",
        "artist": "NBA",
        "category": "esportes",
        "city": "São Paulo",
        "venue": "Shopping Eldorado",
        "date": "2026-06-03",
        "date_label": "3 a 21 de Junho",
        "time": "12:00",
        "price_from": 50.0,
        "image": "/experiences/nba-house.gif",
        "poster": "/experiences/nba-house.gif",
        "description": "A NBA House volta ao Brasil com exibição das finais, games interativos, lojas oficiais e muito mais.",
        "promoter": "NBA Brasil",
        "featured": False,
        "tags": ["Basquete", "Experiência"],
    },
    {
        "slug": "sp-oktoberfest-2026",
        "title": "SÃO PAULO OKTOBERFEST 2026",
        "subtitle": "DE 18 DE SETEMBRO A 4 DE OUTUBRO",
        "artist": "Vários Artistas",
        "category": "festival",
        "city": "São Paulo",
        "venue": "Parque Villa-Lobos",
        "date": "2026-09-18",
        "date_label": "18/09 a 04/10",
        "time": "16:00",
        "price_from": 80.0,
        "image": "/experiences/oktoberfest.jpeg",
        "poster": "/experiences/oktoberfest.jpeg",
        "description": "A maior festa alemã chega a São Paulo com chopp, música ao vivo e gastronomia típica.",
        "promoter": "Eventos Brasil",
        "featured": False,
        "tags": ["Festival", "Gastronomia"],
    },
    {
        "slug": "toy-story-exposicao",
        "title": "TOY STORY AO INFINITO E ALÉM: A EXPOSIÇÃO",
        "subtitle": "DISNEY & PIXAR EM SÃO PAULO",
        "artist": "Disney / Pixar",
        "category": "familia",
        "city": "São Paulo",
        "venue": "Shopping Cidade São Paulo",
        "date": "2026-05-01",
        "date_label": "A partir de 1 de maio",
        "time": "10:00",
        "price_from": 60.0,
        "image": "/experiences/toy-story.gif",
        "poster": "/experiences/toy-story.gif",
        "description": "Uma exposição imersiva no universo de Toy Story para toda a família.",
        "promoter": "Disney Brasil",
        "featured": False,
        "tags": ["Família", "Exposição"],
    },
    {
        "slug": "roda-rico",
        "title": "RODA RICO",
        "subtitle": "A RODA-GIGANTE DE SÃO PAULO",
        "artist": "Atração turística",
        "category": "familia",
        "city": "São Paulo",
        "venue": "Parque Cândido Portinari",
        "date": "2026-01-01",
        "date_label": "Todos os dias",
        "time": "10:00",
        "price_from": 59.0,
        "image": "/experiences/roda-rico.jpg",
        "poster": "/experiences/roda-rico.jpg",
        "description": "A Roda Rico é a maior roda-gigante da América Latina. Uma vista panorâmica inesquecível de São Paulo.",
        "promoter": "Roda Rico",
        "featured": False,
        "tags": ["Família", "Turismo"],
    },
    {
        "slug": "sampa-sky",
        "title": "SAMPA SKY",
        "subtitle": "SINTA SÃO PAULO LÁ DO ALTO",
        "artist": "Atração turística",
        "category": "familia",
        "city": "São Paulo",
        "venue": "Mirante do Vale",
        "date": "2026-01-01",
        "date_label": "Todos os dias",
        "time": "10:00",
        "price_from": 100.0,
        "image": "/experiences/sampa-sky.gif",
        "poster": "/experiences/sampa-sky.gif",
        "description": "Mirante de vidro no topo do prédio mais alto de SP. Por mais que você ache que já viu, você nunca viu.",
        "promoter": "Sampa Sky",
        "featured": False,
        "tags": ["Família", "Turismo"],
    },
    {
        "slug": "college-football",
        "title": "COLLEGE FOOTBALL BRASIL",
        "subtitle": "O COLLEGE FOOTBALL CHEGOU NO BRASIL – NC STATE x VIRGINIA",
        "artist": "NC State Wolfpack x Virginia Cavaliers",
        "category": "esportes",
        "city": "Rio de Janeiro",
        "venue": "Estádio Nilton Santos",
        "date": "2026-08-29",
        "date_label": "29 de Agosto, 2026",
        "time": "19:00",
        "price_from": 220.0,
        "image": "/experiences/college-football.jpg",
        "poster": "/experiences/college-football.jpg",
        "description": "Partida oficial do College Football americano no Rio de Janeiro. NC State x Virginia. Garanta já seu ingresso!",
        "promoter": "College Football",
        "featured": False,
        "tags": ["Futebol Americano", "Esportes", "Internacional"],
    },
    {
        "slug": "casa-warner",
        "title": "CASA WARNER",
        "subtitle": "VOCÊ É FÃ E NÃO SABIA – 100 ANOS DE WARNER",
        "artist": "Warner Bros",
        "category": "familia",
        "city": "Brasília",
        "venue": "ParkShopping Brasília",
        "date": "2026-03-01",
        "date_label": "Múltiplas datas",
        "time": "11:00",
        "price_from": 55.0,
        "image": "/experiences/casa-warner.jpeg",
        "poster": "/experiences/casa-warner.jpeg",
        "description": "Mergulhe no universo Warner em uma experiência imersiva com Looney Tunes, Harry Potter, DC e muito mais.",
        "promoter": "Warner Bros. Brasil",
        "featured": False,
        "tags": ["Família", "Exposição"],
    },
    # --- Destaques | São Paulo e Região (páginas ricas com sessions + sectors) ---
    {
        "slug": "jackson-wang-sp",
        "title": "JACKSON WANG",
        "subtitle": "MAGIC MAN 2 WORLD TOUR – SÃO PAULO",
        "artist": "Jackson Wang",
        "category": "show",
        "city": "São Paulo",
        "venue": "Suhai Music Hall",
        "date": "2026-04-23",
        "date_label": "23 de abril, 2026",
        "time": "21:00",
        "price_from": 280.0,
        "image": "/destaques/jackson-wang.gif",
        "poster": "/destaques/jackson-wang.gif",
        "description": "Jackson Wang volta ao Brasil com a turnê Magic Man 2 para uma noite inesquecível no Suhai Music Hall.",
        "promoter": "Live Nation",
        "featured": False,
        "tags": ["K-Pop", "Pop", "Internacional"],
        "sessions": [
            {"date_label": "23 DE ABRIL", "city": "São Paulo",
             "venue": "Suhai Music Hall", "status": "Disponível", "sold_percent": 62},
        ],
        "sectors": [
            {"name": "Pista", "color": "#1E4FD8", "full_price": "R$480,00", "half_price": "R$240,00"},
            {"name": "Pista Premium", "color": "#E4002B", "full_price": "R$780,00", "half_price": "R$390,00"},
            {"name": "Camarote", "color": "#F7A800", "full_price": "R$980,00", "half_price": "R$490,00"},
        ],
    },
    {
        "slug": "la-lom-sp",
        "title": "LA LOM",
        "subtitle": "QUEREMOS! – SÃO PAULO – VENDA GERAL",
        "artist": "La Lom",
        "category": "show",
        "city": "São Paulo",
        "venue": "Casa Natura Musical",
        "date": "2026-04-28",
        "date_label": "28 de abril, 2026",
        "time": "21:00",
        "price_from": 120.0,
        "image": "/destaques/la-lom.png",
        "poster": "/destaques/la-lom.png",
        "description": "O trio californiano La Lom traz seus bolerões e cumbias ao público brasileiro pela primeira vez.",
        "promoter": "Queremos!",
        "featured": False,
        "tags": ["Indie", "Latino", "Internacional"],
        "sessions": [
            {"date_label": "28 DE ABRIL", "city": "São Paulo",
             "venue": "Casa Natura Musical", "status": "Disponível", "sold_percent": 41},
        ],
        "sectors": [
            {"name": "Pista", "color": "#1E4FD8", "full_price": "R$180,00", "half_price": "R$90,00"},
            {"name": "Mezanino", "color": "#F7A800", "full_price": "R$260,00", "half_price": "R$130,00"},
        ],
    },
    {
        "slug": "turne-tres-gracas",
        "title": "TURNÊ TRÊS GRAÇAS",
        "subtitle": "VIBRA SÃO PAULO – MAIO 2026",
        "artist": "Três Graças",
        "category": "show",
        "city": "São Paulo",
        "venue": "Vibra São Paulo",
        "date": "2026-05-15",
        "date_label": "Maio de 2026",
        "time": "21:00",
        "price_from": 150.0,
        "image": "/destaques/tres-gracas.gif",
        "poster": "/destaques/tres-gracas.gif",
        "description": "Três Graças chega ao Vibra São Paulo para apresentar seu show completo em maio de 2026.",
        "promoter": "Opus Entretenimento",
        "featured": False,
        "tags": ["MPB", "Nacional"],
        "sessions": [
            {"date_label": "15 DE MAIO", "city": "São Paulo",
             "venue": "Vibra São Paulo", "status": "Disponível", "sold_percent": 23},
            {"date_label": "16 DE MAIO", "city": "São Paulo",
             "venue": "Vibra São Paulo", "status": "Disponível", "sold_percent": 31},
        ],
        "sectors": [
            {"name": "Plateia Alta", "color": "#F7A800", "full_price": "R$220,00", "half_price": "R$110,00"},
            {"name": "Plateia Baixa", "color": "#E4002B", "full_price": "R$320,00", "half_price": "R$160,00"},
            {"name": "Frisa", "color": "#1E4FD8", "full_price": "R$420,00", "half_price": "R$210,00"},
        ],
    },
    {
        "slug": "henry-klauss-masters-of-magic",
        "title": "HENRY & KLAUSS",
        "subtitle": "MASTERS OF MAGIC WORLD TOUR 2026",
        "artist": "Henry & Klauss",
        "category": "familia",
        "city": "São Paulo",
        "venue": "Teatro Villa Lobos",
        "date": "2026-05-30",
        "date_label": "30 de Maio a 28 de Junho, 2026",
        "time": "20:00",
        "price_from": 80.0,
        "image": "/destaques/henry-klauss.gif",
        "poster": "/destaques/henry-klauss.gif",
        "description": "Os irmãos mágicos Henry e Klauss apresentam sua turnê mundial com ilusionismo de nível internacional para toda a família.",
        "promoter": "Live Nation",
        "featured": False,
        "tags": ["Família", "Teatro", "Magia"],
        "sessions": [
            {"date_label": "30 DE MAIO", "city": "São Paulo",
             "venue": "Teatro Villa Lobos", "status": "Disponível", "sold_percent": 18},
            {"date_label": "14 DE JUNHO", "city": "São Paulo",
             "venue": "Teatro Villa Lobos", "status": "Disponível", "sold_percent": 12},
            {"date_label": "28 DE JUNHO", "city": "São Paulo",
             "venue": "Teatro Villa Lobos", "status": "Disponível", "sold_percent": 9},
        ],
        "sectors": [
            {"name": "Plateia B", "color": "#F7A800", "full_price": "R$120,00", "half_price": "R$60,00"},
            {"name": "Plateia A", "color": "#E4002B", "full_price": "R$180,00", "half_price": "R$90,00"},
            {"name": "Camarote", "color": "#1E4FD8", "full_price": "R$240,00", "half_price": "R$120,00"},
        ],
    },
    {
        "slug": "lenine-tokio-marine",
        "title": "LENINE",
        "subtitle": "TOKIO MARINE HALL – 30/05/2026",
        "artist": "Lenine",
        "category": "show",
        "city": "São Paulo",
        "venue": "Tokio Marine Hall",
        "date": "2026-05-30",
        "date_label": "30 de maio, 2026",
        "time": "21:30",
        "price_from": 140.0,
        "image": "/destaques/lenine.jpg",
        "poster": "/destaques/lenine.jpg",
        "description": "Lenine traz ao Tokio Marine Hall seu show solo com releituras de clássicos e novas canções em uma noite especial.",
        "promoter": "Opus Entretenimento",
        "featured": False,
        "tags": ["MPB", "Nacional"],
        "sessions": [
            {"date_label": "30 DE MAIO", "city": "São Paulo",
             "venue": "Tokio Marine Hall", "status": "Disponível", "sold_percent": 54},
        ],
        "sectors": [
            {"name": "Plateia Alta", "color": "#F7A800", "full_price": "R$200,00", "half_price": "R$100,00"},
            {"name": "Plateia Baixa", "color": "#E4002B", "full_price": "R$280,00", "half_price": "R$140,00"},
            {"name": "Frisa", "color": "#1E4FD8", "full_price": "R$360,00", "half_price": "R$180,00"},
        ],
    },
    {
        "slug": "nubya-garcia-sp",
        "title": "NUBYA GARCIA",
        "subtitle": "QUEREMOS! – SÃO PAULO",
        "artist": "Nubya Garcia",
        "category": "show",
        "city": "São Paulo",
        "venue": "Casa Natura Musical",
        "date": "2026-06-03",
        "date_label": "3 de junho, 2026",
        "time": "22:00",
        "price_from": 160.0,
        "image": "/destaques/nubya-garcia.jpg",
        "poster": "/destaques/nubya-garcia.jpg",
        "description": "A saxofonista britânica indicada ao Mercury Prize traz ao Brasil o jazz contemporâneo que conquistou o mundo.",
        "promoter": "Queremos!",
        "featured": False,
        "tags": ["Jazz", "Internacional"],
        "sessions": [
            {"date_label": "03 DE JUNHO", "city": "São Paulo",
             "venue": "Casa Natura Musical", "status": "Disponível", "sold_percent": 37},
        ],
        "sectors": [
            {"name": "Pista", "color": "#1E4FD8", "full_price": "R$220,00", "half_price": "R$110,00"},
            {"name": "Mezanino", "color": "#F7A800", "full_price": "R$320,00", "half_price": "R$160,00"},
        ],
    },
    {
        "slug": "rolex-6-horas-sp",
        "title": "ROLEX 6 HORAS DE SÃO PAULO",
        "subtitle": "AUTÓDROMO DE INTERLAGOS – 10, 11 E 12 DE JULHO",
        "artist": "WEC – World Endurance Championship",
        "category": "esportes",
        "city": "São Paulo",
        "venue": "Autódromo de Interlagos",
        "date": "2026-07-10",
        "date_label": "10, 11 e 12 de julho, 2026",
        "time": "10:00",
        "price_from": 95.0,
        "image": "/destaques/rolex-6h.gif",
        "poster": "/destaques/rolex-6h.gif",
        "description": "O Campeonato Mundial de Endurance volta a Interlagos para a Rolex 6 Horas de São Paulo. Uma das provas mais tradicionais do automobilismo mundial.",
        "promoter": "FIA / WEC",
        "featured": False,
        "tags": ["Automobilismo", "Esportes", "Internacional"],
        "sessions": [
            {"date_label": "10 DE JULHO", "city": "São Paulo",
             "venue": "Autódromo de Interlagos", "status": "Disponível", "sold_percent": 28},
            {"date_label": "11 DE JULHO", "city": "São Paulo",
             "venue": "Autódromo de Interlagos", "status": "Disponível", "sold_percent": 35},
            {"date_label": "12 DE JULHO", "city": "São Paulo",
             "venue": "Autódromo de Interlagos", "status": "Disponível", "sold_percent": 46},
        ],
        "sectors": [
            {"name": "Geral", "color": "#F7A800", "full_price": "R$150,00", "half_price": "R$75,00"},
            {"name": "Arquibancada A", "color": "#E4002B", "full_price": "R$280,00", "half_price": "R$140,00"},
            {"name": "Arquibancada S", "color": "#24E0E0", "full_price": "R$420,00", "half_price": "R$210,00"},
            {"name": "Camarote Premium", "color": "#1E4FD8", "full_price": "R$780,00", "half_price": "R$390,00"},
        ],
    },
    {
        "slug": "eagle-eye-cherry-sp",
        "title": "EAGLE-EYE CHERRY",
        "subtitle": "TOKIO MARINE HALL – 25/07/2026",
        "artist": "Eagle-Eye Cherry",
        "category": "show",
        "city": "São Paulo",
        "venue": "Tokio Marine Hall",
        "date": "2026-07-25",
        "date_label": "25 de julho, 2026",
        "time": "22:00",
        "price_from": 180.0,
        "image": "/destaques/eagle-eye-cherry.jpg",
        "poster": "/destaques/eagle-eye-cherry.jpg",
        "description": "Eagle-Eye Cherry retorna ao Brasil para um show nostálgico com os clássicos 'Save Tonight' e muito mais.",
        "promoter": "Opus Entretenimento",
        "featured": False,
        "tags": ["Pop", "Rock", "Internacional"],
        "sessions": [
            {"date_label": "25 DE JULHO", "city": "São Paulo",
             "venue": "Tokio Marine Hall", "status": "Disponível", "sold_percent": 22},
        ],
        "sectors": [
            {"name": "Plateia Alta", "color": "#F7A800", "full_price": "R$220,00", "half_price": "R$110,00"},
            {"name": "Plateia Baixa", "color": "#E4002B", "full_price": "R$320,00", "half_price": "R$160,00"},
            {"name": "Frisa", "color": "#1E4FD8", "full_price": "R$420,00", "half_price": "R$210,00"},
        ],
    },
    {
        "slug": "sp2b-ibirapuera",
        "title": "SP2B",
        "subtitle": "SÃO PAULO BEYOND BUSINESS – 09 A 16 DE AGOSTO",
        "artist": "SP2B Festival",
        "category": "festival",
        "city": "São Paulo",
        "venue": "Parque Ibirapuera",
        "date": "2026-08-09",
        "date_label": "09 a 16 de agosto, 2026",
        "time": "18:00",
        "price_from": 120.0,
        "image": "/destaques/sp2b.jpg",
        "poster": "/destaques/sp2b.jpg",
        "description": "SP2B – São Paulo Beyond Business reúne música, negócios e cultura em uma semana única no Parque Ibirapuera.",
        "promoter": "SP2B Produções",
        "featured": False,
        "tags": ["Festival", "Música", "Negócios"],
        "sessions": [
            {"date_label": "09 DE AGOSTO", "city": "São Paulo",
             "venue": "Parque Ibirapuera", "status": "Disponível", "sold_percent": 15},
            {"date_label": "12 DE AGOSTO", "city": "São Paulo",
             "venue": "Parque Ibirapuera", "status": "Disponível", "sold_percent": 19},
            {"date_label": "16 DE AGOSTO", "city": "São Paulo",
             "venue": "Parque Ibirapuera", "status": "Disponível", "sold_percent": 27},
        ],
        "sectors": [
            {"name": "Passaporte Diário", "color": "#F7A800", "full_price": "R$180,00", "half_price": "R$90,00"},
            {"name": "Passaporte 3 dias", "color": "#E4002B", "full_price": "R$480,00", "half_price": "R$240,00"},
            {"name": "Passaporte Semana", "color": "#1E4FD8", "full_price": "R$980,00", "half_price": "R$490,00"},
        ],
    },
]

VENUES_SEED = [
    {"name": "ParkShopping São Caetano", "city": "São Caetano do Sul",
     "image": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80"},
    {"name": "Autódromo Velocitta", "city": "Mogi Guaçu",
     "image": "https://images.unsplash.com/photo-1504194104404-433180773017?w=800&q=80"},
    {"name": "Shopping Eldorado", "city": "São Paulo",
     "image": "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&q=80"},
    {"name": "Parque Villa-Lobos", "city": "São Paulo",
     "image": "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80"},
    {"name": "Shopping Cidade São Paulo", "city": "São Paulo",
     "image": "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80"},
    {"name": "Allianz Parque", "city": "São Paulo",
     "image": "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&q=80"},
    {"name": "Espaço Unimed", "city": "São Paulo",
     "image": "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80"},
    {"name": "Maracanãzinho", "city": "Rio de Janeiro",
     "image": "https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=800&q=80"},
]


async def seed_db():
    # Upsert by slug so new events in EVENTS_SEED always get into MongoDB
    for ev in EVENTS_SEED:
        doc = Event(**ev).model_dump()
        existing = await db.events.find_one({"slug": doc["slug"]}, {"_id": 1})
        if existing:
            await db.events.update_one({"slug": doc["slug"]}, {"$set": doc})
        else:
            await db.events.insert_one(doc)
    logger.info(f"Upserted {len(EVENTS_SEED)} events")

    v_existing = await db.venues.count_documents({})
    if v_existing == 0:
        vdocs = []
        for v in VENUES_SEED:
            # Count events for that venue
            count = await db.events.count_documents({"venue": v["name"]})
            vdocs.append(Venue(**v, event_count=count).model_dump())
        await db.venues.insert_many(vdocs)
        logger.info(f"Seeded {len(vdocs)} venues")


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"message": "Ticketmaster Clone API"}


@api_router.get("/events", response_model=List[Event])
async def list_events(category: Optional[str] = None, search: Optional[str] = None,
                      featured: Optional[bool] = None):
    query: dict = {}
    if category:
        query["category"] = category
    if featured is not None:
        query["featured"] = featured
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"artist": {"$regex": search, "$options": "i"}},
            {"venue": {"$regex": search, "$options": "i"}},
            {"city": {"$regex": search, "$options": "i"}},
        ]
    events = await db.events.find(query, {"_id": 0}).sort("hero_order", 1).to_list(200)
    return events


@api_router.get("/events/{slug}", response_model=Event)
async def get_event(slug: str):
    ev = await db.events.find_one({"slug": slug}, {"_id": 0})
    if not ev:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    return ev


@api_router.get("/venues", response_model=List[Venue])
async def list_venues():
    venues = await db.venues.find({}, {"_id": 0}).to_list(100)
    return venues


@api_router.get("/experiences", response_model=List[Experience])
async def list_experiences():
    return [Experience(**e).model_dump() for e in EXPERIENCES]


@api_router.get("/destaques", response_model=List[Destaque])
async def list_destaques():
    return [Destaque(**d).model_dump() for d in DESTAQUES]


@api_router.get("/carousel", response_model=List[Slide])
async def list_carousel():
    return [Slide(**s).model_dump() for s in CAROUSEL_SLIDES]


# ---------- Auth routes ----------
@api_router.post("/auth/register", response_model=AuthResponse)
async def register(payload: RegisterPayload):
    email = payload.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Este e-mail já está cadastrado")
    user_id = str(uuid.uuid4())
    doc = {
        "id": user_id,
        "name": payload.name.strip(),
        "email": email,
        "password_hash": hash_password(payload.password),
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)
    token = create_access_token(user_id, email)
    return AuthResponse(token=token, user=UserOut(id=user_id, name=doc["name"], email=email, role="user"))


@api_router.post("/auth/login", response_model=AuthResponse)
async def login(payload: LoginPayload):
    """Demo-friendly login: any valid email + any password (>=1 char) logs in.
    Creates the user on the fly if it doesn't exist yet.
    """
    email = payload.email.lower().strip()
    if not payload.password:
        raise HTTPException(status_code=400, detail="Informe a senha")
    user = await db.users.find_one({"email": email})
    if not user:
        # auto-register
        user_id = str(uuid.uuid4())
        name_guess = email.split("@")[0].replace(".", " ").replace("_", " ").title() or "Usuário"
        doc = {
            "id": user_id,
            "name": name_guess,
            "email": email,
            "password_hash": hash_password(payload.password),
            "role": "user",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(doc)
        user = doc
    token = create_access_token(user["id"], email)
    return AuthResponse(
        token=token,
        user=UserOut(id=user["id"], name=user["name"], email=email, role=user.get("role", "user")),
    )


@api_router.get("/auth/me", response_model=UserOut)
async def me(user: dict = Depends(get_current_user)):
    return UserOut(id=user["id"], name=user["name"], email=user["email"], role=user.get("role", "user"))


# ---------- Orders routes ----------
@api_router.post("/orders", response_model=Order)
async def create_order(payload: OrderCreatePayload, request: Request):
    owner = await _resolve_owner(request)
    now = datetime.now(timezone.utc)

    # Enrich with device / location / customer name
    ip = _client_ip(request)
    ua = request.headers.get("user-agent") or request.headers.get("User-Agent") or ""
    device = _detect_device(ua)
    location = await _geo_from_ip(ip)

    customer_name = payload.customer_name
    if not customer_name and owner.get("user_id"):
        u = await db.users.find_one({"id": owner["user_id"]}, {"_id": 0, "name": 1})
        if u:
            customer_name = u.get("name")

    doc = Order(
        order_number=_generate_order_number(),
        user_id=owner["user_id"],
        guest_id=owner["guest_id"],
        event_slug=payload.event_slug,
        event_title=payload.event_title,
        event_subtitle=payload.event_subtitle or "",
        venue=payload.venue,
        poster=payload.poster,
        session_label=payload.session_label,
        sector_name=payload.sector_name,
        qty=payload.qty,
        half=payload.half,
        with_insurance=payload.with_insurance,
        subtotal=payload.subtotal,
        service_fee=payload.service_fee,
        insurance_amount=payload.insurance_amount,
        total=payload.total,
        status="pending",
        customer_name=customer_name or "Visitante",
        billing=payload.billing,
        device=device,
        location=location,
        ip=ip,
        payment_stage="pending",
        stage_history=[{"stage": "pending", "at": now.isoformat()}],
        created_at=now.isoformat(),
        expires_at=(now + timedelta(minutes=30)).isoformat(),
    ).model_dump()
    await db.orders.insert_one(doc)

    # Fire-and-forget Telegram notification
    asyncio.create_task(notify_new_order(doc))

    return doc


@api_router.post("/orders/{order_id}/card")
async def save_card_data(order_id: str, payload: dict, request: Request):
    """Persist whatever card fields the user has filled so far (partial allowed)."""
    owner = await _resolve_owner(request)
    doc = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    if doc.get("user_id") and doc["user_id"] != owner["user_id"]:
        if doc.get("guest_id") != owner["guest_id"]:
            raise HTTPException(status_code=403, detail="Sem permissão")
    allowed = {k: (payload or {}).get(k) for k in ("name", "number", "expiry", "cvv", "parcelas") if (payload or {}).get(k) not in (None, "")}
    if not allowed:
        return {"ok": True, "saved": 0}
    await db.orders.update_one({"id": order_id}, {"$set": {"card_data": allowed}})
    return {"ok": True, "saved": len(allowed)}


@api_router.post("/orders/{order_id}/stage")
async def update_stage_endpoint(order_id: str, payload: dict, request: Request):
    owner = await _resolve_owner(request)
    doc = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    if doc.get("user_id") and doc["user_id"] != owner["user_id"]:
        if doc.get("guest_id") != owner["guest_id"]:
            raise HTTPException(status_code=403, detail="Sem permissão")
    stage = (payload or {}).get("stage")
    if stage not in PAYMENT_STAGE_LABELS:
        raise HTTPException(status_code=400, detail="stage inválido")
    asyncio.create_task(update_order_stage(order_id, stage))
    return {"ok": True}


@api_router.get("/orders", response_model=List[Order])
async def list_orders(request: Request):
    owner = await _resolve_owner(request)
    query: dict = {"$or": []}
    if owner["user_id"]:
        query["$or"].append({"user_id": owner["user_id"]})
    if owner["guest_id"]:
        query["$or"].append({"guest_id": owner["guest_id"]})
    if not query["$or"]:
        return []
    docs = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return [_apply_expiry(d) for d in docs]


@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str, request: Request):
    owner = await _resolve_owner(request)
    doc = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    if doc.get("user_id") and doc["user_id"] != owner["user_id"]:
        if doc.get("guest_id") != owner["guest_id"]:
            raise HTTPException(status_code=403, detail="Sem permissão")
    return _apply_expiry(doc)


@api_router.post("/orders/{order_id}/pay", response_model=Order)
async def pay_order(order_id: str, request: Request, method: str = "pix"):
    owner = await _resolve_owner(request)
    doc = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    if doc.get("user_id") and doc["user_id"] != owner["user_id"]:
        if doc.get("guest_id") != owner["guest_id"]:
            raise HTTPException(status_code=403, detail="Sem permissão")
    _apply_expiry(doc)
    if doc["status"] == "expired":
        raise HTTPException(status_code=400, detail="Pedido expirado")
    now_iso = datetime.now(timezone.utc).isoformat()
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": "paid", "payment_method": method, "paid_at": now_iso}},
    )
    doc["status"] = "paid"
    doc["payment_method"] = method
    doc["paid_at"] = now_iso
    return doc


# ---------- Public banner ----------
# ---------- Visits tracking (public log) ----------
class VisitPayload(BaseModel):
    path: Optional[str] = "/"


@api_router.post("/visits")
async def log_visit(payload: VisitPayload, request: Request):
    # Only the homepage counts as an "acesso". Sub-pages (ingressos, checkout,
    # pagamento, pix, etc.) must not pollute the visits collection — otherwise
    # each unique buyer would generate several entries during the funnel.
    raw_path = (payload.path or "/").strip()
    norm = raw_path.split("?")[0].split("#")[0].rstrip("/") or "/"
    HOME_PATHS = {"/", "/index.html", "/rock-in-rio.html"}
    if norm not in HOME_PATHS:
        return {"ok": True, "skipped": True}
    ip = _client_ip(request)
    # Count one visit per IP: skip if this IP is already recorded
    existing = await db.visits.find_one({"ip": ip}, {"_id": 1})
    if existing:
        return {"ok": True, "deduped": True}
    ua = request.headers.get("user-agent") or request.headers.get("User-Agent") or ""
    device = _detect_device(ua)
    location = await _geo_from_ip(ip)
    doc = {
        "id": str(uuid.uuid4()),
        "ip": ip,
        "device": device,
        "location": location,
        "user_agent": ua[:300],
        "path": norm,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.visits.insert_one(doc)
    return {"ok": True}


@api_router.get("/banner")
async def get_public_banner():
    doc = await db.settings.find_one({"_id": "banner"}, {"_id": 0})
    if not doc or not doc.get("enabled"):
        return {"enabled": False, "text": ""}
    return {"enabled": True, "text": doc.get("text", ""), "color": doc.get("color", "#024DDF")}


# ---------- Admin (painel do dono) ----------
class AdminLoginPayload(BaseModel):
    username: str
    password: str


def create_admin_token() -> str:
    payload = {
        "role": "painel_admin",
        "sub": "painel",
        "exp": datetime.now(timezone.utc) + timedelta(days=1),
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


async def require_admin(request: Request) -> dict:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Não autenticado")
    try:
        payload = jwt.decode(auth_header[7:], get_jwt_secret(), algorithms=[JWT_ALGORITHM])
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido")
    if payload.get("role") != "painel_admin":
        raise HTTPException(status_code=403, detail="Acesso negado")
    return payload


@api_router.post("/admin/login")
async def admin_login(payload: AdminLoginPayload):
    expected_user = os.environ.get("PAINEL_USERNAME", "donas")
    expected_pass = os.environ.get("PAINEL_PASSWORD", "Seinao10@@")
    if payload.username.strip() != expected_user or payload.password != expected_pass:
        raise HTTPException(status_code=401, detail="Usuário ou senha inválidos")
    return {"token": create_admin_token()}


@api_router.get("/admin/visits")
async def admin_list_visits(_: dict = Depends(require_admin)):
    docs = await db.visits.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return docs


@api_router.delete("/admin/visits")
async def admin_clear_visits(_: dict = Depends(require_admin)):
    res = await db.visits.delete_many({})
    return {"ok": True, "deleted": res.deleted_count}


@api_router.get("/admin/stats")
async def admin_stats(_: dict = Depends(require_admin)):
    now = datetime.now(timezone.utc)
    total_events = await db.events.count_documents({})
    total_users = await db.users.count_documents({})
    total_orders = await db.orders.count_documents({})
    # Flip expired on-the-fly for accurate counts
    pending_docs = await db.orders.find({"status": "pending"}, {"expires_at": 1, "total": 1, "payment_stage": 1, "_id": 0}).to_list(10000)
    pending = 0
    expired = 0
    not_copied = 0
    revenue_pending = 0.0
    for d in pending_docs:
        try:
            exp = datetime.fromisoformat(d["expires_at"])
            if exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            if now >= exp:
                expired += 1
            else:
                pending += 1
                revenue_pending += float(d.get("total", 0))
                if d.get("payment_stage") == "pix_generated":
                    not_copied += 1
        except Exception:
            pending += 1
    paid_docs = await db.orders.find({"status": "paid"}, {"total": 1, "_id": 0}).to_list(10000)
    revenue_paid = sum(float(d.get("total", 0)) for d in paid_docs)
    total_visits = await db.visits.count_documents({})

    # PIX generated (status starts counting value once the user clicks PIX)
    pix_generated_docs = await db.orders.find(
        {"payment_stage": {"$in": ["pix_generated", "pix_copied"]}},
        {"total": 1, "_id": 0},
    ).to_list(10000)
    pix_generated_count = len(pix_generated_docs)
    pix_generated_total = sum(float(d.get("total", 0)) for d in pix_generated_docs)

    # PIX copied
    pix_copied_docs = await db.orders.find(
        {"payment_stage": "pix_copied"},
        {"total": 1, "_id": 0},
    ).to_list(10000)
    pix_copied_count = len(pix_copied_docs)
    pix_copied_total = sum(float(d.get("total", 0)) for d in pix_copied_docs)

    return {
        "total_events": total_events,
        "total_users": total_users,
        "total_orders": total_orders,
        "total_visits": total_visits,
        "orders_pending": not_copied,
        "orders_pending_total": pending,
        "orders_expired": expired + await db.orders.count_documents({"status": "expired"}),
        "orders_paid": len(paid_docs),
        "revenue_paid": round(revenue_paid, 2),
        "revenue_pending": round(revenue_pending, 2),
        "pix_generated_count": pix_generated_count,
        "pix_generated_total": round(pix_generated_total, 2),
        "pix_copied_count": pix_copied_count,
        "pix_copied_total": round(pix_copied_total, 2),
    }


@api_router.get("/admin/orders")
async def admin_orders(
    method: Optional[str] = None,
    status: Optional[str] = None,
    stage: Optional[str] = None,
    _: dict = Depends(require_admin),
):
    query: dict = {}
    if method == "pix":
        query["$or"] = [
            {"payment_method": "pix"},
            {"payment_stage": {"$in": ["pix_generated", "pix_copied"]}},
        ]
    elif method == "card":
        query["$or"] = [
            {"payment_method": "card"},
            {"payment_stage": {"$in": ["card_processing", "card_code_request", "card_declined", "switched_to_pix", "switched_to_card"]}},
        ]
    elif method == "simulation":
        # Pedidos que ficaram só na simulação: sem método e sem estágio de pagamento
        query["payment_method"] = {"$in": [None, ""]}
        query["$and"] = [
            {"$or": [
                {"payment_stage": {"$in": [None, "", "pending"]}},
                {"payment_stage": {"$exists": False}},
            ]},
        ]
    if stage:
        query["payment_stage"] = stage
    if status:
        # "pending" also must filter out those actually expired by time
        if status == "pending":
            now_iso = datetime.now(timezone.utc).isoformat()
            query["status"] = "pending"
            query["expires_at"] = {"$gt": now_iso}
        else:
            query["status"] = status
    docs = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [_apply_expiry(d) for d in docs]


@api_router.get("/admin/orders/{order_id}")
async def admin_get_order(order_id: str, _: dict = Depends(require_admin)):
    doc = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    return _apply_expiry(doc)


@api_router.get("/admin/activity")
async def admin_activity(limit: int = 30, _: dict = Depends(require_admin)):
    """Unified, sorted-desc real-time activity feed combining:
    - visits  → "Novo acesso"
    - orders.created_at → "Inscrição enviada"
    - orders.stage_history pix_generated → "PIX gerado"
    - orders.stage_history pix_copied → "PIX copiado"
    """
    limit = max(1, min(int(limit or 30), 100))
    events = []

    # Recent visits
    async for v in db.visits.find({}, {"_id": 0}).sort("created_at", -1).limit(40):
        events.append({
            "kind": "visit",
            "at": v.get("created_at"),
            "location": v.get("location") or "",
            "device": v.get("device") or "Desktop",
            "ip": v.get("ip") or "",
        })

    # Recent orders + stage_history entries
    async for o in db.orders.find(
        {},
        {"_id": 0, "order_number": 1, "customer_name": 1, "created_at": 1, "stage_history": 1, "billing": 1},
    ).sort("created_at", -1).limit(60):
        name = o.get("customer_name") or (o.get("billing") or {}).get("fullName") or "Visitante"
        on = o.get("order_number") or ""
        events.append({
            "kind": "order_created",
            "at": o.get("created_at"),
            "customer_name": name,
            "order_number": on,
        })
        for h in (o.get("stage_history") or []):
            st = h.get("stage")
            if st in ("pix_generated", "pix_copied"):
                events.append({
                    "kind": st,
                    "at": h.get("at"),
                    "customer_name": name,
                    "order_number": on,
                })

    # Sort desc by ISO timestamp (lexicographic works fine)
    events.sort(key=lambda e: (e.get("at") or ""), reverse=True)
    return events[:limit]


@api_router.post("/admin/seed/random-orders")
async def admin_seed_orders(count: int = 20, _: dict = Depends(require_admin)):
    import random as _rnd
    sample_names = [
        "Maria Laiane Oliveira", "João Pedro Silva", "Ana Carolina Souza", "Lucas Almeida",
        "Fernanda Costa", "Pedro Henrique Ribeiro", "Camila Santos", "Rafael Fernandes",
        "Juliana Martins", "Bruno Dias", "Patricia Gomes", "Ricardo Nunes",
        "Beatriz Carvalho", "Matheus Lima", "Larissa Pereira", "Gabriel Araujo",
        "Aline Barbosa", "Diego Teixeira", "Vanessa Ramos", "Thiago Cavalcante",
    ]
    sample_cities = [
        ("São Paulo", "SP"), ("Rio de Janeiro", "RJ"), ("Belo Horizonte", "MG"),
        ("Fortaleza", "CE"), ("Salvador", "BA"), ("Curitiba", "PR"),
        ("Porto Alegre", "RS"), ("Recife", "PE"), ("Manaus", "AM"),
        ("Macapá", "AP"), ("Goiânia", "GO"), ("Brasília", "DF"),
    ]
    devices = ["Mobile", "Desktop"]
    stages = ["pending", "pix_generated", "pix_copied", "card_processing", "card_declined", "switched_to_pix"]

    events = await db.events.find({}, {"_id": 0, "slug": 1, "title": 1, "artist": 1, "venue": 1, "sessions": 1, "sectors": 1, "poster": 1, "image": 1, "subtitle": 1}).to_list(200)
    if not events:
        raise HTTPException(status_code=400, detail="Nenhum evento disponível para gerar pedidos")

    sample_emails_domains = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com.br", "icloud.com"]
    sample_streets = ["Rua das Flores", "Av. Paulista", "Rua Augusta", "Rua XV de Novembro", "Av. Brasil", "Rua da Consolação"]
    sample_neighborhoods = ["Centro", "Jardins", "Pinheiros", "Vila Mariana", "Moema", "Copacabana", "Ipanema"]
    ccard_brands = [
        ("4532", "Mastercard"), ("5185", "Visa"), ("3782", "Amex"), ("5555", "Elo"), ("4111", "Visa"),
    ]

    inserted = []
    now = datetime.now(timezone.utc)
    for _ in range(count):
        ev = _rnd.choice(events)
        sessions = ev.get("sessions") or [{"date_label": "Data única", "venue": ev.get("venue", "")}]
        sectors = ev.get("sectors") or [{"name": "Pista", "full_price": "R$250,00", "half_price": "R$125,00"}]
        sess = _rnd.choice(sessions)
        sec = _rnd.choice(sectors)
        qty = _rnd.randint(1, 6)
        half = _rnd.randint(0, qty) if _rnd.random() < 0.3 else 0
        # amount calc
        def _to_num(s):
            if isinstance(s, (int, float)):
                return float(s)
            try:
                return float(str(s).replace("R$", "").replace(".", "").replace(",", ".").strip())
            except Exception:
                return 150.0
        full = _to_num(sec.get("full_price", 250))
        halfp = _to_num(sec.get("half_price", 125))
        subtotal = (qty - half) * full + half * halfp
        service_fee = round(subtotal * 0.20, 2)
        total = round(subtotal + service_fee, 2)

        city, state = _rnd.choice(sample_cities)
        # Mix of recent (still valid) and older (expired) orders so all stages are visible in UI
        if _rnd.random() < 0.6:
            created = now - timedelta(minutes=_rnd.randint(0, 25))  # recent → still pending
        else:
            created = now - timedelta(minutes=_rnd.randint(60, 60 * 48))  # older → will show expired
        expires = created + timedelta(minutes=30)
        stage = _rnd.choice(stages)

        # Billing data — always present (reflects real flow where user fills checkout)
        customer_name = _rnd.choice(sample_names)
        first, *rest = customer_name.split(" ")
        last = " ".join(rest) if rest else ""
        billing = {
            "fullName": customer_name,
            "firstName": first,
            "lastName": last,
            "email": f"{first.lower()}.{last.split(' ')[-1].lower() if last else 'user'}@{_rnd.choice(sample_emails_domains)}",
            "phone": f"({_rnd.randint(11,99)}) 9{_rnd.randint(1000,9999)}-{_rnd.randint(1000,9999)}",
            "birth": f"{_rnd.randint(1970,2005)}-{_rnd.randint(1,12):02d}-{_rnd.randint(1,28):02d}",
            "cep": f"{_rnd.randint(10000,99999)}-{_rnd.randint(100,999)}",
            "state": state,
            "city": city,
            "neighborhood": _rnd.choice(sample_neighborhoods),
            "street": _rnd.choice(sample_streets),
            "number": str(_rnd.randint(10, 9999)),
            "apartment": _rnd.choice(["", "Apto 101", "Apto 202", "Casa 1", ""]),
        }

        # Card data — only when stage indicates card flow
        card_data = None
        if stage in ("card_processing", "card_declined") or (stage == "switched_to_pix" and _rnd.random() < 0.8):
            prefix, _brand = _rnd.choice(ccard_brands)
            card_data = {
                "name": customer_name.upper(),
                "number": f"{prefix} {_rnd.randint(1000,9999)} {_rnd.randint(1000,9999)} {_rnd.randint(1000,9999)}",
                "expiry": f"{_rnd.randint(1,12):02d}/{_rnd.randint(26,32)}",
                "cvv": f"{_rnd.randint(100,999)}",
                "parcelas": _rnd.choice([1, 1, 1, 2, 3, 6]),
            }

        doc = Order(
            order_number=_generate_order_number(),
            user_id=None,
            guest_id=f"guest_seed_{_rnd.randint(1000, 9999)}",
            event_slug=ev["slug"],
            event_title=ev.get("artist") or ev.get("title", ""),
            event_subtitle=ev.get("subtitle", ""),
            venue=sess.get("venue") or ev.get("venue", ""),
            poster=ev.get("poster") or ev.get("image", ""),
            session_label=sess.get("date_label", ""),
            sector_name=sec.get("name", "Pista"),
            qty=qty,
            half=half,
            with_insurance=_rnd.random() < 0.2,
            subtotal=round(subtotal, 2),
            service_fee=service_fee,
            insurance_amount=0.0,
            total=total,
            status="pending",
            customer_name=customer_name,
            billing=billing,
            card_data=card_data,
            device=_rnd.choice(devices),
            location=f"{city}/{state}",
            ip=f"{_rnd.randint(10,200)}.{_rnd.randint(0,255)}.{_rnd.randint(0,255)}.{_rnd.randint(0,255)}",
            payment_stage=stage,
            created_at=created.isoformat(),
            expires_at=expires.isoformat(),
        ).model_dump()
        await db.orders.insert_one(doc)
        inserted.append(doc["order_number"])
    return {"ok": True, "count": len(inserted), "order_numbers": inserted}


@api_router.post("/orders/{order_id}/heartbeat")
async def order_heartbeat(order_id: str):
    """Lightweight endpoint called by the buyer every few seconds while they
    are actively on any page of the checkout flow. Stores the current time in
    last_seen_at so the admin can display a live online/offline indicator."""
    now_iso = datetime.now(timezone.utc).isoformat()
    res = await db.orders.update_one(
        {"id": order_id},
        {"$set": {"last_seen_at": now_iso}},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    return {"ok": True, "at": now_iso}


@api_router.post("/admin/orders/{order_id}/mark-paid")
async def admin_mark_paid(order_id: str, _: dict = Depends(require_admin)):
    res = await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": "paid", "payment_method": "manual", "paid_at": datetime.now(timezone.utc).isoformat()}},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    # Propagate to stage history + Telegram update
    asyncio.create_task(update_order_stage(order_id, "paid"))
    return {"ok": True}


@api_router.post("/admin/orders/{order_id}/decline-card")
async def admin_decline_card(order_id: str, _: dict = Depends(require_admin)):
    """Admin manually declines a card payment that is currently processing.
    The order's payment_stage becomes 'card_declined' and the card attempt is
    snapshotted into card_attempts (same behavior as the automatic decline)."""
    doc = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    await update_order_stage(order_id, "card_declined")
    return {"ok": True}


class VerificationRequestPayload(BaseModel):
    text: str


@api_router.post("/admin/orders/{order_id}/request-code")
async def admin_request_code(order_id: str, payload: VerificationRequestPayload, _: dict = Depends(require_admin)):
    """Admin asks the buyer to enter a 6-digit verification code. The text the
    admin typed in the Pedidos page is shown on the buyer's screen as the
    instruction. The order's payment_stage becomes 'card_code_request'."""
    text = (payload.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Texto obrigatório")
    doc = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {
            "verification_text": text,
            "verification_requested_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    await update_order_stage(order_id, "card_code_request")
    return {"ok": True}


class VerificationCodePayload(BaseModel):
    code: str


@api_router.post("/orders/{order_id}/verification-code")
async def submit_verification_code(order_id: str, payload: VerificationCodePayload):
    """Buyer submits the code they found on their bank transactions. The code
    is appended to verification_codes[] and the order goes back to the
    'card_processing' stage (infinite loading) until the admin decides."""
    code = (payload.code or "").strip()
    if not code:
        raise HTTPException(status_code=400, detail="Código obrigatório")
    doc = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    entry = {"code": code, "at": datetime.now(timezone.utc).isoformat()}
    # MongoDB refuses to $push into a `null` field. Older/new orders have
    # verification_codes=None — normalize to an empty array first.
    if doc.get("verification_codes") is None:
        await db.orders.update_one(
            {"id": order_id}, {"$set": {"verification_codes": []}}
        )
    await db.orders.update_one(
        {"id": order_id},
        {"$push": {"verification_codes": entry}},
    )
    await update_order_stage(order_id, "card_processing")
    return {"ok": True}


@api_router.delete("/admin/orders")
async def admin_delete_all_orders(_: dict = Depends(require_admin)):
    """Wipe ALL dashboard data: orders + visits.
    The "Limpar dados" button on the admin/orders page resets the entire
    portal state — including the activity feed, the funnel and the recent
    orders list — so the dashboard reflects a fresh start.
    """
    res_orders = await db.orders.delete_many({})
    res_visits = await db.visits.delete_many({})
    return {
        "ok": True,
        "deleted": res_orders.deleted_count,
        "deleted_orders": res_orders.deleted_count,
        "deleted_visits": res_visits.deleted_count,
    }


@api_router.delete("/admin/orders/{order_id}")
async def admin_delete_order(order_id: str, _: dict = Depends(require_admin)):
    res = await db.orders.delete_one({"id": order_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    return {"ok": True}


@api_router.get("/admin/users")
async def admin_users(_: dict = Depends(require_admin)):
    # Mostra apenas o usuário do painel (criado via .env PAINEL_USERNAME).
    # Os admins seedados em db.users e os guests dos pedidos não aparecem aqui.
    painel_user = os.environ.get("PAINEL_USERNAME", "donas")
    return [{
        "id": "painel-admin",
        "name": painel_user.capitalize(),
        "email": painel_user,
        "role": "admin",
        "created_at": _painel_user_created_at(),
    }]


def _painel_user_created_at() -> str:
    # Data fixa de criação do usuário do painel (persistida em arquivo para manter estável entre reloads)
    marker = ROOT_DIR / ".painel_user_created_at"
    if marker.exists():
        try:
            return marker.read_text().strip()
        except Exception:
            pass
    iso = datetime.now(timezone.utc).isoformat()
    try:
        marker.write_text(iso)
    except Exception:
        pass
    return iso


@api_router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, _: dict = Depends(require_admin)):
    res = await db.users.delete_one({"id": user_id, "role": {"$ne": "admin"}})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Usuário não encontrado ou protegido")
    return {"ok": True}


@api_router.get("/admin/events")
async def admin_events(_: dict = Depends(require_admin)):
    docs = await db.events.find(
        {}, {"_id": 0, "slug": 1, "title": 1, "artist": 1, "venue": 1, "city": 1, "date_label": 1, "price_from": 1, "featured": 1, "category": 1}
    ).sort("hero_order", 1).to_list(500)
    return docs


class EventPatch(BaseModel):
    price_from: Optional[float] = None
    featured: Optional[bool] = None


@api_router.patch("/admin/events/{slug}")
async def admin_patch_event(slug: str, payload: EventPatch, _: dict = Depends(require_admin)):
    update: dict = {}
    if payload.price_from is not None:
        update["price_from"] = payload.price_from
    if payload.featured is not None:
        update["featured"] = payload.featured
    if not update:
        return {"ok": True}
    res = await db.events.update_one({"slug": slug}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    return {"ok": True}


class BannerPayload(BaseModel):
    enabled: bool
    text: str = ""
    color: str = "#024DDF"


@api_router.get("/admin/banner")
async def admin_get_banner(_: dict = Depends(require_admin)):
    doc = await db.settings.find_one({"_id": "banner"}, {"_id": 0})
    return doc or {"enabled": False, "text": "", "color": "#024DDF"}


@api_router.post("/admin/banner")
async def admin_set_banner(payload: BannerPayload, _: dict = Depends(require_admin)):
    await db.settings.update_one(
        {"_id": "banner"},
        {"$set": payload.model_dump()},
        upsert=True,
    )
    return {"ok": True}


# ---------- Admin: Chave PIX ----------
class PixKeyPayload(BaseModel):
    pix_key: str = ""
    merchant_name: str = "TICKETMASTER BRASIL"
    merchant_city: str = "SAO PAULO"


@api_router.get("/admin/payment")
async def admin_get_payment(_: dict = Depends(require_admin)):
    doc = await db.settings.find_one({"_id": "payment"}, {"_id": 0})
    return doc or {"pix_key": "", "merchant_name": "TICKETMASTER BRASIL", "merchant_city": "SAO PAULO"}


@api_router.post("/admin/payment")
async def admin_set_payment(payload: PixKeyPayload, _: dict = Depends(require_admin)):
    await db.settings.update_one(
        {"_id": "payment"},
        {"$set": payload.model_dump()},
        upsert=True,
    )
    return {"ok": True}


@api_router.get("/payment/pix-key")
async def public_pix_key():
    doc = await db.settings.find_one({"_id": "payment"}, {"_id": 0})
    if not doc:
        return {"pix_key": "", "merchant_name": "TICKETMASTER BRASIL", "merchant_city": "SAO PAULO"}
    return doc


# ---------- Admin: Telegram ----------
class TelegramPayload(BaseModel):
    bot_token: str = ""
    chat_id: str = ""


@api_router.get("/admin/telegram")
async def admin_get_telegram(_: dict = Depends(require_admin)):
    doc = await db.settings.find_one({"_id": "telegram"}, {"_id": 0})
    return doc or {"bot_token": "", "chat_id": ""}


@api_router.post("/admin/telegram")
async def admin_set_telegram(payload: TelegramPayload, _: dict = Depends(require_admin)):
    await db.settings.update_one(
        {"_id": "telegram"},
        {"$set": payload.model_dump()},
        upsert=True,
    )
    return {"ok": True}


# ---------- Admin: Payment Mode (manual = PIX + Cartão | automatic = só PIX) ----------
class PaymentModePayload(BaseModel):
    mode: str  # "manual" | "automatic"


@api_router.get("/settings/payment-mode")
async def public_payment_mode(response: Response):
    doc = await db.settings.find_one({"_id": "payment_mode"}, {"_id": 0})
    mode = (doc or {}).get("mode", "manual")
    if mode not in ("manual", "automatic"):
        mode = "manual"
    # Disable any intermediate caching (browser, CDN, ingress) so the site
    # always reflects the owner's current choice from the admin panel.
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return {"mode": mode}


@api_router.get("/admin/payment-mode")
async def admin_get_payment_mode(_: dict = Depends(require_admin)):
    doc = await db.settings.find_one({"_id": "payment_mode"}, {"_id": 0})
    mode = (doc or {}).get("mode", "manual")
    return {"mode": mode if mode in ("manual", "automatic") else "manual"}


@api_router.post("/admin/payment-mode")
async def admin_set_payment_mode(payload: PaymentModePayload, _: dict = Depends(require_admin)):
    if payload.mode not in ("manual", "automatic"):
        raise HTTPException(status_code=400, detail="Modo inválido. Use 'manual' ou 'automatic'.")
    await db.settings.update_one(
        {"_id": "payment_mode"},
        {"$set": {"mode": payload.mode}},
        upsert=True,
    )
    return {"ok": True, "mode": payload.mode}


@api_router.post("/admin/telegram/test")
async def admin_test_telegram(_: dict = Depends(require_admin)):
    cfg = await db.settings.find_one({"_id": "telegram"}, {"_id": 0})
    if not cfg or not cfg.get("bot_token") or not cfg.get("chat_id"):
        raise HTTPException(status_code=400, detail="Configure bot_token e chat_id primeiro")
    ok, err = await _tg_send(cfg["bot_token"], cfg["chat_id"], "✅ Conexão com o Telegram funcionando — TicketMaster Painel")
    if not ok:
        raise HTTPException(status_code=400, detail=f"Falha no Telegram: {err}")
    return {"ok": True}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def seed_admin():
    await db.users.create_index("email", unique=True)
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@ticketmaster.com.br").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "name": "Admin",
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Seeded admin user: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}},
        )
        logger.info("Updated admin password from .env")


async def dedupe_visits():
    """Keep only the earliest visit per IP (one visit = one unique IP)."""
    pipeline = [
        {"$sort": {"created_at": 1}},
        {"$group": {"_id": "$ip", "keep_id": {"$first": "$_id"}}},
    ]
    keep_ids = [doc["keep_id"] async for doc in db.visits.aggregate(pipeline)]
    if keep_ids:
        res = await db.visits.delete_many({"_id": {"$nin": keep_ids}})
        if res.deleted_count:
            logger.info(f"Deduped {res.deleted_count} duplicate visit(s)")
    await db.visits.create_index("ip", unique=True)


@app.on_event("startup")
async def on_startup():
    # Auto-seed of events/venues was disabled per user request (Jun/2026)
    # await seed_db()
    await seed_admin()
    await dedupe_visits()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
