import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useAdminAuth, adminHeaders } from "../../context/AdminAuthContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const FONT = '"Averta","Mulish","Helvetica Neue",Helvetica,Arial,sans-serif';
const br = (n) => (n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function AdminEvents() {
  const { token } = useAdminAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState({});
  const [savingSlug, setSavingSlug] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    axios
      .get(`${API}/admin/events`, { headers: adminHeaders(token) })
      .then((r) => setEvents(r.data))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const savePrice = async (slug) => {
    const val = Number(editing[slug]);
    if (!Number.isFinite(val) || val < 0) return;
    setSavingSlug(slug);
    await axios.patch(
      `${API}/admin/events/${slug}`,
      { price_from: val },
      { headers: adminHeaders(token) }
    );
    setEditing((e) => ({ ...e, [slug]: undefined }));
    setSavingSlug(null);
    load();
  };

  const toggleFeatured = async (slug, featured) => {
    await axios.patch(
      `${API}/admin/events/${slug}`,
      { featured: !featured },
      { headers: adminHeaders(token) }
    );
    load();
  };

  return (
    <div className="px-8 py-8" style={{ fontFamily: FONT }}>
      <h1 className="font-bold mb-6" style={{ fontSize: "24px", color: "rgb(51,51,51)" }}>
        Eventos
      </h1>

      <div className="bg-white rounded-md shadow-sm overflow-x-auto">
        <table className="w-full text-[14px]">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Evento</th>
              <th className="px-4 py-3 font-semibold">Local</th>
              <th className="px-4 py-3 font-semibold">Data</th>
              <th className="px-4 py-3 font-semibold">Categoria</th>
              <th className="px-4 py-3 font-semibold">Preço a partir de</th>
              <th className="px-4 py-3 font-semibold text-center">Destaque</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">Carregando…</td>
              </tr>
            )}
            {events.map((ev) => {
              const hasEdit = editing[ev.slug] !== undefined;
              return (
                <tr key={ev.slug} className="border-t border-gray-100" data-testid={`ev-row-${ev.slug}`}>
                  <td className="px-4 py-3">
                    <div className="font-semibold" style={{ color: "rgb(51,51,51)" }}>{ev.title}</div>
                    <div className="text-[12px] text-gray-500">{ev.artist}</div>
                  </td>
                  <td className="px-4 py-3 text-[13px]">
                    {ev.venue}
                    <div className="text-[12px] text-gray-500">{ev.city}</div>
                  </td>
                  <td className="px-4 py-3 text-[13px]">{ev.date_label}</td>
                  <td className="px-4 py-3 text-[12px] uppercase tracking-wide text-gray-500">{ev.category}</td>
                  <td className="px-4 py-3">
                    {hasEdit ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={editing[ev.slug]}
                          onChange={(e) => setEditing((s) => ({ ...s, [ev.slug]: e.target.value }))}
                          className="w-28 border border-gray-300 rounded px-2 py-1 text-[13px]"
                          data-testid={`price-input-${ev.slug}`}
                        />
                        <button
                          onClick={() => savePrice(ev.slug)}
                          disabled={savingSlug === ev.slug}
                          className="text-white text-[12px] font-semibold rounded px-2 py-1"
                          style={{ backgroundColor: "#16a34a" }}
                        >
                          Salvar
                        </button>
                        <button
                          onClick={() => setEditing((e) => ({ ...e, [ev.slug]: undefined }))}
                          className="text-[12px] text-gray-500"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          setEditing((s) => ({ ...s, [ev.slug]: String(ev.price_from) }))
                        }
                        className="text-left font-semibold hover:underline"
                        style={{ color: "var(--tm-blue)" }}
                        data-testid={`price-${ev.slug}`}
                      >
                        {br(ev.price_from)}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!ev.featured}
                        onChange={() => toggleFeatured(ev.slug, !!ev.featured)}
                        data-testid={`featured-${ev.slug}`}
                      />
                    </label>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
