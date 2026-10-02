import { MODO } from './contracts'
import { selecionarProvider } from './mock-provider'

/** Ponto de composição do provider (SPEC-1-001). Nesta fase, sempre o mock. */
export const provider = selecionarProvider(MODO)
