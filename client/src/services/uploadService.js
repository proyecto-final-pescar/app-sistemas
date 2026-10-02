import api from "./api.js";

// La subida puede tardar mas que el resto de los requests 
// por eso tiene su propio timeout
const TIMEOUT_SUBIDA_MS = 60000;

export const subirImagen = async (archivo, carpeta = "mascotas") => {
  const formData = new FormData();

  formData.append("imagen", archivo);
  formData.append("carpeta", carpeta);

  const { data } = await api.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    timeout: TIMEOUT_SUBIDA_MS,
  });

  return data.url;
};