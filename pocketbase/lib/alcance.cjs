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
  const valor = url.trim()
  if (
    valor.indexOf('https://') !== 0 ||
    valor.indexOf('@') !== -1 ||
    /[\u0000-\u0020\u007f\\]/.test(valor)
  ) {
    return { host: null, configurado: true, chamar: false, estado: 'url_invalida' }
  }

  // Goja/PocketBase não fornece o construtor WHATWG `URL`; parsear somente
  // a autoridade HTTPS com ES5, sem depender de APIs de browser/Node.
  const restante = valor.slice('https://'.length)
  const fimAutoridade = restante.search(/[/?#]/)
  const autoridade = fimAutoridade < 0 ? restante : restante.slice(0, fimAutoridade)
  if (autoridade === '') {
    return { host: null, configurado: true, chamar: false, estado: 'url_invalida' }
  }

  let nomeHost = ''
  let porta = ''
  if (autoridade.charAt(0) === '[') {
    const fechamento = autoridade.indexOf(']')
    if (fechamento < 0) {
      return { host: null, configurado: true, chamar: false, estado: 'url_invalida' }
    }
    const ipv6 = autoridade.slice(1, fechamento)
    const sobra = autoridade.slice(fechamento + 1)
    if (ipv6.indexOf(':') < 0 || !/^[0-9a-f:.]+$/i.test(ipv6)) {
      return { host: null, configurado: true, chamar: false, estado: 'url_invalida' }
    }
    nomeHost = autoridade.slice(0, fechamento + 1)
    if (sobra !== '') {
      if (sobra.charAt(0) !== ':' || !/^[0-9]+$/.test(sobra.slice(1))) {
        return { host: null, configurado: true, chamar: false, estado: 'url_invalida' }
      }
      porta = sobra.slice(1)
    }
  } else {
    const partes = autoridade.match(/^([A-Za-z0-9.-]+)(?::([0-9]+))?$/)
    if (!partes) {
      return { host: null, configurado: true, chamar: false, estado: 'url_invalida' }
    }
    nomeHost = partes[1]
    porta = partes[2] || ''
    if (nomeHost.length > 253) {
      return { host: null, configurado: true, chamar: false, estado: 'url_invalida' }
    }
    const rotulos = nomeHost.split('.')
    for (const rotulo of rotulos) {
      if (
        rotulo.length === 0 || rotulo.length > 63 ||
        !/^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(rotulo)
      ) {
        return { host: null, configurado: true, chamar: false, estado: 'url_invalida' }
      }
    }
  }

  if (porta !== '') {
    const numeroPorta = Number(porta)
    if (numeroPorta < 1 || numeroPorta > 65535) {
      return { host: null, configurado: true, chamar: false, estado: 'url_invalida' }
    }
    porta = String(numeroPorta)
  }
  const host = nomeHost + (porta === '' ? '' : ':' + porta)
  return { host, configurado: true, chamar: true, estado: null }
}

/** Lê o nome de campo documentado pelo PocketBase JSVM ($http.send). */
function extrairStatusHttp(resposta) {
  const status = resposta && resposta.statusCode
  if (typeof status !== 'number' || status < 100 || status > 599 || Math.floor(status) !== status) {
    return null
  }
  return status
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

module.exports = { classificarErroTransporte, validarBase, extrairStatusHttp, resumirChamada }
