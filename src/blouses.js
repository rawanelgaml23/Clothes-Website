const menuButton = document.querySelector('.menu-toggle')
const navigation = document.querySelector('.main-nav')
const bagButton = document.querySelector('.bag-button')
const cartOverlay = document.querySelector('#cart-overlay')
const cartCloseButton = document.querySelector('.cart-close')
const cartCheckoutLink = document.querySelector('.cart-checkout')
const cartItemsList = document.querySelector('.cart-items')
const cartEmpty = document.querySelector('.cart-empty')
const cartSummary = document.querySelector('.cart-summary')
const cartTotalElement = document.querySelector('.cart-total')
const cartTotalNote = document.querySelector('.cart-total-note')
const cartStatus = document.querySelector('.cart-status')
const cartCount = document.querySelector('.bag-count')
const cartTitleCount = document.querySelector('.cart-title-count')
const cartStorageKey = 'salma-cart'
let cart = loadCart()
let previousFocus = null

function loadCart() {
  const savedCart = localStorage.getItem(cartStorageKey)
  if (!savedCart) return []

  try {
    const parsedCart = JSON.parse(savedCart)
    if (
      !Array.isArray(parsedCart) ||
      parsedCart.some(
        (item) =>
          typeof item.id !== 'string' ||
          typeof item.name !== 'string' ||
          typeof item.image !== 'string' ||
          typeof item.description !== 'string' ||
          ('price' in item && item.price !== null && (typeof item.price !== 'number' || !Number.isFinite(item.price) || item.price < 0)) ||
          !Number.isInteger(item.quantity) ||
          item.quantity < 1,
      )
    ) {
      throw new Error('Saved cart has an invalid format.')
    }
    return parsedCart
  } catch (error) {
    console.error('Could not read the saved shopping bag.', error)
    cartStatus.textContent = 'We could not load your saved bag. Please clear your browser storage and try again.'
    return []
  }
}

function saveCart(nextCart) {
  try {
    localStorage.setItem(cartStorageKey, JSON.stringify(nextCart))
    return true
  } catch (error) {
    console.error('Could not save the shopping bag.', error)
    cartStatus.textContent = 'Your bag could not be saved. Check your browser storage and try again.'
    return false
  }
}

function updateCart() {
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0)
  cartCount.textContent = String(itemCount)
  cartTitleCount.textContent = `(${itemCount})`
  bagButton.setAttribute('aria-label', `Shopping bag, ${itemCount} items`)
  cartItemsList.replaceChildren()
  cartEmpty.hidden = itemCount !== 0
  cartSummary.hidden = itemCount === 0
  cartCheckoutLink.hidden = itemCount === 0
  const hasUnpricedItems = cart.some((item) => typeof item.price !== 'number')
  const cartTotal = cart.reduce(
    (total, item) => total + (typeof item.price === 'number' ? item.price * item.quantity : 0),
    0,
  )
  cartTotalElement.textContent = `EGP ${cartTotal.toLocaleString('en-US')}`
  cartTotalNote.hidden = !hasUnpricedItems

  cart.forEach((item) => {
    const row = document.createElement('li')
    row.className = 'cart-item'

    const image = document.createElement('img')
    image.src = item.image
    image.alt = ''
    image.loading = 'lazy'

    const details = document.createElement('div')
    details.className = 'cart-item-details'

    const name = document.createElement('h3')
    name.textContent = item.name

    const description = document.createElement('p')
    description.textContent = item.description

    const price = document.createElement('p')
    price.className = 'cart-item-price'
    price.textContent = typeof item.price === 'number'
      ? `EGP ${item.price.toLocaleString('en-US')} each`
      : 'Price unavailable'

    const controls = document.createElement('div')
    controls.className = 'cart-item-controls'

    const quantity = document.createElement('span')
    quantity.textContent = `Qty: ${item.quantity}`

    const remove = document.createElement('button')
    remove.type = 'button'
    remove.className = 'cart-remove'
    remove.dataset.removeProduct = item.id
    remove.textContent = 'Remove'

    details.append(name, description, price, controls)
    controls.append(quantity, remove)
    row.append(image, details)
    cartItemsList.append(row)
  })
}

function openCart() {
  previousFocus = document.activeElement
  cartOverlay.hidden = false
  bagButton.setAttribute('aria-expanded', 'true')
  document.body.classList.add('cart-is-open')
  cartCloseButton.focus()
}

function closeCart() {
  cartOverlay.hidden = true
  bagButton.setAttribute('aria-expanded', 'false')
  document.body.classList.remove('cart-is-open')
  if (previousFocus instanceof HTMLElement) previousFocus.focus()
}

updateCart()

document.querySelectorAll('.product-card').forEach((card) => {
  const discountLabel = card.querySelector('.discount-label')
  if (!discountLabel) return

  const badge = document.createElement('span')
  badge.className = 'discount-badge'
  badge.textContent = discountLabel.textContent.trim()
  card.querySelector('.product-image-wrap').append(badge)
})

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

bagButton.addEventListener('click', openCart)
cartCloseButton.addEventListener('click', closeCart)
cartOverlay.addEventListener('click', (event) => {
  if (event.target === cartOverlay) closeCart()
})
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !cartOverlay.hidden) closeCart()
})

cartItemsList.addEventListener('click', (event) => {
  const removeButton = event.target.closest('[data-remove-product]')
  if (!removeButton) return

  const nextCart = cart.filter((item) => item.id !== removeButton.dataset.removeProduct)
  if (!saveCart(nextCart)) return
  cart = nextCart
  updateCart()
  cartStatus.textContent = 'Item removed from your bag.'
})

document.querySelectorAll('.quick-add').forEach((button) => {
  button.addEventListener('click', () => {
    const label = button.querySelector('.quick-add-label')
    const icon = button.querySelector('.quick-add-icon')
    const productId = button.dataset.productId
    const card = button.closest('.product-card')
    const productName =
      card.querySelector('.product-info h3')?.textContent.trim() || button.dataset.productName
    button.dataset.productName = productName
    const productImage = card.querySelector('.product-image:not(.product-hover-image)')
    const productDescription = card.querySelector('.product-info > p:not(.price-note)')
    const productPriceElement = card.querySelector('.sale-price, .product-price')
    const productPriceText = productPriceElement?.textContent.replace(/[^\d.]/g, '')
    const productPrice = Number(productPriceText)
    if (!productPriceText || !Number.isFinite(productPrice)) {
      console.error(`Could not read the price for ${productName}.`)
      cartStatus.textContent = 'This product could not be added because its price is unavailable.'
      return
    }
    const existingItem = cart.find((item) => item.id === productId)
    const nextCart = existingItem
      ? cart.map((item) =>
          item.id === productId
            ? { ...item, name: productName, price: productPrice, quantity: item.quantity + 1 }
            : item,
        )
      : [
          ...cart,
          {
            id: productId,
            name: productName,
            image: productImage.getAttribute('src'),
            description: productDescription?.textContent.trim() ?? '',
            price: productPrice,
            quantity: 1,
          },
        ]

    if (!saveCart(nextCart)) return
    cart = nextCart
    updateCart()

    label.textContent = 'ADDED TO CART'
    icon.textContent = '✓'
    button.setAttribute('aria-label', `${productName} added to cart`)
    button.classList.add('is-added')
    cartStatus.textContent = `${productName} added to your bag.`
  })
})
