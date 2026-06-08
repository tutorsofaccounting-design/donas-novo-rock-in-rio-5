import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Eye, ClipboardList, DollarSign, Copy, RefreshCw } from "lucide-react";
import { useAdminAuth, adminHeaders } from "../../context/AdminAuthContext";
import OrderDetailsModal from "./OrderDetailsModal";
import { formatOrdersTxt, downloadTxt } from "../../lib/exportOrders";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const FONT = '"Averta","Mulish","Helvetica Neue",Helvetica,Arial,sans-serif';
const br = (n) => (n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function OrderStatusBadge({ order }) {
  const pill = (bg, fg, label, testid) => (
    <span
      className="inline-block px-2 py-0.5 rounded text-[12px] font-bold whitespace-nowrap"
      style={{ backgroundColor: bg, color: fg }}
      data-testid={testid}
    >
      {label}
    </span>
  );
  // Only three statuses are exposed in the UI:
  //   PENDENTE  → order was created, no PIX clicked yet
  //   GERADO    → user clicked the "Pagar com PIX" button (payment_stage = pix_generated)
  //   COPIADO   → user copied the PIX code (payment_stage = pix_copied)
  const stage = order.payment_stage;
  if (stage === "pix_copied") return pill("#dcfce7", "#15803d", "COPIADO", `status-${order.order_number}`);
  if (stage === "pix_generated") return pill("#dbeafe", "#1d4ed8", "GERADO", `status-${order.order_number}`);
  return pill("#fef3c7", "#b45309", "PENDENTE", `status-${order.order_number}`);
}

const STATS_DEFAULT = {
  total_visits: 0,
  total_orders: 0,
  pix_generated_count: 0,
  pix_generated_total: 0,
  pix_copied_count: 0,
  pix_copied_total: 0,
};

function StatCard({ label, value, subtitle, color, icon, testid }) {
  return (
    <div
      className="relative bg-white rounded-2xl shadow-sm pt-5 pb-6 px-6 overflow-hidden"
      style={{ minHeight: 168 }}
      data-testid={testid}
    >
      {/* Top label + icon */}
      <div className="flex items-start justify-between">
        <span
          className="uppercase tracking-wider text-[12px] font-semibold"
          style={{ color: "#6b7280", letterSpacing: "0.08em" }}
        >
          {label}
        </span>
        <span
          className="flex items-center justify-center rounded-xl"
          style={{
            width: 38,
            height: 38,
            backgroundColor: color.iconBg,
            color: color.iconFg,
          }}
        >
          {icon}
        </span>
      </div>
      {/* Big value */}
      <div
        className="mt-4 font-extrabold leading-none"
        style={{ fontSize: 36, color: "#111827", letterSpacing: "-0.02em" }}
        data-testid={`${testid}-value`}
      >
        {value}
      </div>
      {/* Subtitle */}
      <div className="mt-3 text-[13px]" style={{ color: "#6b7280" }} data-testid={`${testid}-subtitle`}>
        {subtitle}
      </div>
      {/* Bottom accent bar */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{ height: 4, backgroundColor: color.bar }}
      />
    </div>
  );
}

export default function AdminOrders() {
  const { token } = useAdminAuth();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(STATS_DEFAULT);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [codeText, setCodeText] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const url = filter === "all" ? `${API}/admin/orders` : `${API}/admin/orders?method=${filter}`;
    axios
      .get(url, { headers: adminHeaders(token) })
      .then((r) => setOrders(r.data))
      .finally(() => setLoading(false));
    axios
      .get(`${API}/admin/stats`, { headers: adminHeaders(token) })
      .then((r) => setStats({ ...STATS_DEFAULT, ...r.data }))
      .catch(() => {});
  }, [token, filter]);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-refresh every 1s so stage changes (PIX gerado → copiado) appear without manual reload
  useEffect(() => {
    const id = setInterval(() => {
      const url = filter === "all" ? `${API}/admin/orders` : `${API}/admin/orders?method=${filter}`;
      axios
        .get(url, { headers: adminHeaders(token) })
        .then((r) => setOrders(r.data))
        .catch(() => {});
      axios
        .get(`${API}/admin/stats`, { headers: adminHeaders(token) })
        .then((r) => setStats({ ...STATS_DEFAULT, ...r.data }))
        .catch(() => {});
    }, 1000);
    return () => clearInterval(id);
  }, [token, filter]);

  const markPaid = async (id) => {
    if (!window.confirm("Marcar este pedido como PAGO?")) return;
    await axios.post(`${API}/admin/orders/${id}/mark-paid`, {}, { headers: adminHeaders(token) });
    load();
  };

  const declineCard = async (order) => {
    if (order.status === "paid") {
      alert("Este pedido já está pago — não é possível recusar.");
      return;
    }
    if (!window.confirm(`Recusar o cartão do pedido #${order.order_number}?`)) return;
    try {
      await axios.post(`${API}/admin/orders/${order.id}/decline-card`, {}, { headers: adminHeaders(token) });
      load();
    } catch (e) {
      alert("Falha ao recusar o cartão.");
    }
  };

  const sendCode = async (order) => {
    const text = codeText.trim();
    if (!text) {
      alert('Digite o texto no campo "Digite aqui..." ao lado do título "Pedidos" antes.');
      return;
    }
    if (order.status === "paid") {
      alert("Este pedido já está pago.");
      return;
    }
    try {
      await axios.post(
        `${API}/admin/orders/${order.id}/request-code`,
        { text },
        { headers: adminHeaders(token) },
      );
      load();
    } catch (e) {
      alert("Falha ao pedir o código.");
    }
  };

  const view = async (order) => {
    try {
      const r = await axios.get(`${API}/admin/orders/${order.id}`, { headers: adminHeaders(token) });
      setSelected(r.data);
    } catch (e) {
      // Fallback to row data if detail endpoint fails
      setSelected(order);
    }
  };

  const del = async (id) => {
    if (!window.confirm("Excluir este pedido? Essa ação não pode ser desfeita.")) return;
    await axios.delete(`${API}/admin/orders/${id}`, { headers: adminHeaders(token) });
    load();
  };

  const clearAll = async () => {
    if (
      !window.confirm(
        "Limpar TODOS os dados do painel?\n\nIsso vai apagar pedidos, acessos, atividade em tempo real e zerar o funil de conversão. Essa ação não pode ser desfeita.",
      )
    )
      return;
    const r = await axios.delete(`${API}/admin/orders`, { headers: adminHeaders(token) });
    const o = r.data.deleted_orders ?? r.data.deleted ?? 0;
    const v = r.data.deleted_visits ?? 0;
    alert(`Limpeza concluída.\n• ${o} pedidos removidos\n• ${v} acessos removidos`);
    load();
  };

  const downloadAll = () => {
    if (!orders.length) {
      alert("Nenhum pedido para baixar.");
      return;
    }
    const titleByFilter = {
      all: "TODOS OS PEDIDOS",
      pix: "PEDIDOS — PIX",
      card: "PEDIDOS — CARTÃO",
      simulation: "PEDIDOS — SIMULAÇÃO",
    };
    const txt = formatOrdersTxt(orders, { title: titleByFilter[filter] || "PEDIDOS" });
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadTxt(`pedidos-${filter}-${stamp}.txt`, txt);
  };

  return (
    <div className="px-8 py-8" style={{ fontFamily: FONT }}>
      {/* ---- Stat cards ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          label="Acessos"
          value={(stats.total_visits || 0).toLocaleString("pt-BR")}
          subtitle="Visitas registradas"
          color={{ iconBg: "#ede9fe", iconFg: "#7c3aed", bar: "#8b5cf6" }}
          icon={<Eye size={18} />}
          testid="stat-card-accesses"
        />
        <StatCard
          label="Total de pedidos"
          value={(stats.total_orders || 0).toLocaleString("pt-BR")}
          subtitle="Pedidos cadastrados"
          color={{ iconBg: "#dbeafe", iconFg: "#1d4ed8", bar: "#3b82f6" }}
          icon={<ClipboardList size={18} />}
          testid="stat-card-orders"
        />
        <StatCard
          label="Valor total gerado"
          value={br(stats.pix_generated_total)}
          subtitle={`${stats.pix_generated_count || 0} PIX gerado(s)`}
          color={{ iconBg: "#dcfce7", iconFg: "#15803d", bar: "#22c55e" }}
          icon={<DollarSign size={18} />}
          testid="stat-card-pix-generated"
        />
        <StatCard
          label="PIX copiados"
          value={br(stats.pix_copied_total)}
          subtitle={`${stats.pix_copied_count || 0} pix copiados`}
          color={{ iconBg: "#ffedd5", iconFg: "#c2410c", bar: "#f97316" }}
          icon={<Copy size={18} />}
          testid="stat-card-pix-copied"
        />
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="font-bold" style={{ fontSize: "24px", color: "rgb(51,51,51)" }}>
            Pedidos
          </h1>
          <input
            type="text"
            placeholder="Digite aqui..."
            value={codeText}
            onChange={(e) => setCodeText(e.target.value)}
            className="px-3 py-1.5 rounded-md text-[14px] bg-white transition-colors focus:outline-none focus:border-[var(--tm-blue)]"
            style={{ border: "1px solid #d1d5db", color: "rgb(51,51,51)", width: "360px" }}
            data-testid="orders-title-input"
          />
        </div>
        <div className="flex items-center gap-2" data-testid="orders-filter">
          {[
            ["simulation", "Simulação"],
          ].map(([v, lbl]) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              className="px-3 py-1.5 rounded-md text-[13px] font-semibold transition-colors"
              style={{
                backgroundColor: filter === v ? "var(--tm-blue)" : "#fff",
                color: filter === v ? "#fff" : "rgb(51,51,51)",
                border: "1px solid #e5e7eb",
              }}
              data-testid={`filter-${v}`}
            >
              {lbl}
            </button>
          ))}
          <button
            onClick={load}
            className="ml-2 px-3 py-1.5 rounded-md text-[13px] font-semibold transition-colors flex items-center gap-1.5"
            style={{ backgroundColor: "#fff", color: "rgb(51,51,51)", border: "1px solid #e5e7eb" }}
            data-testid="refresh-orders"
            title="Atualizar lista"
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Atualizar
          </button>
          <button
            onClick={downloadAll}
            className="ml-2 px-3 py-1.5 rounded-md text-[13px] font-semibold text-white transition-colors"
            style={{ backgroundColor: "#16a34a", border: "1px solid #16a34a" }}
            data-testid="download-all-orders"
          >
            Baixar dados
          </button>
          <button
            onClick={clearAll}
            className="px-3 py-1.5 rounded-md text-[13px] font-semibold text-white transition-colors"
            style={{ backgroundColor: "#d43a3a", border: "1px solid #d43a3a" }}
            data-testid="clear-all-orders"
          >
            Limpar dados
          </button>
        </div>
      </div>

      <div className="bg-white rounded-md shadow-sm overflow-x-auto">
        <table className="w-full text-[14px]">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Cliente</th>
              <th className="px-4 py-3 font-semibold">Evento / Sessão</th>
              <th className="px-4 py-3 font-semibold">Dispositivo</th>
              <th className="px-4 py-3 font-semibold">Qtd</th>
              <th className="px-4 py-3 font-semibold">Total</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Criado em</th>
              <th className="px-4 py-3 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  Carregando…
                </td>
              </tr>
            )}
            {!loading && orders.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  Nenhum pedido.
                </td>
              </tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-gray-100" data-testid={`order-row-${o.order_number}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <OnlineDot lastSeenAt={o.last_seen_at} />
                    <div>
                      <div className="font-semibold text-gray-800" data-testid={`customer-name-${o.order_number}`}>
                        {o.customer_name || "—"}
                      </div>
                      <div className="text-[12px] text-gray-500" data-testid={`customer-email-${o.order_number}`}>
                        {o.customer_email || (o.billing && o.billing.email) || "—"}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold" style={{ color: "rgb(51,51,51)" }}>{o.event_title}</div>
                  <div className="text-[12px] text-gray-500">{o.session_label}</div>
                </td>
                <td className="px-4 py-3">
                  {(() => {
                    const dev = String(o.device || "").toLowerCase();
                    const ua = String(o.user_agent || "").toLowerCase();
                    const isMobile = dev === "mobile" || dev === "tablet" || /(iphone|ipad|ipod|android|mobile)/i.test(ua);
                    return isMobile ? (
                      <span
                        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-700"
                        data-testid={`device-mobile-${o.order_number}`}
                      >
                        <i className="fas fa-mobile-alt text-gray-500"></i> Mobile
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-700"
                        data-testid={`device-desktop-${o.order_number}`}
                      >
                        <i className="fas fa-desktop text-gray-500"></i> Desktop
                      </span>
                    );
                  })()}
                </td>
                <td className="px-4 py-3">{o.qty}</td>
                <td className="px-4 py-3 font-semibold">{br(o.total)}</td>
                <td className="px-4 py-3">
                  <OrderStatusBadge order={o} />
                </td>
                <td className="px-4 py-3 text-[12px] text-gray-500">
                  {new Date(o.created_at).toLocaleString("pt-BR")}
                </td>
                <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                  <button
                    onClick={() => view(o)}
                    className="text-[12px] font-semibold text-white rounded px-2.5 py-1"
                    style={{ backgroundColor: "var(--tm-blue)" }}
                    data-testid={`view-${o.order_number}`}
                  >
                    Exibir
                  </button>
                  <button
                    onClick={() => del(o.id)}
                    className="text-[12px] font-semibold text-white rounded px-2.5 py-1"
                    style={{ backgroundColor: "#d43a3a" }}
                    data-testid={`del-${o.order_number}`}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && <OrderDetailsModal order={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

// Live presence indicator shown next to the order number. Green when the
// buyer's browser beat in the last 8 seconds (i.e. they have the checkout tab
// open and visible). Red otherwise.
function OnlineDot({ lastSeenAt }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!lastSeenAt) {
    return (
      <span
        className="inline-block w-2.5 h-2.5 rounded-full"
        style={{ backgroundColor: "#dc2626" }}
        title="Comprador offline"
        data-testid="online-dot-offline"
      />
    );
  }
  const ageSec = Math.max(0, Math.floor((now - new Date(lastSeenAt).getTime()) / 1000));
  const online = ageSec <= 8;
  return (
    <span
      className="relative inline-flex w-2.5 h-2.5"
      title={online ? "Comprador online agora" : `Offline há ${ageSec}s`}
      data-testid={online ? "online-dot-online" : "online-dot-offline"}
    >
      {online && (
        <span
          className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping"
          style={{ backgroundColor: "#16a34a" }}
        />
      )}
      <span
        className="relative inline-flex rounded-full h-2.5 w-2.5"
        style={{ backgroundColor: online ? "#16a34a" : "#dc2626" }}
      />
    </span>
  );
}

