/**
 * AlternativoProvider — segundo provider sintético (CA-V12, SPEC-1-004).
 * Mesmo contrato v1, universo próprio (C-C/S-C1, fatura F-C1 R$ 99,00,
 * indicador do AT-C1) e delays próprios. Prova de que a troca de fontes
 * acontece só no ponto de composição (provider.ts), sem tocar as telas.
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
  CLIENTE_C,
  FATURA_C,
  INDICADOR_RX_C,
  INDICADOR_RX_C_EXPIRADO,
  RELOGIO_FIXO,
  SERVICO_C1,
} from './fixtures'

const DELAY_BUSCA_MS = 150
const DELAY_MK_MS = 250
const DELAY_TECNICA_MS = 500

let geracao = 0

// adapta-divida: esperar duplicado por independência entre providers; extrair para util compartilhado quando surgir um 3º provider
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
  if (cliente_id === 'C-C') return [FATURA_C]
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
        explicacao: 'Fatura pendente na demonstração; não afirma causalidade técnica.',
        evidencias: ['Fatura F-C1 pendente, vencimento 30/09/2026'],
        proximo_passo: 'Revisar a situação financeira (demonstração).',
        coletivo: 'não avaliado',
      }
    case 'problema_tecnico':
      return {
        estado: 'problema',
        explicacao:
          'Fonte técnica sintética reporta equipamento offline (exemplo). Prova de segurança: <b>exemplo</b> deve aparecer como texto, sem executar.',
        evidencias: ['AT-C1 offline (simulação)'],
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
        evidencias: ['Indicador I-AT-C1 expirado'],
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

export class AlternativoProvider implements DataProvider {
  async searchClients(nome: string, opcoes: OpcoesOperacao = {}): Promise<Cliente[]> {
    const cenario = opcoes.cenario ?? 'normal'
    await esperar(DELAY_BUSCA_MS, opcoes.signal)
    if (cenario === 'vazio_busca') return []
    const termo = nome.trim().toLowerCase()
    if (termo === '') return [CLIENTE_C]
    return [CLIENTE_C].filter(
      (c) => c.nome.toLowerCase().includes(termo) || c.referencia_mascarada.includes(termo),
    )
  }

  async listServices(cliente_id: string, opcoes: OpcoesOperacao = {}): Promise<Servico[]> {
    const cenario = opcoes.cenario ?? 'normal'
    await esperar(DELAY_BUSCA_MS, opcoes.signal)
    if (cenario === 'vazio_busca') return []
    return [SERVICO_C1].filter((s) => s.cliente_id === cliente_id)
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

    const cliente = params.cliente_id === CLIENTE_C.id ? CLIENTE_C : null
    const servico = params.servico_id === SERVICO_C1.id ? SERVICO_C1 : null
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

    const indicador = cenario === 'vencido' ? INDICADOR_RX_C_EXPIRADO : INDICADOR_RX_C
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
