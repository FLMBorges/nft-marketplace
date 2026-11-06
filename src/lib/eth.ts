const DECIMALS = 18
const ETH_PATTERN = /^\d+(\.\d{1,18})?$/

export const isEth = (value: string) => ETH_PATTERN.test(value)

export function toWei(eth: string): bigint {
  if (!isEth(eth)) throw new Error(`Valor em ETH inválido: ${eth}`)
  const [whole, fraction = ''] = eth.split('.')
  return BigInt(whole + fraction.padEnd(DECIMALS, '0'))
}

export function fromWei(wei: bigint): string {
  const digits = wei.toString().padStart(DECIMALS + 1, '0')
  const fraction = digits.slice(-DECIMALS).replace(/0+$/, '')
  return fraction ? `${digits.slice(0, -DECIMALS)}.${fraction}` : digits.slice(0, -DECIMALS)
}