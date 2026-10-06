/**
 * diagnostico_paridade.js — rota de paridade genérica (SPEC-2-001, passo 3a, CA-2-04).
 * GET /backend/v1/diagnostico/paridade — só superusuário, sem parâmetros, sem rede,
 * sem coleção e sem segredo; roda os vetores das libs registradas e devolve o resumo.
 *
 * Spike de require (CA-2-04): tenta carregar libs/vetores dentro do callback,
 * primeiro por caminho relativo. Falha de require → 500 { codigo: "erro_interno" }.
 */
routerAdd(
  'GET',
  '/backend/v1/diagnostico/paridade',
  (e) => {
    try {
      const paridade = require('../lib/paridade.cjs')
      const alcance = require('../lib/alcance.cjs')
      const vetoresAlcance = require('../lib/vetores-alcance.json')
      const vetoresParidade = require('../lib/vetores-paridade.json')

      const libs = [
        {
          lib: 'alcance',
          resultado: paridade.executarVetores({
            lib: 'alcance',
            vetores: vetoresAlcance,
            funcoes: { validarBase: alcance.validarBase, resumirChamada: alcance.resumirChamada },
          }),
        },
        {
          lib: 'paridade',
          resultado: paridade.executarVetores({
            lib: 'paridade',
            vetores: vetoresParidade,
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
