import { Eye, EyeOff } from 'lucide-react'
import { useId, useState, type ComponentProps } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type FieldProps = ComponentProps<typeof Input> & {
  label: string
  name: string
  error?: string
  hint?: string
  /** Ex.: `sr-only` quando o layout mostra só o placeholder (o label continua para leitores de tela). */
  labelClassName?: string
}

/** Campo com label, dica e erro associados ao input (lidos pelo leitor de tela). */
export function Field({ label, name, error, hint, className, required, labelClassName, ...props }: FieldProps) {
  const id = useId()
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className={cn('text-sm font-medium', labelClassName)}>
        {label}
        {required && <RequiredMark />}
      </label>
      <Input id={id} name={name} aria-invalid={!!error} aria-required={required || undefined} aria-describedby={describedBy} {...props} />
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {message}
    </p>
  )
}

type SelectFieldProps = ComponentProps<'select'> & { label: string; name: string; error?: string; options: [string, string][] }

export function SelectField({ label, name, error, options, className, required, ...props }: SelectFieldProps) {
  const id = useId()
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && <RequiredMark />}
      </label>
      <select
        id={id}
        name={name}
        aria-invalid={!!error}
        aria-required={required || undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm aria-invalid:border-destructive"
        {...props}
      >
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

/** Campo de senha com botão para mostrar/ocultar o texto. */
export function PasswordField({ label, name, error, hint, className, required, labelClassName, ...props }: Omit<FieldProps, 'type'>) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className={cn('text-sm font-medium', labelClassName)}>
        {label}
        {required && <RequiredMark />}
      </label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          aria-invalid={!!error}
          aria-required={required || undefined}
          aria-describedby={describedBy}
          className="pr-9"
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? 'Ocultar caracteres' : 'Mostrar caracteres'}
          aria-controls={id}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 grid w-9 place-items-center text-muted-foreground hover:text-primary"
        >
          {visible ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
        </button>
      </div>
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

export function RequiredMark() {
  return (
    <span aria-hidden className="ml-0.5 text-primary">
      *
    </span>
  )
}
