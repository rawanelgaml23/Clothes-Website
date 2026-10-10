const accountStorageKey = 'salma-account'

function getSavedAccount() {
  const savedAccount = localStorage.getItem(accountStorageKey)
  if (!savedAccount) return null

  try {
    const account = JSON.parse(savedAccount)
    if (
      typeof account.name === 'string' &&
      typeof account.email === 'string'
    ) {
      return account
    }
  } catch {
    localStorage.removeItem(accountStorageKey)
  }

  return null
}

function renderAccountLink() {
  const account = getSavedAccount()
  if (!account) return

  document.querySelectorAll('.account-button').forEach((link) => {
    link.href = './index.html#home'
    link.title = `${account.name} (${account.email})`
    link.setAttribute('aria-label', `Signed in as ${account.name}`)
  })
}

renderAccountLink()
window.addEventListener('storage', (event) => {
  if (event.key === accountStorageKey) renderAccountLink()
})
