import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const Index = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold md:text-3xl">Central de Atendimento</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Consulta de cadastro, serviços, faturas e diagnóstico — ambiente de demonstração com dados
        sintéticos.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Cadastro</CardTitle>
            <CardDescription>Dados do cliente de demonstração</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Bloco em construção nesta fase visual.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Faturas</CardTitle>
            <CardDescription>Situação financeira sintética</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Bloco em construção nesta fase visual.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Diagnóstico</CardTitle>
            <CardDescription>Estados técnicos exemplificados</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Bloco em construção nesta fase visual.
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Index
