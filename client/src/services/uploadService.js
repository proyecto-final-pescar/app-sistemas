import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const subirImagen = async (archivo, carpeta = "mascotas") => {
  const formData = new FormData();

  formData.append("imagen", archivo);
  formData.append("carpeta", carpeta);

  const { data } = await api.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data.url;
};

// Nueva función para subir cualquier tipo de archivo (PDF, imágenes, docs, etc)
export const subirArchivo = async (archivo, carpeta = "estudios") => {
  const formData = new FormData();

  formData.append("archivo", archivo);
  formData.append("carpeta", carpeta);

  const { data } = await api.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data.url;
};