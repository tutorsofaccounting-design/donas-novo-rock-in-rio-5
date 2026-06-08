import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Receipt, Ticket, Users, Megaphone, LogOut } from "lucide-react";
import { useAdminAuth } from "../../context/AdminAuthContext";

const FONT = '"Averta","Mulish","Helvetica Neue",Helvetica,Arial,sans-serif';

const items = [
  { to: "/donaspainel/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/donaspainel/pedidos", label: "Pedidos", icon: Receipt },
  { to: "/donaspainel/eventos", label: "Eventos", icon: Ticket },
  { to: "/donaspainel/usuarios", label: "Usuários", icon: Users },
  { to: "/donaspainel/config", label: "Configurações", icon: Megaphone },
];

export default function AdminLayout() {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex" style={{ fontFamily: FONT, backgroundColor: "#f5f6fa" }}>
      {/* Sidebar */}
      <aside
        className="w-[240px] shrink-0 flex flex-col"
        style={{ backgroundColor: "#0b1a33", color: "#fff" }}
      >
        <div className="px-5 py-5 border-b border-white/10">
          <div className="text-[10px] uppercase tracking-[0.25em] text-white/50">ticketmaster br</div>
          <div className="mt-1 font-bold text-[18px]">Painel do Dono</div>
        </div>
        <nav className="flex-1 py-4">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-3 text-[14px] transition-colors border-l-[3px] ${
                  isActive
                    ? "bg-white/10 border-[var(--tm-blue)] text-white"
                    : "border-transparent text-white/80 hover:bg-white/5"
                }`
              }
              data-testid={`admin-nav-${to.split("/").pop()}`}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => {
            logout();
            navigate("/donaspainel");
          }}
          className="flex items-center gap-3 px-5 py-4 text-[14px] text-white/80 hover:bg-white/5 border-t border-white/10"
          data-testid="admin-logout"
        >
          <LogOut size={18} />
          Sair
        </button>
      </aside>

      {/* Content */}
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
