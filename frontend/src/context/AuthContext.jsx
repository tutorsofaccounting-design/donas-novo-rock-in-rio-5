import { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const TOKEN_KEY = "tm_token";
const GUEST_KEY = "tm_guest_id";

function getOrCreateGuestId() {
  if (typeof window === "undefined") return null;
  let g = localStorage.getItem(GUEST_KEY);
  if (!g) {
    g = `guest_${crypto.randomUUID()}`;
    localStorage.setItem(GUEST_KEY, g);
  }
  return g;
}

// Always send guest id so backend can associate orders even without login
const guestId = getOrCreateGuestId();
if (guestId) axios.defaults.headers.common["X-Guest-Id"] = guestId;

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authModal, setAuthModal] = useState(null); // null | "login" | "register"

  const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    delete axios.defaults.headers.common.Authorization;
    setUser(null);
  }, []);

  const applyToken = (t) => {
    localStorage.setItem(TOKEN_KEY, t);
    axios.defaults.headers.common.Authorization = `Bearer ${t}`;
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    axios
      .get(`${API}/auth/me`)
      .then((r) => setUser(r.data))
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [token, logout]);

  const login = async (email, password) => {
    const { data } = await axios.post(`${API}/auth/login`, { email, password });
    applyToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    const { data } = await axios.post(`${API}/auth/register`, { name, email, password });
    applyToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const openAuth = (mode = "login") => setAuthModal(mode);
  const closeAuth = () => setAuthModal(null);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, authModal, openAuth, closeAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
