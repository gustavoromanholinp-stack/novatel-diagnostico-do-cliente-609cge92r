/**
 * alcance.test.cjs — roda cada vetor V-AL como teste nomeado pelo ID.
 * Falha se faltar um ID listado na SPEC ou se a quantidade for diferente de 16.
 */
const test = require('node:test')
const assert = require('node:assert')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

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

const FUNCOES = {
  validarBase: lib.validarBase,
  resumirChamada: lib.resumirChamada,
  extrairStatusHttp: lib.extrairStatusHttp,
}

for (const vetor of vetores) {
  test(`${vetor.id} — ${vetor.funcao}`, () => {
    const fn = FUNCOES[vetor.funcao]
    assert.ok(fn, `função ${vetor.funcao} não existe na lib`)
    const obtido = fn(vetor.entrada)
    assert.deepStrictEqual(obtido, vetor.esperado)
  })
}

test('validarBase funciona sem a global WHATWG URL (ambiente Goja)', () => {
  const ambiente = { module: { exports: {} } }
  assert.strictEqual(vm.runInNewContext('typeof URL', ambiente), 'undefined')
  const codigo = fs.readFileSync(path.join(__dirname, 'alcance.cjs'), 'utf8')
  vm.runInNewContext(codigo, ambiente)
  const resultado = ambiente.module.exports.validarBase('https://mk.interno:8443/api')
  assert.strictEqual(resultado.chamar, true)
  assert.strictEqual(resultado.host, 'mk.interno:8443')
})

test('validarBase rejeita autoridade HTTPS malformada sem chamar a origem', () => {
  for (const url of [
    'https://',
    'https://host com espaço/api',
    'https://usuario@host/api',
    'https://host:abc/api',
    'https://host:65536/api',
    'https://-host/api',
  ]) {
    const resultado = lib.validarBase(url)
    assert.strictEqual(resultado.chamar, false, url)
    assert.strictEqual(resultado.estado, 'url_invalida', url)
  }
})

test('extrairStatusHttp usa statusCode de $http.send, não status', () => {
  assert.strictEqual(lib.extrairStatusHttp({ statusCode: 200 }), 200)
  assert.strictEqual(lib.extrairStatusHttp({ statusCode: 401 }), 401)
  assert.strictEqual(lib.extrairStatusHttp({ status: 200 }), null)
  assert.strictEqual(lib.extrairStatusHttp(null), null)
})
