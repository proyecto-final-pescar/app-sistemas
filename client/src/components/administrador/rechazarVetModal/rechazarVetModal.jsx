import { useState, useEffect } from "react";
import Button from "../../ui/button/Button";
import Textarea from "../../ui/textarea/Textarea";

import {
  getVeterinariaAdminById,
  rechazarVeterinariaAdmin,
} from "../../../services/adminService";

import styles from "./rechazarVetModal.module.css";

export default function RechazarVetModal({
  veterinariaId,
  nombreVeterinaria: nombreProp = "",
  onClose,
  onSuccess,
}) {
  const [nombreVet, setNombreVet] = useState(nombreProp);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");
  const [loadingFetch, setLoadingFetch] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carga el nombre de la veterinaria por ID si no fue provisto mediante props
  useEffect(() => {
    if (veterinariaId && !nombreProp) {
      const fetchVeterinaria = async () => {
        try {
          setLoadingFetch(true);
          const data = await getVeterinariaAdminById(veterinariaId);
          setNombreVet(data?.nombre || "la veterinaria");
        } catch (err) {
          setError("No se pudo obtener la información de la veterinaria.");
        } finally {
          setLoadingFetch(false);
        }
      };

      fetchVeterinaria();
    }
  }, [veterinariaId, nombreProp]);

  const validate = () => {
    if (!motivo.trim()) {
      return "El motivo del rechazo es obligatorio";
    }
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      // Ejecutamos la petición de rechazo al Backend
      await rechazarVeterinariaAdmin(veterinariaId, motivo);

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Ocurrió un error al rechazar la veterinaria.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Rechazar Veterinaria</h2>

        {loadingFetch ? (
          <p className={styles.description}>
            Cargando datos de la veterinaria...
          </p>
        ) : (
          <p className={styles.description}>
            Está a punto de rechazar la solicitud de registro para{" "}
            <strong>{nombreVet || "esta veterinaria"}</strong>.
          </p>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <Textarea
            label="Motivo del rechazo (se enviará por email)"
            placeholder="Ej. Falta de documentación..."
            value={motivo}
            onChange={(e) => {
              setMotivo(e.target.value);
              if (error) setError("");
            }}
            error={error}
            disabled={isSubmitting || loadingFetch}
          />

          <div className={styles.actions}>
            <Button
              texto="Cancelar"
              variante="secundario"
              tamaño="grande"
              onClick={onClose}
              disabled={isSubmitting}
            />
            <Button
              type="submit"
              texto={isSubmitting ? "Enviando..." : "Confirmar Rechazo"}
              variante="peligro"
              tamaño="grande"
              disabled={isSubmitting || loadingFetch}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
