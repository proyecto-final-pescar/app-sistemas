import { useCallback, useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import { ZoomIn } from "lucide-react";
import Modal from "../layout/modal/Modal";
import Button from "../ui/button/Button";
import { obtenerImagenRecortada } from "../../utils/cropImage";
import "./RecortadorImagen.css";

/**
 * Modal de recorte de imagen reutilizable (drag + zoom).
 * Devuelve, al confirmar, un File JPEG ya recortado según `aspecto` y `forma`.
 *
 * Uso típico:
 *   {archivoParaRecortar && (
 *     <RecortadorImagen
 *       archivo={archivoParaRecortar}
 *       aspecto={1}            // 1 = cuadrado/circular, 16/9, 4/3, etc.
 *       forma="redondo"        // "redondo" | "rectangular"
 *       onCancelar={...}
 *       onConfirmar={(archivoRecortado) => ...}
 *     />
 *   )}
 */
function RecortadorImagen({
  archivo,
  aspecto = 1,
  forma = "redondo",
  titulo = "Ajustá tu foto",
  subtitulo = "Movés y acercás la imagen para encuadrarla como quieras",
  onCancelar,
  onConfirmar,
}) {
  const [imagenUrl, setImagenUrl] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaRecortePixeles, setAreaRecortePixeles] = useState(null);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    const url = URL.createObjectURL(archivo);
    setImagenUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [archivo]);

  const manejarCropCompleto = useCallback((_areaRecorte, areaPixeles) => {
    setAreaRecortePixeles(areaPixeles);
  }, []);

  async function manejarConfirmar() {
    if (!areaRecortePixeles || !imagenUrl) return;

    setProcesando(true);
    try {
      const archivoRecortado = await obtenerImagenRecortada(imagenUrl, areaRecortePixeles);
      onConfirmar?.(archivoRecortado);
    } catch (error) {
      console.error("Error al recortar la imagen:", error);
    } finally {
      setProcesando(false);
    }
  }

  return (
    <Modal isOpen onClose={onCancelar} size="sm" zIndex={1100}>
      <div className="recortadorImagen">
        <div className="recortadorImagen__header">
          <h2>{titulo}</h2>
          <p>{subtitulo}</p>
        </div>

        <div className={`recortadorImagen__area recortadorImagen__area--${forma}`}>
          {imagenUrl && (
            <Cropper
              image={imagenUrl}
              crop={crop}
              zoom={zoom}
              aspect={aspecto}
              cropShape={forma === "redondo" ? "round" : "rect"}
              showGrid={forma !== "redondo"}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={manejarCropCompleto}
            />
          )}
        </div>

        <div className="recortadorImagen__zoom">
          <ZoomIn size={16} />
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(evento) => setZoom(Number(evento.target.value))}
            aria-label="Zoom de la imagen"
          />
        </div>

        <div className="recortadorImagen__acciones">
          <Button
            type="button"
            texto="Cancelar"
            variante="secundario"
            tamaño="mediano"
            onClick={onCancelar}
            disabled={procesando}
          />
          <Button
            type="button"
            texto={procesando ? "Aplicando..." : "Usar esta foto"}
            variante="primario"
            tamaño="mediano"
            onClick={manejarConfirmar}
            disabled={procesando || !areaRecortePixeles}
          />
        </div>
      </div>
    </Modal>
  );
}

export default RecortadorImagen;