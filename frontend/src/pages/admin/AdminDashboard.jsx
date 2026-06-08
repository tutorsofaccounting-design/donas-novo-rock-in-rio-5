import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Eye, ClipboardList, DollarSign, Copy, RefreshCw } from "lucide-react";
import { useAdminAuth, adminHeaders } from "../../context/AdminAuthContext";
import AdminListModal from "./AdminListModal";
import ConversionFunnel from "./ConversionFunnel";
import ActivityFeed from "./ActivityFeed";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const FONT = '"Averta","Mulish","Helvetica Neue",Helvetica,Arial,sans-serif';
const br = (n) => (n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const STATS_DEFAULT = {
  total_visits: 0,
  total_orders: 0,
  pix_generated_count: 0,
  pix_generated_total: 0,
  pix_copied_count: 0,
  pix_copied_total: 0,
};

function StatCard({ label, value, subtitle, color, icon, testid, onClick }) {
  const isInteractive = typeof onClick === "function";
  const Tag = isInteractive ? "button" : "div";
  return (
    <Tag
      type={isInteractive ? "button" : undefined}
      onClick={onClick}
      className={`relative bg-white rounded-2xl shadow-sm pt-5 pb-6 px-6 overflow-hidden text-left w-full transition-shadow ${
        isInteractive ? "cursor-pointer hover:shadow-md" : ""
      }`}
      style={{ minHeight: 168 }}
      data-testid={testid}
    >
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
      <div
        className="mt-4 font-extrabold leading-none"
        style={{ fontSize: 36, color: "#111827", letterSpacing: "-0.02em" }}
        data-testid={`${testid}-value`}
      >
        {value}
      </div>
      <div className="mt-3 text-[13px]" style={{ color: "#6b7280" }} data-testid={`${testid}-subtitle`}>
        {subtitle}
      </div>
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{ height: 4, backgroundColor: color.bar }}
      />
    </Tag>
  );
}

export default function AdminDashboard() {
  const { token } = useAdminAuth();
  const [stats, setStats] = useState(STATS_DEFAULT);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const refresh = useCallback(() => {
    const h = adminHeaders(token);
    Promise.all([
      axios.get(`${API}/admin/stats`, { headers: h }).then((r) => r.data),
      axios.get(`${API}/admin/orders`, { headers: h }).then((r) => r.data.slice(0, 8)),
    ])
      .then(([s, o]) => {
        setStats({ ...STATS_DEFAULT, ...s });
        setRecent(o);
      })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-refresh every 1s so the cards stay in sync with the database
  useEffect(() => {
    if (!token) return;
    const id = setInterval(() => {
      axios
        .get(`${API}/admin/stats`, { headers: adminHeaders(token) })
        .then((r) => setStats((curr) => ({ ...curr, ...r.data })))
        .catch(() => {});
    }, 1000);
    return () => clearInterval(id);
  }, [token]);

  const closeModal = () => {
    setModal(null);
    refresh();
  };

  return (
    <div className="px-8 py-8" style={{ fontFamily: FONT }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-bold" style={{ fontSize: "24px", color: "rgb(51,51,51)" }}>
          Visão geral
        </h1>
        <button
          onClick={refresh}
          className="px-3 py-1.5 rounded-md text-[13px] font-semibold transition-colors flex items-center gap-1.5"
          style={{ backgroundColor: "#fff", color: "rgb(51,51,51)", border: "1px solid #e5e7eb" }}
          data-testid="refresh-dashboard"
          title="Atualizar"
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Atualizar
        </button>
      </div>

      {/* ---- Stat cards (same set used in /donaspainel/pedidos) ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          label="Acessos"
          value={(stats.total_visits || 0).toLocaleString("pt-BR")}
          subtitle="Visitas registradas"
          color={{ iconBg: "#ede9fe", iconFg: "#7c3aed", bar: "#8b5cf6" }}
          icon={<Eye size={18} />}
          testid="stat-card-accesses"
          onClick={() =>
            setModal({
              title: "Acessos — visitas ao site",
              endpoint: "/admin/visits",
              kind: "visits",
              bulkDeleteEndpoint: "/admin/visits",
            })
          }
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

      {/* ---- Conversion funnel + Real-time activity ---- */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-8">
        <ConversionFunnel stats={stats} />
        <ActivityFeed />
      </div>

      <h2 className="font-bold mb-3" style={{ fontSize: "18px", color: "rgb(51,51,51)" }}>
        Pedidos recentes
      </h2>
      <div className="bg-white rounded-md shadow-sm overflow-x-auto">
        <table className="w-full text-[14px]" data-testid="recent-orders">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3 font-semibold">#</th>
              <th className="px-4 py-3 font-semibold">Evento</th>
              <th className="px-4 py-3 font-semibold">Setor</th>
              <th className="px-4 py-3 font-semibold">Qtd</th>
              <th className="px-4 py-3 font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Carregando…
                </td>
              </tr>
            )}
            {!loading && recent.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  Ainda não há pedidos.
                </td>
              </tr>
            )}
            {recent.map((o) => (
              <tr key={o.id} className="border-t border-gray-100">
                <td className="px-4 py-3 text-gray-500">#{o.order_number}</td>
                <td className="px-4 py-3">{o.event_title}</td>
                <td className="px-4 py-3">{o.sector_name}</td>
                <td className="px-4 py-3">{o.qty}</td>
                <td className="px-4 py-3 font-semibold">{br(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <AdminListModal
          title={modal.title}
          endpoint={modal.endpoint}
          kind={modal.kind}
          deleteEndpoint={modal.deleteEndpoint}
          bulkDeleteEndpoint={modal.bulkDeleteEndpoint}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

// Kept exported for backwards compatibility with components that import it
export function StatusPill({ status, stage }) {
  const pill = (bg, fg, label) => (
    <span
      className="inline-block px-2 py-0.5 rounded text-[12px] font-bold whitespace-nowrap"
      style={{ backgroundColor: bg, color: fg }}
    >
      {label.toUpperCase()}
    </span>
  );
  if (status === "paid") return pill("#dcfce7", "#15803d", "Pago");
  if (stage === "pix_copied") return pill("#dcfce7", "#15803d", "Copiado");
  if (stage === "pix_generated") return pill("#dbeafe", "#1d4ed8", "Gerado");
  return pill("#fef3c7", "#b45309", "Pendente");
}
