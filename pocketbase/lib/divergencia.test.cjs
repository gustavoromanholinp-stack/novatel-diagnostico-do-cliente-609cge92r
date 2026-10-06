/**
 * divergencia.test.cjs — guarda do ramo B (SPEC-2-001, CA-2-04).
 * Percorre todos os pocketbase/hooks/*.js e falha se:
 * 1. um bloco embutido difere da lib regenerada;
 * 2. o hash do bloco está desatualizado;
 * 3. um hook que usa o identificador de uma lib fora de bloco não tem o bloco dela.
 */
const test = require('node:test')
const assert = require('node:assert')
const fs = require('node:fs')
const path = require('node:path')
const { createHash } = require('node:crypto')

const raiz = path.join(__dirname, '..', '..')
const hooksDir = path.join(raiz, 'pocketbase', 'hooks')
const libDir = path.join(raiz, 'pocketbase', 'lib')

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

test('divergencia: blocos embutidos dos hooks batem com as libs regeneradas e hashes atualizados', () => {
  const problemas = []
  for (const arquivo of fs.readdirSync(hooksDir)) {
    if (!arquivo.endsWith('.js')) continue
    const fonte = fs.readFileSync(path.join(hooksDir, arquivo), 'utf8')

    // 1+2. cada bloco deve regenerar idêntico (inclui hash)
    const blocos = fonte.matchAll(
      /\/\/ >>> lib:([\w-]+) sha256:[0-9a-f]{64}\n([\s\S]*?)\/\/ <<< lib:\1\n/g,
    )
    for (const [, nome] of blocos) {
      const esperado = `// >>> lib:${nome} sha256:${sha256Arquivo(path.join(libDir, nome.endsWith('.json') ? nome : `${nome}.cjs`))}\n${conteudoEmbutido(nome)}\n// <<< lib:${nome}\n`
      const atual = fonte.match(
        new RegExp(`// >>> lib:${nome} sha256:[0-9a-f]{64}\\n[\\s\\S]*?// <<< lib:${nome}\\n`),
      )
      if (atual === null || atual[0] !== esperado) {
        problemas.push(`${arquivo}: bloco de ${nome} divergente ou hash desatualizado`)
      }
    }

    // 3. identificador de lib usado fora de bloco exige o bloco
    const idents = new Set()
    for (const [, nome] of fonte.matchAll(/\/\/ >>> lib:([\w-]+) /g)) {
      idents.add(nome.replaceAll('-', '_'))
    }
    for (const ident of idents) {
      const usos = fonte
        .split('\n')
        .filter((l) => !l.startsWith('//') && l.includes(ident + '.')).length
      if (usos > 0 && !fonte.includes(`// >>> lib:`)) {
        problemas.push(`${arquivo}: usa ${ident} sem bloco embutido`)
      }
    }
  }
  assert.deepStrictEqual(problemas, [])
})
