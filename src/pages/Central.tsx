import { useCallback, useState } from 'react'
import Index from './pages/Index'
import Progresso from './pages/Progresso'
import Resultado from './pages/Resultado'
import type { ConsultaAlvo } from './lib/central/use-consulta'
import { useConsulta } from './lib/central/use-consulta'

const Central = () => {
  const [emConsulta, setEmConsulta] = useState(false)
  const { alvo, estados, contexto, erro, iniciar, invalidar } = useConsulta()

  const consultar = useCallback(
    (novoAlvo: ConsultaAlvo) => {
      iniciar(novoAlvo)
      setEmConsulta(true)
    },
    [iniciar],
  )

  const voltar = useCallback(() => {
    invalidar()
    setEmConsulta(false)
  }, [invalidar])

  if (emConsulta && alvo !== null && contexto !== null) {
    return <Resultado contexto={contexto} onVoltar={voltar} />
  }

  if (emConsulta && alvo !== null) {
    if (erro !== null) {
      return (
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold md:text-3xl">Consulta simulada</h1>
          <p role="alert" className="mt-2 text-sm text-destructive">
            {erro}
          </p>
          <button
            type="button"
            onClick={voltar}
            className="mt-4 rounded-md border px-4 py-2 text-sm hover:bg-accent"
          >
            Voltar
          </button>
        </div>
      )
    }
    return <Progresso alvo={alvo} estados={estados} onVoltar={voltar} />
  }

  return <Index onConsultar={consultar} />
}

export default Central
