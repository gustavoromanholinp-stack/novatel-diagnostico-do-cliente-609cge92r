/**
 * divergencia.test.cjs — valida que as cópias inline dos hooks correspondem
 * às libs de fonte, incluindo JSON, hashes e usos sem bloco embutido.
 */
const test = require('node:test')
const assert = require('node:assert')
const fs = require('node:fs')
const path = require('node:path')
const { createHash } = require('node:crypto')

const raiz = path.join(__dirname, '..', '..')
const hooksDir = path.join(raiz, 'pocketbase', 'hooks')
const libDir = path.join(raiz, 'pocketbase', 'lib')

function arquivoLib(nome) {
  const cjs = path.join(libDir, `${nome}.cjs`)
  const json = path.join(libDir, `${nome}.json`)
  if (fs.existsSync(cjs)) return cjs
  if (fs.existsSync(json)) return json
  throw new Error(`arquivo da lib "${nome}" não existe`)
}

function sha256Arquivo(caminho) {
  return createHash('sha256').update(fs.readFileSync(caminho)).digest('hex')
}

function conteudoEmbutido(nome) {
  const cjs = path.join(libDir, `${nome}.cjs`)
  const json = path.join(libDir, `${nome}.json`)
  const ident = nome.replaceAll('-', '_')
  if (fs.existsSync(cjs)) {
    const fonte = fs.readFileSync(cjs, 'utf8')
    const corpo = fonte.replace(/^module\.exports\s*=\s*(\{[\s\S]*?\})\s*$/m, 'return $1')
    if (corpo === fonte) throw new Error(`lib ${nome}.cjs sem module.exports no fim`)
    return `const ${ident} = (function () {\n${corpo}\n})();`
  }
  if (fs.existsSync(json)) return `const ${ident} = ${fs.readFileSync(json, 'utf8').trim()};`
  throw new Error(`arquivo da lib "${nome}" não existe`)
}

function verificarHook(fonte, arquivo) {
  const problemas = []
  const marcadores = new Set()
  const regexBloco = /\/\/ >>> lib:([\w-]+) sha256:([0-9a-f]{64})\n([\s\S]*?)\/\/ <<< lib:\1\n/g
  for (const bloco of fonte.matchAll(regexBloco)) {
    const nome = bloco[1]
    marcadores.add(nome)
    const esperado = `// >>> lib:${nome} sha256:${sha256Arquivo(arquivoLib(nome))}\n${conteudoEmbutido(nome)}\n// <<< lib:${nome}\n`
    if (bloco[0] !== esperado)
      problemas.push(`${arquivo}: bloco de ${nome} divergente ou hash desatualizado`)
  }

  const semBlocos = fonte
    .replace(/\/\/ >>> lib:([\w-]+) sha256:[0-9a-f]{64}\n[\s\S]*?\/\/ <<< lib:\1\n/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((linha) => !linha.trim().startsWith('//'))
    .join('\n')

  const nomes = fs
    .readdirSync(libDir)
    .filter(
      (nome) => nome.endsWith('.json') || (nome.endsWith('.cjs') && !nome.endsWith('.test.cjs')),
    )
    .map((nome) => nome.replace(/\.(cjs|json)$/, ''))
  for (const nome of nomes) {
    const ident = nome.replaceAll('-', '_')
    if (new RegExp(`\\b${ident}\\b`).test(semBlocos) && !marcadores.has(nome)) {
      problemas.push(`${arquivo}: usa ${ident} sem bloco embutido`)
    }
  }
  return problemas
}

test('divergencia: todos os hooks correspondem às libs e hashes atuais', () => {
  const problemas = []
  for (const arquivo of fs.readdirSync(hooksDir).filter((nome) => nome.endsWith('.js'))) {
    problemas.push(...verificarHook(fs.readFileSync(path.join(hooksDir, arquivo), 'utf8'), arquivo))
  }
  assert.deepStrictEqual(problemas, [])
})

test('divergencia: alteração no bloco, hash antigo e remoção do bloco são detectados', () => {
  const arquivo = 'diagnostico_rede.js'
  const original = fs.readFileSync(path.join(hooksDir, arquivo), 'utf8')
  const alterado = original.replace('no such host', 'alteracao manual')
  assert.ok(verificarHook(alterado, arquivo).some((p) => p.includes('divergente')))

  const hashAntigo = original.replace(/(sha256:)[0-9a-f]{64}/, `$1${'0'.repeat(64)}`)
  assert.ok(verificarHook(hashAntigo, arquivo).some((p) => p.includes('hash desatualizado')))

  const semBloco = original.replace(
    /    \/\/ >>> lib:alcance sha256:[0-9a-f]{64}\n[\s\S]*?\/\/ <<< lib:alcance\n/,
    '',
  )
  assert.ok(
    verificarHook(semBloco, arquivo).some((p) => p.includes('usa alcance sem bloco embutido')),
  )
})
