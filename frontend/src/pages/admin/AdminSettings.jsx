import { useEffect, useState } from "react";
import axios from "axios";
import { Key, Send, CheckCircle2 } from "lucide-react";
import { useAdminAuth, adminHeaders } from "../../context/AdminAuthContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const FONT = '"Averta","Mulish","Helvetica Neue",Helvetica,Arial,sans-serif';

function Card({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="bg-white rounded-md shadow-sm p-6 mb-6">
      <div className="flex items-center gap-3 mb-1">
        <Icon size={20} style={{ color: "var(--tm-blue)" }} />
        <h2 className="font-bold" style={{ fontSize: "18px", color: "rgb(51,51,51)" }}>
          {title}
        </h2>
      </div>
      <p className="text-[13px] text-gray-600 mb-5">{subtitle}</p>
      {children}
    </div>
  );
}

function Label({ children }) {
  return <span className="text-[13px] font-bold text-gray-700 block mb-1.5">{children}</span>;
}

const input =
  "w-full border border-gray-300 rounded-md px-3 py-2.5 text-[14px] focus:outline-none focus:border-[var(--tm-blue)]";

export default function AdminSettings() {
  const { token } = useAdminAuth();

  // PIX
  const [pixKey, setPixKey] = useState("");
  const [merchantName, setMerchantName] = useState("TICKETMASTER BRASIL");
  const [merchantCity, setMerchantCity] = useState("SAO PAULO");
  const [pixMsg, setPixMsg] = useState("");

  // Telegram
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [tgMsg, setTgMsg] = useState("");
  const [testing, setTesting] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const h = adminHeaders(token);
    Promise.all([
      axios.get(`${API}/admin/payment`, { headers: h }).then((r) => r.data).catch(() => ({})),
      axios.get(`${API}/admin/telegram`, { headers: h }).then((r) => r.data).catch(() => ({})),
    ])
      .then(([p, t]) => {
        setPixKey(p.pix_key || "");
        setMerchantName(p.merchant_name || "TICKETMASTER BRASIL");
        setMerchantCity(p.merchant_city || "SAO PAULO");
        setBotToken(t.bot_token || "");
        setChatId(t.chat_id || "");
      })
      .finally(() => setLoading(false));
  }, [token]);

  const savePix = async () => {
    setPixMsg("");
    await axios.post(
      `${API}/admin/payment`,
      { pix_key: pixKey.trim(), merchant_name: merchantName.trim() || "TICKETMASTER BRASIL", merchant_city: merchantCity.trim() || "SAO PAULO" },
      { headers: adminHeaders(token) }
    );
    setPixMsg("Chave PIX salva com sucesso.");
    setTimeout(() => setPixMsg(""), 3500);
  };

  const saveTg = async () => {
    setTgMsg("");
    await axios.post(
      `${API}/admin/telegram`,
      { bot_token: botToken.trim(), chat_id: chatId.trim() },
      { headers: adminHeaders(token) }
    );
    setTgMsg("Configuração do Telegram salva.");
    setTimeout(() => setTgMsg(""), 3500);
  };

  const testTg = async () => {
    setTesting(true);
    setTgMsg("");
    try {
      await axios.post(`${API}/admin/telegram/test`, {}, { headers: adminHeaders(token) });
      setTgMsg("✅ Mensagem de teste enviada. Confira seu Telegram.");
    } catch (e) {
      setTgMsg(`❌ ${e?.response?.data?.detail || "Falha ao enviar teste"}`);
    } finally {
      setTesting(false);
      setTimeout(() => setTgMsg(""), 6000);
    }
  };

  return (
    <div className="px-8 py-8 max-w-[820px]" style={{ fontFamily: FONT }}>
      <h1 className="font-bold mb-6" style={{ fontSize: "24px", color: "rgb(51,51,51)" }}>
        Configurações
      </h1>

      {loading ? (
        <div className="h-40 bg-white rounded-md animate-pulse" />
      ) : (
        <>
          <Card
            icon={Key}
            title="Chave PIX"
            subtitle="Chave PIX usada para gerar os códigos de pagamento exibidos aos clientes."
          >
            <div className="mb-4">
              <Label>Chave PIX (Aleatória, CPF, CNPJ, E-mail ou Telefone)</Label>
              <input
                type="text"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                className={input}
                placeholder="ex: 3a330cad-0e02-4588-96dc-b5d1f51b4138"
                data-testid="pix-key-input"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label>Nome do recebedor (até 25 caracteres)</Label>
                <input
                  type="text"
                  value={merchantName}
                  maxLength={25}
                  onChange={(e) => setMerchantName(e.target.value)}
                  className={input}
                  data-testid="pix-name-input"
                />
              </div>
              <div>
                <Label>Cidade (até 15 caracteres)</Label>
                <input
                  type="text"
                  value={merchantCity}
                  maxLength={15}
                  onChange={(e) => setMerchantCity(e.target.value)}
                  className={input}
                  data-testid="pix-city-input"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={savePix}
              className="text-white font-semibold rounded-md"
              style={{ backgroundColor: "var(--tm-blue)", padding: "10px 20px", fontSize: "14px" }}
              data-testid="pix-save"
            >
              Salvar Chave PIX
            </button>
            {pixMsg && (
              <span className="inline-flex items-center gap-1.5 ml-3 text-[13px] text-green-700">
                <CheckCircle2 size={14} /> {pixMsg}
              </span>
            )}
          </Card>

          <Card
            icon={Send}
            title="Configuração do Telegram"
            subtitle="Configure o bot do Telegram para receber notificações em tempo real de novos pedidos."
          >
            <div className="mb-4">
              <Label>Telegram Bot Token</Label>
              <input
                type="text"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                className={input}
                placeholder="123456789:AAF-xxxxxxxxxxxxxxxxxxxxx"
                data-testid="tg-token-input"
              />
              <p className="text-[12px] text-gray-500 mt-1">
                Obtenha o token conversando com <b>@BotFather</b> no Telegram.
              </p>
            </div>
            <div className="mb-5">
              <Label>Chat ID (ou ID do grupo)</Label>
              <input
                type="text"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                className={input}
                placeholder="-1003742872851"
                data-testid="tg-chatid-input"
              />
              <p className="text-[12px] text-gray-500 mt-1">
                Adicione o bot ao grupo e envie /start. Para obter o ID do grupo, fale com <b>@getidsbot</b>.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={saveTg}
                className="text-white font-semibold rounded-md"
                style={{ backgroundColor: "var(--tm-blue)", padding: "10px 20px", fontSize: "14px" }}
                data-testid="tg-save"
              >
                Salvar Configurações
              </button>
              <button
                type="button"
                onClick={testTg}
                disabled={testing}
                className="font-semibold rounded-md disabled:opacity-60"
                style={{
                  backgroundColor: "#16a34a",
                  color: "#fff",
                  padding: "10px 20px",
                  fontSize: "14px",
                }}
                data-testid="tg-test"
              >
                {testing ? "Testando…" : "Testar conexão"}
              </button>
            </div>
            {tgMsg && <p className="mt-3 text-[13px] text-gray-700">{tgMsg}</p>}
          </Card>
        </>
      )}
    </div>
  );
}
