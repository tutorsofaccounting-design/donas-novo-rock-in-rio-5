import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";

const FONT = '"Averta","Mulish","Helvetica Neue",Helvetica,Arial,sans-serif';

export default function AdminLogin() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await login(u, p);
      navigate("/donaspainel/dashboard");
    } catch (e2) {
      setErr(e2?.response?.data?.detail || "Falha no login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ fontFamily: FONT, backgroundColor: "#0b1a33" }}
    >
      <div className="w-full max-w-[420px] bg-white rounded-md shadow-xl p-8" data-testid="admin-login-card">
        <div className="flex flex-col items-center gap-3 mb-6">
          <div
            className="w-full rounded-md flex items-center justify-center py-3"
            style={{ backgroundColor: "var(--tm-blue)" }}
            data-testid="admin-login-logo"
          >
            <img
              src="/brand/ticketmaster-logo.png"
              alt="ticketmaster"
              className="h-6 md:h-7 w-auto select-none"
              style={{ filter: "brightness(0) invert(1)" }}
              draggable={false}
            />
          </div>
          <div className="text-center">
            <div className="text-[11px] uppercase tracking-[0.2em] text-gray-500">ticketmaster br</div>
            <h1 className="font-bold text-[20px]" style={{ color: "rgb(51,51,51)" }}>
              Painel do Dono
            </h1>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4" data-testid="admin-login-form">
          <div>
            <label className="block text-[13px] font-bold mb-1 text-gray-700">Usuário</label>
            <input
              type="text"
              value={u}
              onChange={(e) => setU(e.target.value)}
              autoFocus
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-[15px] focus:outline-none focus:border-[var(--tm-blue)]"
              data-testid="admin-user"
            />
          </div>
          <div>
            <label className="block text-[13px] font-bold mb-1 text-gray-700">Senha</label>
            <input
              type="password"
              value={p}
              onChange={(e) => setP(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-[15px] focus:outline-none focus:border-[var(--tm-blue)]"
              data-testid="admin-pass"
            />
          </div>
          {err && (
            <div
              className="text-[13px] rounded-md px-3 py-2"
              style={{ backgroundColor: "#fdecec", color: "#c52b2b" }}
              data-testid="admin-login-error"
            >
              {err}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-semibold rounded-md disabled:opacity-60"
            style={{ backgroundColor: "var(--tm-blue)", padding: "12px 20px", fontSize: "15px" }}
            data-testid="admin-submit"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <p className="mt-5 text-[12px] text-gray-500 text-center">
          Acesso restrito ao dono do site. Saídas são registradas.
        </p>
      </div>
    </div>
  );
}
