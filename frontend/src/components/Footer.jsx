import { Instagram, Facebook, Linkedin, Globe } from "lucide-react";

const FONT = '"Averta", "Mulish", "Helvetica Neue", Helvetica, Arial, sans-serif';
const FOOTER_BG = "#1d2430";

// TikTok icon (lucide doesn't have it in older versions — inline svg)
const TikTokIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M16.6 5.82a4.28 4.28 0 0 1-3.77-2.32h-2.5v12.4a2.44 2.44 0 0 1-2.44 2.45 2.44 2.44 0 0 1-2.45-2.45 2.44 2.44 0 0 1 3.2-2.31V10.9a5 5 0 1 0 4.19 4.95V9.41a6.77 6.77 0 0 0 3.77 1.15V8.08a4.28 4.28 0 0 1 0-2.26z" />
  </svg>
);

// Small Blog icon (stylised text like the original)
const BlogBadge = () => (
  <span
    className="flex flex-col items-center justify-center leading-none select-none"
    aria-hidden="true"
  >
    <span className="text-[7px] tracking-wider opacity-90">ticketmaster</span>
    <span className="text-[12px] font-semibold tracking-wide">BLOG</span>
  </span>
);

const COL_ACESSO = [
  { label: "Minhas Compras", href: "#minhas-compras" },
  { label: "Meu Perfil", href: "#meu-perfil" },
  { label: "Suporte ao Fã", href: "#suporte" },
  { label: "Acessibilidade", href: "#acessibilidade" },
];

const COL_TERMOS = [
  { label: "Termos de Uso", href: "#termos" },
  { label: "Política de Compra", href: "#pol-compra" },
  { label: "Política de Cookies", href: "#pol-cookies" },
  { label: "Política de Privacidade", href: "#pol-privacidade" },
];

const COL_SOBRE = [
  { label: "Ticketmaster Brasil", href: "#tm-br" },
  { label: "Ticketmaster Internacional", href: "#tm-intl" },
  { label: "Trabalhe com a gente", href: "#jobs" },
];

export default function Footer() {
  return (
    <footer
      className="text-white mt-12"
      style={{ backgroundColor: FOOTER_BG, fontFamily: FONT }}
      data-testid="site-footer"
    >
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 pt-16 pb-10">
        {/* Link columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-20">
          <FooterColumn title="Acesso Rápido" items={COL_ACESSO} />
          <FooterColumn title="Termos e Políticas" items={COL_TERMOS} />
          <FooterColumn title="Sobre a Ticketmaster" items={COL_SOBRE} />
        </div>

        {/* Logo */}
        <div className="mt-16 mb-10">
          <img
            src="/brand/ticketmaster-logo.png"
            alt="ticketmaster"
            className="h-8 w-auto select-none"
            style={{ filter: "brightness(0) invert(1)" }}
            draggable={false}
          />
        </div>

        {/* Socials + copyright row */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          <div className="flex items-center gap-6 opacity-95" data-testid="footer-socials">
            <a href="#ig" aria-label="Instagram" className="hover:opacity-80">
              <Instagram size={20} strokeWidth={1.5} />
            </a>
            <a href="#fb" aria-label="Facebook" className="hover:opacity-80">
              <Facebook size={20} strokeWidth={1.5} />
            </a>
            <a href="#in" aria-label="LinkedIn" className="hover:opacity-80">
              <Linkedin size={20} strokeWidth={1.5} />
            </a>
            <a href="#tt" aria-label="TikTok" className="hover:opacity-80">
              <TikTokIcon />
            </a>
            <a href="#blog" aria-label="Blog" className="hover:opacity-80">
              <BlogBadge />
            </a>
          </div>

          <div className="md:text-right text-[14px] leading-7 opacity-90">
            <div className="flex flex-wrap md:justify-end items-center gap-2 mb-1">
              <button
                type="button"
                className="bg-[#6dc86d] text-black text-[13px] px-2 py-0.5 rounded"
                data-testid="cookie-prefs"
              >
                Preferências de cookies
              </button>
              <span>© {new Date().getFullYear()} Ticketmaster.</span>
            </div>
            <div>TICKETMASTER BRASIL LTDA - CNPJ 42.789.521/0001-10</div>
            <div className="mt-3">
              R. Bacaetava, nº 401, 7º andar, Vila Gertrudes, São Paulo/SP, CEP 04705-010
            </div>
          </div>
        </div>
      </div>

      {/* Language bar */}
      <div className="border-t border-white/10" style={{ backgroundColor: "#0d111a" }}>
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-5 flex items-center justify-end gap-6 text-[14px]">
          <Globe size={18} strokeWidth={1.5} className="opacity-80" />
          <a href="#es" className="opacity-80 hover:opacity-100" data-testid="lang-es">Español</a>
          <a href="#en" className="opacity-80 hover:opacity-100" data-testid="lang-en">English</a>
          <a
            href="#pt"
            className="opacity-100 underline underline-offset-4"
            data-testid="lang-pt"
          >
            Português
          </a>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, items }) {
  return (
    <div>
      <h4 className="font-bold mb-6" style={{ fontSize: "17px" }}>
        {title}
      </h4>
      <ul className="space-y-5">
        {items.map((it) => (
          <li key={it.label}>
            <a
              href={it.href}
              className="text-[15px] opacity-90 hover:opacity-100 hover:underline underline-offset-4"
            >
              {it.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
