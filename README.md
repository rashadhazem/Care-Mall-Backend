# Full E-commerce Backend (Node.js / Express / MongoDB) ✅

**Short description:** A RESTful backend for an e-commerce platform built with Node.js, Express, and MongoDB. Provides authentication, product/category/brand management, carts, orders, coupons, reviews, file uploads (Cloudinary), Stripe payment integration, and API documentation via Swagger.

---

## 🔧 Features

- User authentication (JWT)
- Product, Category, SubCategory, Brand CRUD
- Reviews & Ratings
- Shopping Cart & Orders
- Coupon support
- Stripe payments
- Image uploads (Cloudinary)
- Email notifications (nodemailer)
- Swagger API docs at `/api-docs`

---

## 🧰 Tech Stack

- Node.js, Express
- MongoDB (mongoose)
- JWT (jsonwebtoken)
- Cloudinary for image hosting
- Stripe for payments
- Swagger for API docs

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- MongoDB running locally or a connection URI

### Install & Run

1. Clone the repo

```bash
git clone <repo-url>
cd "Full BackEnd Code"
```

2. Install dependencies

```bash
npm install
```

3. Create and configure `config.env` at the project root (the project uses `dotenv` and loads `config.env` by default). See **Environment variables** below.

4. Run in development

```bash
npm start
```

> The app uses `nodemon` (via the `start` script) to auto-reload during development.

The server will listen on the port defined in `PORT` environment variable (e.g. `8000`).

---

## ⚙️ Environment Variables

The project reads variables from `config.env`. Example variables used in this project include:

- `PORT` — Port server listens on (e.g. 8000)
- `NODE_ENV` — `development` | `production`
- `BASE_URL` — Base app URL (e.g. `http://localhost:8000`)
- `DB_URI` — MongoDB connection string
- `STRIPE_SECRET` — Stripe secret key
- `COOKIE_EXPIRATION_DAYS` — Cookie expiry (days)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — Cloudinary credentials
- `ORIGIN` — Allowed CORS origin(s) (front-end URL)
- `JWT_SECRET` / `SECRET_KEY` — Secrets for signing tokens
- `EMAIL` / `PASSWORD` — SMTP credentials for nodemailer (if used)
- `PASSWORD_RESET_TOKEN_EXPIRATION`, `LOGIN_TOKEN_EXPIRATION`, `REFRESH_TOKEN_EXPIRATION` — Token lifetimes

> Note: The repository contains a `config.env` example (if present) — make sure to keep secrets out of version control.

---

## 📚 API Endpoints (Base paths)

The routes are mounted in `routes/index.js`. Main base paths:

- `GET /api/v1/categories` — Categories
- `GET /api/v1/subcategories` — SubCategories
- `GET /api/v1/brands` — Brands
- `GET /api/v1/products` — Products
- `POST /api/v1/auth` — Authentication
- `GET /api/v1/users` — Users
- `GET /api/v1/reviews` — Reviews
- `GET /api/v1/wishlist` — Wishlist
- `GET /api/v1/addresses` — Addresses
- `GET /api/v1/coupons` — Coupons
- `GET /api/v1/cart` — Cart
- `GET /api/v1/orders` — Orders

For full API documentation and to interact with endpoints visually, open the Swagger UI at:

```
http://localhost:<PORT>/api-docs
```

---

## 🔧 Project Structure

Key folders and files:

- `server.js` — App entry point
- `routes/` — Express route definitions
- `models/` — Mongoose models
- `services/` — Business logic and services
- `middlewares/` — Custom middleware
- `utils/` — Utilities (validation, tokens, emails, cloudinary, etc.)

---

## 🧪 Tests

There are no automated tests configured yet. The `npm test` script exists as a placeholder.

---

## 💡 Notes & Tips

- Ensure MongoDB is running or set `DB_URI` to your cloud DB.
- Set `ORIGIN` correctly (e.g. `http://localhost:3000`) if using a React front-end.
- Keep sensitive keys (Stripe, Cloudinary, JWT secrets) out of source control.

---

## 🤝 Contributing

Contributions are welcome — open an issue or a PR describing the change.

---



## ✉️ Contact

For questions, reach out to the repo owner / maintainer.

