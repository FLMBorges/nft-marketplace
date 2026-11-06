import { useState } from 'react'
import type { z } from 'zod'
import { errorMessage, getApiError } from '@/api/client'
import { fieldErrors } from './schemas'

/** Lê os campos de texto de um formulário. */
export const formValues = (form: HTMLFormElement) =>
  Object.fromEntries([...new FormData(form)].filter(([, value]) => typeof value === 'string')) as Record<string, string>

/** Coloca o foco no primeiro campo inválido, para quem navega por teclado ou leitor de tela. */
const focusFirstError = (form: HTMLFormElement) =>
  requestAnimationFrame(() => form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())

/**
 * Estado de erros de um formulário: valida no cliente com zod e aceita os erros por campo vindos da API.
 */
export function useFormErrors() {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  function validate<T extends z.ZodType>(schema: T, form: HTMLFormElement): z.infer<T> | null {
    const parsed = schema.safeParse(formValues(form))
    setFormError(null)
    if (parsed.success) {
      setErrors({})
      return parsed.data
    }
    setErrors(fieldErrors(parsed.error))
    focusFirstError(form)
    return null
  }

  function fromApi(error: unknown, form?: HTMLFormElement | null) {
    const apiError = getApiError(error)
    setErrors(apiError?.fields ?? {})
    setFormError(apiError?.fields ? null : errorMessage(error))
    if (form && apiError?.fields) focusFirstError(form)
  }

  return { errors, formError, validate, fromApi, reset: () => (setErrors({}), setFormError(null)) }
}
