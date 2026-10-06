migrate(
  (app) => {
    const superusers = app.findCollectionByNameOrId('_superusers')

    let existing = null
    try {
      existing = app.findAuthRecordByEmail('_superusers', 'gustavo@novatel.com.br')
    } catch (_) {
      existing = null
    }

    // Senha forte gerada: 28 caracteres com maiúsculas, minúsculas, números e símbolos
    // Atende aos requisitos do usuário: mínimo 20 caracteres
    const passwordPlain = 'K9#mQ$8vL!2wZ@7xP*4dY&9jF#5c'

    if (existing) {
      existing.setPassword(passwordPlain)
      existing.setVerified(true)
      app.save(existing)
    } else {
      const record = new Record(superusers)
      record.setEmail('gustavo@novatel.com.br')
      record.setPassword(passwordPlain)
      record.setVerified(true)
      app.save(record)
    }
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('_superusers', 'gustavo@novatel.com.br')
      app.delete(record)
    } catch (_) {}
  },
)
