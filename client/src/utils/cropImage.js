function crearImagen(url) {
  return new Promise((resolve, reject) => {
    const imagen = new Image();
    imagen.addEventListener("load", () => resolve(imagen));
    imagen.addEventListener("error", (error) => reject(error));
    imagen.setAttribute("crossOrigin", "anonymous");
    imagen.src = url;
  });
}

/**
 
 *
 * @param {string} imagenSrc - URL (object URL) de la imagen original.
 * @param {{x:number,y:number,width:number,height:number}} pixelCrop - Área de recorte en píxeles (la da react-easy-crop en onCropComplete).
 * @param {string} nombreArchivo - Nombre a usar para el File resultante.
 * @param {{maxLado?:number, calidad?:number}} opciones 
 * @returns {Promise<File>}
 */
export async function obtenerImagenRecortada(
  imagenSrc,
  pixelCrop,
  nombreArchivo = "foto-recortada.jpg",
  { maxLado = 1200, calidad = 0.85 } = {}
) {
  const imagen = await crearImagen(imagenSrc);
  const canvas = document.createElement("canvas");
  const contexto = canvas.getContext("2d");

  if (!contexto) {
    throw new Error("No se pudo obtener el contexto de canvas");
  }

  // Nunca se agranda: si el recorte ya es chico, se conserva su tamaño
  const escala = Math.min(1, maxLado / Math.max(pixelCrop.width, pixelCrop.height));
  const anchoFinal = Math.max(1, Math.round(pixelCrop.width * escala));
  const altoFinal = Math.max(1, Math.round(pixelCrop.height * escala));

  canvas.width = anchoFinal;
  canvas.height = altoFinal;

  // El JPEG no tiene transparencia: sin fondo, un PNG transparente saldría negro
  contexto.fillStyle = "#ffffff";
  contexto.fillRect(0, 0, anchoFinal, altoFinal);

  contexto.imageSmoothingQuality = "high";
  contexto.drawImage(
    imagen,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    anchoFinal,
    altoFinal
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("No se pudo generar la imagen recortada"));
          return;
        }
        resolve(new File([blob], nombreArchivo, { type: "image/jpeg" }));
      },
      "image/jpeg",
      calidad
    );
  });
}