import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../../../services/api'
import Sidebar from '../../../components/layout/Sidebar'
import TopBar from '../../../components/layout/TopBar'
import Button from '../../../components/ui/button/Button'
import Card from '../../../components/ui/card/Card'
import Modal from '../../../components/layout/modal/Modal'
import FormularioFichaMedica from '../../../components/forms/FormularioFichaMedica'
import styles from './HistorialIndividual.module.css'

export default function HistorialIndividual() {
  const { mascotaId } = useParams()
  const navigate = useNavigate()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [modalAbierto, setModalAbierto] = useState(false)
  const [mensajeExito, setMensajeExito] = useState(null)

  const mostrarExito = (mensaje) => {
    setMensajeExito(mensaje)
    setTimeout(() => setMensajeExito(null), 3000)
  }

  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        const response = await api.get(`/historial-completo/${mascotaId}`)
        if (response.data.success) {
          setData(response.data.data)
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Error al cargar la ficha')
      } finally {
        setLoading(false)
      }
    }

    fetchHistorial()
  }, [mascotaId])

  if (loading) return <div className={styles.container}>Cargando...</div>
  if (error) return <div className={styles.container}><p>{error}</p></div>
  if (!data) return <div className={styles.container}>No hay datos</div>

  const { mascota, fichaMedica, vacunas, estudios } = data

  const calcularEdad = () => {
    if (!mascota?.fechaNacimiento) return 'N/A'
    const hoy = new Date()
    const nacimiento = new Date(mascota.fechaNacimiento)
    const años = hoy.getFullYear() - nacimiento.getFullYear()
    const meses = hoy.getMonth() - nacimiento.getMonth()

    if (meses < 0) return `${años - 1} años`
    return `${años} años`
  }

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopBar />
        <div className={styles.container}>

          {mensajeExito && <div className={styles.successBanner}>{mensajeExito}</div>}

          {/* Header */}
          <div className={styles.header}>
            <div className={styles.titleSection}>
              <h1 className={styles.titulo}>Historial Clínico - {mascota?.nombre}</h1>
              <p className={styles.subtitulo}>Tutor: {mascota?.dueñoId?.nombre || 'No registrado'}</p>
            </div>
            <div className={styles.actions}>
              <Button
                texto="Editar"
                variante="violeta"
                tamaño="mediano"
                onClick={() => setModalAbierto(true)}
              />
            </div>
          </div>

          {/* Info Cards */}
          <div className={styles.infoCards}>
            <Card>
              <p className={styles.cardLabel}>Peso Actual</p>
              <p className={styles.cardValue}>{mascota?.peso || 'N/A'} kg</p>
            </Card>
            <Card>
              <p className={styles.cardLabel}>Edad Actual</p>
              <p className={styles.cardValue}>{calcularEdad()}</p>
            </Card>
            <Card>
              <p className={styles.cardLabel}>Consultas Totales</p>
              <p className={styles.cardValue}>{(vacunas?.length || 0) + (estudios?.length || 0)}</p>
            </Card>
            <Card>
              <p className={styles.cardLabel}>Última Consulta</p>
              <p className={styles.cardValue}>
                {vacunas?.[0]?.fechaAplicada || estudios?.[0]?.fecha
                  ? formatearFecha(vacunas?.[0]?.fechaAplicada || estudios?.[0]?.fecha)
                  : 'N/A'
                }
              </p>
            </Card>
          </div>

          {/* Layout en 2 columnas: Ficha permanente (izq) | Vacunación + Estudios (der) */}
          <div className={styles.gridLayout}>

            {/* Columna izquierda */}
            <div className={styles.colIzquierda}>
              <section className={styles.section}>
                <h2 className={styles.sectionTitulo}>Ficha permanente</h2>
                <Card className={styles.fichaPermanente}>
                  <div className={styles.row}>
                    <div className={styles.field}>
                      <label>Fecha de nacimiento</label>
                      <p>{fichaMedica?.fechaNacimiento
                        ? formatearFecha(fichaMedica.fechaNacimiento)
                        : mascota?.fechaNacimiento
                        ? formatearFecha(mascota.fechaNacimiento)
                        : 'No registrada'
                      }</p>
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.field}>
                      <label>Especie / Raza</label>
                      <p>{mascota?.especie} · {mascota?.raza}</p>
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.field}>
                      <label>Color / Pelaje</label>
                      <p>{fichaMedica?.colorPelaje || 'No registrado'}</p>
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.field}>
                      <label>Microchip</label>
                      <p>{fichaMedica?.microchip || 'No registrado'}</p>
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.field}>
                      <label>Enfermedades crónicas</label>
                      <p>{fichaMedica?.enfermedadesCronicas || 'Ninguna registrada'}</p>
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.field}>
                      <label>Cirugías previas</label>
                      <p>{fichaMedica?.cirugiasPrevias || 'Ninguna registrada'}</p>
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.field}>
                      <label>Medicamentos habituales</label>
                      <p>{fichaMedica?.medicamentosHabituales || 'Ninguno'}</p>
                    </div>
                  </div>
                </Card>

                <div className={styles.verConsultasWrapper}>
                  <Button
                    texto="Ver Consultas"
                    variante="secundario"
                    tamaño="mediano"
                    // TODO: pendiente crear la página anterior/listado de consultas
                    onClick={() => navigate(-1)}
                  />
                </div>
              </section>
            </div>

            {/* Columna derecha */}
            <div className={styles.colDerecha}>
              {/* Registro de Vacunación */}
              <section className={styles.section}>
                <h2 className={styles.sectionTitulo}>Registro Vacunación</h2>
                {vacunas && vacunas.length > 0 ? (
                  <Card className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Vacuna</th>
                          <th>Aplicada</th>
                          <th>Veterinario</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vacunas.map((vacuna, idx) => (
                          <tr key={idx}>
                            <td>{vacuna.nombre}</td>
                            <td>{formatearFecha(vacuna.fechaAplicada)}</td>
                            <td>{vacuna.profesionalId?.nombre || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Card>
                ) : (
                  <Card>
                    <p className={styles.vacio}>Todavía no hay vacunas registradas.</p>
                  </Card>
                )}
              </section>

              {/* Estudios y Laboratorios */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitulo}>Estudios y Laboratorios</h2>
                  <Button
                    texto="Adjuntar nuevo estudio"
                    variante="secundario"
                    tamaño="chico"
                    // TODO: pendiente definir con Camila/equipo quién carga esto (tutor o veterinario)
                    // y el endpoint + Cloudinary antes de conectar este botón
                    onClick={() => {}}
                  />
                </div>
                {estudios && estudios.length > 0 ? (
                  <div className={styles.estudios}>
                    {estudios.map((estudio, idx) => (
                      <Card key={idx} className={styles.estudioCard}>
                        <h3>{estudio.nombre}</h3>
                        <p>{formatearFecha(estudio.fecha)} | {estudio.profesionalId?.nombre || 'N/A'}</p>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <p className={styles.vacio}>Todavía no hay estudios registrados.</p>
                  </Card>
                )}
              </section>
            </div>

          </div>

        </div>
      </div>

      {modalAbierto && (
        <Modal isOpen={modalAbierto} onClose={() => setModalAbierto(false)}>
          <FormularioFichaMedica
            mascotaId={mascotaId}
            fichaInicial={fichaMedica}
            onCancelar={() => setModalAbierto(false)}
            onGuardado={() => {
              setModalAbierto(false)
              api.get(`/historial-completo/${mascotaId}`).then((res) => {
                if (res.data.success) setData(res.data.data)
              })
              mostrarExito('¡Ficha médica actualizada correctamente!')
            }}
          />
        </Modal>
      )}
    </div>
  )
}