# 🔐 Auth Practice

A backend authentication system built with Node.js, Express, and MongoDB for learning purposes.

---

## ✨ Features

- **Register** — Create a new account with name, email, and password. An OTP is sent to verify the email.
- **Email Verification** — Verify your email using the OTP received. OTP is hashed (SHA-256) before storing and auto-expires after 5 minutes.
- **Login** — Get an access token (15 min) and a refresh token (7 days). Each login creates a new session.
- **Get Profile** — Fetch the logged-in user's profile using the access token.
- **Refresh Token Rotation** — Exchange the current refresh token for a new one along with a fresh access token.
- **Logout** — Revoke the current session.
- **Logout from All Sessions** — Revoke all active sessions at once.
- **Forgot Password** — Request a password reset OTP via email.
- **Reset Password** — Verify the OTP and set a new password.

---

## 📁 Project Structure

```
pro_Auth_practice/
├── server.js
├── package.json
├── .env
├── .gitignore
└── src/
    ├── app.js
    ├── db.js
    ├── controllers/
    │   └── auth.controller.js
    ├── models/
    │   ├── user.model.js
    │   ├── session.model.js
    │   └── otp.model.js
    ├── routes/
    │   └── auth.route.js
    ├── services/
    │   └── email.service.js
    └── utils/
        └── utils.js
```

---

## 🚀 API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/verify-email` | Verify email with OTP |
| POST | `/api/auth/login` | Login and get tokens |
| GET | `/api/auth/getme` | Get logged-in user profile |
| POST | `/api/auth/refresh-token` | Rotate refresh token and get new access token |
| POST | `/api/auth/logout` | Logout current session |
| POST | `/api/auth/logout-all` | Logout from all sessions |
| POST | `/api/auth/forgot-password` | Request password reset OTP |
| POST | `/api/auth/reset-password` | Verify OTP and set new password |

---

## 🛠 Tech Stack

- **Node.js** + **Express.js v5**
- **MongoDB** with **Mongoose**
- **JWT** — Access and Refresh tokens
- **bcryptjs** — Password hashing
- **crypto** (built-in) — SHA-256 hashing for OTP and refresh tokens
- **Nodemailer** — Email via Gmail OAuth2
- **cookie-parser** — HttpOnly cookie handling

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
MONGO_URI=
JWT_SECRET=
JWT_REFRESH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
GOOGLE_USER=
```

---

## ▶️ Run the Server

```bash
npm install
npm run dev
```

Server will start on `http://localhost:3000`


