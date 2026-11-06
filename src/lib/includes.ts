/** Confere se um valor desconhecido (da URL, por exemplo) está numa lista de opções válidas. */
export const includes = <T extends string>(list: readonly T[], value: unknown): value is T =>
  typeof value === 'string' && (list as readonly string[]).includes(value)