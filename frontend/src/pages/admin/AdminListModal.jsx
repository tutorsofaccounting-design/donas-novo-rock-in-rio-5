import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { X, Trash2 } from "lucide-react";
import { useAdminAuth, adminHeaders } from "../../context/AdminAuthContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const FONT = '"Averta","Mulish","Helvetica Neue",Helvetica,Arial,sans-serif';
const br = (n) => (n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtBrasilia = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  } catch {
    return iso;
  }
};

/**
 * props:
 *  title
 *  endpoint  (GET; defaults to absolute when starts with http, else appended to /api)
 *  kind: "visits" | "orders" | "users"
 *  deleteEndpoint?: when row has ID to delete, fn(id) => url
 *  bulkDeleteEndpoint?: string (DELETE URL) for "limpar tudo"
 *  onClose
 */
export default function AdminListModal({ title, endpoint, kind, deleteEndpoint, bulkDeleteEndpoint, onClose }) {
  const { token } = useAdminAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    axios
      .get(`${API}${endpoint}`, { headers: adminHeaders(token) })
      .then((r) => setItems(r.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [endpoint]);

  const delOne = async (id) => {
    if (!deleteEndpoint) return;
    if (!window.confirm("Excluir este item? Essa ação não pode ser desfeita.")) return;
    await axios.delete(`${API}${deleteEndpoint(id)}`, { headers: adminHeaders(token) });
    load();
  };

  const delAll = async () => {
    if (!bulkDeleteEndpoint) return;
    if (!window.confirm(`Limpar TODOS os ${items.length} itens? Essa ação não pode ser desfeita.`)) return;
    await axios.delete(`${API}${bulkDeleteEndpoint}`, { headers: adminHeaders(token) });
    load();
  };

  const columns = useMemo(() => {
    if (kind === "visits") {
      return [
        { label: "IP", key: (v) => v.ip || "—", mono: true },
        { label: "Localização", key: (v) => v.location || "—" },
        { label: "Dispositivo", key: (v) => v.device || "—" },
        { label: "Página", key: (v) => v.path || "/", mono: true },
        { label: "Data/Hora (Brasília)", key: (v) => fmtBrasilia(v.created_at) },
      ];
    }
    if (kind === "orders") {
      return [
        { label: "#", key: (o) => `#${o.order_number}` },
        { label: "Cliente", key: (o) => (o.billing && o.billing.fullName) || o.customer_name || "—" },
        { label: "Evento", key: (o) => o.event_title },
        { label: "Método", key: (o) => {
          const m = o.payment_method;
          const s = o.payment_stage;
          if (m === "pix" || s === "pix_generated" || s === "pix_copied") return "PIX";
          if (m === "card" || (s || "").startsWith("card_") || s === "switched_to_pix") return "CARTÃO";
          return "—";
        }},
        { label: "Status", key: (o) => (o.status || "").toUpperCase() },
        { label: "Stage", key: (o) => o.payment_stage || "—" },
        { label: "Total", key: (o) => br(o.total) },
        { label: "Localização", key: (o) => o.location || "—" },
        { label: "Criado", key: (o) => fmtBrasilia(o.created_at) },
      ];
    }
    if (kind === "users") {
      return [
        { label: "Nome", key: (u) => u.name },
        { label: "E-mail", key: (u) => u.email },
        { label: "Role", key: (u) => (u.role || "user").toUpperCase() },
        { label: "Criado", key: (u) => fmtBrasilia(u.created_at) },
      ];
    }
    return [];
  }, [kind]);

  const canDelete = !!deleteEndpoint;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto py-8 px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.55)", fontFamily: FONT }}
      onClick={onClose}
      data-testid="list-modal-backdrop"
    >
      <div
        className="w-full max-w-[1000px] bg-white rounded-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        data-testid="list-modal"
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-gray-200"
          style={{ backgroundColor: "var(--tm-blue)", color: "#fff", borderRadius: "6px 6px 0 0" }}
        >
          <h2 className="font-bold text-[18px]">{title} <span className="opacity-75 text-[14px] font-normal">· {items.length}</span></h2>
          <div className="flex items-center gap-2">
            {bulkDeleteEndpoint && items.length > 0 && (
              <button
                onClick={delAll}
                className="text-[12px] font-semibold rounded px-3 py-1.5"
                style={{ backgroundColor: "#ffffff22", color: "#fff", border: "1px solid #ffffff44" }}
                data-testid="list-modal-clear-all"
              >
                Limpar tudo
              </button>
            )}
            <button
              onClick={onClose}
              className="hover:bg-white/10 rounded p-1.5"
              data-testid="list-modal-close"
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-gray-50 text-left text-gray-600 sticky top-0">
              <tr>
                {columns.map((c) => (
                  <th key={c.label} className="px-4 py-3 font-semibold whitespace-nowrap">{c.label}</th>
                ))}
                {canDelete && <th className="px-4 py-3 font-semibold text-right">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={columns.length + 1} className="px-4 py-10 text-center text-gray-400">Carregando…</td></tr>
              )}
              {!loading && items.length === 0 && (
                <tr><td colSpan={columns.length + 1} className="px-4 py-10 text-center text-gray-500">Nenhum item.</td></tr>
              )}
              {items.map((it) => (
                <tr key={it.id} className="border-t border-gray-100">
                  {columns.map((c) => (
                    <td key={c.label} className={`px-4 py-2.5 ${c.mono ? "font-mono" : ""}`} style={{ color: "rgb(51,51,51)" }}>
                      {c.key(it)}
                    </td>
                  ))}
                  {canDelete && (
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => delOne(it.id)}
                        className="inline-flex items-center gap-1 text-[12px] font-semibold text-white rounded px-2 py-1"
                        style={{ backgroundColor: "#d43a3a" }}
                        data-testid={`list-modal-del-${it.id}`}
                      >
                        <Trash2 size={12} /> Excluir
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
