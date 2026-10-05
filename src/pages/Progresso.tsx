import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { AlvoAtivo, EstadosFonte } from '@/lib/central/use-consulta'
import { Database, Signal } from 'lucide-react'

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
    <div className="container relative mx-auto px-4 py-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-primary/15 to-transparent" />
      <h1
        ref={tituloRef}
        tabIndex={-1}
        className="text-3xl font-bold tracking-tight outline-none md:text-4xl"
      >
        Consulta simulada
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        Progresso de demonstração — os tempos são artificiais e não medem operação real.
      </p>

      <div className="mt-8 max-w-xl space-y-4">
        <Card className="shadow-lg shadow-black/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="h-5 w-5 text-primary" aria-hidden="true" />
              Simulação MK
            </CardTitle>
            <CardDescription>Fonte de cadastro e faturamento (demonstração)</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant={VARIANTE[estados.mk]}>{ROTULOS[estados.mk]}</Badge>
          </CardContent>
        </Card>
        <Card className="shadow-lg shadow-black/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Signal className="h-5 w-5 text-primary" aria-hidden="true" />
              Simulação técnica
            </CardTitle>
            <CardDescription>Fonte de telemetria (demonstração)</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant={VARIANTE[estados.tecnica]}>{ROTULOS[estados.tecnica]}</Badge>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 max-w-xl">
        <p className="text-base text-muted-foreground" role="status">
          Cliente: {alvo.cliente.nome} (Ref. {alvo.cliente.referencia_mascarada}) · Serviço:{' '}
          {alvo.servico.tipo} ({alvo.servico.ativo_id})
        </p>
        <Button variant="secondary" onClick={onVoltar} className="mt-5">
          Voltar
        </Button>
      </div>
    </div>
  )
}

export default Progresso
