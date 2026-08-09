import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../../../services/api'
import Sidebar from '../../../components/layout/Sidebar'
import TopBar from '../../../components/layout/TopBar'
import Badge from '../../../components/ui/badge/Badge'
import styles from './HistorialIndividual.module.css'
import Button from '../../../components/ui/button/Button'

export default function HistorialIndividual() {
  const { mascotaId } = useParams()
  const navigate = useNavigate()
  
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
  const fetchHistorial = async () => {
    try {
      const response = await api.get(`/historial-completo/${mascotaId}`)
      if (response.data.success) {
        setData(response.data.data)
        setLoading(false)
      }
    } catch (err) {
      console.error('Error:', err)
      setError(err.response?.data?.message || 'Error al cargar la ficha')
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
  
  let años = hoy.getFullYear() - nacimiento.getFullYear()
  let meses = hoy.getMonth() - nacimiento.getMonth()
  let dias = hoy.getDate() - nacimiento.getDate()

  if (dias < 0) {
    meses--
    dias += new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate()
  }

  if (meses < 0) {
    años--
    meses += 12
  }

  if (años > 0) {
    return `${años} año${años > 1 ? 's' : ''} ${meses} mes${meses !== 1 ? 'es' : ''}`
  } else if (meses > 0) {
    return `${meses} mes${meses !== 1 ? 'es' : ''}`
  } else {
    return `${dias} día${dias !== 1 ? 's' : ''}`
  }
}
  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
  <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#fff' }}>
    <Sidebar />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <TopBar />
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1>Ficha Médica - {mascota?.nombre}</h1>
          <p>Tutor: {mascota?.dueñoId?.name || 'No registrado'}</p>
        </div>

        {/* mascota*/}
        <div className={styles.mascotaCard}>
          <div className={styles.mascotaInfo}>
            <div className={styles.mascotaAvatar}>{mascota?.nombre?.charAt(0)}</div>
            <div className={styles.mascotaDetails}>
              <h2>{mascota?.nombre}</h2>
              <p>{mascota?.especie} · {mascota?.raza} · {mascota?.sexo}</p>
              <div className={styles.badges}>
                <Badge texto="Castrada" variante="secondary" />
                <Badge texto={`Pelaje: ${fichaMedica?.colorPelaje || 'No registrado'}`} variante="success" />
              </div>
            </div>
          </div>
          <div className={styles.responsable}>
            <p className={styles.responsableLabel}>RESPONSABLE</p>
            <p className={styles.responsableName}>{mascota?.dueñoId?.name}</p>
            <p className={styles.responsablePhone}>{mascota?.dueñoId?.telefono || 'N/A'}</p>
          </div>
        </div>

        {/*tarjetitas informacion */}
        <div className={styles.cardsGrid}>
          <div className={styles.card}>
            <svg className={styles.cardIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p className={styles.cardValue}>{mascota?.peso} kg</p>
            <p className={styles.cardLabel}>Peso Actual</p>
          </div>
          <div className={styles.card}>
            <svg className={styles.cardIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className={styles.cardValue}>{calcularEdad()}</p>
            <p className={styles.cardLabel}>Edad Actual</p>
          </div>
          <div className={styles.card}>
            <svg className={styles.cardIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className={styles.cardValue}>{(vacunas?.length || 0) + (estudios?.length || 0)}</p>
            <p className={styles.cardLabel}>Consultas Totales</p>
          </div>
          <div className={styles.card}>
            <svg className={styles.cardIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className={styles.cardValue}>{vacunas?.[0]?.fechaAplicada || estudios?.[0]?.fecha ? formatearFecha(vacunas?.[0]?.fechaAplicada || estudios?.[0]?.fecha) : 'N/A'}</p>
            <p className={styles.cardLabel}>Última Consulta</p>
          </div>
        </div>

        <div className={styles.contentGrid}>
          {/* Ficha Permanente */}
          <section className={styles.section}>
            <h2>Ficha permanente</h2>
            <div className={styles.fichaPermanente}>
              <div className={styles.row}>
                <label>Fecha de nacimiento</label>
                <p>{fichaMedica?.fechaNacimiento ? formatearFecha(fichaMedica.fechaNacimiento) : mascota?.fechaNacimiento ? formatearFecha(mascota.fechaNacimiento) : 'No registrada'}</p>
              </div>
              <div className={styles.row}>
                <label>Especie / Raza</label>
                <p>{mascota?.especie} · {mascota?.raza}</p>
              </div>
              <div className={styles.row}>
                <label>Color / Pelaje</label>
                <p>{fichaMedica?.colorPelaje || 'No registrado'}</p>
              </div>
              <div className={styles.row}>
                <label>Microchip</label>
                <p>{fichaMedica?.microchip || 'No registrado'}</p>
              </div>
              <div className={styles.row}>
                <label>Enfermedades crónicas</label>
                <p>{fichaMedica?.enfermedadesCronicas || 'Ninguna registrada'}</p>
              </div>
              <div className={styles.row}>
                <label>Cirugías previas</label>
                <p>{fichaMedica?.cirugiasPrevias || 'Ninguna registrada'}</p>
              </div>
              <div className={styles.row}>
                <label>Medicamentos habituales</label>
                <p>{fichaMedica?.medicamentosHabituales || 'Ninguno'}</p>
              </div>
              {/* Botón Ver Consultas */}
              <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'center' }}>
                <button 
                  onClick={() => navigate(-1)}
                  style={{
                    padding: '0.75rem 2rem',
                    backgroundColor: '#7c3aed',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '999px',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Volver a Consultas
                </button>
              </div>
            </div>
          </section>

          {/* Vacunacion y Estudios */}
          <div className={styles.rightColumn}>
            {/* Vacunas */}
            <section className={styles.section}>
              <h2>Registro de Vacunación</h2>
              {vacunas && vacunas.length > 0 ? (
                <div className={styles.vacunasTable}>
                  {vacunas.map((vacuna, idx) => (
                    <div key={idx} className={styles.vacunaRow}>
                      <span className={styles.vacunaNombre}>{vacuna.nombre}</span>
                      <span className={styles.vacunaFecha}>Aplicada: {formatearFecha(vacuna.fechaAplicada)}</span>
                      <span className={styles.vacunaVet}>Dra. {vacuna.profesionalId?.nombre || 'N/A'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.emptyState}>Todavía no hay vacunas registradas.</p>
              )}
            </section>

            {/* Estudios */}
            <section className={styles.section}>
              <h2>Estudios</h2>
              {estudios && estudios.length > 0 ? (
                <div className={styles.estudios}>
                  {estudios.map((estudio, idx) => (
                    <div key={idx} className={styles.estudioCard}>
                      <h3>{estudio.nombre}</h3>
                      <p>{formatearFecha(estudio.fecha)} · {estudio.profesionalId?.nombre || 'N/A'}</p>
                      <a href="#" className={styles.verResultado}>Ver resultado</a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.emptyState}>Todavía no hay estudios registrados.</p>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  </div>
)}