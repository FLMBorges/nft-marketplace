import { z } from 'zod'
import { NETWORKS } from '@/types/nft'
import { WALLET_PROVIDERS } from '@/types/user'

/**
 * Validações compartilhadas entre os formulários e a API simulada.
 * O cliente valida para dar feedback rápido; a API valida de novo porque nunca deve confiar no cliente.
 */

const email = z.string().trim().toLowerCase().email('Informe um e-mail válido.')
const password = z
  .string()
  .min(8, 'A senha precisa de pelo menos 8 caracteres.')
  .regex(/[A-Za-z]/, 'A senha precisa de ao menos uma letra.')
  .regex(/\d/, 'A senha precisa de ao menos um número.')
const name = z.string().trim().min(2, 'Informe seu nome.').max(80, 'Use no máximo 80 caracteres.')

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Informe sua senha.'),
})

export const registerSchema = z
  .object({ name, email, password, confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não coincidem.',
  })

export const profileSchema = z.object({
  name,
  email,
  phone: z
    .string()
    .trim()
    .regex(/^$|^\+?[\d\s()-]{10,20}$/, 'Informe um telefone válido.'),
})

export const passwordChangeSchema = z
  .object({ currentPassword: z.string().min(1, 'Informe a senha atual.'), newPassword: password, confirmPassword: z.string() })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não coincidem.',
  })

const EVM_ADDRESS = /^0x[a-fA-F0-9]{40}$/
const SOLANA_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

export const walletSchema = z
  .object({
    label: z.string().trim().min(2, 'Dê um nome para a carteira.').max(40, 'Use no máximo 40 caracteres.'),
    provider: z.enum(WALLET_PROVIDERS, 'Escolha o provedor.'),
    network: z.enum(NETWORKS, 'Escolha a rede.'),
    address: z.string().trim(),
  })
  .refine((data) => (data.network === 'solana' ? SOLANA_ADDRESS : EVM_ADDRESS).test(data.address), {
    path: ['address'],
    message: 'Endereço inválido para a rede escolhida.',
  })

export const buyerSchema = z.object({ name, email })

export const avatarSchema = z.object({
  dataUrl: z
    .string()
    .regex(/^data:image\/(png|jpeg|webp);base64,/, 'Use uma imagem PNG, JPG ou WebP.')
    .max(1_400_000, 'A imagem precisa ter no máximo 1 MB.'),
})

/** Converte o erro do zod em `{ campo: mensagem }`, o mesmo formato que a API devolve. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  return Object.fromEntries(error.issues.map((issue) => [issue.path.join('.'), issue.message]).reverse())
}
