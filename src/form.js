import { readApiResponse } from './api-response.js'

const menuButton = document.querySelector('.menu-toggle')
const navigation = document.querySelector('.main-nav')
const signUpForm = document.querySelector('#sign-up-form')
const signUpMessage = document.querySelector('#sign-up-message')
const submitButton = signUpForm.querySelector('button[type="submit"]')

menuButton.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') !== 'true'
  menuButton.setAttribute('aria-expanded', String(isOpen))
  menuButton.setAttribute(
    'aria-label',
    isOpen ? 'Close navigation menu' : 'Open navigation menu',
  )
  menuButton.classList.toggle('is-open', isOpen)
  navigation.classList.toggle('is-open', isOpen)
})

navigation.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    menuButton.setAttribute('aria-expanded', 'false')
    menuButton.setAttribute('aria-label', 'Open navigation menu')
    menuButton.classList.remove('is-open')
    navigation.classList.remove('is-open')
  })
})

signUpForm.addEventListener('submit', async (event) => {
  event.preventDefault()
  signUpMessage.textContent = ''
  signUpMessage.classList.remove('is-error')
  submitButton.disabled = true

  try {
    const response = await fetch('/api/sign-up', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(signUpForm))),
    })
    const result = await readApiResponse(response)

    if (!response.ok) {
      signUpMessage.textContent = result.message || 'Unable to create the account.'
      signUpMessage.classList.add('is-error')
      return
    }

    signUpMessage.textContent = result.message
    localStorage.setItem('salma-account', JSON.stringify(result.user))
    signUpForm.reset()
    window.setTimeout(() => {
      window.location.assign('./index.html')
    }, 1200)
  } catch (error) {
    signUpMessage.textContent = error.message || 'Could not connect to the server. Please try again.'
    signUpMessage.classList.add('is-error')
  } finally {
    submitButton.disabled = false
  }
})
