import { Skeleton } from '@/components/ui/skeleton'
import { NETWORK_LABELS } from '@/lib/labels'
import type { Quote } from '@/types/cart'

/** Resumo de valores exatamente como a API calculou: a interface não refaz contas de dinheiro. */
export function QuoteSummary({ quote }: { quote?: Quote }) {
  if (!quote) {
    return (
      <div aria-busy="true" aria-label="Calculando valores" className="space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-5 w-full" />
        ))}
      </div>
    )
  }

  return (
    <dl className="space-y-2 text-sm">
      <Row label="Subtotal" value={`${quote.subtotal} ETH`} />
      <Row
        label={quote.coupon ? `Desconto (${quote.coupon.code}, ${quote.coupon.percent}%)` : 'Desconto'}
        value={quote.discount === '0' ? '—' : `− ${quote.discount} ETH`}
      />
      <Row label={`Taxa de rede (${NETWORK_LABELS[quote.network]})`} value={`${quote.networkFee} ETH`} />
      <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
        <dt>Total</dt>
        <dd className="text-primary">{quote.total} ETH</dd>
      </div>
    </dl>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
