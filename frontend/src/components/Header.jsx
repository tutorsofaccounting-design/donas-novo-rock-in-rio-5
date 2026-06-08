import { Link, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { playClick } from "../lib/sounds";

// Font stack used across the header — mirrors the original Ticketmaster site
const HEADER_FONT = '"Averta", "Mulish", "Helvetica Neue", Helvetica, Arial, sans-serif';

export default function Header({ initialQuery = "", showSearch = true }) {
  const [q, setQ] = useState(initialQuery);
  const navigate = useNavigate();
  const { user, openAuth, logout } = useAuth();
  const debounceRef = useRef(null);

  // Keep input in sync when URL changes (e.g. after clicking the logo)
  useEffect(() => {
    setQ(initialQuery);
  }, [initialQuery]);

  const submit = (e) => {
    e.preventDefault();
    try { playClick(); } catch { /* ignore */ }
    // Clear any pending live-search to avoid a redundant navigation right after
    if (debounceRef.current) clearTimeout(debounceRef.current);
    navigate(`/?q=${encodeURIComponent(q.trim())}`);
  };

  const onChange = (e) => {
    const v = e.target.value;
    setQ(v);

    // Cancel previous scheduled search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    // Empty → back to home immediately
    if (v === "") {
      navigate("/");
      return;
    }

    // Live search starting at 3 characters (debounced 250ms for snappy feel)
    const term = v.trim();
    if (term.length >= 3) {
      debounceRef.current = setTimeout(() => {
        navigate(`/?q=${encodeURIComponent(term)}`, { replace: true });
      }, 250);
    }
  };

  const linkCls =
    "text-white hover:underline underline-offset-4 transition-opacity whitespace-nowrap text-[13px] md:text-[15px] leading-[18px] md:leading-[22px] font-normal";
  const linkStyle = {};
  const mobileLinkStyle = {};

  return (
    <>
      {/* Sticky top bar */}
      <div
        className="w-full sticky top-0 z-50"
        style={{ backgroundColor: "var(--tm-blue)", fontFamily: HEADER_FONT }}
        data-testid="site-header"
      >
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-3 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center shrink-0" data-testid="logo-link">
            <img
              src="/brand/ticketmaster-logo.png"
              alt="ticketmaster"
              className="h-5 md:h-6 w-auto select-none"
              style={{ filter: "brightness(0) invert(1)" }}
              draggable={false}
            />
          </Link>

          <nav className="flex items-center gap-3 md:gap-8">
            {user ? (
              <>
                <Link to="/meus-pedidos" className={linkCls} style={linkStyle} data-testid="nav-orders">
                  Meus pedidos
                </Link>
                <span
                  className="text-white cursor-default select-none opacity-90"
                  style={linkStyle}
                  data-testid="nav-profile"
                >
                  Meu perfil
                </span>
                <span
                  className="text-white cursor-default select-none opacity-90"
                  style={linkStyle}
                  data-testid="nav-support"
                >
                  Suporte ao Fã
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className={linkCls}
                  style={linkStyle}
                  data-testid="nav-logout"
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <a href="#suporte" className={`hidden md:block ${linkCls}`} style={linkStyle} data-testid="nav-support">
                  Suporte ao Fã
                </a>
                <button
                  type="button"
                  onClick={() => openAuth("login")}
                  className={linkCls}
                  style={linkStyle}
                  data-testid="nav-login"
                >
                  Entrar / Cadastre-se
                </button>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Search section — not sticky, only on home */}
      {showSearch && (
        <div
          className="w-full"
          style={{ backgroundColor: "var(--tm-blue)", fontFamily: HEADER_FONT }}
        >
          <div className="max-w-[1440px] mx-auto px-4 md:px-10 pt-6 md:pt-12 pb-6 md:pb-10 flex justify-center">
            <form onSubmit={submit} className="w-full max-w-[900px]" data-testid="search-form">
              <div className="flex items-stretch bg-white p-1.5 shadow-sm rounded-md">
                <input
                  value={q}
                  onChange={onChange}
                  type="text"
                  placeholder="Pesquisar artista ou evento"
                  className="flex-1 min-w-0 px-3 md:px-4 text-gray-800 placeholder-gray-400 outline-none bg-transparent rounded-md text-[14px] md:text-[15px]"
                  style={{ fontFamily: HEADER_FONT, lineHeight: "22px", fontWeight: 400 }}
                  data-testid="search-input"
                />
                <button
                  type="submit"
                  className="px-4 md:px-7 py-2.5 md:py-3 text-white flex items-center gap-2 shrink-0 rounded-md"
                  style={{ backgroundColor: "var(--tm-blue)", fontFamily: HEADER_FONT, fontSize: "14px", lineHeight: "20px", fontWeight: 400 }}
                  data-testid="search-submit"
                >
                  <span className="hidden md:inline">Pesquisar</span>
                  <Search size={16} strokeWidth={2} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
