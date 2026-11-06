import { toast } from 'sonner'

/** Ações fora do escopo da demonstração: avisam em vez de fingir que funcionaram. */
export const comingSoon = () => toast.info('Disponível em breve: esta seção não faz parte da demonstração.')
