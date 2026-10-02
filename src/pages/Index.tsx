import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { provider } from '@/lib/central/provider'
import {
  CENARIOS,
  ehCenario,
  type Cliente,
  type Cenario,
  type Servico,
} from '@/lib/central/contracts'
import type { ConsultaAlvo } from '@/lib/central/use-consulta'

const MIN_NOME = 3
const MAX_NOME = 120

const Index = ({ onConsultar }: { onConsultar: (alvo: ConsultaAlvo) => void }) => {
  const [termo, setTermo] = useState('')
  const [cenario, setCenario] = useState<Cenario>('normal')
  const [clientes, setClientes] = useState<Cliente[] | null>(null)
  const [servicos, setServicos] = useState<Servico[] | null>(null)
  const [clienteSel, setClienteSel] = useState<Cliente | null>(null)
  const [servicoSel, setServicoSel] = useState<Servico | null>(null)
  const [erroNome, setErroNome] = useState<string | null>(null)
  const [buscando, setBuscando] = useState(false)
  const [buscandoServicos, setBuscandoServicos] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  const buscar = useCallback(async () => {
    const nome = termo.trim()
    if (nome.length < MIN_NOME || nome.length > MAX_NOME) {
      setErroNome(
        nome.length < MIN_NOME
          ? `Informe o nome completo do cliente (mínimo ${MIN_NOME} caracteres).`
          : `Nome muito longo (máximo ${MAX_NOME} caracteres).`,
      )
      setClientes(null)
      setClienteSel(null)
      setServicos(null)
      setServicoSel(null)
      return
    }
    setErroNome(null)
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setBuscando(true)
    setClientes(null)
    setClienteSel(null)
    setServicos(null)
    setServicoSel(null)
    try {
      const resultado = await provider.searchClients(nome, { signal: ctrl.signal, cenario })
      if (ctrl.signal.aborted) return
      setClientes(resultado)
    } catch (e) {
      if (!ctrl.signal.aborted) {
        setClientes([])
        setErroNome('Não foi possível concluir a busca. Tente novamente.')
      }
    } finally {
      if (!ctrl.signal.aborted) setBuscando(false)
    }
  }, [termo, cenario])

  const escolherCliente = useCallback(
    async (cliente: Cliente) => {
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl
      setClienteSel(cliente)
      setServicoSel(null)
      setServicos(null)
      setBuscandoServicos(true)
      try {
        const lista = await provider.listServices(cliente.id, { signal: ctrl.signal, cenario })
        if (ctrl.signal.aborted) return
        setServicos(lista)
      } catch (e) {
        if (!ctrl.signal.aborted) setServicos([])
      } finally {
        if (!ctrl.signal.aborted) setBuscandoServicos(false)
      }
    },
    [cenario],
  )

  const podeConsultar = clienteSel !== null && servicoSel !== null

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold md:text-3xl">Central de Atendimento</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Consulta de cadastro, serviços, faturas e diagnóstico — ambiente de demonstração com dados
        sintéticos.
      </p>

      <div className="mt-6 max-w-xl">
        <label htmlFor="cenario-demo" className="mb-1 block text-sm font-medium">
          Cenário de demonstração
        </label>
        <select
          id="cenario-demo"
          value={cenario}
          onChange={(e) => {
            const valor = e.target.value
            if (ehCenario(valor)) {
              setCenario(valor)
              setClientes(null)
              setClienteSel(null)
              setServicos(null)
              setServicoSel(null)
              setErroNome(null)
            }
          }}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {CENARIOS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <label htmlFor="busca-cliente" className="mb-1 mt-4 block text-sm font-medium">
          Buscar cliente (nome completo)
        </label>
        <div className="flex gap-2">
          <Input
            id="busca-cliente"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Ex.: Cliente Demonstração"
            aria-invalid={erroNome !== null}
            aria-describedby={erroNome !== null ? 'erro-busca' : undefined}
          />
          <Button onClick={buscar} disabled={buscando}>
            {buscando ? 'Buscando…' : 'Buscar'}
          </Button>
        </div>
        {erroNome !== null && (
          <p id="erro-busca" role="alert" className="mt-2 text-sm text-destructive">
            {erroNome}
          </p>
        )}
      </div>

      {clientes !== null && clientes.length === 0 && (
        <div className="mt-6 max-w-xl rounded-md border p-4" role="status">
          <p className="text-sm font-medium">Cliente não encontrado</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Revise o nome informado e tente novamente.
          </p>
        </div>
      )}

      {clientes !== null && clientes.length > 0 && (
        <div className="mt-6 max-w-xl">
          <h2 className="text-sm font-medium">Resultados — selecione o cliente</h2>
          <div className="mt-2 space-y-2">
            {clientes.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => escolherCliente(c)}
                aria-pressed={clienteSel?.id === c.id}
                className={`w-full rounded-md border p-3 text-left transition-colors hover:bg-accent ${
                  clienteSel?.id === c.id ? 'border-primary bg-accent' : ''
                }`}
              >
                <span className="font-medium">{c.nome}</span>
                <Badge variant="secondary" className="ml-2">
                  Ref. {c.referencia_mascarada}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      )}

      {clienteSel !== null && (
        <div className="mt-6 max-w-xl">
          <h2 className="text-sm font-medium">
            Serviços de {clienteSel.nome} (Ref. {clienteSel.referencia_mascarada}) — selecione o
            serviço
          </h2>
          {buscandoServicos && (
            <p className="mt-2 text-sm text-muted-foreground" role="status">
              Carregando serviços…
            </p>
          )}
          {servicos !== null && servicos.length === 0 && (
            <p className="mt-2 text-sm text-muted-foreground" role="status">
              Nenhum serviço vinculado a este cliente na demonstração.
            </p>
          )}
          {servicos !== null && servicos.length > 0 && (
            <div className="mt-2 space-y-2">
              {servicos.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setServicoSel(s)}
                  aria-pressed={servicoSel?.id === s.id}
                  className={`w-full rounded-md border p-3 text-left transition-colors hover:bg-accent ${
                    servicoSel?.id === s.id ? 'border-primary bg-accent' : ''
                  }`}
                >
                  <span className="font-medium">{s.tipo}</span>
                  <span className="ml-2 text-sm text-muted-foreground">
                    {s.plano} · Ativo {s.ativo_id}
                  </span>
                </button>
              ))}
            </div>
          )}
          <div className="mt-4">
            <Button
              disabled={!podeConsultar}
              title={
                podeConsultar ? undefined : 'Selecione um cliente e um serviço antes de consultar'
              }
              onClick={() => {
                if (clienteSel !== null && servicoSel !== null) {
                  onConsultar({ cliente: clienteSel, servico: servicoSel, cenario })
                }
              }}
            >
              {podeConsultar ? 'Consultar' : 'Consultar (selecione cliente e serviço)'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Index
