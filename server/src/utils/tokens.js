import crypto from 'crypto'

export const hashToken = (tokenPlano) =>
  crypto.createHash('sha256').update(tokenPlano).digest('hex')