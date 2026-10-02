import { Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-2 px-4 py-3">
          <span className="text-lg font-bold tracking-tight">NOVATEL TELECOM</span>
          <span
            className="rounded-full border border-amber-600 bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800"
            aria-label="Ambiente de demonstração"
          >
            Demonstração
          </span>
        </div>
      </header>
      <div className="flex-1">
        <Outlet />
      </div>
      <footer className="border-t py-3">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          Central de Atendimento — dados de demonstração
        </div>
      </footer>
    </main>
  )
}
