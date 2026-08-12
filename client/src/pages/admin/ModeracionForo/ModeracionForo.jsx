import { useEffect, useState } from "react";
import Sidebar from "../../../components/layout/Sidebar";
import TopBar from "../../../components/layout/TopBar";
import ModeracionDeForoModal from "../../../components/administrador/moderacionDeForoModal/moderacionDeForoModal";
import {
    obtenerPublicacionesConReportes
} from "../../../services/publicacionesService";
import styles from "./ModeracionForo.module.css";

export default function ModeracionForo() {
    const [publicaciones, setPublicaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filtroZona, setFiltroZona] = useState("");
    const [filtroReportes, setFiltroReportes] = useState("");
    const [paginaActual, setPaginaActual] = useState(1);
    const [publicacionSeleccionada, setPublicacionSeleccionada] = useState(null);
    const ITEMS_POR_PAGINA = 10;

    const cargar = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await obtenerPublicacionesConReportes();
            setPublicaciones(data);
        } catch (err) {
            setError("No se pudieron cargar las publicaciones. Intentá de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargar();
    }, []);

    // Filtros aplicados en el cliente
    const publicacionesFiltradas = publicaciones.filter((item) => {
        const pub = item.publicacion;
        if (!pub) return false;

        const coincideZona = filtroZona
            ? pub.zona?.toLowerCase().includes(filtroZona.toLowerCase())
            : true;

        const coincideReportes = (() => {
            if (!filtroReportes) return true;
            const cantidad = item.cantidadReportes;
            if (filtroReportes === "1-5") return cantidad >= 1 && cantidad <= 5;
            if (filtroReportes === "6-10") return cantidad >= 6 && cantidad <= 10;
            if (filtroReportes === "10+") return cantidad > 10;
            return true;
        })();

        return coincideZona && coincideReportes;
    });

    const totalPaginas = Math.ceil(publicacionesFiltradas.length / ITEMS_POR_PAGINA);

    const publicacionesPaginadas = publicacionesFiltradas.slice(
        (paginaActual - 1) * ITEMS_POR_PAGINA,
        paginaActual * ITEMS_POR_PAGINA
    );

    const handleVerDetalle = (item) => {
        setPublicacionSeleccionada({
            ...item.publicacion,
            cantidadReportes: item.cantidadReportes,
        });
    };

    const handleCerrarModal = () => {
        setPublicacionSeleccionada(null);
    };

    const handleSuccessModeracion = () => {
        cargar();
    };

    return (
        <div className={styles.shell}>
            <Sidebar title="Moderación de Foro" />
            
            <div className={styles.main}>
                <TopBar title="Moderación de Foro" />

                <div className={styles.content}>

                    {/* Filtros */}
                    <div className={styles.filtros}>
                        <span className={styles.filtrosLabel}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
                            Filtrar por:
                        </span>
                        <select
                            className={styles.select}
                            value={filtroReportes}
                            onChange={(e) => { setFiltroReportes(e.target.value); setPaginaActual(1); }} // cambiado
                        >
                            <option value="">Reportes</option>
                            <option value="1-5">1 a 5 reportes</option>
                            <option value="6-10">6 a 10 reportes</option>
                            <option value="10+">Más de 10 reportes</option>
                        </select>
                        <input
                            type="text"
                            placeholder="Zona (Ej. Palermo)"
                            className={styles.inputZona}
                            value={filtroZona}
                            onChange={(e) => { setFiltroZona(e.target.value); setPaginaActual(1); }} // cambiado
                        />
                    </div>

                    {/* Tabla */}
                    <div className={styles.tablaWrapper}>
                        <table className={styles.tabla}>
                            <thead>
                                <tr>
                                    <th>Foto</th>
                                    <th>Mascota / Título</th>
                                    <th>Zona</th>
                                    <th>Creador</th>
                                    <th>Reportes</th>
                                    <th>Fecha de publicación</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr>
                                        <td colSpan="7" className={styles.estadoVacio}>
                                            Cargando publicaciones...
                                        </td>
                                    </tr>
                                )}
                                {!loading && error && (
                                    <tr>
                                        <td colSpan="9" className={styles.estadoVacio}>{error}</td>
                                    </tr>
                                )}
                                {!loading && !error && publicacionesFiltradas.length === 0 && (
                                    <tr>
                                        <td colSpan="9" className={styles.estadoVacio}>
                                            No hay publicaciones con reportes para mostrar.
                                        </td>
                                    </tr>
                                )}
                                {!loading && !error && publicacionesPaginadas.map((item) => {
                                    const pub = item.publicacion;
                                    const fecha = pub?.createdAt
                                        ? new Date(pub.createdAt).toLocaleDateString("es-AR")
                                        : "-";

                                    return (
                                        <tr key={item.publicacionId}>
                                            <td>
                                                {pub?.foto ? (
                                                    <img
                                                        src={pub.foto}
                                                        alt={pub.nombre || "Mascota"}
                                                        className={styles.foto}
                                                    />
                                                ) : (
                                                    <div className={styles.fotoPlaceholder}>🐾</div>
                                                )}
                                            </td>
                                            <td className={styles.nombreCell}>
                                                {pub?.nombre || "Sin nombre"}
                                            </td>
                                            <td>{pub?.zona || "-"}</td>
                                            <td className={styles.creadorCell}>
                                                {pub?.usuarioId?.name || "Usuario"}<br />
                                                <span className={styles.creadorId}>
                                                    (OW-{pub?.usuarioId?._id?.toString().slice(-3).toUpperCase()})
                                                </span>
                                            </td>
                                            <td>
                                                <span className={styles.badgeReportes}>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                                    {item.cantidadReportes}
                                                </span>
                                            </td>
                                            <td>{fecha}</td>
                                            <td>
                                                <div className={styles.acciones}>
                                                    <button
                                                        className={styles.btnIcono}
                                                        title="Ver detalle"
                                                        onClick={() => handleVerDetalle(item)}
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginación placeholder */}
                    <div className={styles.paginacion}>
                        <button
                            className={styles.btnPag}
                            onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
                            disabled={paginaActual === 1}
                        >
                            ← Anterior
                        </button>

                        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                            <button
                                key={num}
                                className={`${styles.btnPag} ${paginaActual === num ? styles.btnPagActivo : ""}`}
                                onClick={() => setPaginaActual(num)}
                            >
                                {num}
                            </button>
                        ))}

                        <button
                            className={styles.btnPag}
                            onClick={() => setPaginaActual((p) => Math.min(p + 1, totalPaginas))}
                            disabled={paginaActual === totalPaginas || totalPaginas === 0}
                        >
                            Siguiente →
                        </button>
                    </div>

                </div>
            </div>

            {publicacionSeleccionada && (
                <ModeracionDeForoModal
                    publicacion={publicacionSeleccionada}
                    onClose={handleCerrarModal}
                    onSuccess={handleSuccessModeracion}
                />
            )}
        </div>
    );
}