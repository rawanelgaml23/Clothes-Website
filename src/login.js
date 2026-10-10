const loginForm = document.querySelector('#login-form')
const loginMessage = document.querySelector('#login-message')
const submitButton = loginForm.querySelector('button[type="submit"]')

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault()
  loginMessage.textContent = ''
  loginMessage.classList.remove('is-error')
  submitButton.disabled = true

  try {
    const response = await fetch('/api/sign-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(loginForm))),
    })
    const result = await response.json()

    if (!response.ok) {
      loginMessage.textContent = result.message || 'Unable to sign in.'
      loginMessage.classList.add('is-error')
      return
    }

    loginMessage.textContent = result.message
    localStorage.setItem('salma-account', JSON.stringify(result.user))
    loginForm.reset()
    window.setTimeout(() => {
      window.location.assign('./index.html')
    }, 1200)
  } catch {
    loginMessage.textContent = 'Could not connect to the server. Please try again.'
    loginMessage.classList.add('is-error')
  } finally {
    submitButton.disabled = false
  }
})
