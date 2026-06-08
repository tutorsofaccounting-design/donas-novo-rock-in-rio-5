import { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const KEY = "tm_admin_token";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [token, setToken] = useState(() => (typeof window !== "undefined" ? localStorage.getItem(KEY) : null));
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!token) {
      setChecking(false);
      return;
    }
    // lightweight ping: try /admin/stats; if 401 -> clear token
    axios
      .get(`${API}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .catch((e) => {
        if (e?.response?.status === 401 || e?.response?.status === 403) {
          localStorage.removeItem(KEY);
          setToken(null);
        }
      })
      .finally(() => setChecking(false));
  }, [token]);

  const login = async (username, password) => {
    const { data } = await axios.post(`${API}/admin/login`, { username, password });
    localStorage.setItem(KEY, data.token);
    setToken(data.token);
    return true;
  };

  const logout = useCallback(() => {
    localStorage.removeItem(KEY);
    setToken(null);
  }, []);

  return (
    <AdminAuthContext.Provider value={{ token, checking, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}

export function adminHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
