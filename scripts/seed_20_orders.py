"""Create exactly 20 simulated orders (mix PIX, card, pending)."""
import os
import sys
import random
from pathlib import Path

# Reuse the helpers from seed_50_orders
sys.path.insert(0, str(Path(__file__).parent))
import requests  # noqa: E402
import uuid  # noqa: E402

from seed_50_orders import (  # noqa: E402
    fetch_events,
    build_billing,
    build_order_payload,
    create_order,
    save_card,
    set_stage,
)

API_BASE = os.environ.get("API_BASE", "http://localhost:8001/api")


def main():
    print(f"[seed20] API = {API_BASE}")
    events = fetch_events()
    print(f"[seed20] {len(events)} eventos carregados")
    if not events:
        sys.exit("nenhum evento")

    plan = (["pix"] * 10) + (["card"] * 8) + (["none"] * 2)
    random.shuffle(plan)

    summary = {"pix": 0, "card": 0, "none": 0, "errors": 0}
    created = []
    for i, kind in enumerate(plan, start=1):
        sess = requests.Session()
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
            oid = order["id"]
            if kind == "pix":
                set_stage(sess, oid, "pix_generated")
                if random.random() < 0.6:
                    set_stage(sess, oid, "pix_copied")
                summary["pix"] += 1
            elif kind == "card":
                save_card(sess, oid, billing)
                set_stage(sess, oid, "card_processing")
                if random.random() < 0.3:
                    set_stage(sess, oid, "card_declined")
                summary["card"] += 1
            else:
                summary["none"] += 1
            created.append(order["order_number"])
            print(f"  [{i:02d}/20] {kind.upper():<4} OK  #{order['order_number']}  R$ {order['total']:.2f}  "
                  f"{billing['fullName']} ({billing['city']}-{billing['state']}) — {event['title'][:40]}")
        except Exception as e:
            summary["errors"] += 1
            print(f"  [{i:02d}/20] {kind.upper():<4} ERRO: {e}")

    print("\n===== RESUMO =====")
    print(f"  PIX:        {summary['pix']}/10")
    print(f"  Cartao:     {summary['card']}/8")
    print(f"  Pendentes:  {summary['none']}/2")
    print(f"  Erros:      {summary['errors']}")
    print(f"  Total:      {len(created)}")


if __name__ == "__main__":
    main()
