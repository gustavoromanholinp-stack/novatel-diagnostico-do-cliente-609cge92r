/**
 * diagnostico_paridade.js — rota de paridade genérica (SPEC-2-001, passo 3a, CA-2-04).
 * GET /backend/v1/diagnostico/paridade — só superusuário, sem rede/coleção/segredo.
 * Ramo B do spike (CA-2-04): libs e vetores EMBUTIDOS pelo scripts/embutir-lib.mjs.
 */
routerAdd(
  'GET',
  '/backend/v1/diagnostico/paridade',
  (e) => {
    // >>> lib:paridade sha256:1f566320810441425b477d2dc079d488894129ec32779e1494a14babf3d2cac7
    const paridade = (function () {
      function canonizar(valor) {
        if (valor === null || typeof valor !== 'object') return JSON.stringify(valor)
        if (Array.isArray(valor)) return '[' + valor.map(canonizar).join(',') + ']'
        const chaves = Object.keys(valor).sort()
        return (
          '{' + chaves.map((k) => JSON.stringify(k) + ':' + canonizar(valor[k])).join(',') + '}'
        )
      }
      function compararCanonico(dados) {
        return canonizar(dados.a) === canonizar(dados.b)
      }
      function executarVetores(dados) {
        const { lib, vetores, funcoes } = dados
        const divergentes = []
        for (const vetor of vetores) {
          const fn = funcoes[vetor.funcao]
          let obtido
          try {
            obtido = fn ? fn(vetor.entrada) : undefined
          } catch (e) {
            obtido = undefined
          }
          if (!compararCanonico({ a: obtido, b: vetor.esperado })) divergentes.push(vetor.id)
        }
        return {
          lib,
          total: vetores.length,
          aprovados: vetores.length - divergentes.length,
          divergentes,
        }
      }
      return { canonizar, compararCanonico, executarVetores }
    })()
    // <<< lib:paridade
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
    // >>> lib:vetores-paridade sha256:84a7748ee713c7b0e7094c1bc93a724960923523f9f011cb626e90c9e6a4d641
    const vetores_paridade = [
      {
        id: 'V-PA-01',
        funcao: 'compararCanonico',
        entrada: { a: { x: 1, y: 2 }, b: { y: 2, x: 1 } },
        esperado: true,
      },
      {
        id: 'V-PA-02',
        funcao: 'compararCanonico',
        entrada: { a: { x: 1 }, b: { x: '1' } },
        esperado: false,
      },
      {
        id: 'V-PA-03',
        funcao: 'compararCanonico',
        entrada: { a: [1, 2], b: [2, 1] },
        esperado: false,
      },
      {
        id: 'V-PA-04',
        funcao: 'compararCanonico',
        entrada: { a: { x: null }, b: {} },
        esperado: false,
      },
    ]
    // <<< lib:vetores-paridade
    // >>> lib:vetores-alcance sha256:dbd4b27ce63a1b2b63d546d8d8c578e136ebc19e2a8d43661409688a510a1c71
    const vetores_alcance = [
      {
        id: 'V-AL-01',
        funcao: 'validarBase',
        entrada: '',
        esperado: { host: null, configurado: false, chamar: false, estado: 'nao_configurado' },
      },
      {
        id: 'V-AL-02',
        funcao: 'validarBase',
        entrada: 'http://exemplo.invalid',
        esperado: { host: null, configurado: true, chamar: false, estado: 'url_invalida' },
      },
      {
        id: 'V-AL-03',
        funcao: 'validarBase',
        entrada: 'https://u:s@exemplo.invalid',
        esperado: { host: null, configurado: true, chamar: false, estado: 'url_invalida' },
      },
      {
        id: 'V-AL-04',
        funcao: 'validarBase',
        entrada: 'https://exemplo.invalid/api',
        esperado: { host: 'exemplo.invalid', configurado: true, chamar: true, estado: null },
      },
      {
        id: 'V-AL-05',
        funcao: 'resumirChamada',
        entrada: { status_http: 200, inicio_ms: 1000, fim_ms: 1250 },
        esperado: {
          estado: 'alcancavel',
          status_http: 200,
          tls: 'ok',
          latencia_ms: 250,
          classe_erro: null,
        },
      },
      {
        id: 'V-AL-06',
        funcao: 'resumirChamada',
        entrada: { status_http: 401, inicio_ms: 1000, fim_ms: 1250 },
        esperado: {
          estado: 'alcancavel',
          status_http: 401,
          tls: 'ok',
          latencia_ms: 250,
          classe_erro: null,
        },
      },
      {
        id: 'V-AL-07',
        funcao: 'resumirChamada',
        entrada: { status_http: 403, inicio_ms: 1000, fim_ms: 1250 },
        esperado: {
          estado: 'alcancavel',
          status_http: 403,
          tls: 'ok',
          latencia_ms: 250,
          classe_erro: null,
        },
      },
      {
        id: 'V-AL-08',
        funcao: 'resumirChamada',
        entrada: { status_http: 500, inicio_ms: 1000, fim_ms: 1250 },
        esperado: {
          estado: 'alcancavel',
          status_http: 500,
          tls: 'ok',
          latencia_ms: 250,
          classe_erro: null,
        },
      },
      {
        id: 'V-AL-09',
        funcao: 'resumirChamada',
        entrada: {
          status_http: null,
          erro_mensagem: 'dial tcp: lookup exemplo.invalid: no such host',
          inicio_ms: 1000,
          fim_ms: 1250,
        },
        esperado: {
          estado: 'falha_transporte',
          status_http: null,
          tls: 'nao_verificado',
          latencia_ms: 250,
          classe_erro: 'dns',
        },
      },
      {
        id: 'V-AL-10',
        funcao: 'resumirChamada',
        entrada: {
          status_http: null,
          erro_mensagem: 'x509: certificate signed by unknown authority',
          inicio_ms: 1000,
          fim_ms: 1250,
        },
        esperado: {
          estado: 'falha_transporte',
          status_http: null,
          tls: 'falha',
          latencia_ms: 250,
          classe_erro: 'tls',
        },
      },
      {
        id: 'V-AL-11',
        funcao: 'resumirChamada',
        entrada: {
          status_http: null,
          erro_mensagem: 'remote error: tls: handshake failure',
          inicio_ms: 1000,
          fim_ms: 1250,
        },
        esperado: {
          estado: 'falha_transporte',
          status_http: null,
          tls: 'falha',
          latencia_ms: 250,
          classe_erro: 'tls',
        },
      },
      {
        id: 'V-AL-12',
        funcao: 'resumirChamada',
        entrada: {
          status_http: null,
          erro_mensagem: 'Client.Timeout exceeded while awaiting headers',
          inicio_ms: 1000,
          fim_ms: 1250,
        },
        esperado: {
          estado: 'falha_transporte',
          status_http: null,
          tls: 'nao_verificado',
          latencia_ms: 250,
          classe_erro: 'timeout',
        },
      },
      {
        id: 'V-AL-13',
        funcao: 'resumirChamada',
        entrada: {
          status_http: null,
          erro_mensagem: 'context deadline exceeded',
          inicio_ms: 1000,
          fim_ms: 1250,
        },
        esperado: {
          estado: 'falha_transporte',
          status_http: null,
          tls: 'nao_verificado',
          latencia_ms: 250,
          classe_erro: 'timeout',
        },
      },
      {
        id: 'V-AL-14',
        funcao: 'resumirChamada',
        entrada: {
          status_http: null,
          erro_mensagem: 'read tcp: i/o timeout',
          inicio_ms: 1000,
          fim_ms: 1250,
        },
        esperado: {
          estado: 'falha_transporte',
          status_http: null,
          tls: 'nao_verificado',
          latencia_ms: 250,
          classe_erro: 'timeout',
        },
      },
      {
        id: 'V-AL-15',
        funcao: 'resumirChamada',
        entrada: {
          status_http: null,
          erro_mensagem: 'dial tcp: connection refused',
          inicio_ms: 1000,
          fim_ms: 1250,
        },
        esperado: {
          estado: 'falha_transporte',
          status_http: null,
          tls: 'nao_verificado',
          latencia_ms: 250,
          classe_erro: 'recusada',
        },
      },
      {
        id: 'V-AL-16',
        funcao: 'resumirChamada',
        entrada: {
          status_http: null,
          erro_mensagem: 'mensagem desconhecida',
          inicio_ms: 1000,
          fim_ms: 1250,
        },
        esperado: {
          estado: 'falha_transporte',
          status_http: null,
          tls: 'nao_verificado',
          latencia_ms: 250,
          classe_erro: 'outro',
        },
      },
    ]
    // <<< lib:vetores-alcance
    try {
      const libs = [
        {
          lib: 'alcance',
          resultado: paridade.executarVetores({
            lib: 'alcance',
            vetores: vetores_alcance,
            funcoes: { validarBase: alcance.validarBase, resumirChamada: alcance.resumirChamada },
          }),
        },
        {
          lib: 'paridade',
          resultado: paridade.executarVetores({
            lib: 'paridade',
            vetores: vetores_paridade,
            funcoes: { compararCanonico: paridade.compararCanonico },
          }),
        },
      ]
      const resumo = libs.map((l) => l.lib + ':' + l.resultado.aprovados + '/' + l.resultado.total)
      $app.logger().info('diagnostico_paridade: ' + resumo.join(' '))
      return e.json(200, {
        executado_em_utc: new Date().toISOString(),
        libs: libs.map((l) => ({
          lib: l.resultado.lib,
          total: l.resultado.total,
          aprovados: l.resultado.aprovados,
          divergentes: l.resultado.divergentes,
        })),
      })
    } catch (ex) {
      $app.logger().error('diagnostico_paridade: erro_interno')
      return e.json(500, { codigo: 'erro_interno' })
    }
  },
  $apis.requireSuperuserAuth(),
)
