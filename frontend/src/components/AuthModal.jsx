import { useEffect, useState } from "react";
import { X, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const FONT = '"Averta","Mulish","Helvetica Neue",Helvetica,Arial,sans-serif';

function formatApiError(detail) {
  if (detail == null) return "Algo deu errado. Tente novamente.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail
      .map((e) => (e && typeof e.msg === "string" ? e.msg : ""))
      .filter(Boolean)
      .join(" ") || "Dados inválidos.";
  if (detail && typeof detail.msg === "string") return detail.msg;
  return "Algo deu errado. Tente novamente.";
}

export default function AuthModal() {
  const { authModal, closeAuth, openAuth, login, register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [captchaStage, setCaptchaStage] = useState("idle"); // idle → checking → success

  // Animate the Cloudflare-like captcha when the modal opens so the user
  // actually sees it being verified (instead of a pre-checked badge).
  useEffect(() => {
    if (!authModal) {
      setCaptchaStage("idle");
      return;
    }
    setCaptchaStage("idle");
    const t1 = setTimeout(() => setCaptchaStage("checking"), 900);
    const t2 = setTimeout(() => setCaptchaStage("success"), 2800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [authModal]);

  if (!authModal) return null;

  const isLogin = authModal === "login";

  const reset = () => {
    setEmail("");
    setPassword("");
    setName("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (isLogin) await login(email, password);
      else await register(name, email, password);
      reset();
      closeAuth();
    } catch (err) {
      setError(formatApiError(err?.response?.data?.detail) || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = (mode) => {
    reset();
    openAuth(mode);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.55)", fontFamily: FONT }}
      data-testid="auth-modal"
      onClick={closeAuth}
    >
      <div
        className="bg-white w-full max-w-[520px] rounded-md shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={closeAuth}
          className="absolute top-4 right-4"
          style={{ color: "var(--tm-blue)" }}
          aria-label="Fechar"
          data-testid="auth-close"
        >
          <X size={22} strokeWidth={2.5} />
        </button>

        <div className="px-8 pt-10 pb-8">
          <h2 className="font-bold" style={{ fontSize: "26px", color: "rgb(51,51,51)" }}>
            {isLogin ? "Acesse a sua conta" : "Crie sua conta"}
          </h2>
          <p className="mt-2 text-[14px] text-gray-600">
            {isLogin ? (
              <>
                Não tem uma conta?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                  className="underline"
                  style={{ color: "var(--tm-blue)" }}
                  data-testid="switch-to-register"
                >
                  Cadastre-se agora
                </button>
              </>
            ) : (
              <>
                Já tem uma conta?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="underline"
                  style={{ color: "var(--tm-blue)" }}
                  data-testid="switch-to-login"
                >
                  Faça login
                </button>
              </>
            )}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5" data-testid="auth-form">
            {!isLogin && (
              <div>
                <label className="block text-[14px] font-bold mb-1.5" style={{ color: "rgb(51,51,51)" }}>
                  Nome completo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  className="w-full border border-gray-300 rounded-md px-3 py-3 text-[15px] focus:outline-none focus:border-[var(--tm-blue)]"
                  placeholder="Seu nome"
                  data-testid="auth-name"
                />
              </div>
            )}
            <div>
              <label className="block text-[14px] font-bold mb-1.5" style={{ color: "rgb(51,51,51)" }}>
                E-Mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-3 text-[15px] focus:outline-none focus:border-[var(--tm-blue)]"
                placeholder="E-Mail"
                data-testid="auth-email"
              />
            </div>
            <div>
              <label className="block text-[14px] font-bold mb-1.5" style={{ color: "rgb(51,51,51)" }}>
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-3 text-[15px] focus:outline-none focus:border-[var(--tm-blue)]"
                placeholder="Senha"
                data-testid="auth-password"
              />
            </div>

            {/* Cloudflare-like verification box: animates idle → checking → success */}
            <div
              className="flex items-center justify-between px-4 py-3 rounded-md"
              style={{ backgroundColor: "#2f3437" }}
              data-testid="auth-captcha"
            >
              <div className="flex items-center gap-3">
                {captchaStage === "idle" && (
                  <>
                    <span
                      className="w-5 h-5 rounded-sm border-2 bg-white"
                      style={{ borderColor: "#d0d5dd" }}
                      data-testid="captcha-idle"
                    />
                    <span className="text-white text-[14px]">Verifique que você é humano</span>
                  </>
                )}
                {captchaStage === "checking" && (
                  <>
                    <span
                      className="w-5 h-5 rounded-full border-[3px] animate-spin"
                      style={{
                        borderColor: "#6b7280",
                        borderTopColor: "#22c55e",
                      }}
                      data-testid="captcha-checking"
                    />
                    <span className="text-white text-[14px]">Verificando…</span>
                  </>
                )}
                {captchaStage === "success" && (
                  <>
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: "#22c55e",
                        animation: "captchaPop 260ms ease-out",
                      }}
                      data-testid="captcha-success"
                    >
                      <Check size={14} color="#fff" strokeWidth={3} />
                    </span>
                    <span className="text-white text-[14px]">Sucesso!</span>
                  </>
                )}
              </div>
              <div className="text-[10px] text-gray-300 leading-tight text-right">
                <div className="font-bold" style={{ color: "#f38020" }}>CLOUDFLARE</div>
                <div>Privacidade • Ajuda</div>
              </div>
            </div>

            {isLogin && (
              <button
                type="button"
                className="text-[14px] text-gray-600 hover:underline"
                onClick={() => alert("Fluxo de recuperação de senha ainda não implementado.")}
                data-testid="auth-forgot"
              >
                Esqueceu sua senha?
              </button>
            )}

            {error && (
              <div
                className="text-[14px] rounded-md px-3 py-2"
                style={{ backgroundColor: "#fdecec", color: "#c52b2b" }}
                data-testid="auth-error"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full text-white font-semibold rounded-md transition-opacity disabled:opacity-60 disabled:cursor-wait"
              style={{ backgroundColor: "var(--tm-blue)", padding: "14px 24px", fontSize: "16px" }}
              data-testid="auth-submit"
            >
              {submitting ? "Aguarde…" : isLogin ? "Entrar" : "Cadastrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
