import { useQueryClient } from '@tanstack/react-query'
import { FlaskConical } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useCart } from '@/api/cart'
import { SelectField } from '@/components/form/field'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { fromWei, toWei } from '@/lib/eth'
import type { FailureKey, FailureMode, Scenario } from '@/mocks/scenario'

const FAILURE_LABELS: Record<FailureKey, string> = {
  'nfts.list': 'Catálogo',
  'nfts.detail': 'Detalhe do NFT',
  auth: 'Login/sessão',
  cart: 'Carrinho',
  favorites: 'Favoritar/desfavoritar',
  'orders.create': 'Criação de pedido',
  'orders.read': 'Consulta de pedido',
  profile: 'Perfil',
  wallets: 'Carteiras',
}

/**
 * Painel da demonstração (só existe com os mocks ligados). Ele não altera a tela diretamente:
 * muda o "servidor" simulado, que responde pela REST e publica eventos pelo Socket.IO.
 */
export default function ScenarioPanel() {
  const mock = window.__kurioMock!
  const queryClient = useQueryClient()
  const { data: cart } = useCart()
  const [scenario, setScenario] = useState<Scenario>(() => mock.getScenario())
  const [failKey, setFailKey] = useState<FailureKey>('nfts.list')
  const [failMode, setFailMode] = useState<FailureMode>('server')
  const target = cart?.items[0]

  function update(patch: Partial<Scenario>) {
    mock.setScenario(patch)
    setScenario(mock.getScenario())
  }

  function run(label: string, action: () => unknown) {
    try {
      action()
      toast.info(`Simulação: ${label}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha na simulação.')
    }
  }

  return (
    <Sheet onOpenChange={(open) => open && setScenario(mock.getScenario())}>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline" data-testid="scenario-trigger" className="fixed bottom-20 left-4 z-40 md:bottom-4 border-primary bg-background shadow-lg">
          <FlaskConical aria-hidden />
          <span className="max-md:sr-only">Cenários</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="overflow-y-auto px-6 pb-8">
        <SheetHeader className="px-0">
          <SheetTitle>Cenários da simulação</SheetTitle>
          <SheetDescription>Controla a API e os eventos simulados (MSW). As escolhas ficam salvas até o reset.</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 text-sm">
          <section className="space-y-3">
            <h3 className="font-semibold">Rede</h3>
            <SelectField
              label="Latência"
              name="latency"
              value={scenario.latency}
              onChange={(event) => update({ latency: event.target.value as Scenario['latency'] })}
              options={[
                ['none', 'Sem atraso'],
                ['normal', 'Normal (100–400 ms)'],
                ['slow', 'Lenta (3 s)'],
                ['variable', 'Variável (respostas fora de ordem)'],
              ]}
            />
            <div className="grid grid-cols-2 gap-2">
              <SelectField
                label="Rota"
                name="failKey"
                value={failKey}
                onChange={(event) => setFailKey(event.target.value as FailureKey)}
                options={Object.entries(FAILURE_LABELS)}
              />
              <SelectField
                label="Falha"
                name="failMode"
                value={failMode}
                onChange={(event) => setFailMode(event.target.value as FailureMode)}
                options={[
                  ['server', 'Erro 503'],
                  ['network', 'Sem conexão'],
                  ['timeout', 'Timeout'],
                ]}
              />
            </div>
            <Button size="sm" variant="outline" onClick={() => run('próxima chamada vai falhar', () => mock.failNext(failKey, failMode))}>
              Falhar a próxima chamada
            </Button>
          </section>

          <section className="space-y-3">
            <h3 className="font-semibold">Pagamento e carteira</h3>
            <SelectField
              label="Resultado do pagamento"
              name="payment"
              value={scenario.payment}
              onChange={(event) => update({ payment: event.target.value as Scenario['payment'] })}
              options={[
                ['confirm', 'Confirmar'],
                ['decline', 'Recusar'],
              ]}
            />
            <SelectField
              label="Conexão da carteira"
              name="walletConnection"
              value={scenario.walletConnection}
              onChange={(event) => update({ walletConnection: event.target.value as Scenario['walletConnection'] })}
              options={[
                ['approve', 'Aprovar'],
                ['refuse', 'Recusar'],
              ]}
            />
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">Tempo real (Socket.IO)</h3>
            <p className="text-xs text-muted-foreground">
              {target ? `Alvo: ${target.nft.name} (primeiro item do carrinho).` : 'Adicione um item ao carrinho para usar as ações abaixo.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={!target}
                onClick={() =>
                  run('preço alterado', () => mock.updateNft(target!.nftId, { price: fromWei((toWei(target!.unitPrice) * 110n) / 100n) }))
                }
              >
                Aumentar preço em 10%
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!target}
                onClick={() => run('edição esgotada', () => mock.updateNft(target!.nftId, { edition: target!.edition, available: 0 }))}
              >
                Esgotar edição
              </Button>
              <Button size="sm" variant="outline" onClick={() => run('evento duplicado reenviado', mock.replayLastEvent)}>
                Reenviar último evento
              </Button>
              <Button size="sm" variant="outline" disabled={!target} onClick={() => run('evento antigo enviado', () => mock.emitStaleNftEvent(target!.nftId))}>
                Enviar evento antigo
              </Button>
              <Button size="sm" variant="outline" onClick={() => run('conexão derrubada', mock.disconnectSockets)}>
                Derrubar conexão
              </Button>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">Sessão e dados</h3>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => run('sessão expirada', mock.expireSessions)}>
                Expirar sessão
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  mock.reset()
                  queryClient.clear()
                  sessionStorage.clear()
                  location.assign('/')
                }}
              >
                Restaurar cenário inicial
              </Button>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
