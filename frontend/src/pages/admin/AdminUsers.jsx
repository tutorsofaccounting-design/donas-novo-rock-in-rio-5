import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useAdminAuth, adminHeaders } from "../../context/AdminAuthContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const FONT = '"Averta","Mulish","Helvetica Neue",Helvetica,Arial,sans-serif';

export default function AdminUsers() {
  const { token } = useAdminAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    axios
      .get(`${API}/admin/users`, { headers: adminHeaders(token) })
      .then((r) => setUsers(r.data))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const del = async (id) => {
    if (!window.confirm("Excluir este usuário? Essa ação não pode ser desfeita.")) return;
    try {
      await axios.delete(`${API}/admin/users/${id}`, { headers: adminHeaders(token) });
      load();
    } catch (e) {
      alert(e?.response?.data?.detail || "Erro ao excluir");
    }
  };

  return (
    <div className="px-8 py-8" style={{ fontFamily: FONT }}>
      <h1 className="font-bold mb-6" style={{ fontSize: "24px", color: "rgb(51,51,51)" }}>
        Usuários
      </h1>

      <div className="bg-white rounded-md shadow-sm overflow-x-auto">
        <table className="w-full text-[14px]">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Nome</th>
              <th className="px-4 py-3 font-semibold">E-mail</th>
              <th className="px-4 py-3 font-semibold">Papel</th>
              <th className="px-4 py-3 font-semibold">Cadastrado em</th>
              <th className="px-4 py-3 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">Carregando…</td>
              </tr>
            )}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  Ainda não há usuários cadastrados.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="border-t border-gray-100" data-testid={`user-row-${u.id}`}>
                <td className="px-4 py-3 font-semibold" style={{ color: "rgb(51,51,51)" }}>{u.name}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">
                  <span
                    className="text-[11px] font-bold uppercase px-2 py-0.5 rounded"
                    style={
                      u.role === "admin"
                        ? { backgroundColor: "#ede9fe", color: "#6d28d9" }
                        : { backgroundColor: "#e0f2fe", color: "#0369a1" }
                    }
                  >
                    {u.role || "user"}
                  </span>
                </td>
                <td className="px-4 py-3 text-[12px] text-gray-500">
                  {u.created_at ? new Date(u.created_at).toLocaleString("pt-BR") : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  {u.role !== "admin" && (
                    <button
                      onClick={() => del(u.id)}
                      className="text-[12px] font-semibold text-white rounded px-2.5 py-1"
                      style={{ backgroundColor: "#d43a3a" }}
                      data-testid={`del-user-${u.id}`}
                    >
                      Excluir
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
