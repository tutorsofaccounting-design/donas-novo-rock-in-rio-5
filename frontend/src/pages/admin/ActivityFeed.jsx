import { useEffect, useState } from "react";
import axios from "axios";
import { Eye, FileText, CreditCard, Copy, Smartphone, Monitor } from "lucide-react";
import { useAdminAuth, adminHeaders } from "../../context/AdminAuthContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const KIND_META = {
  visit: {
    icon: Eye,
    label: "Novo acesso",
    bg: "#8b5cf6",
  },
  order_created: {
    icon: FileText,
    label: "Pedido criado",
    bg: "#22c55e",
  },
  pix_generated: {
    icon: CreditCard,
    label: "PIX gerado",
    bg: "#f59e0b",
  },
  pix_copied: {
    icon: Copy,
    label: "PIX copiado",
    bg: "#ec4899",
  },
};

function timeAgo(iso) {
  if (!iso) return "agora";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "agora";
  const sec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (sec < 5) return "agora";
  if (sec < 60) return `${sec}s atrás`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min atrás`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} h atrás`;
  const day = Math.floor(hr / 24);
  return `${day} d atrás`;
}

function EventRow({ event }) {
  const meta = KIND_META[event.kind] || KIND_META.visit;
  const Icon = meta.icon;
  const isVisit = event.kind === "visit";
  const isMobile = String(event.device || "").toLowerCase() === "mobile";

  const sub = isVisit
    ? `${event.location || "—"} • ${event.device || "Desktop"}`
    : `${event.customer_name || "Visitante"} • ${event.order_number || ""}`;

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white transition-colors hover:bg-gray-50"
      style={{ border: "1px solid #f3f4f6" }}
      data-testid={`activity-${event.kind}`}
    >
      <span
        className="flex items-center justify-center rounded-full shrink-0 text-white"
        style={{ width: 40, height: 40, backgroundColor: meta.bg }}
      >
        <Icon size={18} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[14px]" style={{ color: "#111827" }}>
            {meta.label}
          </span>
          {isVisit && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold"
              style={{
                backgroundColor: isMobile ? "#dbeafe" : "#ede9fe",
                color: isMobile ? "#1d4ed8" : "#6d28d9",
              }}
            >
              {isMobile ? <Smartphone size={10} /> : <Monitor size={10} />}
              {isMobile ? "Mobile" : "Desktop"}
            </span>
          )}
        </div>
        <div className="text-[12px] mt-0.5 truncate" style={{ color: "#6b7280" }}>
          {sub}
        </div>
      </div>
      <div className="text-[11px] shrink-0 tabular-nums" style={{ color: "#9ca3af" }}>
        {timeAgo(event.at)}
      </div>
    </div>
  );
}

export default function ActivityFeed() {
  const { token } = useAdminAuth();
  const [events, setEvents] = useState([]);
  const [tick, setTick] = useState(0); // forces re-render of timeAgo every 5s

  useEffect(() => {
    if (!token) return;
    let alive = true;
    const fetchFeed = () => {
      axios
        .get(`${API}/admin/activity?limit=30`, { headers: adminHeaders(token) })
        .then((r) => {
          if (alive) setEvents(r.data);
        })
        .catch(() => {});
    };
    fetchFeed();
    const id = setInterval(fetchFeed, 3000);
    const tickId = setInterval(() => setTick((t) => t + 1), 5000);
    return () => {
      alive = false;
      clearInterval(id);
      clearInterval(tickId);
    };
  }, [token]);

  // tick is read only to force re-render of timeAgo()
  void tick;

  return (
    <div
      className="bg-white rounded-2xl p-6 flex flex-col"
      style={{ border: "1px solid #f3f4f6", maxHeight: 720 }}
      data-testid="activity-feed"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-bold text-[18px]" style={{ color: "#111827" }}>
            Atividade em tempo real
          </h2>
          <p className="mt-1 text-[13px]" style={{ color: "#6b7280" }}>
            Últimos eventos no portal
          </p>
        </div>
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider"
          style={{ backgroundColor: "#fef2f2", color: "#dc2626" }}
          data-testid="activity-live-badge"
        >
          <span className="relative flex items-center justify-center" style={{ width: 8, height: 8 }}>
            <span
              className="absolute inline-flex h-full w-full rounded-full animate-ping"
              style={{ backgroundColor: "#dc2626", opacity: 0.6 }}
            />
            <span className="relative inline-flex rounded-full" style={{ width: 8, height: 8, backgroundColor: "#dc2626" }} />
          </span>
          Ao vivo
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-2.5" style={{ minHeight: 0 }}>
        {events.length === 0 && (
          <div className="text-center py-10 text-[13px]" style={{ color: "#9ca3af" }}>
            Aguardando eventos…
          </div>
        )}
        {events.map((e, i) => (
          <EventRow key={`${e.kind}-${e.at}-${i}`} event={e} />
        ))}
      </div>
    </div>
  );
}
