import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { AlvoAtivo, EstadosFonte } from '@/lib/central/use-consulta'

const ROTULOS: Record<string, string> = {
  consultando: 'Consultando…',
  ok: 'Dados obtidos',
  vazio: 'Sem dados',
  indisponivel: 'Indisponível',
  vencido: 'Dado expirado',
}

const VARIANTE: Record<string, 'secondary' | 'default' | 'destructive' | 'outline'> = {
  consultando: 'secondary',
  ok: 'default',
  vazio: 'outline',
  indisponivel: 'destructive',
  vencido: 'destructive',
}

interface Props {
  alvo: AlvoAtivo
  estados: EstadosFonte
  onVoltar: () => void
}

const Progresso = ({ alvo, estados, onVoltar }: Props) => {
  const tituloRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    tituloRef.current?.focus()
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 ref={tituloRef} tabIndex={-1} className="text-2xl font-bold md:text-3xl">
        Consulta simulada
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Progresso de demonstração — os tempos são artificiais e não medem operação real.
      </p>

      <div className="mt-6 max-w-xl space-y-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Simulação MK</CardTitle>
            <CardDescription>Fonte de cadastro e faturamento (demonstração)</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant={VARIANTE[estados.mk]}>{ROTULOS[estados.mk]}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Simulação técnica</CardTitle>
            <CardDescription>Fonte de telemetria (demonstração)</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant={VARIANTE[estados.tecnica]}>{ROTULOS[estados.tecnica]}</Badge>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 max-w-xl">
        <p className="text-sm text-muted-foreground" role="status">
          Cliente: {alvo.cliente.nome} (Ref. {alvo.cliente.referencia_mascarada}) · Serviço:{' '}
          {alvo.servico.tipo} ({alvo.servico.ativo_id})
        </p>
        <Button variant="secondary" onClick={onVoltar} className="mt-4">
          Voltar
        </Button>
      </div>
    </div>
  )
}

export default Progresso
