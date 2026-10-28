import { createContext, useContext, useState } from "react";
import { api, setToken } from "@/services/api";

const AuthCtx = createContext(null);
const KEY = "spendcheck.session";

function load() {
  try { return JSON.parse(sessionStorage.getItem(KEY)); } catch { return null; }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const s = load();
    if (s) setToken(s.accessToken);
    return s;
  });

  const persist = (s) => {
    setToken(s?.accessToken ?? null);
    setSession(s);
    try { s ? sessionStorage.setItem(KEY, JSON.stringify(s)) : sessionStorage.removeItem(KEY); } catch { /* storage blocked */ }
  };

  const value = {
    user: session?.user ?? null,
    login: async (email, password) => persist(await api.login(email, password)),
    register: async (payload) => persist(await api.register(payload)),
    logout: async () => { await api.logout(); persist(null); },
  };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
