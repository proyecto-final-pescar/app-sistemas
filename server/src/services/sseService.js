
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
  for (const res of set) {
    res.write(`event: ${evento}\ndata: ${JSON.stringify(data)}\n\n`)
  }
}