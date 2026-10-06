import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Database,
  Gauge,
  Signal,
  Wifi,
} from 'lucide-react'
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

/** Série mensal sintética (demonstração) — velocidade média por mês, Mbps. */
const CONSUMO_MENSAL = [
  { mes: 'Mai', consumo: 386, limite: 500 },
  { mes: 'Jun', consumo: 421, limite: 500 },
  { mes: 'Jul', consumo: 355, limite: 500 },
  { mes: 'Ago', consumo: 468, limite: 500 },
  { mes: 'Set', consumo: 402, limite: 500 },
  { mes: 'Out', consumo: 440, limite: 500 },
]

/** Composição sintética da última fatura (demonstração), em reais. */
const COMPOSICAO_FATURA = [
  { nome: 'Disponibilidade', valor: 42.0, cor: '#06b6d4' },
  { nome: 'Tributos', valor: 31.0, cor: '#8b5cf6' },
  { nome: 'Serviço', valor: 26.0, cor: '#22d3ee' },
]

const CORES = {
  ciano: '#06b6d4',
  claro: '#22d3ee',
  ok: '#34d399',
  alerta: '#fbbf24',
  erro: '#f87171',
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
      vencimento?: string | null
      situacao: string | null
      dias_vencidos: number | null
    }[]
  }
  const dadosTecnica = (blocoTecnica?.dados ?? {}) as {
    indicador?: { valor: number; unidade: string; validade_segundos: number; estado: string } | null
    equipamento_online?: boolean
  }

  const diagnosticoOk = contexto.diagnostico.estado === 'normal'

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-primary/15 to-transparent" />
      <h1
        ref={tituloRef}
        tabIndex={-1}
        className="text-3xl font-bold tracking-tight outline-none md:text-4xl"
      >
        Resultado da consulta
      </h1>
      <p className="mt-2 max-w-2xl text-lg text-muted-foreground">
        Dados sintéticos do cenário selecionado. Cada fonte mostra seu estado e limitação.
      </p>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-lg shadow-black/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="h-5 w-5 text-primary" aria-hidden="true" />
              Simulação MK — cadastro e faturamento
            </CardTitle>
            <CardDescription>
              {fonteMk?.motivo ?? 'Fonte de cadastro e faturamento (demonstração)'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Badge variant={VARIANTE[blocoMk?.estado ?? 'consultando']}>
              {ROTULOS[blocoMk?.estado ?? 'consultando']}
            </Badge>
            {dadosMk.cliente && (
              <p className="text-base">
                <span className="font-medium">Cliente:</span> {dadosMk.cliente.nome} (Ref.{' '}
                {dadosMk.cliente.referencia_mascarada})
              </p>
            )}
            {dadosMk.servico && (
              <p className="flex items-center gap-2 text-base">
                <Wifi className="h-4 w-4 text-primary" aria-hidden="true" />
                <span className="font-medium">Serviço:</span> {dadosMk.servico.tipo} ·{' '}
                {dadosMk.servico.plano} · Ativo {dadosMk.servico.ativo_id}
              </p>
            )}
            {dadosMk.faturas != null && dadosMk.faturas.length > 0 && (
              <table className="mt-2 w-full text-left text-base">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th scope="col" className="py-2 pr-2 font-medium">
                      Fatura
                    </th>
                    <th scope="col" className="py-2 pr-2 font-medium">
                      Valor
                    </th>
                    <th scope="col" className="py-2 pr-2 font-medium">
                      Situação
                    </th>
                    <th scope="col" className="py-2 pr-2 font-medium">
                      Vencimento
                    </th>
                    <th scope="col" className="py-2 font-medium">
                      Dias em atraso
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dadosMk.faturas.map((f) => {
                    const valor =
                      f.valor_centavos != null
                        ? `R$ ${(f.valor_centavos / 100).toFixed(2).replace('.', ',')}`
                        : 'Não localizado'
                    const situacao = f.situacao ?? 'Não localizado'
                    const vencimento =
                      f.vencimento != null
                        ? f.vencimento.split('-').reverse().join('/')
                        : 'Não localizado'
                    const dias =
                      f.dias_vencidos === null
                        ? 'Não localizado'
                        : f.dias_vencidos === 0
                          ? f.situacao === 'paga'
                            ? '0 (paga)'
                            : '0 (em dia)'
                          : String(f.dias_vencidos)
                    return (
                      <tr key={f.id} className="border-b border-border/60">
                        <td className="py-2 pr-2 font-medium">{f.id}</td>
                        <td className="py-2 pr-2">{valor}</td>
                        <td className="py-2 pr-2">{situacao}</td>
                        <td className="py-2 pr-2">{vencimento}</td>
                        <td className="py-2">{dias}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
            {dadosMk.faturas != null && dadosMk.faturas.length === 0 && (
              <p role="status" className="text-base">
                Nenhuma fatura registrada para este cliente na demonstração.
              </p>
            )}
            {dadosMk.faturas == null && (
              <p role="status" className="text-base">
                Faturas não localizadas para este cliente.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="shadow-lg shadow-black/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Signal className="h-5 w-5 text-primary" aria-hidden="true" />
                Simulação técnica
              </CardTitle>
              <CardDescription>
                {fonteTecnica?.motivo ?? 'Telemetria (demonstração)'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Badge variant={VARIANTE[blocoTecnica?.estado ?? 'consultando']}>
                {ROTULOS[blocoTecnica?.estado ?? 'consultando']}
              </Badge>
              {dadosTecnica.indicador && (
                <p className="flex items-center gap-2 text-base">
                  <Gauge className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span className="font-medium">RX:</span> {dadosTecnica.indicador.valor}{' '}
                  {dadosTecnica.indicador.unidade} · validade{' '}
                  {dadosTecnica.indicador.validade_segundos}s
                  {dadosTecnica.indicador.estado === 'expirado' ? ' · leitura expirada' : ''}
                </p>
              )}
              {blocoTecnica?.estado === 'vazio' && dadosTecnica.indicador == null && (
                <p role="status" className="text-base">
                  Sem vínculo de ativo — telemetria não avaliada para este cliente.
                </p>
              )}
              {dadosTecnica.equipamento_online === false && (
                <p className="text-base">Equipamento offline (exemplo de demonstração).</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-transparent shadow-lg shadow-black/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                {diagnosticoOk ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" />
                ) : (
                  <Clock className="h-5 w-5 text-primary" aria-hidden="true" />
                )}
                Diagnóstico
              </CardTitle>
              <CardDescription>Avaliação de demonstração — coletivo não avaliado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Badge variant={VARIANTE_DIAG[contexto.diagnostico.estado]}>
                {ESTADO_DIAG[contexto.diagnostico.estado]}
              </Badge>
              <p className="text-base">{contexto.diagnostico.explicacao}</p>
              {contexto.diagnostico.evidencias.length > 0 && (
                <div>
                  <p className="font-medium">Evidências:</p>
                  <ul className="list-disc space-y-1 pl-5">
                    {contexto.diagnostico.evidencias.map((e, i) => (
                      <li key={i} className="text-base">
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-base">
                <span className="font-medium">Próximo passo:</span>{' '}
                {contexto.diagnostico.proximo_passo}
              </p>
              <p className="text-sm text-muted-foreground">Coletivo: não avaliado nesta fase.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-5">
        <Card className="shadow-lg shadow-black/30 lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg">Velocidade média mensal (demonstração)</CardTitle>
            <CardDescription>
              Mbps por mês — série sintética; não mede operação real
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CONSUMO_MENSAL} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="corConsumo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CORES.ciano} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={CORES.ciano} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="mes" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(222 44% 8%)',
                    border: '1px solid hsl(217 30% 18%)',
                    borderRadius: 8,
                    color: '#f8fafc',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="consumo"
                  name="Velocidade (Mbps)"
                  stroke={CORES.ciano}
                  strokeWidth={2}
                  fill="url(#corConsumo)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-lg shadow-black/30 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Composição da fatura (demonstração)</CardTitle>
            <CardDescription>Distribuição sintética por grupo</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={COMPOSICAO_FATURA}
                  dataKey="valor"
                  nameKey="nome"
                  innerRadius="55%"
                  outerRadius="80%"
                  paddingAngle={3}
                  stroke="none"
                >
                  {COMPOSICAO_FATURA.map((entrada) => (
                    <Cell key={entrada.nome} fill={entrada.cor} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(valor: number) => [
                    `R$ ${valor.toFixed(2).replace('.', ',')}`,
                    'Valor',
                  ]}
                  contentStyle={{
                    backgroundColor: 'hsl(222 44% 8%)',
                    border: '1px solid hsl(217 30% 18%)',
                    borderRadius: 8,
                    color: '#f8fafc',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md shadow-black/20">
          <CardContent className="flex items-center gap-3 p-4">
            <ArrowDownLeft className="h-8 w-8 text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm text-muted-foreground">Download médio</p>
              <p className="text-xl font-bold">412 Mbps</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md shadow-black/20">
          <CardContent className="flex items-center gap-3 p-4">
            <ArrowUpRight className="h-8 w-8 text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm text-muted-foreground">Upload médio</p>
              <p className="text-xl font-bold">205 Mbps</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md shadow-black/20">
          <CardContent className="flex items-center gap-3 p-4">
            <Bar className="h-8 w-8 text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm text-muted-foreground">Estabilidade 30d</p>
              <p className="text-xl font-bold">99,2%</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md shadow-black/20">
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-8 w-8 text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm text-muted-foreground">Latência</p>
              <p className="text-xl font-bold">18 ms</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Button variant="secondary" onClick={onVoltar}>
          Voltar
        </Button>
      </div>
    </div>
  )
}

export default Resultado
