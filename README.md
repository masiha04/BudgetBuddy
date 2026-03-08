# BudgetBuddy 💰 — Personal Finance Manager

A full-stack personal finance manager built with React, Node.js/Express, MongoDB, and Chart.js.

---

## 🚀 Features

- **User Authentication** — Secure signup/login with JWT
- **Transaction Management** — Full CRUD for income & expense transactions with categories
- **Monthly Budgets** — Set spending limits with real-time alerts when thresholds are exceeded
- **Analytics Dashboard** — Interactive charts: income vs expenses, category breakdowns, trends
- **Export Reports** — Download transactions as CSV or JSON
- **Responsive Design** — Works on desktop, tablet, and mobile

---

## 🗂️ Project Structure

```
budgetbuddy/
├── backend/          # Node.js/Express API
│   ├── models/       # MongoDB schemas (User, Transaction, Budget)
│   ├── routes/       # API routes
│   ├── middleware/   # Auth middleware
│   └── server.js     # Entry point
└── frontend/         # React app
    ├── src/
    │   ├── pages/    # Page components
    │   ├── components/
    │   ├── context/  # Auth context
    │   ├── utils/    # API & formatting helpers
    │   └── styles/   # Global CSS
    └── public/
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js v18+
- MongoDB (local or MongoDB Atlas)

### 1. Backend Setup

```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env and set your MONGO_URI and JWT_SECRET

npm run dev     # Development (nodemon)
# OR
npm start       # Production
```

The API runs at `http://localhost:5000`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm start
```

The app opens at `http://localhost:3000`

---

## 🔑 Environment Variables (backend/.env)

| Variable     | Description                  | Default                               |
|--------------|------------------------------|---------------------------------------|
| `MONGO_URI`  | MongoDB connection string    | `mongodb://localhost:27017/budgetbuddy` |
| `JWT_SECRET` | JWT signing secret           | Change this in production!            |
| `PORT`       | Server port                  | `5000`                                |
| `CLIENT_URL` | Frontend URL (for CORS)      | `http://localhost:3000`               |

---

## 📡 API Endpoints

### Auth
| Method | Endpoint            | Description       |
|--------|---------------------|-------------------|
| POST   | `/api/auth/register` | Register user    |
| POST   | `/api/auth/login`    | Login            |
| GET    | `/api/auth/me`       | Get current user |
| PUT    | `/api/auth/profile`  | Update profile   |
| PUT    | `/api/auth/password` | Change password  |

### Transactions
| Method | Endpoint                  | Description            |
|--------|---------------------------|------------------------|
| GET    | `/api/transactions`        | List (with filters)   |
| POST   | `/api/transactions`        | Create transaction    |
| PUT    | `/api/transactions/:id`    | Update transaction    |
| DELETE | `/api/transactions/:id`    | Delete transaction    |

### Budgets
| Method | Endpoint              | Description               |
|--------|-----------------------|---------------------------|
| GET    | `/api/budgets`         | List all budgets          |
| GET    | `/api/budgets/current` | Current month + alerts   |
| POST   | `/api/budgets`         | Create budget             |
| PUT    | `/api/budgets/:id`     | Update budget             |
| DELETE | `/api/budgets/:id`     | Delete budget             |

### Analytics
| Method | Endpoint                        | Description            |
|--------|---------------------------------|------------------------|
| GET    | `/api/analytics/summary`        | Monthly summary        |
| GET    | `/api/analytics/monthly`        | Yearly monthly data    |
| GET    | `/api/analytics/by-category`    | Category breakdown     |
| GET    | `/api/analytics/trend`          | 6-month trend          |

### Export
| Method | Endpoint          | Description     |
|--------|-------------------|-----------------|
| GET    | `/api/export/csv`  | Download CSV   |
| GET    | `/api/export/json` | Download JSON  |

---

## 🛠️ Tech Stack

| Layer     | Technology             |
|-----------|------------------------|
| Frontend  | React 18, React Router |
| Charts    | Chart.js, react-chartjs-2 |
| Backend   | Node.js, Express       |
| Database  | MongoDB, Mongoose      |
| Auth      | JWT, bcryptjs          |
| Styling   | Custom CSS (no Tailwind) |

---

## 🎨 Design

- Dark theme with purple accent colors
- DM Sans + DM Mono typography
- Responsive sidebar navigation
- Smooth animations and hover states

---

## 📝 License

MIT
