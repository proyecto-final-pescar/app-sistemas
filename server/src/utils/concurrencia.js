
export const mapConLimite = async (items, limite, fn) => {
  const resultados = new Array(items.length)
  let indice = 0

  const worker = async () => {
    while (indice < items.length) {
      const actual = indice++
      resultados[actual] = await fn(items[actual], actual)
    }
  }

  const cantidadWorkers = Math.min(limite, items.length)
  await Promise.all(Array.from({ length: cantidadWorkers }, worker))
  return resultados
}