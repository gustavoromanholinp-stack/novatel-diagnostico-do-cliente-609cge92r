/**
 * paridade.test.cjs — roda cada vetor V-PA como teste nomeado pelo ID;
 * prova que vetor divergente é contado e que lista vazia dá total: 0.
 */
const test = require('node:test')
const assert = require('node:assert')
const fs = require('node:fs')
const path = require('node:path')

const lib = require('./paridade.cjs')
const vetores = JSON.parse(fs.readFileSync(path.join(__dirname, 'vetores-paridade.json'), 'utf8'))

const IDS_ESPERADOS = ['V-PA-01', 'V-PA-02', 'V-PA-03', 'V-PA-04']
const ids = vetores.map((v) => v.id)

test('vetores-paridade: quantidade e IDs conforme SPEC (V-PA-01..04)', () => {
  assert.strictEqual(vetores.length, 4)
  for (const id of IDS_ESPERADOS) {
    assert.ok(ids.includes(id), `vetor ausente: ${id}`)
  }
})

const FUNCOES = { compararCanonico: lib.compararCanonico }

for (const vetor of vetores) {
  test(`${vetor.id} — ${vetor.funcao}`, () => {
    const fn = FUNCOES[vetor.funcao]
    assert.ok(fn, `função ${vetor.funcao} não existe na lib`)
    const obtido = fn(vetor.entrada)
    assert.strictEqual(obtido, vetor.esperado)
  })
}

test('executarVetores: vetor divergente é contado e listado pelo ID', () => {
  const resultado = lib.executarVetores({
    lib: 'teste',
    vetores: [
      {
        id: 'X-01',
        funcao: 'compararCanonico',
        entrada: { a: { x: 1 }, b: { x: 1 } },
        esperado: true,
      },
      {
        id: 'X-02',
        funcao: 'compararCanonico',
        entrada: { a: { x: 1 }, b: { x: 2 } },
        esperado: true,
      },
    ],
    funcoes: FUNCOES,
  })
  assert.strictEqual(resultado.total, 2)
  assert.strictEqual(resultado.aprovados, 1)
  assert.deepStrictEqual(resultado.divergentes, ['X-02'])
})

test('executarVetores: lista vazia dá total 0', () => {
  const resultado = lib.executarVetores({ lib: 'teste', vetores: [], funcoes: FUNCOES })
  assert.strictEqual(resultado.total, 0)
  assert.strictEqual(resultado.aprovados, 0)
  assert.deepStrictEqual(resultado.divergentes, [])
})
