const conexiones = new Map()

export const agregarConexion = (usuarioId, res) => {
  if (!conexiones.has(usuarioId)) conexiones.set(usuarioId, new Set())
  conexiones.get(usuarioId).add(res)
}

export const quitarConexion = (usuarioId, res) => {
  const set = conexiones.get(usuarioId)
  if (!set) return
  set.delete(res)
  if (set.size === 0) conexiones.delete(usuarioId)
}

export const emitirAUsuario = (usuarioId, evento, data) => {
  const set = conexiones.get(usuarioId)
  if (!set) return

  // Se serializa una sola vez, aunque el usuario tenga varias pestañas abiertas
  const mensaje = `event: ${evento}\ndata: ${JSON.stringify(data)}\n\n`

  // Copia del Set porque quitarConexion lo modifica mientras iteramos
  for (const res of [...set]) {
    try {
      res.write(mensaje)
    } catch (error) {
      // Conexión muerta: se descarta y no afecta al resto ni a quien emitió
      quitarConexion(usuarioId, res)
    }
  }
}