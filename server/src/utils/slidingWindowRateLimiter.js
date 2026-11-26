/**
 * Rate limiter de ventana móvil para una sola instancia de Node.js.
 * Cuenta timestamps recientes por clave y descarta cada evento al vencer su
 * propia ventana, en lugar de reiniciar todo el contador en un límite fijo.
 */
export class SlidingWindowRateLimiter {
  constructor({ keyPrefix, points, duration }) {
    if (!Number.isInteger(points) || points < 1) {
      throw new TypeError('points debe ser un entero positivo')
    }
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new TypeError('duration debe ser una cantidad positiva de segundos')
    }

    this.keyPrefix = keyPrefix
    this.points = points
    this.windowMs = duration * 1000
    this.entries = new Map()
  }

  async consume(key) {
    const fullKey = `${this.keyPrefix}:${String(key)}`
    const ahora = Date.now()
    let entrada = this.entries.get(fullKey)

    if (!entrada) {
      entrada = { timestamps: [], timer: null }
      this.entries.set(fullKey, entrada)
    }

    this.#eliminarVencidos(entrada, ahora)

    if (entrada.timestamps.length >= this.points) {
      const venceEn = entrada.timestamps[0] + this.windowMs
      this.#programarLimpieza(fullKey, entrada)

      const error = new Error('Rate limit exceeded')
      error.name = 'RateLimiterRes'
      error.consumedPoints = entrada.timestamps.length
      error.remainingPoints = 0
      error.msBeforeNext = Math.max(1, venceEn - ahora)
      throw error
    }

    entrada.timestamps.push(ahora)
    this.#programarLimpieza(fullKey, entrada)

    return {
      consumedPoints: entrada.timestamps.length,
      remainingPoints: Math.max(this.points - entrada.timestamps.length, 0),
      msBeforeNext: Math.max(1, entrada.timestamps[0] + this.windowMs - ahora)
    }
  }

  delete(key) {
    const fullKey = `${this.keyPrefix}:${String(key)}`
    const entrada = this.entries.get(fullKey)
    if (!entrada) return false

    if (entrada.timer) clearTimeout(entrada.timer)
    return this.entries.delete(fullKey)
  }

  #eliminarVencidos(entrada, ahora) {
    const limite = ahora - this.windowMs
    while (entrada.timestamps.length && entrada.timestamps[0] <= limite) {
      entrada.timestamps.shift()
    }
  }

  #programarLimpieza(fullKey, entrada) {
    if (entrada.timer) clearTimeout(entrada.timer)

    if (!entrada.timestamps.length) {
      this.entries.delete(fullKey)
      return
    }

    const proximoVencimiento = entrada.timestamps[0] + this.windowMs
    const demora = Math.max(1, proximoVencimiento - Date.now() + 1)

    entrada.timer = setTimeout(() => {
      if (this.entries.get(fullKey) !== entrada) return

      entrada.timer = null
      this.#eliminarVencidos(entrada, Date.now())

      if (!entrada.timestamps.length) {
        this.entries.delete(fullKey)
      } else {
        this.#programarLimpieza(fullKey, entrada)
      }
    }, demora)

    entrada.timer.unref?.()
  }
}
