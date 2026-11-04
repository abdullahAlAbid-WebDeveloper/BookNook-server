# 📦 BookNook — Library Management System (Server)

Express + MongoDB REST API for the **BookNook** library app. It stores books and borrow records and protects the write routes with **JWT verification** against the Next.js client's Better Auth JWKS endpoint.

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Create a .env file in this folder
CLIENT_URL=http://localhost:3000

# 3. Make sure the Next.js client is running on CLIENT_URL
#    (the JWTs are verified against http://CLIENT_URL/api/auth/jwks)

# 4. Start the server
node index.js
# Server is Running on 5000
```

## 🛠️ Tech Stack

- [Express 5](https://expressjs.com)
- [MongoDB Driver](https://www.mongodb.com/docs/drivers/node/) + Atlas cluster
- [jose](https://github.com/panva/jose) — `jwtVerify` + `createRemoteJWKSet`
- [cors](https://github.com/expressjs/cors) + `dotenv`

## 📡 API Routes

Database: `bookNook` — collections: `bookData`, `borrowData`

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/` | — | Health check ("hello world") |
| POST | `/bookData` | JWT | Add a book (rejects duplicate title+author) |
| GET | `/bookData` | — | All books |
| GET | `/bookData/:id` | — | Single book |
| PATCH | `/bookData/:id` | JWT | Update a book |
| DELETE | `/bookData/:id` | JWT | Delete a book |
| GET | `/myBooks/:email` | JWT | Books created by that email (403 if not your email) |
| POST | `/bookData/borrow` | JWT | Borrow a book — **copies left −1** · 400 if already borrowed or no copies left |
| GET | `/bookData/borrow/:email` | JWT | Your borrowed books (403 if not your email) |
| DELETE | `/bookData/borrow/:id` | JWT | Return a book — **copies left +1** |

### 🔐 JWT verification (`verifyToken` middleware)

```
Authorization: Bearer <token>
```

1. Every protected request must include the header above — otherwise **401 Unauthorized**.
2. The token is verified with `createRemoteJWKSet(`${CLIENT_URL}/api/auth/jwks`)`.
3. Token claims must match: `issuer: CLIENT_URL` (your Next.js base URL).
4. On success the decoded user (`email`, `name`, ...) is attached to `req.user`, which the email-checked routes use for **403 Forbidden access** when the URL email doesn't match the token owner.

### 📚 Copies left logic

- **Borrow** (`POST /bookData/borrow`): reads the book's `totalCopies`; if `<= 0` it returns `{ error: "No copies of this book are available right now." }`. After a successful insert it saves `totalCopies - 1` back to the book.
- **Return** (`DELETE /bookData/borrow/:id`): finds the borrow record first (to know the `bookId`), deletes it, then saves `totalCopies + 1` back to the book.

Values are converted with `Number()` before saving, so books originally stored with string copies (e.g. `"12"`) still work.

## 📁 Project Structure

```
index.js          # Express app, Mongo connection, all routes, verifyToken
.env              # MONGODB_URL, CLIENT_URL  (never commit)
vercel.json       # Deployment config
```

## 🖥️ Run together

```
Next.js client  →  http://localhost:3000   (fetches JWT from /api/auth/token)
Express server  →  http://localhost:5000   (expects Authorization: Bearer)
```

Start the client first, log in, then the server can verify every protected request.
