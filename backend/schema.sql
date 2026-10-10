CREATE DATABASE IF NOT EXISTS salma_store
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE salma_store;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash CHAR(128) NOT NULL,
  salt CHAR(32) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX orders_created_at_idx (created_at),
  INDEX orders_customer_email_idx (customer_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
