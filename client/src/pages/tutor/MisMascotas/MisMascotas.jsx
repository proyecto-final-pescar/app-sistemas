import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../../components/layout/Sidebar";
import TopBar from "../../../components/layout/TopBar";
import Button from "../../../components/ui/button/Button";
import MascotaCard from "../../../components/mascotas/MascotaCard";
import AddPetCard from "../../../components/mascotas/AddPetCard";
import FormularioMascota from "../../../components/forms/FormularioMascota/FormularioMascota.jsx";
import Modal from "../../../components/layout/modal/Modal";
import {
  obtenerMascotas,
  eliminarMascota,
} from "../../../services/MascotaService";
import styles from "../../../styles/MisMascotas.module.css";

const MisMascotas = () => {
  const navigate = useNavigate();

  const [mascotas, setMascotas] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [mascotaSeleccionada, setMascotaSeleccionada] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);


  const cargarMascotas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await obtenerMascotas();
      setMascotas(data);
     
    } catch (err) {
      console.error("Error al obtener mascotas:", err);

      const status = err?.response?.status;
      const mensajeBackend = err?.response?.data?.error;

      if (status === 401) {
        setError(mensajeBackend || "Tu sesión expiró. Te estamos llevando al login…");
        setTimeout(() => navigate("/login"), 1500);
      } else if (mensajeBackend) {
        setError(mensajeBackend);
      } else {
        setError("No pudimos cargar tus mascotas. Intentá nuevamente en unos minutos.");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    cargarMascotas();
  }, [cargarMascotas]);

  const abrirModalNuevaMascota = () => {
  setMascotaSeleccionada(null);
  setModalAbierto(true);
};

const mostrarExito = (mensaje) => {
  setMensajeExito(mensaje);
  setTimeout(() => setMensajeExito(null), 3000);
};


  const handleViewPet = (id) => navigate(`/mascotas/${id}`);
 const handleEdit = (id) => {
  const mascota = mascotas.find((m) => m._id === id);

  if (!mascota) return;

  setMascotaSeleccionada(mascota);
  setModalAbierto(true);
};

  const handleDelete = async (id) => {
    const mascotasPrevias = mascotas;
    try {
      setDeletingId(id);
      setMascotas((prev) => prev.filter((m) => m._id !== id));
      await eliminarMascota(id);
    } catch (err) {
      console.error("Error al eliminar mascota:", err);

      const status = err?.response?.status;
      const mensajeBackend = err?.response?.data?.error;

     setMascotas(mascotasPrevias);

      if (status === 401) {
        setError(mensajeBackend || "Tu sesión expiró. Te estamos llevando al login…");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setError(mensajeBackend || "No se pudo eliminar la mascota. Intentá de nuevo.");
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className={styles.layout}>
      <Sidebar role="tutor" />

      <div className={styles.pageWrapper}>
        <TopBar title="Mis Mascotas" />

        <main className={styles.content}>
          <div className={styles.toolbar}>
            <p className={styles.countLabel}>
              {loading
                ? "Cargando mascotas…"
                : `${mascotas.length} ${mascotas.length === 1
                    ? "mascota registrada"
                    : "mascotas registradas"
                  }`}
            </p>
                <Button
                texto="+ Agregar Mascota"
                variante="primario"
                tamaño="mediano"
                 onClick={abrirModalNuevaMascota}
              />
          </div>

          {error && <div className={styles.errorBanner}>{error}</div>}
          {mensajeExito && (                                
            <div className={styles.successBanner}>{mensajeExito}</div>
          )}

          {loading ? (
            <div className={styles.grid}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={styles.skeletonCard} />
              ))}
            </div>
          ) : (
            <div className={styles.grid}>
              {mascotas.map((mascota) => (
                <div
                  key={mascota._id}
                  style={{
                    opacity: deletingId === mascota._id ? 0.5 : 1,
                    transition: "opacity 0.2s ease",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <MascotaCard
                    mascota={mascota}
                    onView={handleViewPet}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    eliminando={deletingId === mascota._id}
                  />
                </div>
              ))}
              <AddPetCard
                  onClick={abrirModalNuevaMascota}
                />
            </div>
          )}

          {!loading && mascotas.length === 0 && !error && (
            <p className={styles.emptyHint}>
              Todavía no registraste ninguna mascota. ¡Agregá la primera!
            </p>
          )}
        </main>


        {modalAbierto && (
          <Modal
            isOpen={modalAbierto}
            onClose={() => setModalAbierto(false)}
          >
            <FormularioMascota
              mascotaInicial={mascotaSeleccionada}
              onCancelar={() => setModalAbierto(false)}
              onGuardado={() => {
                setModalAbierto(false);
                cargarMascotas();
                 mostrarExito(                                    
                  mascotaSeleccionada
                    ? "¡Mascota actualizada correctamente!"
                    : "¡Mascota agregada correctamente!"
                );
                }}
            />
          </Modal>
        )}
      </div> 
    </div>  
  );
};

export default MisMascotas;