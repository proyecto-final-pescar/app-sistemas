import { useMemo, useState } from "react";
import { Eye, KeyRound } from "lucide-react";

import Sidebar from "../../../components/layout/Sidebar";
import TopBar from "../../../components/layout/TopBar";

import styles from "./GestionUsuarios.module.css";

const usuariosIniciales = [
  {
    id: "D-1029",
    nombre: "Juan Pérez",
    email: "juan.perez@email.com",
    telefono: "+54 11 1234-5678",
    mascotas: 2,
    fechaRegistro: "12/03/2026",
    ultimoIngreso: "29/05/2026",
    turnosProximos: 2,
    turnosPasados: 5,
    activo: true,
  },
  {
    id: "D-1030",
    nombre: "María Gómez",
    email: "maria.g@email.com",
    telefono: "+54 11 9876-5432",
    mascotas: 0,
    fechaRegistro: "15/04/2026",
    ultimoIngreso: "30/05/2026",
    turnosProximos: 0,
    turnosPasados: 2,
    activo: false,
  },
  {
    id: "D-1031",
    nombre: "Carlos Ruiz",
    email: "carlos.r88@email.com",
    telefono: "+54 11 4455-6677",
    mascotas: 1,
    fechaRegistro: "12/03/2026",
    ultimoIngreso: "29/05/2026",
    turnosProximos: 2,
    turnosPasados: 10,
    activo: true,
  },
  {
    id: "D-1032",
    nombre: "Laura Fernández",
    email: "laura.fernandez@email.com",
    telefono: "+54 11 2233-4455",
    mascotas: 1,
    fechaRegistro: "18/03/2026",
    ultimoIngreso: "01/06/2026",
    turnosProximos: 1,
    turnosPasados: 4,
    activo: true,
  },
  {
    id: "D-1033",
    nombre: "Martín López",
    email: "martin.lopez@email.com",
    telefono: "+54 11 7788-9900",
    mascotas: 3,
    fechaRegistro: "20/03/2026",
    ultimoIngreso: "02/06/2026",
    turnosProximos: 1,
    turnosPasados: 7,
    activo: true,
  },
  {
    id: "D-1034",
    nombre: "Sofía Martínez",
    email: "sofia.martinez@email.com",
    telefono: "+54 11 5544-3322",
    mascotas: 2,
    fechaRegistro: "22/03/2026",
    ultimoIngreso: "03/06/2026",
    turnosProximos: 2,
    turnosPasados: 6,
    activo: false,
  },
  {
    id: "D-1035",
    nombre: "Diego Ramírez",
    email: "diego.ramirez@email.com",
    telefono: "+54 11 6655-4433",
    mascotas: 1,
    fechaRegistro: "25/03/2026",
    ultimoIngreso: "04/06/2026",
    turnosProximos: 0,
    turnosPasados: 3,
    activo: true,
  },
  {
    id: "D-1036",
    nombre: "Valentina Torres",
    email: "valentina.torres@email.com",
    telefono: "+54 11 8877-6655",
    mascotas: 4,
    fechaRegistro: "27/03/2026",
    ultimoIngreso: "05/06/2026",
    turnosProximos: 3,
    turnosPasados: 9,
    activo: true,
  },
  {
    id: "D-1037",
    nombre: "Federico Castro",
    email: "federico.castro@email.com",
    telefono: "+54 11 3344-5566",
    mascotas: 1,
    fechaRegistro: "30/03/2026",
    ultimoIngreso: "06/06/2026",
    turnosProximos: 1,
    turnosPasados: 2,
    activo: false,
  },
  {
    id: "D-1038",
    nombre: "Camila Sánchez",
    email: "camila.sanchez@email.com",
    telefono: "+54 11 1122-3344",
    mascotas: 2,
    fechaRegistro: "02/04/2026",
    ultimoIngreso: "07/06/2026",
    turnosProximos: 2,
    turnosPasados: 8,
    activo: true,
  },
  {
    id: "D-1039",
    nombre: "Nicolás Herrera",
    email: "nicolas.herrera@email.com",
    telefono: "+54 11 9988-7766",
    mascotas: 0,
    fechaRegistro: "05/04/2026",
    ultimoIngreso: "08/06/2026",
    turnosProximos: 0,
    turnosPasados: 1,
    activo: true,
  },
  {
    id: "D-1040",
    nombre: "Julieta Acosta",
    email: "julieta.acosta@email.com",
    telefono: "+54 11 4466-8800",
    mascotas: 3,
    fechaRegistro: "08/04/2026",
    ultimoIngreso: "09/06/2026",
    turnosProximos: 1,
    turnosPasados: 5,
    activo: false,
  },
];

function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState(usuariosIniciales);
  const [busqueda, setBusqueda] = useState("");
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroEmail, setFiltroEmail] = useState("");
  const [filtroTelefono, setFiltroTelefono] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);

  const usuariosPorPagina = 4;

  const usuariosFiltrados = useMemo(() => {
    const textoBusqueda = busqueda.trim().toLowerCase();

    return usuarios.filter((usuario) => {
      const coincideBusqueda =
        !textoBusqueda ||
        usuario.nombre.toLowerCase().includes(textoBusqueda) ||
        usuario.email.toLowerCase().includes(textoBusqueda);

      const coincideNombre =
        !filtroNombre ||
        usuario.nombre.toLowerCase().includes(filtroNombre.toLowerCase());

      const coincideEmail =
        !filtroEmail ||
        usuario.email.toLowerCase().includes(filtroEmail.toLowerCase());

      const coincideTelefono =
        !filtroTelefono || usuario.telefono.includes(filtroTelefono);

      const coincideEstado =
        !filtroEstado ||
        (filtroEstado === "activo" && usuario.activo) ||
        (filtroEstado === "inactivo" && !usuario.activo);

      return (
        coincideBusqueda &&
        coincideNombre &&
        coincideEmail &&
        coincideTelefono &&
        coincideEstado
      );
    });
  }, [
    usuarios,
    busqueda,
    filtroNombre,
    filtroEmail,
    filtroTelefono,
    filtroEstado,
  ]);

  const totalPaginas = Math.ceil(
    usuariosFiltrados.length / usuariosPorPagina
  );

  const indiceUltimoUsuario = paginaActual * usuariosPorPagina;
  const indicePrimerUsuario = indiceUltimoUsuario - usuariosPorPagina;

  const usuariosPaginados = usuariosFiltrados.slice(
    indicePrimerUsuario,
    indiceUltimoUsuario
  );

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
  };

  const irPaginaAnterior = () => {
    setPaginaActual((pagina) => Math.max(pagina - 1, 1));
  };

  const irPaginaSiguiente = () => {
    setPaginaActual((pagina) => Math.min(pagina + 1, totalPaginas));
  };

  const reiniciarPagina = () => {
    setPaginaActual(1);
  };

  const cambiarEstado = (id) => {
    setUsuarios((usuariosActuales) =>
      usuariosActuales.map((usuario) =>
        usuario.id === id
          ? { ...usuario, activo: !usuario.activo }
          : usuario
      )
    );
  };

  const exportarCSV = () => {
    const encabezados = [
      "ID",
      "Nombre",
      "Email",
      "Teléfono",
      "Mascotas",
      "Registro",
      "Último ingreso",
      "Turnos próximos",
      "Turnos pasados",
      "Estado",
    ];

    const filas = usuariosFiltrados.map((usuario) => [
      usuario.id,
      usuario.nombre,
      usuario.email,
      usuario.telefono,
      usuario.mascotas,
      usuario.fechaRegistro,
      usuario.ultimoIngreso,
      usuario.turnosProximos,
      usuario.turnosPasados,
      usuario.activo ? "Activo" : "Inactivo",
    ]);

    const contenidoCSV = [encabezados, ...filas]
      .map((fila) =>
        fila
          .map((valor) => `"${String(valor).replaceAll('"', '""')}"`)
          .join(",")
      )
      .join("\n");

    const archivo = new Blob([contenidoCSV], {
      type: "text/csv;charset=utf-8;",
    });

    const enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(archivo);
    enlace.download = "gestion-duenos.csv";
    enlace.click();

    URL.revokeObjectURL(enlace.href);
  };

  return (
    <div className={styles.page}>
      <Sidebar role="administrador" activeItem="Dueños" />

      <div className={styles.main}>
        <TopBar
          title="Gestión de Dueños"
          subtitle="Domingo, 26 de julio de 2026"
          notifications={2}
        />

        <main className={styles.content}>
          <section className={styles.toolbar}>
            <div className={styles.searchBox}>
              <span aria-hidden="true">⌕</span>

              <input
                type="search"
                placeholder="Buscar por nombre o email..."
                value={busqueda}
                onChange={(evento) => {
                  setBusqueda(evento.target.value);
                  reiniciarPagina();
                }}
              />
            </div>

            <button
              type="button"
              className={styles.exportButton}
              onClick={exportarCSV}
            >
              Exportar CSV
            </button>
          </section>

          <section className={styles.filters}>
            <span className={styles.filtersLabel}>
              <span aria-hidden="true">▽</span>
              Filtros Avanzados:
            </span>

            <input
              type="text"
              placeholder="Nombre"
              value={filtroNombre}
              onChange={(evento) => {
                setFiltroNombre(evento.target.value);
                reiniciarPagina();
              }}
            />

            <input
              type="email"
              placeholder="Email"
              value={filtroEmail}
              onChange={(evento) => {
                setFiltroEmail(evento.target.value);
                reiniciarPagina();
              }}
            />

            <input
              type="text"
              placeholder="Teléfono"
              value={filtroTelefono}
              onChange={(evento) => {
                setFiltroTelefono(evento.target.value);
                reiniciarPagina();
              }}
            />

            <select
              value={filtroEstado}
              onChange={(evento) => {
                setFiltroEstado(evento.target.value);
                reiniciarPagina();
              }}
            >
              <option value="">Estado</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </section>

          <section className={styles.tableCard}>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Contacto</th>
                    <th>Mascotas</th>
                    <th>
                      Registro
                      <br />
                      Últ. Ingreso
                    </th>
                    <th>
                      Turnos
                      <br />
                      (Próx | Pas)
                    </th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {usuariosPaginados.map((usuario) => (
                    <tr key={usuario.id}>
                      <td>{usuario.id}</td>

                      <td>{usuario.nombre}</td>

                      <td>
                        <span>{usuario.email}</span>
                        <span>{usuario.telefono}</span>
                      </td>

                      <td>
                        <span className={styles.petCount}>
                          {usuario.mascotas}
                        </span>
                      </td>

                      <td>
                        <span>{usuario.fechaRegistro}</span>
                        <span>{usuario.ultimoIngreso}</span>
                      </td>

                      <td>
                        {usuario.turnosProximos} | {usuario.turnosPasados}
                      </td>

                      <td>
                        <button
                          type="button"
                          className={`${styles.toggle} ${
                            usuario.activo ? styles.toggleActive : ""
                          }`}
                          onClick={() => cambiarEstado(usuario.id)}
                          aria-label={
                            usuario.activo
                              ? `Desactivar a ${usuario.nombre}`
                              : `Activar a ${usuario.nombre}`
                          }
                        >
                          <span />
                        </button>
                      </td>

                      <td>
                        <div className={styles.actions}>
                         <button
                     type="button"
                     aria-label={`Ver información de ${usuario.nombre}`}
                     title="Ver información"
                    >
                    <Eye size={17} />
                    </button>

                <button
                  type="button"
                    aria-label={`Gestionar acceso de ${usuario.nombre}`}
                    title="Gestionar acceso"
                    >
                <KeyRound size={17} />
                </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {usuariosFiltrados.length === 0 && (
                <p className={styles.emptyState}>
                  No se encontraron dueños con esos filtros.
                </p>
              )}
            </div>

            {usuariosFiltrados.length > 0 && (
              <div className={styles.pagination}>
                <button
                  type="button"
                  onClick={irPaginaAnterior}
                  disabled={paginaActual === 1}
                >
                  ← Anterior
                </button>

                {Array.from({ length: totalPaginas }, (_, indice) => {
                  const numeroPagina = indice + 1;

                  return (
                    <button
                      type="button"
                      key={numeroPagina}
                      onClick={() => cambiarPagina(numeroPagina)}
                      className={
                        paginaActual === numeroPagina
                          ? styles.activePage
                          : ""
                      }
                    >
                      {numeroPagina}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={irPaginaSiguiente}
                  disabled={paginaActual === totalPaginas}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default GestionUsuarios;