import { Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border bg-card/70">
        <div className="container mx-auto flex flex-col items-start gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <span aria-hidden="true" className="h-5 w-1.5 rounded-full bg-primary"></span>
            NOVATEL TELECOM
          </span>
          <span
            className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-300"
            aria-label="Ambiente de demonstração"
          >
            Demonstração
          </span>
        </div>
      </header>
      <div className="flex-1">
        <Outlet />
      </div>
      <footer className="border-t border-border py-4">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          Central de Atendimento — dados de demonstração
        </div>
      </footer>
    </main>
  )
}
