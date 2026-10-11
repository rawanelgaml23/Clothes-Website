import { readApiResponse } from './api-response.js'

const cartStorageKey = 'salma-cart'
const savedDetailsStorageKey = 'salma-checkout-details'
const checkoutForm = document.querySelector('#checkout-form')
const checkoutMessage = document.querySelector('#checkout-message')
const checkoutItems = document.querySelector('#checkout-items')
const checkoutEmpty = document.querySelector('#checkout-empty')
const checkoutSubtotal = document.querySelector('#checkout-subtotal')
const checkoutTotal = document.querySelector('#checkout-total')
const checkoutShippingSummary = document.querySelector('#checkout-shipping-summary')
const checkoutButton = document.querySelector('.checkout-submit')
const billingFields = document.querySelector('#billing-fields')
const billingInputs = [...billingFields.querySelectorAll('input, select')]
const shippingCost = 100
const formatCurrency = (amount) =>
  `E£${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function readCart() {
  try {
    const savedCart = localStorage.getItem(cartStorageKey)
    if (!savedCart) return []

    const cart = JSON.parse(savedCart)
    if (
      !Array.isArray(cart) ||
      cart.some(
        (item) =>
          typeof item.id !== 'string' ||
          typeof item.name !== 'string' ||
          typeof item.image !== 'string' ||
          typeof item.description !== 'string' ||
          typeof item.price !== 'number' ||
          !Number.isFinite(item.price) ||
          item.price < 0 ||
          !Number.isInteger(item.quantity) ||
          item.quantity < 1,
      )
    ) {
      throw new Error('The saved cart is incomplete or has an invalid format.')
    }
    return cart
  } catch (error) {
    console.error('Could not load the saved shopping bag for checkout.', error)
    checkoutMessage.textContent = 'We could not load your bag. Return to the store and try again.'
    checkoutMessage.classList.add('is-error')
    return []
  }
}

const cart = readCart()
let subtotal = 0

for (const item of cart) {
  const row = document.createElement('li')
  row.className = 'checkout-item'

  const image = document.createElement('img')
  image.src = item.image
  image.alt = ''
  image.loading = 'lazy'

  const details = document.createElement('div')
  details.className = 'checkout-item-details'

  const name = document.createElement('h3')
  name.textContent = item.name

  const description = document.createElement('p')
  description.textContent = item.description

  const quantity = document.createElement('span')
  quantity.className = 'checkout-item-quantity'
  quantity.textContent = `Qty ${item.quantity}`

  const lineTotal = item.price * item.quantity
  subtotal += lineTotal
  const price = document.createElement('strong')
  price.textContent = formatCurrency(lineTotal)

  details.append(name, description, quantity)
  row.append(image, details, price)
  checkoutItems.append(row)
}

checkoutEmpty.hidden = cart.length > 0
checkoutSubtotal.textContent = formatCurrency(subtotal)
checkoutShippingSummary.textContent = formatCurrency(shippingCost)
checkoutTotal.textContent = formatCurrency(cart.length ? subtotal + shippingCost : 0)
checkoutButton.disabled = cart.length === 0

try {
  const savedDetails = JSON.parse(localStorage.getItem(savedDetailsStorageKey) || 'null')
  if (savedDetails && typeof savedDetails === 'object') {
    for (const field of ['email', 'firstName', 'lastName', 'phone', 'governorate', 'address', 'apartment', 'city', 'postalCode']) {
      const input = checkoutForm.elements.namedItem(field)
      if (input && typeof savedDetails[field] === 'string') input.value = savedDetails[field]
    }
    if (typeof savedDetails.name === 'string' && !savedDetails.lastName) {
      const [firstName = '', ...lastName] = savedDetails.name.trim().split(/\s+/)
      checkoutForm.elements.firstName.value = firstName
      checkoutForm.elements.lastName.value = lastName.join(' ')
    }
    checkoutForm.elements.namedItem('saveInformation').checked = true
  }

  const account = JSON.parse(localStorage.getItem('salma-account') || 'null')
  if (account && typeof account === 'object') {
    if (!checkoutForm.elements.email.value && typeof account.email === 'string') {
      checkoutForm.elements.email.value = account.email
    }
    if (!checkoutForm.elements.lastName.value && typeof account.name === 'string') {
      const [firstName = '', ...lastName] = account.name.trim().split(/\s+/)
      checkoutForm.elements.firstName.value = firstName
      checkoutForm.elements.lastName.value = lastName.join(' ')
    }
  }
} catch (error) {
  console.error('Could not load saved checkout details.', error)
}

document.querySelectorAll('input[name="billingAddress"]').forEach((input) => {
  input.addEventListener('change', () => {
    const useDifferentAddress = checkoutForm.elements.billingAddress.value === 'different'
    billingFields.hidden = !useDifferentAddress
    billingInputs.forEach((field) => {
      field.required = useDifferentAddress
    })
  })
})

checkoutForm.addEventListener('submit', async (event) => {
  event.preventDefault()
  checkoutMessage.classList.remove('is-error')
  checkoutMessage.textContent = ''

  if (!cart.length) {
    checkoutMessage.textContent = 'Your bag is empty. Add an item before checking out.'
    checkoutMessage.classList.add('is-error')
    return
  }

  const form = new FormData(checkoutForm)
  const customer = {
    name: `${form.get('firstName').trim()} ${form.get('lastName').trim()}`.trim(),
    email: form.get('email').trim(),
    phone: form.get('phone').trim(),
  }
  const shippingAddress = {
    country: form.get('country'),
    governorate: form.get('governorate'),
    address: form.get('address').trim(),
    apartment: form.get('apartment').trim(),
    city: form.get('city').trim(),
    postalCode: form.get('postalCode').trim(),
  }
  const useDifferentBillingAddress = form.get('billingAddress') === 'different'
  const billingAddress = useDifferentBillingAddress
    ? {
        name: form.get('billingName').trim(),
        governorate: form.get('billingGovernorate'),
        address: form.get('billingAddressLine').trim(),
        city: form.get('billingCity').trim(),
      }
    : null

  if (form.get('saveInformation')) {
    try {
      localStorage.setItem(
        savedDetailsStorageKey,
        JSON.stringify({
          email: customer.email,
          firstName: form.get('firstName').trim(),
          lastName: form.get('lastName').trim(),
          phone: customer.phone,
          ...shippingAddress,
        }),
      )
    } catch (error) {
      console.error('Could not save checkout details.', error)
      checkoutMessage.textContent = 'Your details could not be saved in this browser. Please try again.'
      checkoutMessage.classList.add('is-error')
      return
    }
  }

  checkoutButton.disabled = true
  checkoutButton.textContent = 'PLACING ORDER...'

  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer,
        shippingAddress,
        billingAddress,
        saveInformation: Boolean(form.get('saveInformation')),
        marketingOptIn: Boolean(form.get('marketingOptIn')),
        paymentMethod: form.get('paymentMethod'),
        items: cart,
      }),
    })
    const result = await readApiResponse(response)
    if (!response.ok) throw new Error(result.message || 'Your order could not be placed.')

    try {
      localStorage.removeItem(cartStorageKey)
    } catch (error) {
      console.error('Order was saved, but the local shopping bag could not be cleared.', error)
    }

    checkoutMessage.textContent = `Thank you! Your order #${result.orderId} has been received.`
    checkoutButton.textContent = 'ORDER RECEIVED'
  } catch (error) {
    console.error('Could not submit the order.', error)
    checkoutMessage.textContent = error.message || 'Your order could not be placed. Please try again.'
    checkoutMessage.classList.add('is-error')
    checkoutButton.disabled = false
    checkoutButton.textContent = 'SUBMIT ORDER'
  }
})
