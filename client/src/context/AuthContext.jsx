import { useMemo, useState } from "react";
import { AuthContext } from "./AuthContextValue.js";

const getStoredUser = () => {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    localStorage.removeItem("user");
    return null;
  }
};

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(getStoredUser);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUsuario(null);
  };

  const value = useMemo(
    () => ({
      usuario,
      setUsuario,
      logout,
      isAuthenticated: Boolean(usuario),
    }),
    [usuario],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
