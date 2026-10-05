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
import { Search, SlidersHorizontal } from 'lucide-react'

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
    <div className="container relative mx-auto px-4 py-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-primary/15 to-transparent" />
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Central de Atendimento</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        Consulta de cadastro, serviços, faturas e diagnóstico — ambiente de demonstração com dados
        sintéticos.
      </p>

      <div className="mt-8 max-w-xl space-y-5">
        <div className="rounded-xl border border-border bg-card/60 p-4 shadow-lg shadow-black/20">
          <label
            htmlFor="cenario-demo"
            className="mb-2 flex items-center gap-2 text-sm font-medium"
          >
            <SlidersHorizontal className="h-4 w-4 text-primary" aria-hidden="true" />
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
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base [&>option]:bg-card [&>option]:text-foreground"
          >
            {CENARIOS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border border-border bg-card/60 p-4 shadow-lg shadow-black/20">
          <label
            htmlFor="busca-cliente"
            className="mb-2 flex items-center gap-2 text-sm font-medium"
          >
            <Search className="h-4 w-4 text-primary" aria-hidden="true" />
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
              className="h-11 text-base"
            />
            <Button onClick={buscar} disabled={buscando} className="h-11">
              {buscando ? 'Buscando…' : 'Buscar'}
            </Button>
          </div>
          {erroNome !== null && (
            <p id="erro-busca" role="alert" className="mt-2 text-sm text-destructive">
              {erroNome}
            </p>
          )}
        </div>
      </div>

      {clientes !== null && clientes.length === 0 && (
        <div className="mt-6 max-w-xl rounded-xl border p-5" role="status">
          <p className="text-base font-medium">Cliente não encontrado</p>
          <p className="mt-1 text-base text-muted-foreground">
            Revise o nome informado e tente novamente.
          </p>
        </div>
      )}

      {clientes !== null && clientes.length > 0 && (
        <div className="mt-8 max-w-xl">
          <h2 className="text-base font-medium">Resultados — selecione o cliente</h2>
          <div className="mt-3 space-y-3">
            {clientes.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => escolherCliente(c)}
                aria-pressed={clienteSel?.id === c.id}
                className={`w-full rounded-xl border p-4 text-left transition-all hover:bg-accent hover:shadow-lg hover:shadow-black/20 ${
                  clienteSel?.id === c.id ? 'border-primary bg-accent ring-1 ring-primary/60' : ''
                }`}
              >
                <span className="text-base font-medium">{c.nome}</span>
                <Badge variant="secondary" className="ml-2">
                  Ref. {c.referencia_mascarada}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      )}

      {clienteSel !== null && (
        <div className="mt-8 max-w-xl">
          <h2 className="text-base font-medium">
            Serviços de {clienteSel.nome} (Ref. {clienteSel.referencia_mascarada}) — selecione o
            serviço
          </h2>
          {buscandoServicos && (
            <p className="mt-3 text-base text-muted-foreground" role="status">
              Carregando serviços…
            </p>
          )}
          {servicos !== null && servicos.length === 0 && (
            <p className="mt-3 text-base text-muted-foreground" role="status">
              Nenhum serviço vinculado a este cliente na demonstração.
            </p>
          )}
          {servicos !== null && servicos.length > 0 && (
            <div className="mt-3 space-y-3">
              {servicos.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setServicoSel(s)}
                  aria-pressed={servicoSel?.id === s.id}
                  className={`w-full rounded-xl border p-4 text-left transition-all hover:bg-accent hover:shadow-lg hover:shadow-black/20 ${
                    servicoSel?.id === s.id ? 'border-primary bg-accent ring-1 ring-primary/60' : ''
                  }`}
                >
                  <span className="text-base font-medium capitalize">{s.tipo}</span>
                  <span className="ml-2 text-sm text-muted-foreground">
                    {s.plano} · Ativo {s.ativo_id}
                  </span>
                </button>
              ))}
            </div>
          )}
          <div className="mt-6">
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
              className="h-11 px-8"
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
