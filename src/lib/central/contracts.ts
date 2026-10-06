/**
 * Contrato v1 da Central de Atendimento — SPEC-1-001 (fase visual).
 * Modelos normalizados e interface de provider. Ausente é null, nunca zero.
 */

export type Cenario =
  | 'normal'
  | 'atencao_financeira'
  | 'problema_tecnico'
  | 'vazio_busca'
  | 'falha_tecnica'
  | 'sem_vinculo'
  | 'vencido'

export const CENARIOS: readonly Cenario[] = [
  'normal',
  'atencao_financeira',
  'problema_tecnico',
  'vazio_busca',
  'falha_tecnica',
  'sem_vinculo',
  'vencido',
]

export function ehCenario(valor: unknown): valor is Cenario {
  return typeof valor === 'string' && (CENARIOS as readonly string[]).includes(valor)
}

export type EstadoFonte = 'consultando' | 'ok' | 'vazio' | 'indisponivel' | 'vencido'

export interface Cliente {
  id: string
  nome: string
  referencia_mascarada: string
}

export interface Servico {
  id: string
  cliente_id: string
  tipo: string
  plano: string
  conexao_id: string
  ativo_id: string
}

export interface Fatura {
  id: string
  valor_centavos: number
  moeda: 'BRL'
  vencimento: string | null
  situacao: string | null
  dias_vencidos: number | null
}

export interface Indicador {
  id: string
  ativo_id: string
  valor: number
  unidade: string
  observado_em: string
  coletado_em: string
  validade_segundos: number
  estado: string
}

export interface Diagnostico {
  estado: 'normal' | 'atencao' | 'problema' | 'inconclusivo'
  explicacao: string
  evidencias: string[]
  proximo_passo: string
  coletivo: 'não avaliado'
}

export interface FonteInfo {
  id: string
  nome: string
  estado: EstadoFonte
  coletado_em: string
  motivo: string | null
}

export interface Bloco {
  fonte_id: string
  estado: EstadoFonte
  dados: unknown
}

export interface Contexto {
  request_id: string
  modo: 'demo'
  cliente_id: string
  servico_id: string
  fontes: FonteInfo[]
  blocos: Bloco[]
  diagnostico: Diagnostico
}

export interface EventoFonte {
  fonte_id: string
  request_id: string
  modo: 'demo'
  cenario: Cenario
  geracao: number
  estado: EstadoFonte
}

export interface OpcoesOperacao {
  signal?: AbortSignal
  cenario?: Cenario
}

export interface OpcoesContexto {
  signal?: AbortSignal
  onSourceState?: (evento: EventoFonte) => void
}

export interface DataProvider {
  searchClients(nome: string, opcoes?: OpcoesOperacao): Promise<Cliente[]>
  listServices(cliente_id: string, opcoes?: OpcoesOperacao): Promise<Servico[]>
  getContext(
    params: { cliente_id: string; servico_id: string; request_id?: string; cenario?: Cenario },
    opcoes?: OpcoesContexto,
  ): Promise<Contexto>
}

/** Modo configurado nesta fase. Ponto único de configuração (SPEC-1-001). */
export const MODO = 'demo' as const
