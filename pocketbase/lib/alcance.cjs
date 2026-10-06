/**
 * alcance.cjs — lib de servidor (SPEC-2-001, passos 1–3).
 * Formato de lib de servidor: CommonJS, sem require de módulos Node, sem
 * process, sem Date.now()/new Date() (tempos e agora chegam por parâmetro).
 * Termina com uma única linha module.exports = { ... }.
 */

/** Tabela de classes de erro de transporte (passo 3 da SPEC). */
function classificarErroTransporte(mensagem) {
  if (typeof mensagem !== 'string') return 'outro'
  const m = mensagem.toLowerCase()
  if (m.indexOf('no such host') !== -1) return 'dns'
  if (m.indexOf('x509') !== -1 || m.indexOf('tls:') !== -1) return 'tls'
  if (
    m.indexOf('client.timeout') !== -1 ||
    m.indexOf('deadline exceeded') !== -1 ||
    m.indexOf('i/o timeout') !== -1
  ) {
    return 'timeout'
  }
  if (m.indexOf('connection refused') !== -1) return 'recusada'
  return 'outro'
}

/**
 * validarBase(url) → { host, configurado, chamar, estado }
 * - url vazia/não string → nao_configurado (sem chamada)
 * - url sem https:// ou com @ (credencial embutida) → url_invalida, host null (sem chamada)
 * - url válida → host extraído, chamar true, estado null
 */
function validarBase(url) {
  if (typeof url !== 'string' || url.trim() === '') {
    return { host: null, configurado: false, chamar: false, estado: 'nao_configurado' }
  }
  if (url.indexOf('https://') !== 0 || url.indexOf('@') !== -1) {
    return { host: null, configurado: true, chamar: false, estado: 'url_invalida' }
  }
  let host = null
  try {
    host = new URL(url).host
  } catch (e) {
    host = null
  }
  if (host === null || host === '') {
    return { host: null, configurado: true, chamar: false, estado: 'url_invalida' }
  }
  return { host, configurado: true, chamar: true, estado: null }
}

/**
 * resumirChamada({ status_http, erro_mensagem, inicio_ms, fim_ms }) → resumo sanitizado.
 * - resposta HTTP de qualquer status → alcancavel, tls ok
 * - exceção → falha_transporte, classe pela tabela, tls falha (classe tls) ou nao_verificado
 * - sem chamada → nulls
 */
function resumirChamada(dados) {
  const d = dados || {}
  if (d.status_http === null || d.status_http === undefined) {
    if (d.erro_mensagem === null || d.erro_mensagem === undefined) {
      return {
        estado: null,
        status_http: null,
        tls: null,
        latencia_ms: null,
        classe_erro: null,
      }
    }
    const classe = classificarErroTransporte(d.erro_mensagem)
    return {
      estado: 'falha_transporte',
      status_http: null,
      tls: classe === 'tls' ? 'falha' : 'nao_verificado',
      latencia_ms: d.fim_ms - d.inicio_ms,
      classe_erro: classe,
    }
  }
  return {
    estado: 'alcancavel',
    status_http: d.status_http,
    tls: 'ok',
    latencia_ms: d.fim_ms - d.inicio_ms,
    classe_erro: null,
  }
}

module.exports = { classificarErroTransporte, validarBase, resumirChamada }
