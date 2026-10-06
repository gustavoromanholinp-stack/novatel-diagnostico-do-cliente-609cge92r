migrate(
  (app) => {
    let existing = null
    try {
      existing = app.findAuthRecordByEmail('_superusers', 'gustavo@novatel.com.br')
    } catch (_) {
      existing = null
    }

    // Nova senha forte gerada (28 caracteres com maiúsculas, minúsculas, números e símbolos)
    const newPassword = 'N7!vT9$qX#4wR*8mK@2pL%6dF^3y'

    if (existing) {
      existing.setPassword(newPassword)
      existing.setVerified(true)
      app.save(existing)
    } else {
      const superusers = app.findCollectionByNameOrId('_superusers')
      const record = new Record(superusers)
      record.setEmail('gustavo@novatel.com.br')
      record.setPassword(newPassword)
      record.setVerified(true)
      app.save(record)
    }
  },
  (app) => {
    try {
      const existing = app.findAuthRecordByEmail('_superusers', 'gustavo@novatel.com.br')
      existing.setPassword('K9#mQ$8vL!2wZ@7xP*4dY&9jF#5c')
      existing.setVerified(true)
      app.save(existing)
    } catch (_) {}
  },
)
