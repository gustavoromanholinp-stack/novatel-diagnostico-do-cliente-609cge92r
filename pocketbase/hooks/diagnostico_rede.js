/**
 * diagnostico_rede.js — rota de diagnóstico de rede (SPEC-2-001, passos 2–3, CA-2-02).
 * GET /backend/v1/diagnostico/rede — só superusuário, sem parâmetros, resposta
 * sanitizada (sem cabeçalhos, corpo da origem, mensagem bruta ou segredo).
 *
 * Spike de require (CA-2-04): tenta carregar a lib dentro do callback,
 * primeiro por caminho relativo. Falha de require → 500 { codigo: "erro_interno" }.
 */
routerAdd(
  'GET',
  '/backend/v1/diagnostico/rede',
  (e) => {
    try {
      const alcance = require('../lib/alcance.cjs')

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
          status = resp.status
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
