import {
  randomBytes,
  scrypt as scryptCallback,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import express from 'express'
import mysql from 'mysql2/promise'

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) })

const scrypt = promisify(scryptCallback)
const app = express()
const port = Number(process.env.PORT || 3000)
const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env
const dbPort = Number(process.env.DB_PORT || 3306)
const standardShippingCostCents = 10000

const dbConfig = {
  host: DB_HOST,
  port: dbPort,
  user: DB_USER,
  password: DB_PASSWORD || '',
  charset: 'utf8mb4',
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true,
  },
}
let pool
let poolInitialization

function validateDatabaseConfig() {
  if (
    !DB_HOST ||
    !DB_USER ||
    !DB_NAME ||
    !/^[a-zA-Z0-9_]+$/.test(DB_NAME) ||
    !Number.isInteger(dbPort)
  ) {
    throw new Error('Configure DB_HOST, DB_USER, DB_NAME, and a valid DB_PORT.')
  }
}

async function initializeServerlessPool() {
  if (pool) return
  if (poolInitialization) return poolInitialization

  poolInitialization = (async () => {
    validateDatabaseConfig()
    const nextPool = mysql.createPool({
      ...dbConfig,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
    })
    try {
      await nextPool.query('SELECT 1')
    } catch (error) {
      await nextPool.end()
      throw error
    }
    pool = nextPool
  })()

  try {
    await poolInitialization
  } catch (error) {
    poolInitialization = null
    throw error
  }
}

const egyptGovernorates = new Set([
  '6th of October',
  'Al Sharqia',
  'Alexandria',
  'Aswan',
  'Asyut',
  'Beheira',
  'Beni Suef',
  'Cairo',
  'Dakahlia',
  'Damietta',
  'Faiyum',
  'Gharbia',
  'Giza',
  'Helwan',
  'Ismailia',
  'Kafr el-Sheikh',
  'Luxor',
  'Matrouh',
  'Minya',
  'Monufia',
  'New Valley',
  'North Sinai',
  'Port Said',
  'Qalyubia',
  'Qena',
  'Red Sea',
  'Sohag',
  'South Sinai',
  'Suez',
])

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char])
}

async function sendOrderEmail({ orderId, customer, shippingAddress, items, total }) {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.ORDER_NOTIFY_EMAIL
  if (!apiKey || !to) return

  const itemsHtml = items
    .map(
      (item) =>
        `<li>${escapeHtml(item.name)} × ${item.quantity} = ${(item.lineTotalCents / 100).toFixed(2)}</li>`,
    )
    .join('')

  const html = `
    <h2>طلب جديد #${escapeHtml(orderId)}</h2>
    <p><strong>العميل:</strong> ${escapeHtml(customer.name)}</p>
    <p><strong>الإيميل:</strong> ${escapeHtml(customer.email)}</p>
    <p><strong>التليفون:</strong> ${escapeHtml(customer.phone)}</p>
    <p><strong>العنوان:</strong> ${escapeHtml(shippingAddress.governorate)}, ${escapeHtml(shippingAddress.city)}, ${escapeHtml(shippingAddress.address)}${shippingAddress.apartment ? ', ' + escapeHtml(shippingAddress.apartment) : ''}</p>
    <h3>المنتجات</h3>
    <ul>${itemsHtml}</ul>
    <p><strong>الإجمالي (شامل الشحن):</strong> ${total}</p>
  `

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Orders <onboarding@resend.dev>',
      to: [to],
      subject: `طلب جديد من ${customer.name}`,
      html,
    }),
  })

  if (!response.ok) {
    throw new Error(`Resend failed: ${response.status} ${await response.text()}`)
  }
}




app.use(express.json({ limit: '64kb' }))

if (process.env.VERCEL === '1') {
  app.use('/api', async (_request, _response, next) => {
    try {
      await initializeServerlessPool()
      next()
    } catch (error) {
      next(error)
    }
  })
}

app.get('/api/health', async (_request, response, next) => {
  try {
    await pool.query('SELECT 1')
    response.json({ status: 'ok', database: 'connected' })
  } catch (error) {
    next(error)
  }
})

app.post('/api/sign-in', async (request, response, next) => {
  const { email, password } = request.body ?? {}
  if (typeof email !== 'string' || typeof password !== 'string') {
    response.status(400).json({ message: 'Enter your email and password.' })
    return
  }

  const cleanEmail = email.trim().toLowerCase()
  if (
    cleanEmail.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) ||
    password.length > 128
  ) {
    response.status(400).json({ message: 'Enter a valid email and password.' })
    return
  }

  try {
    const [users] = await pool.execute(
      'SELECT id, name, email, password_hash, salt FROM users WHERE email = ? LIMIT 1',
      [cleanEmail],
    )
    const user = users[0]
    if (!user || !/^[a-f0-9]{32}$/.test(user.salt) || !/^[a-f0-9]{128}$/.test(user.password_hash)) {
      response.status(401).json({ message: 'Invalid email or password.' })
      return
    }

    const submittedHash = Buffer.from(await scrypt(password, user.salt, 64))
    const savedHash = Buffer.from(user.password_hash, 'hex')
    if (!timingSafeEqual(submittedHash, savedHash)) {
      response.status(401).json({ message: 'Invalid email or password.' })
      return
    }

    response.json({
      message: 'You are signed in.',
      user: { id: user.id, name: user.name, email: user.email },
    })
  } catch (error) {
    next(error)
  }
})

app.post('/api/sign-up', async (request, response, next) => {
  const { name, email, password } = request.body ?? {}

  if (
    typeof name !== 'string' ||
    typeof email !== 'string' ||
    typeof password !== 'string'
  ) {
    response.status(400).json({ message: 'Please complete all fields.' })
    return
  }

  const cleanName = name.trim()
  const cleanEmail = email.trim().toLowerCase()

  if (cleanName.length < 1 || cleanName.length > 100) {
    response.status(400).json({ message: 'Name must be between 1 and 100 characters.' })
    return
  }

  if (cleanEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    response.status(400).json({ message: 'Enter a valid email address.' })
    return
  }

  if (password.length < 8 || password.length > 128) {
    response.status(400).json({ message: 'Password must be between 8 and 128 characters.' })
    return
  }

  try {
    const salt = randomBytes(16).toString('hex')
    const passwordHash = (await scrypt(password, salt, 64)).toString('hex')
    const id = randomUUID()

    await pool.execute(
      'INSERT INTO users (id, name, email, password_hash, salt) VALUES (?, ?, ?, ?, ?)',
      [id, cleanName, cleanEmail, passwordHash, salt],
    )

    response.status(201).json({
      message: 'Your account was created successfully.',
      user: { id, name: cleanName, email: cleanEmail },
    })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      response.status(409).json({ message: 'That email is already registered.' })
      return
    }
    next(error)
  }
})

app.post('/api/orders', async (request, response, next) => {
  const {
    customer,
    shippingAddress,
    billingAddress,
    saveInformation,
    marketingOptIn,
    paymentMethod,
    items,
  } = request.body ?? {}
  const isText = (value, maxLength, required = true) =>
    typeof value === 'string' &&
    value.trim().length <= maxLength &&
    (required ? value.trim().length > 0 : true)

  if (
    !customer ||
    !isText(customer.name, 100) ||
    !isText(customer.email, 254) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim()) ||
    !isText(customer.phone, 30) ||
    !/^[+()\d\s.-]+$/.test(customer.phone.trim()) ||
    customer.phone.replace(/\D/g, '').length < 7 ||
    !shippingAddress ||
    shippingAddress.country !== 'Egypt' ||
    !egyptGovernorates.has(shippingAddress.governorate) ||
    !isText(shippingAddress.address, 255) ||
    !isText(shippingAddress.apartment, 150, false) ||
    !isText(shippingAddress.city, 100) ||
    !isText(shippingAddress.postalCode, 20, false) ||
    (billingAddress !== null &&
      (!billingAddress ||
        !isText(billingAddress.name, 100) ||
        !egyptGovernorates.has(billingAddress.governorate) ||
        !isText(billingAddress.address, 255) ||
        !isText(billingAddress.city, 100))) ||
    typeof saveInformation !== 'boolean' ||
    typeof marketingOptIn !== 'boolean' ||
    paymentMethod !== 'cod' ||
    !Array.isArray(items) ||
    items.length < 1 ||
    items.length > 40
  ) {
    response.status(400).json({ message: 'Check your contact, delivery, and billing details.' })
    return
  }

  let subtotalCents = 0
  const cleanItems = []
  const seenProductIds = new Set()

  for (const item of items) {
    const imageIsSafe =
      typeof item?.image === 'string' &&
      item.image.length <= 2048 &&
      ![...item.image].some((character) => character.charCodeAt(0) < 32) &&
      !item.image.includes('\\') &&
      !item.image.includes('..') &&
      (item.image.startsWith('/') || item.image.startsWith('./') || /^https:\/\//i.test(item.image))
    const priceCents = typeof item?.price === 'number' ? Math.round(item.price * 100) : NaN
    if (
      !item ||
      typeof item.id !== 'string' ||
      !/^[a-zA-Z0-9_-]{1,100}$/.test(item.id) ||
      seenProductIds.has(item.id) ||
      !isText(item.name, 200) ||
      !isText(item.description, 500, false) ||
      !imageIsSafe ||
      !Number.isFinite(item.price) ||
      item.price < 0 ||
      item.price > 9999999.99 ||
      Math.abs(item.price * 100 - priceCents) > 0.000001 ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 99
    ) {
      response.status(400).json({ message: 'Your shopping bag has an invalid item. Return to the store and try again.' })
      return
    }

    seenProductIds.add(item.id)
    subtotalCents += priceCents * item.quantity
    cleanItems.push({
      ...item,
      priceCents,
      lineTotalCents: priceCents * item.quantity,
    })
  }

  if (
    !Number.isSafeInteger(subtotalCents) ||
    subtotalCents + standardShippingCostCents > 9999999999
  ) {
    response.status(400).json({ message: 'The order total is too large to process.' })
    return
  }

  const cleanCustomer = {
    name: customer.name.trim(),
    email: customer.email.trim().toLowerCase(),
    phone: customer.phone.trim(),
  }
  const cleanShippingAddress = {
    country: 'Egypt',
    governorate: shippingAddress.governorate,
    address: shippingAddress.address.trim(),
    apartment: shippingAddress.apartment.trim() || null,
    city: shippingAddress.city.trim(),
    postalCode: shippingAddress.postalCode.trim() || null,
  }
  const cleanBillingAddress = billingAddress
    ? {
        name: billingAddress.name.trim(),
        governorate: billingAddress.governorate,
        address: billingAddress.address.trim(),
        city: billingAddress.city.trim(),
      }
    : null

  let connection
  try {
    connection = await pool.getConnection()
    await connection.beginTransaction()
    const orderId = randomUUID()
    const subtotal = (subtotalCents / 100).toFixed(2)
    const total = ((subtotalCents + standardShippingCostCents) / 100).toFixed(2)

    await connection.execute(
      `INSERT INTO orders (
        id, customer_name, customer_email, customer_phone, country, governorate,
        address, apartment, city, postal_code, save_information, marketing_opt_in,
        billing_address, payment_method, subtotal, shipping_cost, total_amount, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'cod', ?, ?, ?, 'pending')`,
      [
        orderId,
        cleanCustomer.name,
        cleanCustomer.email,
        cleanCustomer.phone,
        cleanShippingAddress.country,
        cleanShippingAddress.governorate,
        cleanShippingAddress.address,
        cleanShippingAddress.apartment,
        cleanShippingAddress.city,
        cleanShippingAddress.postalCode,
        saveInformation,
        marketingOptIn,
        cleanBillingAddress ? JSON.stringify(cleanBillingAddress) : null,
        subtotal,
        (standardShippingCostCents / 100).toFixed(2),
        total,
      ],
    )

    for (const item of cleanItems) {
      await connection.execute(
        `INSERT INTO order_items (
          order_id, product_id, product_name, product_description, image, unit_price, quantity, line_total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.id,
          item.name.trim(),
          item.description.trim(),
          item.image,
          (item.priceCents / 100).toFixed(2),
          item.quantity,
          (item.lineTotalCents / 100).toFixed(2),
        ],
      )
    }

        await connection.commit()
    await sendOrderEmail({
      orderId,
      customer: cleanCustomer,
      shippingAddress: cleanShippingAddress,
      items: cleanItems,
      total,
    }).catch((error) => console.error('Order email failed:', error))
    response.status(201).json({ message: 'Your order has been received.', orderId, total })
  } catch (error) {
    if (connection) await connection.rollback()
    next(error)
  } finally {
    if (connection) connection.release()
  }
})

app.use('/api', (_request, response) => {
  response.status(404).json({ message: 'API endpoint not found.' })
})

app.use((error, _request, response, _next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    response.status(400).json({ message: 'Request body must be valid JSON.' })
    return
  }

  console.error('Backend request failed:', error)
  response.status(500).json({ message: 'The server could not complete the request.' })
})

async function startServer() {
  validateDatabaseConfig()
  const setupConnection = await mysql.createConnection(dbConfig)
  try {
    await setupConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    )
  } finally {
    await setupConnection.end()
  }

  pool = mysql.createPool({
    ...dbConfig,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
  })
  await pool.query('SELECT 1')
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id CHAR(36) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(254) NOT NULL UNIQUE,
      password_hash CHAR(128) NOT NULL,
      salt CHAR(32) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id CHAR(36) PRIMARY KEY,
      customer_name VARCHAR(100) NOT NULL,
      customer_email VARCHAR(254) NOT NULL,
      customer_phone VARCHAR(30) NOT NULL,
      country VARCHAR(50) NOT NULL,
      governorate VARCHAR(100) NOT NULL,
      address VARCHAR(255) NOT NULL,
      apartment VARCHAR(150) NULL,
      city VARCHAR(100) NOT NULL,
      postal_code VARCHAR(20) NULL,
      save_information BOOLEAN NOT NULL DEFAULT FALSE,
      marketing_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
      billing_address JSON NULL,
      payment_method VARCHAR(20) NOT NULL DEFAULT 'cod',
      subtotal DECIMAL(10, 2) NOT NULL,
      shipping_cost DECIMAL(10, 2) NULL,
      tax_amount DECIMAL(10, 2) NULL,
      total_amount DECIMAL(10, 2) NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'awaiting_delivery_confirmation',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX orders_created_at_idx (created_at),
      INDEX orders_customer_email_idx (customer_email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS order_items (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      order_id CHAR(36) NOT NULL,
      product_id VARCHAR(100) NOT NULL,
      product_name VARCHAR(200) NOT NULL,
      product_description VARCHAR(500) NOT NULL DEFAULT '',
      image VARCHAR(2048) NOT NULL,
      unit_price DECIMAL(10, 2) NOT NULL,
      quantity INT UNSIGNED NOT NULL,
      line_total DECIMAL(10, 2) NOT NULL,
      CONSTRAINT order_items_order_fk FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)

  app.listen(port, () => {
    console.log(`Backend server listening on port ${port}`)
  })
}

if (process.env.VERCEL !== '1') {
  startServer().catch(async (error) => {
    if (error.code === 'ER_DBACCESS_DENIED_ERROR' || error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('MySQL user needs permission to create the database and users table:', error.message)
    } else {
      console.error('Could not connect to MySQL or initialize the database:', error)
    }
    if (pool) await pool.end()
    process.exitCode = 1
  })
}

export default app
