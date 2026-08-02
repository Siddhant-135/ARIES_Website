"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { login as apiLogin, logout as apiLogout, me } from "@/lib/api";
import { levelToUiRole, type UiRole } from "@/lib/roles";

interface AuthSession {
  token: string;
  memberSlug: string;
  level: string;
  name: string;
  email: string;
}

interface AuthState {
  session: AuthSession | null;
  role: UiRole;
  loading: boolean;
  signIn: (entryNumber: string, password: string) => Promise<AuthSession>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  session: null,
  role: "viewer",
  loading: true,
  signIn: async () => {
    throw new Error("AuthProvider not mounted");
  },
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    me()
      .then((data) => {
        const next = data as AuthSession;
        localStorage.setItem(SESSION_KEY, JSON.stringify(next));
        setCookie(SESSION_KEY, JSON.stringify(next));
        setSession(next);
      })
      .catch(() => {
        localStorage.removeItem(SESSION_KEY);
        deleteCookie(SESSION_KEY);
        setSession(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const signIn = async (entryNumber: string, password: string) => {
    const data = await apiLogin(entryNumber, password);
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
    setCookie(SESSION_KEY, JSON.stringify(data));
    setSession(data);
    return data;
  };

  const signOut = async () => {
    await apiLogout().catch(() => {});
    localStorage.removeItem(SESSION_KEY);
    deleteCookie(SESSION_KEY);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        role: session ? levelToUiRole(session.level) : "viewer",
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
