import { useId, type ComponentProps } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type FieldProps = ComponentProps<typeof Input> & { label: string; name: string; error?: string; hint?: string }

/** Campo com label, dica e erro associados ao input (lidos pelo leitor de tela). */
export function Field({ label, name, error, hint, className, ...props }: FieldProps) {
  const id = useId()
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Input id={id} name={name} aria-invalid={!!error} aria-describedby={describedBy} {...props} />
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

export function SelectField({ label, name, error, options, className, ...props }: SelectFieldProps) {
  const id = useId()
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        name={name}
        aria-invalid={!!error}
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
