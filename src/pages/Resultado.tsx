import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Contexto } from '@/lib/central/contracts'

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

const ESTADO_DIAG: Record<string, string> = {
  normal: 'Normal',
  atencao: 'Atenção',
  problema: 'Problema',
  inconclusivo: 'Inconclusivo',
}

const VARIANTE_DIAG: Record<string, 'secondary' | 'default' | 'destructive' | 'outline'> = {
  normal: 'default',
  atencao: 'secondary',
  problema: 'destructive',
  inconclusivo: 'outline',
}

interface Props {
  contexto: Contexto
  onVoltar: () => void
}

const Resultado = ({ contexto, onVoltar }: Props) => {
  const tituloRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    tituloRef.current?.focus()
  }, [])

  const blocoMk = contexto.blocos.find((b) => b.fonte_id === 'mk')
  const blocoTecnica = contexto.blocos.find((b) => b.fonte_id === 'tecnica')
  const fonteMk = contexto.fontes.find((f) => f.id === 'mk')
  const fonteTecnica = contexto.fontes.find((f) => f.id === 'tecnica')
  const dadosMk = (blocoMk?.dados ?? {}) as {
    cliente?: { nome: string; referencia_mascarada: string } | null
    servico?: { tipo: string; plano: string; ativo_id: string } | null
    faturas?: {
      id: string
      valor_centavos: number
      situacao: string | null
      dias_vencidos: number | null
    }[]
  }
  const dadosTecnica = (blocoTecnica?.dados ?? {}) as {
    indicador?: { valor: number; unidade: string; validade_segundos: number; estado: string } | null
    equipamento_online?: boolean
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 ref={tituloRef} tabIndex={-1} className="text-2xl font-bold md:text-3xl">
        Resultado da consulta (demonstração)
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Dados sintéticos do cenário selecionado. Cada fonte mostra seu estado e limitação.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Simulação MK</CardTitle>
            <CardDescription>
              {fonteMk?.motivo ?? 'Cadastro e faturamento (demonstração)'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Badge variant={VARIANTE[blocoMk?.estado ?? 'consultando']}>
              {ROTULOS[blocoMk?.estado ?? 'consultando']}
            </Badge>
            {dadosMk.cliente && (
              <p>
                <span className="font-medium">Cliente:</span> {dadosMk.cliente.nome} (Ref.{' '}
                {dadosMk.cliente.referencia_mascarada})
              </p>
            )}
            {dadosMk.servico && (
              <p>
                <span className="font-medium">Serviço:</span> {dadosMk.servico.tipo} ·{' '}
                {dadosMk.servico.plano} · Ativo {dadosMk.servico.ativo_id}
              </p>
            )}
            {dadosMk.faturas?.map((f) => (
              <p key={f.id}>
                <span className="font-medium">Fatura:</span> R${' '}
                {(f.valor_centavos / 100).toFixed(2).replace('.', ',')} ·{' '}
                {f.situacao ?? 'situação não informada'}
                {f.dias_vencidos !== null ? ` · ${f.dias_vencidos} dia(s) em atraso` : ''}
              </p>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Simulação técnica</CardTitle>
            <CardDescription>{fonteTecnica?.motivo ?? 'Telemetria (demonstração)'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Badge variant={VARIANTE[blocoTecnica?.estado ?? 'consultando']}>
              {ROTULOS[blocoTecnica?.estado ?? 'consultando']}
            </Badge>
            {dadosTecnica.indicador && (
              <p>
                <span className="font-medium">Indicador:</span> RX {dadosTecnica.indicador.valor}{' '}
                {dadosTecnica.indicador.unidade} · validade{' '}
                {dadosTecnica.indicador.validade_segundos}s
                {dadosTecnica.indicador.estado === 'expirado' ? ' · leitura expirada' : ''}
              </p>
            )}
            {blocoTecnica?.estado === 'vazio' && dadosTecnica.indicador == null && (
              <p role="status">Sem vínculo de ativo — telemetria não avaliada para este cliente.</p>
            )}
            {dadosTecnica.equipamento_online === false && (
              <p>Equipamento offline (exemplo de demonstração).</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4 max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Diagnóstico</CardTitle>
          <CardDescription>Avaliação de demonstração — coletivo não avaliado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Badge variant={VARIANTE_DIAG[contexto.diagnostico.estado]}>
            {ESTADO_DIAG[contexto.diagnostico.estado]}
          </Badge>
          <p>{contexto.diagnostico.explicacao}</p>
          <p>
            <span className="font-medium">Próximo passo:</span> {contexto.diagnostico.proximo_passo}
          </p>
        </CardContent>
      </Card>

      <div className="mt-6">
        <Button variant="secondary" onClick={onVoltar}>
          Voltar
        </Button>
      </div>
    </div>
  )
}

export default Resultado
