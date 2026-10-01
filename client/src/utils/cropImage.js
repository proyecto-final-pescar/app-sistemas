

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
 * Genera un File JPEG con la imagen ya recortada según el área indicada.
 *
 * @param {string} imagenSrc - URL (object URL) de la imagen original.
 * @param {{x:number,y:number,width:number,height:number}} pixelCrop - Área de recorte en píxeles (la da react-easy-crop en onCropComplete).
 * @param {string} nombreArchivo - Nombre a usar para el File resultante.
 * @returns {Promise<File>}
 */
export async function obtenerImagenRecortada(
  imagenSrc,
  pixelCrop,
  nombreArchivo = "foto-recortada.jpg"
) {
  const imagen = await crearImagen(imagenSrc);
  const canvas = document.createElement("canvas");
  const contexto = canvas.getContext("2d");

  if (!contexto) {
    throw new Error("No se pudo obtener el contexto de canvas");
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  contexto.drawImage(
    imagen,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
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
      0.92
    );
  });
}