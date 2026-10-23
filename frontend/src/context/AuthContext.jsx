import React, { createContext, useState, useCallback } from "react";
import * as authApi from "../services/authApi.js";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    return {
      token,
      username: localStorage.getItem("username"),
      fullName: localStorage.getItem("fullName"),
      role: localStorage.getItem("role"),
    };
  });

  const login = useCallback(async (username, password) => {
    const result = await authApi.login(username, password);
    localStorage.setItem("token", result.token);
    localStorage.setItem("username", result.username);
    localStorage.setItem("fullName", result.fullName);
    localStorage.setItem("role", result.role);
    setUser({ token: result.token, username: result.username, fullName: result.fullName, role: result.role });
    return result;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      // Even if the network call fails, still clear the local session.
    }
    localStorage.clear();
    setUser(null);
  }, []);

  const isManager = user?.role === "MANAGER";

  return (
    <AuthContext.Provider value={{ user, login, logout, isManager }}>
      {children}
    </AuthContext.Provider>
  );
}
