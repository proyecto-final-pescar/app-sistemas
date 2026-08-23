import api from "./api";

export const forgotPassword = async (email) => {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
};

export const resetPassword = async (token, nuevaPassword) => {
  const response = await api.post("/auth/reset-password", {
    token,
    newPassword: nuevaPassword, 
  });
  return response.data;
};

export const verificarCuenta = async (token) => {
  const response = await api.get("/auth/verificar", { params: { token } });
  return response.data;
};

export const reenviarVerificacion = async (email) => {
  const response = await api.post("/auth/reenviar-verificacion", { email });
  return response.data;
};