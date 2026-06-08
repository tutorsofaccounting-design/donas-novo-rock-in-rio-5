import { X, User, MapPin, CreditCard, QrCode, Download, History, Check, Ban, KeyRound } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import { formatOrderTxt, downloadTxt } from "../../lib/exportOrders";
import { useAdminAuth, adminHeaders } from "../../context/AdminAuthContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const FONT = '"Averta","Mulish","Helvetica Neue",Helvetica,Arial,sans-serif';

const STAGE_LABELS = {
  pending: "Aguardando pagamento",
  pix_generated: "PIX gerado",
  pix_copied: "PIX copiado",
  card_processing: "Cartão sendo processado",
  card_code_request: "Código de verificação pedido",
  card_declined: "Cartão recusado pelo banco",
  switched_to_pix: "Mudou de Cartão → PIX",
  switched_to_card: "Mudou de PIX → Cartão",
  paid: "Pagamento confirmado",
  expired: "Pedido expirado",
};

const STAGE_COLORS = {
  // Neutral palette — single subtle color for all history entries.
  // Only terminal "paid" gets a soft green to highlight success.
  pending: { bg: "#f3f4f6", fg: "#374151" },
  pix_generated: { bg: "#f3f4f6", fg: "#374151" },
  pix_copied: { bg: "#f3f4f6", fg: "#374151" },
  card_processing: { bg: "#f3f4f6", fg: "#374151" },
  card_code_request: { bg: "#f3f4f6", fg: "#374151" },
  card_declined: { bg: "#f3f4f6", fg: "#374151" },
  switched_to_pix: { bg: "#f3f4f6", fg: "#374151" },
  switched_to_card: { bg: "#f3f4f6", fg: "#374151" },
  paid: { bg: "#dcfce7", fg: "#15803d" },
  expired: { bg: "#f3f4f6", fg: "#374151" },
};

function Row({ label, value, mono }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between gap-3 py-1.5 border-b border-gray-100 last:border-0 text-[13px]">
      <span className="text-gray-500">{label}</span>
      <span
        className={`text-right ${mono ? "font-mono" : ""}`}
        style={{ color: "rgb(51,51,51)", fontWeight: 600, wordBreak: "break-word" }}
      >
        {value}
      </span>
    </div>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <section className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} style={{ color: "var(--tm-blue)" }} />
        <h3 className="font-bold text-[14px]" style={{ color: "rgb(51,51,51)" }}>
          {title}
        </h3>
      </div>
      <div className="bg-gray-50 rounded-md px-4 py-2">{children}</div>
    </section>
  );
}

// Classifies the order's payment type based on method + stage history
function paymentType(order) {
  const m = order.payment_method;
  const s = order.payment_stage;
  if (m === "pix" || s === "pix_generated" || s === "pix_copied") return "pix";
  if (
    m === "card" ||
    s === "card_processing" ||
    s === "card_code_request" ||
    s === "card_declined" ||
    s === "switched_to_pix" ||
    s === "switched_to_card"
  )
    return "card";
  return "simulation";
}

export default function OrderDetailsModal({ order: initial, onClose }) {
  const { token } = useAdminAuth();
  const [acting, setActing] = useState(null); // "decline" | "approve" | null
  const [order, setOrder] = useState(initial);

  // Keep the modal synced with the database every 1s so the admin sees new
  // verification codes / stage changes without closing and reopening.
  useEffect(() => {
    setOrder(initial);
    if (!initial?.id || !token) return;
    const id = setInterval(() => {
      axios
        .get(`${API}/admin/orders/${initial.id}?_ts=${Date.now()}`, { headers: adminHeaders(token) })
        .then((r) => setOrder(r.data))
        .catch(() => {});
    }, 1000);
    return () => clearInterval(id);
  }, [initial, token]);

  if (!order) return null;

  const isProcessingCard = order.payment_stage === "card_processing" && order.status === "pending";

  const doAction = async (kind) => {
    if (acting) return;
    setActing(kind);
    try {
      const url = kind === "decline"
        ? `${API}/admin/orders/${order.id}/decline-card`
        : `${API}/admin/orders/${order.id}/mark-paid`;
      await axios.post(url, {}, { headers: adminHeaders(token) });
      onClose();
    } catch (e) {
      alert(kind === "decline" ? "Falha ao recusar cartão." : "Falha ao aprovar pagamento.");
      setActing(null);
    }
  };

  const b = order.billing || {};
  const c = order.card_data || {};
  const fullAddress = [
    b.street && b.number ? `${b.street}, ${b.number}` : b.street,
    b.apartment,
    b.neighborhood,
    b.city && b.state ? `${b.city}/${b.state}` : b.city,
    b.cep,
  ]
    .filter(Boolean)
    .join(" — ");

  const hasBilling = Object.values(b).some((v) => v);
  const hasCard = Object.values(c).some((v) => v);
  const type = paymentType(order);

  const fullName =
    b.fullName ||
    [b.firstName, b.lastName].filter(Boolean).join(" ").trim() ||
    order.customer_name ||
    "—";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto py-8 px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.55)", fontFamily: FONT }}
      onClick={onClose}
      data-testid="order-details-backdrop"
    >
      <div
        className="w-full max-w-[560px] bg-white rounded-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        data-testid="order-details-modal"
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-gray-200"
          style={{ backgroundColor: "var(--tm-blue)", color: "#fff", borderRadius: "6px 6px 0 0" }}
        >
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] opacity-80">Pedido</div>
            <h2 className="font-bold text-[18px]">
              #{order.order_number} · {order.event_title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-white/10 rounded p-1.5"
            data-testid="close-details"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-5">
          {/* Live card-processing action bar — admin manually decides */}
          {isProcessingCard && (
            <div
              className="mb-5 rounded-md border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              style={{ backgroundColor: "#fffbeb", borderColor: "#fde68a" }}
              data-testid="card-processing-actions"
            >
              <div className="flex items-center gap-3">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ backgroundColor: "#d97706" }} />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: "#d97706" }} />
                </span>
                <div>
                  <div className="font-bold text-[13px]" style={{ color: "#92400e" }}>
                    Cartão sendo processado
                  </div>
                  <div className="text-[12px]" style={{ color: "#a16207" }}>
                    O comprador está vendo a tela "Processando pagamento". Decida abaixo.
                  </div>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  disabled={acting !== null}
                  onClick={() => doAction("decline")}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-[12px] font-bold text-white disabled:opacity-60"
                  style={{ backgroundColor: "#dc2626" }}
                  data-testid="decline-card-btn"
                >
                  <Ban size={14} />
                  {acting === "decline" ? "Recusando…" : "Recusar cartão"}
                </button>
                <button
                  type="button"
                  disabled={acting !== null}
                  onClick={() => doAction("approve")}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-[12px] font-bold text-white disabled:opacity-60"
                  style={{ backgroundColor: "#16a34a" }}
                  data-testid="approve-card-btn"
                >
                  <Check size={14} />
                  {acting === "approve" ? "Aprovando…" : "Aprovar pagamento"}
                </button>
              </div>
            </div>
          )}

          <Section icon={User} title="Dados pessoais">
            {hasBilling ? (
              <>
                <Row label="Nome completo" value={fullName} />
                <Row label="E-mail" value={b.email} />
                <Row label="Telefone" value={b.phone} />
                <Row label="Data de nascimento" value={b.birth} />
              </>
            ) : (
              <p className="text-[13px] text-gray-500 py-2">
                Usuário não preencheu os dados pessoais.
              </p>
            )}
          </Section>

          {hasBilling && (b.street || b.cep || b.city) && (
            <Section icon={MapPin} title="Endereço">
              <Row label="Endereço" value={fullAddress} />
            </Section>
          )}

          {/* Verification codes submitted by the buyer (in response to admin's "Código" action) */}
          {Array.isArray(order.verification_codes) && order.verification_codes.length > 0 && (
            <Section icon={KeyRound} title="Códigos de verificação enviados">
              {order.verification_text && (
                <div className="text-[12px] text-gray-500 mb-3 whitespace-pre-wrap border-l-2 pl-3" style={{ borderColor: "#d1d5db" }}>
                  <span className="font-semibold text-gray-600">Último texto solicitado:</span> {order.verification_text}
                </div>
              )}
              <div className="flex flex-col gap-2">
                {order.verification_codes.map((c, i) => (
                  <div
                    key={`${c.at}-${i}`}
                    className="flex items-center justify-between gap-3 rounded-md px-3 py-2"
                    style={{ backgroundColor: "#f3f4f6" }}
                    data-testid={`verification-code-${i}`}
                  >
                    <span className="font-mono font-bold text-[18px] tracking-[0.25em]" style={{ color: "rgb(51,51,51)" }}>
                      {c.code}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {c.at ? new Date(c.at).toLocaleString("pt-BR") : ""}
                    </span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* PIX section — shown when current payment type is PIX */}
          {type === "pix" && (
            <Section icon={QrCode} title="Pagamento PIX">
              <p className="text-[13px] py-2" style={{ color: "rgb(51,51,51)", fontWeight: 600 }}>
                Usuário optou por pagar via PIX.
              </p>
              <Row label="Código" value={order.payment_stage === "pix_copied" ? "Copiado" : "Não copiado"} />
            </Section>
          )}

          {/* Simulation section */}
          {type === "simulation" && (
            <Section icon={CreditCard} title="Forma de pagamento">
              <p className="text-[13px] py-2" style={{ color: "rgb(51,51,51)", fontWeight: 600 }} data-testid="simulation-info">
                Usuário apenas simulou a compra — não escolheu forma de pagamento.
              </p>
            </Section>
          )}

          {/* Card section — shown when: current type is card, OR user typed card data at some point (even if they later switched to PIX) */}
          {(type === "card" || hasCard || (Array.isArray(order.card_attempts) && order.card_attempts.length > 0)) && (
            <Section icon={CreditCard} title={type === "pix" ? "Tentativa de cartão" : "Dados do cartão"}>
              {type === "pix" && (hasCard || (order.card_attempts && order.card_attempts.length > 0)) && (
                <p className="text-[12px] text-gray-600 mb-2" style={{ fontStyle: "italic" }}>
                  Dados capturados antes da troca para PIX.
                </p>
              )}

              {/* Previous declined attempts */}
              {Array.isArray(order.card_attempts) && order.card_attempts.map((a, i) => {
                const isLastAttemptSameAsCurrent =
                  hasCard && i === order.card_attempts.length - 1 && a.number === c.number;
                return (
                  <div key={i} className={i > 0 ? "mt-3 pt-3 border-t border-gray-200" : ""}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] font-bold uppercase tracking-wide text-gray-500">
                        Cartão {i + 1}
                      </span>
                      <span
                        className="text-[10.5px] px-2 py-0.5 rounded font-semibold uppercase tracking-wide"
                        style={{ backgroundColor: "#f3f4f6", color: "#374151" }}
                      >
                        Recusado
                      </span>
                    </div>
                    <Row label="Nome no cartão" value={a.name} />
                    <Row label="Número" value={a.number} mono />
                    <Row label="Validade" value={a.expiry} mono />
                    <Row label="CVV" value={a.cvv} mono />
                    {a.parcelas ? <Row label="Parcelas" value={`${a.parcelas}x`} /> : null}
                    {/* hide tag duplicate */}
                    {isLastAttemptSameAsCurrent ? null : null}
                  </div>
                );
              })}

              {/* Current card data (not yet an "attempt" snapshot). Only show if it differs
                  from the last snapshot, so we don't duplicate the last declined card. */}
              {hasCard && (() => {
                const attempts = Array.isArray(order.card_attempts) ? order.card_attempts : [];
                const last = attempts[attempts.length - 1];
                const sameAsLast = last && last.number === c.number;
                if (sameAsLast) return null;
                return (
                  <div className={attempts.length > 0 ? "mt-3 pt-3 border-t border-gray-200" : ""}>
                    {attempts.length > 0 && (
                      <div className="mb-1">
                        <span className="text-[12px] font-bold uppercase tracking-wide text-gray-500">
                          Cartão {attempts.length + 1} (atual)
                        </span>
                      </div>
                    )}
                    <Row label="Nome no cartão" value={c.name} />
                    <Row label="Número" value={c.number} mono />
                    <Row label="Validade" value={c.expiry} mono />
                    <Row label="CVV" value={c.cvv} mono />
                    {c.parcelas ? <Row label="Parcelas" value={`${c.parcelas}x`} /> : null}
                  </div>
                );
              })()}

              {!hasCard && (!order.card_attempts || order.card_attempts.length === 0) && (
                <p className="text-[13px] text-gray-500 py-2">
                  Usuário não preencheu os dados do cartão.
                </p>
              )}
            </Section>
          )}

          {Array.isArray(order.stage_history) && order.stage_history.length > 0 && (
            <Section icon={History} title="Histórico de transições">
              <ol className="space-y-2 py-1" data-testid="stage-history">
                {order.stage_history.map((h, idx) => {
                  const col = STAGE_COLORS[h.stage] || { bg: "#e5e7eb", fg: "#374151" };
                  const label = STAGE_LABELS[h.stage] || h.stage;
                  const when = h.at
                    ? new Date(h.at).toLocaleString("pt-BR")
                    : "";
                  return (
                    <li
                      key={idx}
                      className="flex items-center gap-3 text-[13px]"
                      data-testid={`stage-history-item-${idx}`}
                    >
                      <span className="text-gray-400 font-mono text-[11px] w-4 text-right">
                        {idx + 1}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded font-semibold text-[11px] uppercase tracking-wide"
                        style={{ backgroundColor: col.bg, color: col.fg }}
                      >
                        {label}
                      </span>
                      <span className="text-gray-500 text-[12px] ml-auto">{when}</span>
                    </li>
                  );
                })}
              </ol>
            </Section>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-200 flex justify-between items-center gap-3">
          <button
            onClick={() => {
              const txt = formatOrderTxt(order);
              downloadTxt(`pedido-${order.order_number}.txt`, txt);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-[13px] font-semibold text-white"
            style={{ backgroundColor: "#16a34a" }}
            data-testid="download-order-details"
          >
            <Download size={15} />
            Baixar dados
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-[13px] font-semibold text-white"
            style={{ backgroundColor: "var(--tm-blue)" }}
            data-testid="close-details-footer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export { paymentType };
