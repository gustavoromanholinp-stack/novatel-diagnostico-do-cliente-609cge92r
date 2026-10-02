/**
 * MockProvider — provider exclusivamente em memória (SPEC-1-001).
 * Sem fetch/XHR/WebSocket. Delays artificiais não medem performance real.
 */
import type {
  Bloco,
  Cenario,
  Cliente,
  Contexto,
  DataProvider,
  Diagnostico,
  EstadoFonte,
  EventoFonte,
  OpcoesContexto,
  OpcoesOperacao,
  Servico,
} from './contracts'
import { MODO } from './contracts'
import {
  CLIENTES,
  CLIENTES_ALTERNATIVOS,
  CLIENTE_C,
  FATURA_PAGA,
  FATURA_PENDENTE,
  FATURA_SEM_DADOS,
  INDICADOR_RX,
  INDICADOR_RX_EXPIRADO,
  RELOGIO_FIXO,
  SERVICOS,
  SERVICOS_ALTERNATIVOS,
  SERVICO_C1,
} from './fixtures'

const DELAY_BUSCA_MS = 300
const DELAY_MK_MS = 300
const DELAY_TECNICA_MS = 800

let geracao = 0

function esperar(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Operação cancelada', 'AbortError'))
      return
    }
    const aoCancelar = () => {
      clearTimeout(timer)
      reject(new DOMException('Operação cancelada', 'AbortError'))
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', aoCancelar)
      resolve()
    }, ms)
    signal?.addEventListener('abort', aoCancelar)
  })
}

function coletadoAgora(): string {
  return RELOGIO_FIXO.toISOString()
}

function faturasDoCliente(cliente_id: string) {
  if (cliente_id === 'C-A') return [FATURA_PENDENTE, FATURA_PAGA]
  if (cliente_id === 'C-B') return [FATURA_SEM_DADOS]
  return []
}

function estadosPorCenario(cenario: Cenario): {
  estadoMk: EstadoFonte
  estadoTecnica: EstadoFonte
  motivoTecnica: string | null
} {
  switch (cenario) {
    case 'falha_tecnica':
      return {
        estadoMk: 'ok',
        estadoTecnica: 'indisponivel',
        motivoTecnica: 'Fonte técnica indisponível na demonstração.',
      }
    case 'sem_vinculo':
      return {
        estadoMk: 'ok',
        estadoTecnica: 'vazio',
        motivoTecnica: 'Sem vínculo de ativo para este cliente na demonstração.',
      }
    case 'vencido':
      return {
        estadoMk: 'ok',
        estadoTecnica: 'vencido',
        motivoTecnica: 'Leitura com idade acima da validade (TTL).',
      }
    default:
      return { estadoMk: 'ok', estadoTecnica: 'ok', motivoTecnica: null }
  }
}

function diagnosticoPorCenario(cenario: Cenario): Diagnostico {
  switch (cenario) {
    case 'atencao_financeira':
      return {
        estado: 'atencao',
        explicacao:
          'Fatura pendente com 2 dias de atraso na demonstração; não afirma causalidade técnica.',
        evidencias: ['Fatura F-A1 pendente, vencimento 30/09/2026'],
        proximo_passo: 'Revisar a situação financeira (demonstração).',
        coletivo: 'não avaliado',
      }
    case 'problema_tecnico':
      return {
        estado: 'problema',
        explicacao: 'Fonte técnica sintética reporta equipamento offline (exemplo).',
        evidencias: ['AT-A1 offline (simulação)'],
        proximo_passo: 'Acionar o suporte técnico (demonstração).',
        coletivo: 'não avaliado',
      }
    case 'falha_tecnica':
      return {
        estado: 'inconclusivo',
        explicacao: 'Fonte técnica indisponível; o diagnóstico não pode ser concluído.',
        evidencias: [],
        proximo_passo: 'Repetir a consulta mais tarde (demonstração).',
        coletivo: 'não avaliado',
      }
    case 'sem_vinculo':
      return {
        estado: 'inconclusivo',
        explicacao: 'Sem vínculo de ativo para este cliente; telemetria não avaliada.',
        evidencias: [],
        proximo_passo: 'Confirmar o vínculo cliente–ativo (demonstração).',
        coletivo: 'não avaliado',
      }
    case 'vencido':
      return {
        estado: 'inconclusivo',
        explicacao: 'Leitura com idade de 301 s, acima da validade de 300 s; dado expirado.',
        evidencias: ['Indicador I-AT-A1 expirado'],
        proximo_passo: 'Atualizar a leitura (demonstração).',
        coletivo: 'não avaliado',
      }
    default:
      return {
        estado: 'normal',
        explicacao: 'Indicadores de demonstração dentro do esperado.',
        evidencias: ['RX −23 dBm dentro da validade'],
        proximo_passo: 'Nenhuma ação necessária (demonstração).',
        coletivo: 'não avaliado',
      }
  }
}

export class MockProvider implements DataProvider {
  async searchClients(nome: string, opcoes: OpcoesOperacao = {}): Promise<Cliente[]> {
    const cenario = opcoes.cenario ?? 'normal'
    await esperar(DELAY_BUSCA_MS, opcoes.signal)
    if (cenario === 'vazio_busca') return []
    const termo = nome.trim().toLowerCase()
    if (termo === '') return [...CLIENTES, ...CLIENTES_ALTERNATIVOS]
    const base = [...CLIENTES, ...CLIENTES_ALTERNATIVOS]
    return base.filter(
      (c) => c.nome.toLowerCase().includes(termo) || c.referencia_mascarada.includes(termo),
    )
  }

  async listServices(cliente_id: string, opcoes: OpcoesOperacao = {}): Promise<Servico[]> {
    const cenario = opcoes.cenario ?? 'normal'
    await esperar(DELAY_BUSCA_MS, opcoes.signal)
    if (cenario === 'vazio_busca') return []
    return SERVICOS.filter((s) => s.cliente_id === cliente_id)
  }

  async getContext(
    params: { cliente_id: string; servico_id: string; request_id?: string; cenario?: Cenario },
    opcoes: OpcoesContexto = {},
  ): Promise<Contexto> {
    const cenario = params.cenario ?? 'normal'
    const request_id = params.request_id ?? crypto.randomUUID()
    const signal = opcoes.signal
    const onSourceState = opcoes.onSourceState
    geracao += 1
    const geracaoAtual = geracao

    const emitir = (fonte_id: string, estado: EstadoFonte) => {
      const evento: EventoFonte = {
        fonte_id,
        request_id,
        modo: MODO,
        cenario,
        geracao: geracaoAtual,
        estado,
      }
      onSourceState?.(evento)
    }

    emitir('mk', 'consultando')
    emitir('tecnica', 'consultando')

    const { estadoMk, estadoTecnica, motivoTecnica } = estadosPorCenario(cenario)

    await esperar(DELAY_MK_MS, signal)
    emitir('mk', estadoMk)

    await esperar(DELAY_TECNICA_MS - DELAY_MK_MS, signal)
    emitir('tecnica', estadoTecnica)

    const cliente =
      CLIENTES.find((c) => c.id === params.cliente_id) ??
      CLIENTES_ALTERNATIVOS.find((c) => c.id === params.cliente_id) ??
      (params.cliente_id === CLIENTE_C.id ? CLIENTE_C : null)
    const servico =
      SERVICOS.find((s) => s.id === params.servico_id) ??
      SERVICOS_ALTERNATIVOS.find((s) => s.id === params.servico_id) ??
      (params.servico_id === SERVICO_C1.id ? SERVICO_C1 : null)
    const coletado = coletadoAgora()

    const fontes = [
      { id: 'mk', nome: 'Simulação MK', estado: estadoMk, coletado_em: coletado, motivo: null },
      {
        id: 'tecnica',
        nome: 'Simulação técnica',
        estado: estadoTecnica,
        coletado_em: coletado,
        motivo: motivoTecnica,
      },
    ]

    const blocoMk: Bloco = {
      fonte_id: 'mk',
      estado: estadoMk,
      dados: { cliente, servico, faturas: faturasDoCliente(params.cliente_id) },
    }

    const indicador = cenario === 'vencido' ? INDICADOR_RX_EXPIRADO : INDICADOR_RX
    const dadosTecnica =
      estadoTecnica === 'ok'
        ? cenario === 'problema_tecnico'
          ? { indicador, equipamento_online: false }
          : { indicador }
        : estadoTecnica === 'vencido'
          ? { indicador }
          : null
    const blocoTecnica: Bloco = { fonte_id: 'tecnica', estado: estadoTecnica, dados: dadosTecnica }

    return {
      request_id,
      modo: MODO,
      cliente_id: params.cliente_id,
      servico_id: params.servico_id,
      fontes,
      blocos: [blocoMk, blocoTecnica],
      diagnostico: diagnosticoPorCenario(cenario),
    }
  }
}

/**
 * Ponto de composição de provider (SPEC-1-001). Modo real sem adaptador
 * configurado falha explicitamente — nunca fallback silencioso para o mock.
 */
export function selecionarProvider(modo: string, provider?: DataProvider): DataProvider {
  if (modo === MODO) return provider ?? new MockProvider()
  throw new Error(
    'Modo real não configurado: nenhum provider real disponível nesta fase (SPEC-1-001).',
  )
}
