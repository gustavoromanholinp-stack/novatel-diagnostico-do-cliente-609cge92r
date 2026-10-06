#!/usr/bin/env node
/**
 * embutir-lib.mjs — ramo B do spike (SPEC-2-001, CA-2-04).
 * Genérico: para cada par
 *   // >>> lib:<nome> sha256:<hash>
 *   // <<< lib:<nome>
 * dentro de cada pocketbase/hooks/*.js, insere o conteúdo de
 * pocketbase/lib/<nome>.cjs envolvido numa função IIFE
 * (const <ident> = (function () { … return { … }; })();) — com a linha
 * module.exports = { … } trocada por return { … } — ou, para
 * pocketbase/lib/<nome>.json, const <ident> = <JSON>;.
 * <ident> é <nome> com "-" trocado por "_"; <hash> é o SHA-256 do arquivo da lib.
 * Um hook pode ter vários blocos; nome sem arquivo correspondente faz o script falhar.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const hooksDir = join(raiz, 'pocketbase', 'hooks')
const libDir = join(raiz, 'pocketbase', 'lib')

function sha256Arquivo(caminho) {
  return createHash('sha256').update(readFileSync(caminho)).digest('hex')
}

function conteudoEmbutido(nome) {
  const cjs = join(libDir, `${nome}.cjs`)
  const json = join(libDir, `${nome}.json`)
  const ident = nome.replaceAll('-', '_')
  if (existsSync(cjs)) {
    const fonte = readFileSync(cjs, 'utf8')
    const corpo = fonte.replace(/^module\.exports\s*=\s*(\{[\s\S]*?\})\s*$/m, 'return $1')
    if (corpo === fonte) {
      throw new Error(`lib ${nome}.cjs sem linha module.exports no fim`)
    }
    return `const ${ident} = (function () {\n${corpo}\n})();`
  }
  if (existsSync(json)) {
    return `const ${ident} = ${readFileSync(json, 'utf8').trim()};`
  }
  throw new Error(`arquivo da lib "${nome}" não existe (nem .cjs nem .json)`)
}

let alterados = 0
for (const arquivo of readdirSync(hooksDir)) {
  if (!arquivo.endsWith('.js')) continue
  const caminho = join(hooksDir, arquivo)
  const original = readFileSync(caminho, 'utf8')
  const saida = original.replaceAll(
    /\/\/ >>> lib:([\w-]+) sha256:[0-9a-f]{64}\n([\s\S]*?)\/\/ <<< lib:\1\n/g,
    (inteiro, nome) => {
      const hash = sha256Arquivo(join(libDir, nome.endsWith('.json') ? nome : `${nome}.cjs`))
      const novo = `// >>> lib:${nome} sha256:${hash}\n${conteudoEmbutido(nome)}\n// <<< lib:${nome}\n`
      return novo === inteiro ? inteiro : novo
    },
  )
  if (saida !== original) {
    writeFileSync(caminho, saida)
    alterados += 1
    console.log(`embutido: pocketbase/hooks/${arquivo}`)
  }
}
console.log(`concluído — ${alterados} hook(s) atualizado(s)`)
