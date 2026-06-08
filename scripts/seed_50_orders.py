"""
Seed 50 pedidos de teste:
 - 20 com PIX (payment_stage = pix_generated/pix_copied)
 - 20 com CARTÃO (salva card_data + payment_stage = card_processing)
 - 10 sem forma de pagamento (payment_stage = pending)
Todos com dados pessoais brasileiros realistas.
"""
import os
import sys
import random
import uuid
import requests
from datetime import datetime

API_BASE = os.environ.get("API_BASE", "http://localhost:8001/api")

# ---- Datasets realistas (PT-BR) ----
FIRST_NAMES = [
    "Gabriel", "Lucas", "João", "Matheus", "Pedro", "Rafael", "Felipe", "Guilherme",
    "Bruno", "Rodrigo", "Thiago", "Eduardo", "Vinícius", "Leonardo", "Henrique",
    "Maria", "Ana", "Juliana", "Camila", "Beatriz", "Larissa", "Fernanda", "Mariana",
    "Amanda", "Letícia", "Carolina", "Isabela", "Natália", "Bruna", "Gabriela",
    "Jéssica", "Patrícia", "Renata", "Vanessa", "Aline", "Priscila", "Sabrina",
    "Diego", "Ricardo", "Anderson", "Fábio", "Marcos", "André", "Caio", "Daniel",
    "Everton", "Igor", "Júlio", "Leandro", "Márcio", "Nelson"
]
LAST_NAMES = [
    "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves",
    "Pereira", "Lima", "Gomes", "Ribeiro", "Carvalho", "Almeida", "Araújo",
    "Martins", "Barbosa", "Rocha", "Moreira", "Cardoso", "Pinto", "Teixeira",
    "Moura", "Correia", "Costa", "Azevedo", "Nunes", "Melo", "Dias", "Castro",
    "Fernandes", "Cavalcanti", "Freitas", "Machado", "Vieira", "Ramos"
]

CITIES = [
    ("São Paulo", "SP", "01310"),
    ("Rio de Janeiro", "RJ", "20040"),
    ("Belo Horizonte", "MG", "30140"),
    ("Curitiba", "PR", "80010"),
    ("Porto Alegre", "RS", "90010"),
    ("Salvador", "BA", "40020"),
    ("Recife", "PE", "50010"),
    ("Fortaleza", "CE", "60010"),
    ("Brasília", "DF", "70040"),
    ("Goiânia", "GO", "74010"),
    ("Manaus", "AM", "69010"),
    ("Belém", "PA", "66010"),
    ("Campinas", "SP", "13010"),
    ("Santos", "SP", "11010"),
    ("Florianópolis", "SC", "88010"),
]

NEIGHBORHOODS = [
    "Centro", "Jardim Paulista", "Vila Mariana", "Pinheiros", "Moema",
    "Copacabana", "Ipanema", "Botafogo", "Barra da Tijuca", "Tijuca",
    "Savassi", "Funcionários", "Batel", "Água Verde", "Moinhos de Vento",
    "Pituba", "Boa Viagem", "Meireles", "Asa Sul", "Asa Norte",
]

STREETS = [
    "Rua das Flores", "Av. Paulista", "Rua Augusta", "Av. Brasil", "Rua XV de Novembro",
    "Av. Atlântica", "Rua Oscar Freire", "Av. Rebouças", "Rua da Consolação",
    "Av. Faria Lima", "Rua Bela Cintra", "Av. Nove de Julho", "Rua Haddock Lobo",
    "Av. Ipiranga", "Rua Teodoro Sampaio", "Av. Brigadeiro Luís Antônio",
]

EMAIL_DOMAINS = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com.br", "icloud.com"]

CARD_FLAGS = ["Visa", "Master", "Elo", "Hipercard"]


def rand_birth():
    y = random.randint(1970, 2005)
    m = random.randint(1, 12)
    d = random.randint(1, 28)
    return f"{y:04d}-{m:02d}-{d:02d}"


def rand_phone():
    ddd = random.choice([11, 21, 31, 41, 51, 61, 71, 81, 85, 62, 27, 92])
    num = random.randint(90000000, 99999999)
    return f"({ddd}) 9{str(num)[0:4]}-{str(num)[4:]}"


def rand_cep(prefix):
    return f"{prefix}-{random.randint(100, 999):03d}"


def rand_card_number():
    # 16 digitos formatados
    groups = [str(random.randint(1000, 9999)) for _ in range(4)]
    return " ".join(groups)


def rand_expiry():
    m = random.randint(1, 12)
    y = random.randint(26, 32)
    return f"{m:02d}/{y:02d}"


def build_billing():
    first = random.choice(FIRST_NAMES)
    last = random.choice(LAST_NAMES)
    full = f"{first} {last}"
    city, state, cep_prefix = random.choice(CITIES)
    email_base = f"{first}.{last}".lower().replace("ã", "a").replace("õ", "o").replace("á", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u").replace("ç", "c")
    email = f"{email_base}{random.randint(10, 9999)}@{random.choice(EMAIL_DOMAINS)}"
    return {
        "fullName": full,
        "firstName": first,
        "lastName": last,
        "birth": rand_birth(),
        "email": email,
        "phone": rand_phone(),
        "cep": rand_cep(cep_prefix),
        "state": state,
        "city": city,
        "neighborhood": random.choice(NEIGHBORHOODS),
        "street": random.choice(STREETS),
        "number": str(random.randint(10, 9999)),
        "apartment": random.choice(["", f"Apto {random.randint(10, 250)}", f"Bloco {random.choice('ABCDE')}", ""]),
    }


def fetch_events():
    r = requests.get(f"{API_BASE}/events", timeout=15)
    r.raise_for_status()
    return r.json()


def build_order_payload(event, billing):
    qty = random.choice([1, 1, 2, 2, 3, 4])
    half = random.choice([0, 0, 0, 1])
    def _to_float(v, default=250.0):
        if v is None:
            return default
        if isinstance(v, (int, float)):
            return float(v)
        s = str(v).strip().replace("R$", "").replace(" ", "").replace(".", "").replace(",", ".")
        try:
            return float(s)
        except Exception:
            return default

    # Sector name
    if event.get("sectors"):
        sec = random.choice(event["sectors"])
        sector_name = sec.get("name", "Pista")
        unit = _to_float(sec.get("full_price"), _to_float(event.get("price_from"), 250))
    else:
        sector_name = random.choice(["Pista", "Pista Premium", "Cadeira Inferior", "Cadeira Superior", "Camarote", "VIP"])
        unit = _to_float(event.get("price_from"), 250)
    subtotal = round(unit * qty, 2)
    service_fee = round(subtotal * 0.20, 2)
    with_insurance = random.random() < 0.3
    insurance_amount = round(8.9 * qty, 2) if with_insurance else 0.0
    total = round(subtotal + service_fee + insurance_amount, 2)

    # Session label
    sessions = event.get("sessions") or []
    if sessions:
        sess = random.choice(sessions)
        session_label = sess.get("date_label") or event.get("date_label") or "Data única"
    else:
        session_label = event.get("date_label") or "Data única"

    return {
        "event_slug": event["slug"],
        "event_title": event["title"],
        "event_subtitle": event.get("subtitle") or "",
        "venue": event.get("venue") or "",
        "poster": event.get("poster") or event.get("image") or "",
        "session_label": session_label,
        "sector_name": sector_name,
        "qty": qty,
        "half": min(half, qty),
        "with_insurance": with_insurance,
        "subtotal": subtotal,
        "service_fee": service_fee,
        "insurance_amount": insurance_amount,
        "total": total,
        "customer_name": billing["fullName"],
        "billing": billing,
    }


def create_order(session, payload):
    r = session.post(f"{API_BASE}/orders", json=payload, timeout=20)
    r.raise_for_status()
    return r.json()


def save_card(session, order_id, billing):
    card_data = {
        "name": billing["fullName"].upper(),
        "number": rand_card_number(),
        "expiry": rand_expiry(),
        "cvv": f"{random.randint(100, 999)}",
        "parcelas": random.choice([1, 2, 3, 4, 6, 10, 12]),
    }
    r = session.post(f"{API_BASE}/orders/{order_id}/card", json=card_data, timeout=15)
    r.raise_for_status()


def set_stage(session, order_id, stage):
    r = session.post(f"{API_BASE}/orders/{order_id}/stage", json={"stage": stage}, timeout=15)
    r.raise_for_status()


def main():
    print(f"[seed] API = {API_BASE}")
    events = fetch_events()
    if not events:
        print("ERRO: nenhum evento encontrado")
        sys.exit(1)
    print(f"[seed] {len(events)} eventos carregados")

    # Plan: 20 pix, 20 card, 10 sem forma
    plan = (["pix"] * 20) + (["card"] * 20) + (["none"] * 10)
    random.shuffle(plan)

    summary = {"pix": 0, "card": 0, "none": 0, "errors": 0}
    created = []

    for i, kind in enumerate(plan, start=1):
        # Cada pedido = visitante diferente (guest_id único via cookie/ID simulado)
        # Criamos uma sessão nova por pedido para isolar guest_id no cookie
        sess = requests.Session()
        # Simula user-agent variado
        ua = random.choice([
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_3) AppleWebKit/605.1.15 Safari/605.1.15",
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
            "Mozilla/5.0 (Linux; Android 13; SM-G998B) AppleWebKit/537.36 Chrome/124.0 Mobile Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; rv:124.0) Gecko/20100101 Firefox/124.0",
        ])
        sess.headers.update({"User-Agent": ua, "X-Guest-Id": str(uuid.uuid4())})

        billing = build_billing()
        event = random.choice(events)
        payload = build_order_payload(event, billing)

        try:
            order = create_order(sess, payload)
            order_id = order["id"]
            if kind == "pix":
                set_stage(sess, order_id, "pix_generated")
                if random.random() < 0.6:
                    set_stage(sess, order_id, "pix_copied")
                summary["pix"] += 1
            elif kind == "card":
                save_card(sess, order_id, billing)
                set_stage(sess, order_id, "card_processing")
                # chance do cartão ser recusado
                if random.random() < 0.3:
                    set_stage(sess, order_id, "card_declined")
                summary["card"] += 1
            else:
                # sem forma de pagamento — permanece pending
                summary["none"] += 1
            created.append({"id": order_id, "order_number": order["order_number"], "kind": kind, "total": order["total"]})
            print(f"  [{i:02d}/{len(plan)}] {kind.upper():<4} ✅ #{order['order_number']}  R$ {order['total']:.2f}  — {billing['fullName']} / {billing['city']}-{billing['state']}")
        except Exception as e:
            summary["errors"] += 1
            print(f"  [{i:02d}/{len(plan)}] {kind.upper():<4} ❌ ERRO: {e}")

    print("\n===== RESUMO =====")
    print(f"  PIX:              {summary['pix']}/20")
    print(f"  Cartão:           {summary['card']}/20")
    print(f"  Sem forma:        {summary['none']}/10")
    print(f"  Erros:            {summary['errors']}")
    print(f"  Total criado:     {len(created)}")


if __name__ == "__main__":
    main()
