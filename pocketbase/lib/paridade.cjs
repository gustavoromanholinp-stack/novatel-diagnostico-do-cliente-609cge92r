/**
 * paridade.cjs — lib de servidor (SPEC-2-001, passo 1).
 * CommonJS, sem require de módulos Node, sem process, sem relógio local.
 */

/** Igualdade por JSON canônico (chaves ordenadas recursivamente). */
function canonizar(valor) {
  if (valor === null || typeof valor !== 'object') return JSON.stringify(valor)
  if (Array.isArray(valor)) return '[' + valor.map(canonizar).join(',') + ']'
  const chaves = Object.keys(valor).sort()
  return '{' + chaves.map((k) => JSON.stringify(k) + ':' + canonizar(valor[k])).join(',') + '}'
}

function compararCanonico(dados) {
  return canonizar(dados.a) === canonizar(dados.b)
}

/**
 * executarVetores({ lib, vetores, funcoes }) → { lib, total, aprovados, divergentes }
 * Cada vetor: { id, funcao, entrada, esperado }. divergentes lista só IDs.
 * funcoes: mapa nome → função da lib; vetor com função ausente conta como divergente.
 */
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
    if (!compararCanonico({ a: obtido, b: vetor.esperado })) {
      divergentes.push(vetor.id)
    }
  }
  return { lib, total: vetores.length, aprovados: vetores.length - divergentes.length, divergentes }
}

module.exports = { canonizar, compararCanonico, executarVetores }
