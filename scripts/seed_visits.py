"""Seed simulated Brazilian visits directly into MongoDB (bypasses ip-api rate limit)."""
import asyncio
import os
import random
import uuid
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(Path(__file__).parent.parent / "backend" / ".env")

TARGET = int(os.environ.get("VISITS_TARGET", "5742"))
DAYS_BACK = 30  # spread visits across last 30 days


BR_LOCATIONS = [
    # (City, State, Approx IP block prefix used by major BR ISPs)
    ("São Paulo", "SP", ["177.84.", "177.85.", "177.86.", "187.32.", "189.6.", "200.142."]),
    ("Rio de Janeiro", "RJ", ["177.66.", "187.84.", "200.96.", "201.92.", "189.45."]),
    ("Belo Horizonte", "MG", ["177.92.", "189.59.", "200.179.", "186.220."]),
    ("Brasília", "DF", ["177.137.", "189.6.", "200.10.", "186.215."]),
    ("Curitiba", "PR", ["177.99.", "187.51.", "200.184.", "189.59."]),
    ("Porto Alegre", "RS", ["177.103.", "187.121.", "200.196.", "189.124."]),
    ("Salvador", "BA", ["177.43.", "187.59.", "189.74.", "200.213."]),
    ("Recife", "PE", ["177.36.", "187.74.", "189.4.", "200.219."]),
    ("Fortaleza", "CE", ["177.40.", "187.61.", "189.41.", "200.222."]),
    ("Goiânia", "GO", ["177.135.", "187.122.", "189.79.", "200.171."]),
    ("Manaus", "AM", ["177.183.", "187.106.", "189.103.", "200.165."]),
    ("Belém", "PA", ["177.20.", "187.99.", "189.6.", "200.149."]),
    ("Campinas", "SP", ["177.155.", "187.21.", "189.6.", "200.150."]),
    ("Santos", "SP", ["177.158.", "187.74.", "189.42.", "200.158."]),
    ("Florianópolis", "SC", ["177.97.", "187.61.", "189.124.", "200.187."]),
    ("Vitória", "ES", ["177.124.", "187.66.", "189.40.", "200.155."]),
    ("Natal", "RN", ["177.94.", "187.49.", "189.78.", "200.232."]),
    ("João Pessoa", "PB", ["177.39.", "187.49.", "189.83.", "200.207."]),
    ("Maceió", "AL", ["177.92.", "187.7.", "189.124.", "200.252."]),
    ("Aracaju", "SE", ["177.95.", "187.74.", "189.40.", "200.252."]),
    ("Teresina", "PI", ["177.45.", "187.106.", "189.123.", "200.252."]),
    ("São Luís", "MA", ["177.42.", "187.4.", "189.45.", "200.252."]),
    ("Cuiabá", "MT", ["177.46.", "187.84.", "189.121.", "200.244."]),
    ("Campo Grande", "MS", ["177.139.", "187.94.", "189.18.", "200.252."]),
    ("Porto Velho", "RO", ["177.81.", "187.65.", "189.103.", "200.252."]),
    ("Boa Vista", "RR", ["177.91.", "187.103.", "189.42.", "200.171."]),
    ("Rio Branco", "AC", ["177.124.", "187.106.", "189.42.", "200.252."]),
    ("Macapá", "AP", ["177.182.", "187.121.", "189.42.", "200.252."]),
    ("Palmas", "TO", ["177.92.", "187.106.", "189.45.", "200.252."]),
    ("Londrina", "PR", ["177.46.", "187.74.", "189.40.", "200.252."]),
    ("Joinville", "SC", ["177.124.", "187.103.", "189.124.", "200.252."]),
    ("Ribeirão Preto", "SP", ["177.46.", "187.4.", "189.42.", "200.252."]),
    ("São José dos Campos", "SP", ["177.46.", "187.74.", "189.42.", "200.252."]),
    ("Sorocaba", "SP", ["177.45.", "187.74.", "189.42.", "200.252."]),
    ("Niterói", "RJ", ["177.86.", "187.84.", "189.45.", "200.96."]),
    ("Uberlândia", "MG", ["177.46.", "187.59.", "189.40.", "200.252."]),
    ("Juiz de Fora", "MG", ["177.92.", "187.84.", "189.40.", "200.252."]),
    ("Aparecida de Goiânia", "GO", ["177.135.", "187.122.", "189.79.", "200.171."]),
    ("Feira de Santana", "BA", ["177.43.", "187.59.", "189.74.", "200.213."]),
    ("Pelotas", "RS", ["177.103.", "187.121.", "200.196.", "189.124."]),
]

UA_LIST = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Safari/605.1.15",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Linux; Android 13; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; rv:124.0) Gecko/20100101 Firefox/124.0",
    "Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
]

PATHS = ["/"]  # only the homepage is registered as an access now


def detect_device(ua: str) -> str:
    u = ua.lower()
    if any(k in u for k in ("iphone", "android", "mobile", "ipad")):
        return "Mobile"
    return "Desktop"


def rand_ip(prefix: str) -> str:
    parts = prefix.split(".")
    while len(parts) < 4:
        parts.append(str(random.randint(2, 254)))
    return ".".join(parts[:4])


def rand_created_at() -> str:
    # Distribute mostly into the last 7 days, with a long tail to 30 days
    if random.random() < 0.6:
        delta_days = random.uniform(0, 7)
    else:
        delta_days = random.uniform(7, DAYS_BACK)
    dt = datetime.now(timezone.utc) - timedelta(days=delta_days, hours=random.randint(0, 23), minutes=random.randint(0, 59))
    return dt.isoformat()


async def main():
    mongo_url = os.environ["MONGO_URL"]
    db_name = os.environ["DB_NAME"]
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    # Drop unique index temporarily isn't needed because we use upsert by IP.
    # Instead, generate unique IPs by tracking what we already have + a set.
    existing_ips = set()
    async for d in db.visits.find({}, {"ip": 1}):
        existing_ips.add(d.get("ip"))

    print(f"[seed-visits] Já existem {len(existing_ips)} visitas no banco")
    print(f"[seed-visits] Alvo: {TARGET}")

    to_insert = []
    attempts = 0
    target_new = max(0, TARGET - len(existing_ips))
    while len(to_insert) < target_new and attempts < target_new * 8:
        attempts += 1
        city, state, prefixes = random.choice(BR_LOCATIONS)
        ip = rand_ip(random.choice(prefixes))
        if ip in existing_ips:
            continue
        existing_ips.add(ip)
        ua = random.choice(UA_LIST)
        doc = {
            "id": str(uuid.uuid4()),
            "ip": ip,
            "device": detect_device(ua),
            "location": f"{city}/{state}",
            "user_agent": ua[:300],
            "path": random.choice(PATHS),
            "created_at": rand_created_at(),
        }
        to_insert.append(doc)
        if len(to_insert) % 500 == 0:
            print(f"  ... {len(to_insert)} preparadas")

    if to_insert:
        # Insert in chunks of 1000
        CHUNK = 1000
        for i in range(0, len(to_insert), CHUNK):
            await db.visits.insert_many(to_insert[i:i + CHUNK], ordered=False)
            print(f"  Inseridas {min(i + CHUNK, len(to_insert))}/{len(to_insert)}")

    total = await db.visits.count_documents({})
    print(f"\n[seed-visits] Total final: {total} visitas")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
