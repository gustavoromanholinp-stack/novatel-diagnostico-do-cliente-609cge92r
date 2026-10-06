/**
 * diagnostico_rede.js — rota de diagnóstico de rede (SPEC-2-001, passos 2–3, CA-2-02).
 * GET /backend/v1/diagnostico/rede — só superusuário, resposta sanitizada.
 * Ramo B do spike (CA-2-04): lib EMBUTIDA pelo scripts/embutir-lib.mjs
 * (require relativo não existe no runtime goja do Skip Cloud — doc §15).
 */
routerAdd(
  'GET',
  '/backend/v1/diagnostico/rede',
  (e) => {
    // >>> lib:alcance sha256:b7aac8f3aedf6eab1992bc401212b5e9c4fc6d41320ee0b28f34752e814b54dd
    const alcance = (function () {
      function classificarErroTransporte(mensagem) {
        if (typeof mensagem !== 'string') return 'outro'
        const m = mensagem.toLowerCase()
        if (m.indexOf('no such host') !== -1) return 'dns'
        if (m.indexOf('x509') !== -1 || m.indexOf('tls:') !== -1) return 'tls'
        if (
          m.indexOf('client.timeout') !== -1 ||
          m.indexOf('deadline exceeded') !== -1 ||
          m.indexOf('i/o timeout') !== -1
        )
          return 'timeout'
        if (m.indexOf('connection refused') !== -1) return 'recusada'
        return 'outro'
      }
      function validarBase(url) {
        if (typeof url !== 'string' || url.trim() === '')
          return { host: null, configurado: false, chamar: false, estado: 'nao_configurado' }
        if (url.indexOf('https://') !== 0 || url.indexOf('@') !== -1)
          return { host: null, configurado: true, chamar: false, estado: 'url_invalida' }
        let host = null
        try {
          host = new URL(url).host
        } catch (e) {
          host = null
        }
        if (host === null || host === '')
          return { host: null, configurado: true, chamar: false, estado: 'url_invalida' }
        return { host, configurado: true, chamar: true, estado: null }
      }
      function resumirChamada(dados) {
        const d = dados || {}
        if (d.status_http === null || d.status_http === undefined) {
          if (d.erro_mensagem === null || d.erro_mensagem === undefined)
            return {
              estado: null,
              status_http: null,
              tls: null,
              latencia_ms: null,
              classe_erro: null,
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
      return { classificarErroTransporte, validarBase, resumirChamada }
    })()
    // <<< lib:alcance
    try {
      const lerSegredo = (chave) => {
        try {
          const v = $secrets.get(chave)
          return typeof v === 'string' ? v.trim() : ''
        } catch (err) {
          return ''
        }
      }
      const fontes = []
      for (const par of [
        { id: 'mk', segredo: 'MK_BASE_URL' },
        { id: 'tec', segredo: 'TEC_BASE_URL' },
      ]) {
        const base = lerSegredo(par.segredo)
        const validacao = alcance.validarBase(base)
        if (!validacao.chamar) {
          fontes.push({
            fonte: par.id,
            host: validacao.host,
            configurado: validacao.configurado,
            estado: validacao.estado,
            status_http: null,
            tls: null,
            latencia_ms: null,
            classe_erro: null,
          })
          continue
        }
        const inicio = new Date().getTime()
        let status = null
        let erro = null
        try {
          const resp = $http.send({ url: base, method: 'GET', timeout: 10 })
          status = alcance.extrairStatusHttp(resp)
          if (status === null) erro = 'status_code_indisponivel'
        } catch (ex) {
          erro = String(ex && ex.message ? ex.message : ex)
        }
        const fim = new Date().getTime()
        const resumo = alcance.resumirChamada({
          status_http: status,
          erro_mensagem: erro,
          inicio_ms: inicio,
          fim_ms: fim,
        })
        fontes.push({
          fonte: par.id,
          host: validacao.host,
          configurado: true,
          estado: resumo.estado,
          status_http: resumo.status_http,
          tls: resumo.tls,
          latencia_ms: resumo.latencia_ms,
          classe_erro: resumo.classe_erro,
        })
      }
      $app
        .logger()
        .info(
          'diagnostico_rede: ' +
            fontes
              .map(
                (f) =>
                  f.fonte + '=' + f.estado + (f.status_http !== null ? '/' + f.status_http : ''),
              )
              .join(' '),
        )
      return e.json(200, { executado_em_utc: new Date().toISOString(), fontes })
    } catch (ex) {
      $app.logger().error('diagnostico_rede: erro_interno')
      return e.json(500, { codigo: 'erro_interno' })
    }
  },
  $apis.requireSuperuserAuth(),
)
