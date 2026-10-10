import { useMemo, useState } from 'react'
import './App.css'

import backgroundImage from './assets/bg.jpeg'
import productOne from './assets/ima1.jpg'
import productTwo from './assets/ima2.jpeg'
import productThree from './assets/ima3.jpeg'
import productFour from './assets/ima4.jpg'
import productFive from './assets/ima5.jpg'
import productSix from './assets/ima6.jpg'
import logo from './assets/logo.png'

const products = [
  {
    name: 'SAM FULL SUIT',
    details: '3 Sizes / 3 Colors',
    price: '1,000',
    previousPrice: '1,450',
    discount: '-31%',
    image: productOne,
    alt: 'Sam full suit in black, grey, and pink',
  },
  {
    name: 'SAM FULL SUIT',
    details: '3 Sizes / 4 Brands',
    price: '1,100',
    image: productTwo,
    alt: 'Sam full suit in several colors',
  },
  {
    name: 'SAM FULL SUIT',
    details: '3 Sizes / 4 Colors',
    price: '600',
    previousPrice: '850',
    discount: '-29%',
    image: productThree,
    alt: 'Sam full suit collection',
  },
  {
    name: 'SAM FULL SUIT',
    details: '3 Sizes',
    price: '450',
    image: productFour,
    alt: 'Sam full suit',
  },
  {
    name: 'SAM FULL SUIT',
    details: '2 Sizes / 4 Brands',
    price: '720',
    image: productFive,
    alt: 'Sam full suit',
  },
  {
    name: 'SAM FULL SUIT',
    details: '3 Sizes / 3 Colors',
    price: '500',
    previousPrice: '650',
    discount: '-23%',
    image: productSix,
    alt: 'Sam full suit',
  },
]

const productCategories = [
  'ABAYAS',
  'MODEST LINENS',
  'DRESSES',
  'SETS',
  'SKIRTS',
  'BLOUSES',
  'KHIMAR',
  'SCARFS',
  'MEDICAL SCRUBS',
]

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 5 5" />
    </svg>
  )
}

function BagIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M5 8h14l1 13H4L5 8Z" />
      <path d="M9 9V6a3 3 0 0 1 6 0v3" />
    </svg>
  )
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [cartCount, setCartCount] = useState(0)
  const [cartMessage, setCartMessage] = useState('')

  const visibleProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return products

    return products.filter((product) =>
      `${product.name} ${product.details} ${product.price} ${product.alt}`
        .toLowerCase()
        .includes(term),
    )
  }, [searchTerm])

  const closeMenu = () => setMenuOpen(false)

  const addToBag = (productName) => {
    setCartCount((count) => count + 1)
    setCartMessage(`${productName} added to your bag.`)
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#home" aria-label="Salma home" onClick={closeMenu}>
          <img src={logo} alt="Salma" />
        </a>

        <button
          className={`menu-toggle${menuOpen ? ' is-open' : ''}`}
          type="button"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`main-nav${menuOpen ? ' is-open' : ''}`} aria-label="Main navigation">
          <a href="#home" onClick={closeMenu}>HOME</a>
          <details className="nav-dropdown">
            <summary>ALL PRODUCTS</summary>
            <div className="dropdown-menu">
              {productCategories.map((category) => (
                <a href="#products" key={category} onClick={closeMenu}>{category}</a>
              ))}
            </div>
          </details>
          <details className="nav-dropdown">
            <summary>SHOP BY WINTER COLLECTION</summary>
            <div className="dropdown-menu">
              <a href="./hoodies.html" onClick={closeMenu}>HOODIES</a>
              <a href="./coats.html" onClick={closeMenu}>COATS</a>
            </div>
          </details>
          <a href="#policy" onClick={closeMenu}>OUR POLICY</a>
          <a href="#about" onClick={closeMenu}>ABOUT US</a>
        </nav>

        <div className="header-actions">
          <button
            className="icon-button"
            type="button"
            aria-label={searchOpen ? 'Close product search' : 'Search products'}
            aria-expanded={searchOpen}
            onClick={() => {
              setSearchOpen((open) => !open)
              setSearchTerm('')
            }}
          >
            <SearchIcon />
          </button>
          <a className="icon-button bag-button" href="#products" aria-label={`Shopping bag, ${cartCount} items`}>
            <BagIcon />
            <span className="bag-count" aria-live="polite">{cartCount}</span>
          </a>
          <a className="icon-button account-button" href="./form.html" aria-label="Sign in">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="3.5" />
              <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
            </svg>
          </a>
        </div>

        {searchOpen && (
          <div className="search-panel">
            <label htmlFor="product-search">Search the collection</label>
            <input
              autoFocus
              id="product-search"
              type="search"
              placeholder="Try a size, color, or product..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <button className="search-close" type="button" onClick={() => setSearchOpen(false)}>
              Close
            </button>
          </div>
        )}
      </header>

      <main>
        <section
          className="hero"
          id="home"
          style={{ '--hero-image': `url("${backgroundImage}")` }}
        >
          <div className="hero-content">
            <p className="eyebrow">COMFORT, MADE MODEST</p>
            <h1>Your favourite products are here!</h1>
            <p className="hero-description">
              Don’t miss out on our new collection. Shop our latest products and get the best offers.
            </p>
            <a className="button button-light" href="#products">SHOP NOW <span aria-hidden="true">↗</span></a>
          </div>
          <a className="scroll-cue" href="#products" aria-label="Scroll to trending products">
            <span />
          </a>
        </section>

        <section className="products-section" id="products">
          <div className="section-heading">
            <div>
              <p className="eyebrow">THE SALMA EDIT</p>
              <h2>Trending Products</h2>
            </div>
            <p>Everyday favourites, thoughtfully selected.</p>
          </div>

          <div className="product-grid" aria-live="polite">
            {visibleProducts.map((product, index) => (
              <article
                className="product-card"
                key={`${product.name}-${index}`}
                style={{ '--card-index': index }}
              >
                <div className="product-image-wrap">
                  <img className="product-image" src={product.image} alt={product.alt} loading="lazy" />
                  {product.discount && <span className="discount-badge">{product.discount}</span>}
                  <button
                    className="quick-add"
                    type="button"
                    onClick={() => addToBag(product.name)}
                  >
                    ADD TO BAG <span aria-hidden="true">+</span>
                  </button>
                </div>
                <div className="product-info">
                  <div className="product-title-row">
                    <h3>{product.name}</h3>
                    <span className="product-price">EGP {product.price}</span>
                  </div>
                  <p>{product.details}</p>
                  {product.previousPrice && (
                    <p className="price-note">
                      <del>EGP {product.previousPrice}</del>
                      <span>{product.discount}</span>
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>

          {visibleProducts.length === 0 && (
            <p className="empty-search">No products match “{searchTerm}”. Try another search.</p>
          )}
          <p className="cart-message" role="status">{cartMessage}</p>
        </section>

        <section className="collection-banner" aria-label="Explore collection">
          <div>
            <p className="eyebrow">A LITTLE MORE TO LOVE</p>
            <h2>Explore Our Best</h2>
          </div>
          <a className="button button-outline" href="#products">DISCOVER THE COLLECTION <span aria-hidden="true">↗</span></a>
        </section>
      </main>

      <section className="footer-container" id="about">
        <div className="footer-column footer-brand">
          <a href="#home" className="footer-brand-name">Botique</a>
          <a href="tel:+20939833" className="contact-link">
            <span aria-hidden="true">☎</span> +20939833
          </a>
        </div>
        <div className="footer-column">
          <h2>Quick Links</h2>
          <a href="#about">Store info</a>
          <a href="#about">Contact us</a>
          <a href="#policy">Return Policy</a>
        </div>
        <div className="footer-column footer-details" id="policy">
          <div className="social-links" aria-label="Social media">
            <span role="img" aria-label="WhatsApp">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.2 11.8a8.2 8.2 0 0 1-12.1 7.1L3 20l1.2-4.8a8.2 8.2 0 1 1 16-3.4Z" />
                <path d="M8.5 8.1c.3-.5.6-.4.8-.4h.4c.1 0 .3 0 .4.3l.7 1.7c.1.2 0 .4-.1.5l-.5.6c-.1.1-.2.3-.1.5.2.4.7 1.1 1.4 1.7.8.7 1.5 1 1.9 1.2.2.1.4 0 .5-.1l.7-.8c.2-.2.3-.2.5-.1l1.6.8c.2.1.3.2.3.4 0 .3-.2 1.3-.8 1.7-.5.4-1.2.6-2 .4-.5-.1-1.2-.4-2.1-.8-2.2-1-3.6-3.3-3.7-3.5-.1-.2-.9-1.2-.9-2.3 0-1.1.6-1.7.9-1.9Z" />
              </svg>
            </span>
            <span role="img" aria-label="Instagram">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle className="social-dot" cx="17.5" cy="6.8" r=".8" />
              </svg>
            </span>
          </div>
          <p>Delivery within 5-10 working days</p>
          <p>Returns allowed <a href="#policy">More info</a></p>
        </div>
      </section>
      <footer className="site-footer"><small>© 2024, Botique</small></footer>
    </div>
  )
}

export default App
