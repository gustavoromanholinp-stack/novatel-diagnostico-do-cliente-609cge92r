/**
 * alcance.test.cjs — roda cada vetor V-AL como teste nomeado pelo ID.
 * Falha se faltar um ID listado na SPEC ou se a quantidade for diferente de 16.
 */
const test = require('node:test')
const assert = require('node:assert')
const fs = require('node:fs')
const path = require('node:path')

const lib = require('./alcance.cjs')
const vetores = JSON.parse(fs.readFileSync(path.join(__dirname, 'vetores-alcance.json'), 'utf8'))

const IDS_ESPERADOS = Array.from({ length: 16 }, (_, i) => `V-AL-${String(i + 1).padStart(2, '0')}`)
const ids = vetores.map((v) => v.id)

test('vetores-alcance: quantidade e IDs conforme SPEC (V-AL-01..16)', () => {
  assert.strictEqual(vetores.length, 16)
  for (const id of IDS_ESPERADOS) {
    assert.ok(ids.includes(id), `vetor ausente: ${id}`)
  }
})

const FUNCOES = { validarBase: lib.validarBase, resumirChamada: lib.resumirChamada }

for (const vetor of vetores) {
  test(`${vetor.id} — ${vetor.funcao}`, () => {
    const fn = FUNCOES[vetor.funcao]
    assert.ok(fn, `função ${vetor.funcao} não existe na lib`)
    const obtido = fn(vetor.entrada)
    assert.deepStrictEqual(obtido, vetor.esperado)
  })
}
