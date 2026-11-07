// Pide a Cloudinary la imagen al tamaño justo y en el formato más liviano.

export const optimizarImagen = (url, ancho = 600) => {
  if (!url || typeof url !== "string") return url;

  const marca = "/image/upload/";
  const indice = url.indexOf(marca);
  if (!url.includes("res.cloudinary.com") || indice === -1) return url;

  const inicioResto = indice + marca.length;
  const resto = url.slice(inicioResto);

  
  if (!/^v\d+\//.test(resto)) return url;

  return `${url.slice(0, inicioResto)}f_auto,q_auto,w_${ancho}/${resto}`;
};

export default optimizarImagen;