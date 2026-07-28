import { useEffect, useState } from "react";
import Sidebar from "../../../components/layout/Sidebar";
import TopBar from "../../../components/layout/TopBar";
import ConfirmModal from "../../../components/ui/confirm-modal/ConfirmModal";
import {
    obtenerPublicacionesConReportes,
    eliminarPublicacion,
} from "../../../services/publicacionesService";
import styles from "./ModeracionForo.module.css";

export default function ModeracionForo() {
    const [publicaciones, setPublicaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("");
    const [filtroZona, setFiltroZona] = useState("");
    const [modalBaja, setModalBaja] = useState(null);
    const [eliminando, setEliminando] = useState(false);
    const [filtroReportes, setFiltroReportes] = useState("");
    const [paginaActual, setPaginaActual] = useState(1);
    const ITEMS_POR_PAGINA = 10;

    useEffect(() => {
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
        cargar();
    }, []);

    const handleEliminar = async () => {
        if (!modalBaja) return;
        setEliminando(true);
        try {
            await eliminarPublicacion(modalBaja);
            setPublicaciones((prev) =>
                prev.filter((p) => p.publicacionId?.toString() !== modalBaja)
            );
            setModalBaja(null);
        } catch (err) {
            setError("No se pudo dar de baja la publicación.");
            setModalBaja(null);
        } finally {
            setEliminando(false);
        }
    };

    // Filtros aplicados en el cliente
    const publicacionesFiltradas = publicaciones.filter((item) => {
        const pub = item.publicacion;
        if (!pub) return false;

        const coincideBusqueda = busqueda
            ? pub.nombre?.toLowerCase().includes(busqueda.toLowerCase())
            : true;

        const coincideEstado = filtroEstado
            ? pub.estado === filtroEstado
            : true;

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

        return coincideBusqueda && coincideEstado && coincideZona && coincideReportes;
    });

    const totalPaginas = Math.ceil(publicacionesFiltradas.length / ITEMS_POR_PAGINA);

    const publicacionesPaginadas = publicacionesFiltradas.slice(
        (paginaActual - 1) * ITEMS_POR_PAGINA,
        paginaActual * ITEMS_POR_PAGINA
    );

    return (
        <div className={styles.shell}>
            <Sidebar />
            <div className={styles.main}>
                <TopBar title="Moderación de Foro" />

                <div className={styles.content}>

                    {/* Barra superior */}
                    <div className={styles.topBar}>
                        <button className={styles.btnReportes}>
                            Bandeja de entrada de Reportes
                        </button>
                        <input
                            type="text"
                            placeholder="Buscar publicación..."
                            className={styles.buscador}
                            value={busqueda}
                            onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }}
                        />
                    </div>

                    {/* Filtros */}
                    <div className={styles.filtros}>
                        <span className={styles.filtrosLabel}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
                            Filtrar por:
                        </span>
                        <select
                            className={styles.select}
                            value={filtroEstado}
                            onChange={(e) => { setFiltroEstado(e.target.value); setPaginaActual(1); }}
                        >
                            <option value="">Estado</option>
                            <option value="activa">Activa</option>
                            <option value="cerrada">Cerrada</option>
                        </select>
                        <select
                            className={styles.select}
                            value={filtroReportes}
                            onChange={(e) => { setFiltroZona(e.target.value); setPaginaActual(1); }}
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
                            onChange={(e) => { setFiltroReportes(e.target.value); setPaginaActual(1); }}
                        />
                    </div>

                    {/* Tabla */}
                    <div className={styles.tablaWrapper}>
                        <table className={styles.tabla}>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Foto</th>
                                    <th>Mascota / Título</th>
                                    <th>Zona</th>
                                    <th>Creador</th>
                                    <th>Reportes</th>
                                    <th>Estado</th>
                                    <th>Fecha de publicación</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr>
                                        <td colSpan="9" className={styles.estadoVacio}>
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
                                            <td className={styles.idCell}>
                                                PUB-{item.publicacionId?.toString().slice(-4).toUpperCase()}
                                            </td>
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
                                            <td>
                                                <span className={`${styles.badge} ${pub?.estado === "activa" ? styles.badgeActiva : styles.badgeCerrada}`}>
                                                    {pub?.estado === "activa" ? "Activa" : "Cerrada"}
                                                </span>
                                            </td>
                                            <td>{fecha}</td>
                                            <td>
                                                <div className={styles.acciones}>
                                                    {/* Placeholder — lo implementa el otro integrante */}
                                                    <button className={styles.btnIcono} title="Dar de baja" onClick={() => setModalBaja(item.publicacionId?.toString())}>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <circle cx="12" cy="12" r="10" />
                                                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                                                        </svg>
                                                    </button>
                                                    {/* Placeholder — lo implementa el otro integrante */}
                                                    <button className={styles.btnIcono} title="Ver detalle">
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

            <ConfirmModal
                abierto={modalBaja !== null}
                titulo="¿Dar de baja esta publicación?"
                mensaje="Esta acción eliminará la publicación permanentemente. No se puede deshacer."
                textoConfirmar="Sí, dar de baja"
                textoCancelar="Cancelar"
                varianteConfirmar="peligro"
                onConfirm={handleEliminar}
                onCancel={() => setModalBaja(null)}
                confirmando={eliminando}
            />
        </div>
    );
}