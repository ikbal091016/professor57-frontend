"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ApiUser, loginUser, logoutUser, refreshSession, registerUser } from "./api";

interface AuthContextValue {
  user: ApiUser | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On first load, try to silently exchange the httpOnly refresh cookie for a fresh
  // access token — this is what keeps someone logged in across page reloads.
  useEffect(() => {
    refreshSession()
      .then((res) => {
        setUser(res.user);
        setAccessToken(res.accessToken);
      })
      .catch(() => {
        setUser(null);
        setAccessToken(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await loginUser({ email, password });
    setUser(res.user);
    setAccessToken(res.accessToken);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await registerUser({ name, email, password });
    setUser(res.user);
    setAccessToken(res.accessToken);
  }, []);

  const logout = useCallback(async () => {
    await logoutUser(accessToken).catch(() => {});
    setUser(null);
    setAccessToken(null);
  }, [accessToken]);

  const value = useMemo(
    () => ({ user, accessToken, isLoading, login, register, logout }),
    [user, accessToken, isLoading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
