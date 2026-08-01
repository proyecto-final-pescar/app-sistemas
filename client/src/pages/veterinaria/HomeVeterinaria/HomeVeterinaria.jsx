import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { obtenerMiVeterinaria } from "../../../services/veterinariaService";
import { obtenerTurnosPorVeterinaria } from "../../../services/turnosService";
import { obtenerDisponibilidadPorFecha } from "../../../services/disponibilidadService";

import Sidebar from "../../../components/layout/Sidebar";
import TopBar from "../../../components/layout/TopBar";
import Card from "../../../components/ui/card/Card";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/ui/input/Input";

import styles from "./HomeVeterinaria.module.css";

const HomeVeterinaria = () => {
  const { usuario } = useAuth();
  const [nombreVet, setNombreVet] = useState(usuario?.nombre || "Cargando...");
  const [proximoTurno, setProximoTurno] = useState(null);
  const [consultasHoy, setConsultasHoy] = useState(0);
  const [cuposLibres, setCuposLibres] = useState(0);
  const [loading, setLoading] = useState(true);

  const formatearFechaLocal = (fechaInput) => {
    if (!fechaInput) return "";

    let fecha;

    if (typeof fechaInput === "string") {
      const soloFecha = fechaInput.split("T")[0];
      const [anio, mes, dia] = soloFecha.split("-").map(Number);
      fecha = new Date(anio, mes - 1, dia, 12, 0, 0); // Ajuste de hora para evitar desfase
    } else {
      fecha = new Date(fechaInput);
    }

    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
  };

  useEffect(() => {
    async function cargarDatosHome() {
      if (!usuario) return;

      try {
        setLoading(true);
        const miVet = await obtenerMiVeterinaria();
        if (miVet && miVet.nombre) {
          setNombreVet(miVet.nombre);
        }

        const vetId = miVet?._id;
        if (!vetId) return;

        const fechaHoyStr = formatearFechaLocal(new Date());

        const todosLosTurnos = await obtenerTurnosPorVeterinaria(vetId);

        const pendientes = todosLosTurnos.filter(
          (t) => t.estado === "pendiente" || t.estado === "confirmado",
        );
        if (pendientes.length > 0) {
          setProximoTurno(pendientes[0]);
        }

        const hoyTurnos = todosLosTurnos.filter((t) => {
          const fechaTurno = formatearFechaLocal(t.fecha);
          return fechaTurno === fechaHoyStr;
        });
        setConsultasHoy(hoyTurnos.length);

        const resDispo = await obtenerDisponibilidadPorFecha(
          vetId,
          fechaHoyStr,
        );
        if (resDispo?.success) {
          setCuposLibres(resDispo.data.totalDisponibles);
        }
      } catch (error) {
        console.error("Error cargando las métricas del Home:", error);
        if (usuario?.nombre) {
          setNombreVet(usuario.nombre);
        }
      } finally {
        setLoading(false);
      }
    }

    cargarDatosHome();
  }, [usuario]);

  // Formateador de fechas interno para la vista del turno
  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return "";

    let fecha;
    if (typeof fechaStr === "string") {
      const soloFecha = fechaStr.split("T")[0]; // Toma "2026-07-23"
      const [anio, mes, dia] = soloFecha.split("-").map(Number);
      fecha = new Date(anio, mes - 1, dia, 12, 0, 0);
    } else {
      fecha = new Date(fechaStr);
    }

    const opciones = { weekday: "long", day: "numeric", month: "long" };
    return fecha.toLocaleDateString("es-AR", opciones);
  };

  return (
    <div className={styles.shell}>
      {/* Sidebar lateral izquierdo */}
      <Sidebar role="veterinaria" />

      <div className={styles.main}>
        {/* Barra superior con el título y perfil */}
        <TopBar
          title="Home"
          notifications={2}
          userInitial={usuario?.nombre?.charAt(0)}
        />

        {/* Contenido de Home */}
        <div className={styles.contentWrap}>
          {/* Panel de Bienvenida */}
          <div className={styles.welcomePanel}>
            <h1 className={styles.welcomeTitle}>Hola, {nombreVet}</h1>
            <p className={styles.welcomeDate}>
              {new Date().toLocaleDateString("es-AR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>

            <div className={styles.searchBarRow}>
              <div className={styles.inputSearchContainer}>
                <Input placeholder="Buscar por nombre del dueño..." />
              </div>
              <Button texto="Buscar" variante="primario" tamaño="mediano" />
            </div>

            <div className={styles.actionButtonsRow}>
              <Link to="/cargar-turnos">
                <Button
                  texto="Cargar turnos"
                  variante="secundario"
                  tamaño="mediano"
                />
              </Link>
              <Link to="/agenda">
                <Button
                  texto="Ver agenda"
                  variante="primario"
                  tamaño="mediano"
                />
              </Link>
            </div>
          </div>

          {/* Grilla de Tarjetas */}
          <div className={styles.cardsGrid}>
            {/* Próximo Turno */}
            <Card className={styles.metricCard}>
              <div className={styles.cardHeader}>
                <span className={styles.icon}>📅</span>
                <h3>Próximo turno</h3>
              </div>
              {proximoTurno ? (
                <div className={styles.cardBody}>
                  <h4 className={styles.mainDetail}>
                    {proximoTurno.mascotaId?.nombre || "Mascota"}
                  </h4>
                  <p className={styles.subDetail}>{proximoTurno.motivo}</p>
                  <p className={styles.timeDetail}>
                    {formatearFecha(proximoTurno.fecha)} · {proximoTurno.hora}{" "}
                    hs
                  </p>
                </div>
              ) : (
                <p className={styles.emptyText}>
                  No hay turnos próximos agendados.
                </p>
              )}
              <Link to="/turnos-veterinaria" className={styles.cardLink}>
                Ver detalle →
              </Link>
            </Card>

            {/* Historial */}
            <Card className={styles.metricCard}>
              <div className={styles.cardHeader}>
                <span className={styles.icon}>📄</span>
                <h3>Historial</h3>
              </div>
              <div className={styles.cardBody}>
                <h4 className={styles.mainNumber}>{consultasHoy}</h4>
                <p className={styles.subDetail}>consultas registradas hoy</p>
              </div>
              <Link to="/historial-clinico" className={styles.cardLink}>
                Ver historial completo →
              </Link>
            </Card>

            {/* Disponibilidad */}
            <Card className={styles.metricCard}>
              <div className={styles.cardHeader}>
                <span className={styles.icon}>🕒</span>
                <h3>Disponibilidad</h3>
              </div>
              <div className={styles.cardBody}>
                <h4 className={styles.mainNumber}>{cuposLibres}</h4>
                <p className={styles.subDetail}>horarios libres hoy</p>
              </div>
              <Link to="cargar-turnos" className={styles.cardLink}>
                Cargar más turnos →
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeVeterinaria;
