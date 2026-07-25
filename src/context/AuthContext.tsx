"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { login as apiLogin, logout as apiLogout, me } from "@/lib/api";

type Role = "admin" | "coordinator" | "member" | "viewer";

interface AuthSession {
  token: string;
  memberSlug: string;
  level: string;
  name: string;
  email: string;
}

interface AuthState {
  session: AuthSession | null;
  role: Role;
  loading: boolean;
  signIn: (entryNumber: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  session: null,
  role: "viewer",
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

const SESSION_KEY = "aries_session";

function setCookie(name: string, value: string, days = 7) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

function levelToRole(level: string): Role {
  if (level === "oc") return "admin";
  if (level === "coordinator") return "coordinator";
  if (["executive", "member"].includes(level)) return "member";
  return "viewer";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) {
      deleteCookie(SESSION_KEY);
      setLoading(false);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as AuthSession;
      me(parsed.token)
        .then(() => {
          setSession(parsed);
          setCookie(SESSION_KEY, JSON.stringify(parsed));
        })
        .catch(() => {
          localStorage.removeItem(SESSION_KEY);
          deleteCookie(SESSION_KEY);
        })
        .finally(() => setLoading(false));
    } catch {
      localStorage.removeItem(SESSION_KEY);
      deleteCookie(SESSION_KEY);
      setLoading(false);
    }
  }, []);

  const signIn = async (entryNumber: string, password: string) => {
    const data = await apiLogin(entryNumber, password);
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
    setCookie(SESSION_KEY, JSON.stringify(data));
    setSession(data);
  };

  const signOut = async () => {
    if (session) {
      apiLogout(session.token).catch(() => {});
    }
    localStorage.removeItem(SESSION_KEY);
    deleteCookie(SESSION_KEY);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        role: session ? levelToRole(session.level) : "viewer",
        loading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
