// ============================================================
// authService.js
//
// Centraliza todas las llamadas HTTP relacionadas a autenticación.
// En C# sería tu AuthRepository o AuthHttpClient.
//
// Importamos la instancia de axios preconfigurada (base URL + token).
// ============================================================

import api from "./api";

// ── POST /auth/forgot-password ────────────────────────────────
// Le manda un email al usuario con el link de recuperación.
// El backend genera un token y lo incluye en la URL del correo.
export const forgotPassword = async (email) => {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
};

// ── POST /auth/reset-password/:token ─────────────────────────
// Recibe el token de la URL y la nueva contraseña.
// El backend valida el token y actualiza la contraseña.
// El backend lee { token, newPassword } del req.body
// NO va en la URL — va en el cuerpo del POST
export const resetPassword = async (token, nuevaPassword) => {
  const response = await api.post("/auth/reset-password", {
    token,
    newPassword: nuevaPassword,   // el backend espera "newPassword"
  });
  return response.data;
};
