/**
 * Fixtures determinísticas da demonstração — SPEC-1-001.
 * Relógio fixo: 02/10/2026. Nenhum dado real, nenhum segredo.
 */
import type { Cliente, Fatura, Indicador, Servico } from './contracts'

/** Momento fixo da demonstração: 02/10/2026 12:00 UTC. */
export const RELOGIO_FIXO = new Date('2026-10-02T12:00:00Z')

export const CLIENTES: Cliente[] = [
  { id: 'C-A', nome: 'Cliente Demonstração', referencia_mascarada: '001' },
  { id: 'C-B', nome: 'Cliente Demonstração', referencia_mascarada: '002' },
]

export const SERVICOS: Servico[] = [
  {
    id: 'S-A1',
    cliente_id: 'C-A',
    tipo: 'fibra',
    plano: 'Plano Demo 500',
    conexao_id: 'ONU-A1',
    ativo_id: 'AT-A1',
  },
  {
    id: 'S-A2',
    cliente_id: 'C-A',
    tipo: 'radio',
    plano: 'Plano Demo 100',
    conexao_id: 'RDO-A2',
    ativo_id: 'AT-A2',
  },
  {
    id: 'S-B1',
    cliente_id: 'C-B',
    tipo: 'fibra',
    plano: 'Plano Demo 500',
    conexao_id: 'ONU-B1',
    ativo_id: 'AT-B1',
  },
]

/** Contexto alternativo sintético (TDD CA-V07): prova independência de IDs fixos. */
export const CLIENTE_C: Cliente = {
  id: 'C-C',
  nome: 'Cliente Demonstração',
  referencia_mascarada: '003',
}
export const SERVICO_C1: Servico = {
  id: 'S-C1',
  cliente_id: 'C-C',
  tipo: 'fibra',
  plano: 'Plano Demo 300',
  conexao_id: 'ONU-C1',
  ativo_id: 'AT-C1',
}
export const CLIENTES_ALTERNATIVOS: Cliente[] = [CLIENTE_C]
export const SERVICOS_ALTERNATIVOS: Servico[] = [SERVICO_C1]

export const FATURA_PENDENTE: Fatura = {
  id: 'F-A1',
  valor_centavos: 19990,
  moeda: 'BRL',
  vencimento: '2026-09-30',
  situacao: 'pendente',
  dias_vencidos: 2,
}

export const FATURA_PAGA: Fatura = {
  id: 'F-A2',
  valor_centavos: 9990,
  moeda: 'BRL',
  vencimento: '2026-10-05',
  situacao: 'paga',
  dias_vencidos: 0,
}

export const FATURA_SEM_DADOS: Fatura = {
  id: 'F-B1',
  valor_centavos: 14990,
  moeda: 'BRL',
  vencimento: null,
  situacao: null,
  dias_vencidos: null,
}

export const INDICADOR_RX: Indicador = {
  id: 'I-AT-A1',
  ativo_id: 'AT-A1',
  valor: -23,
  unidade: 'dBm',
  observado_em: '2026-10-02T11:55:00Z',
  coletado_em: '2026-10-02T12:00:00Z',
  validade_segundos: 300,
  estado: 'ok',
}

/** Leitura com idade de 301 s, acima do TTL de 300 s — cenário vencido. */
export const INDICADOR_RX_EXPIRADO: Indicador = {
  id: 'I-AT-A1',
  ativo_id: 'AT-A1',
  valor: -23,
  unidade: 'dBm',
  observado_em: '2026-10-02T11:54:59Z',
  coletado_em: '2026-10-02T12:00:00Z',
  validade_segundos: 300,
  estado: 'expirado',
}
