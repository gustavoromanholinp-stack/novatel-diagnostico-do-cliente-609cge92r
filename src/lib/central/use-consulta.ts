import { useCallback, useEffect, useRef, useState } from 'react'
import type { Cliente, Contexto, Cenario, EstadoFonte, Servico } from './contracts'
import { provider } from './provider'

export interface ConsultaAlvo {
  cliente: Cliente
  servico: Servico
  cenario: Cenario
}

export interface AlvoAtivo extends ConsultaAlvo {
  request_id: string
}

export interface EstadosFonte {
  mk: EstadoFonte
  tecnica: EstadoFonte
}

/**
 * Controlador da consulta simulada (SPEC-1-002): cria request_id, consome
 * eventos com guarda de request_id/geração, cancela ao voltar/trocar e só
 * aceita contexto que corresponde à seleção corrente.
 */
export function useConsulta() {
  const [alvo, setAlvo] = useState<AlvoAtivo | null>(null)
  const [estados, setEstados] = useState<EstadosFonte>({
    mk: 'consultando',
    tecnica: 'consultando',
  })
  const [contexto, setContexto] = useState<Contexto | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const ctrlRef = useRef<AbortController | null>(null)
  const geracaoRef = useRef(0)
  const alvoRef = useRef<AlvoAtivo | null>(null)

  const iniciar = useCallback((novoAlvo: ConsultaAlvo) => {
    ctrlRef.current?.abort()
    geracaoRef.current += 1
    const geracao = geracaoRef.current
    const request_id = crypto.randomUUID()
    const atual: AlvoAtivo = { ...novoAlvo, request_id }
    alvoRef.current = atual
    setAlvo(atual)
    setEstados({ mk: 'consultando', tecnica: 'consultando' })
    setContexto(null)
    setErro(null)

    const ctrl = new AbortController()
    ctrlRef.current = ctrl

    provider
      .getContext(
        {
          cliente_id: novoAlvo.cliente.id,
          servico_id: novoAlvo.servico.id,
          request_id,
          cenario: novoAlvo.cenario,
        },
        {
          signal: ctrl.signal,
          onSourceState: (evento) => {
            if (evento.request_id !== request_id || evento.geracao !== geracao) return
            if (alvoRef.current?.request_id !== request_id) return
            setEstados((prev) =>
              evento.fonte_id === 'mk'
                ? { ...prev, mk: evento.estado }
                : evento.fonte_id === 'tecnica'
                  ? { ...prev, tecnica: evento.estado }
                  : prev,
            )
          },
        },
      )
      .then((ctx) => {
        if (ctrl.signal.aborted) return
        if (alvoRef.current?.request_id !== request_id || geracaoRef.current !== geracao) return
        setContexto(ctx)
      })
      .catch(() => {
        if (ctrl.signal.aborted) return
        if (alvoRef.current?.request_id !== request_id) return
        setErro('Não foi possível concluir a consulta simulada. Volte e tente novamente.')
      })
  }, [])

  const invalidar = useCallback(() => {
    ctrlRef.current?.abort()
    geracaoRef.current += 1
    alvoRef.current = null
    setAlvo(null)
    setContexto(null)
    setEstados({ mk: 'consultando', tecnica: 'consultando' })
    setErro(null)
  }, [])

  useEffect(() => {
    return () => {
      ctrlRef.current?.abort()
      geracaoRef.current += 1
    }
  }, [])

  return { alvo, estados, contexto, erro, iniciar, invalidar }
}
