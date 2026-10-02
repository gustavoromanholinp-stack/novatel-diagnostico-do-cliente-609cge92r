import { MODO } from './contracts'
import { selecionarProvider } from './mock-provider'
import { AlternativoProvider } from './alternativo-provider'

/**
 * Ponto de composição do provider (SPEC-1-001).
 * CA-V12 (SPEC-1-004): provider sintético alternativo no lugar do mock —
 * a troca acontece apenas aqui; telas e contrato permanecem iguais.
 */
export const provider = selecionarProvider(MODO, new AlternativoProvider())
