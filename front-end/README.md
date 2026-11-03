<div align="center">

# 🗓️ Staff Leave Management System

**A role-based web application to apply for, approve and track staff leave.**

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-Build-646CFF?logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?logo=mysql&logoColor=white)
![Status](https://img.shields.io/badge/Status-In%20Development-f59e0b)

HND in Computer Science · Full-Stack Web Application Development

</div>

---

## 📌 About the Project

Many organisations still manage leave with paper forms, emails or spreadsheets, which causes lost requests, wrong balances and no central record. **Staff Leave Management System** replaces this with a single web application where:

- **Employees** apply for leave and track their balance and history
- **Managers** review, approve or reject their team's requests
- **Admins** manage users, departments, leave types and view reports

## ✨ Features

### 👤 Employee
- Role-based dashboard with leave balances and recent requests
- Apply for leave with validation (dates, weekends excluded, balance check)
- Leave history with status filters and cancel for pending requests

### 🧑‍💼 Manager
- Everything an employee can do
- Team requests page with approve / reject and comments (comment required on rejection)
- Dashboard with team pending count

### 🛠️ Admin
- Dashboard with staff, department and request statistics
- Manage **Users**, **Departments** and **Leave Types** (add, edit, delete with confirmation)
- **Reports** with filters (date, department, type, status) and **PDF export**

### 🎨 UI / UX
- Modern glass-style login with show/hide password
- Fully responsive (desktop, tablet, mobile)
- Reusable components, smooth animations, logout confirmation

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Front end | React 19, Vite, React Router, React Icons, Context API |
| Back end *(planned)* | Node.js, Express.js |
| Database *(planned)* | MySQL |
| Security *(planned)* | JWT, bcrypt, express-validator |
| Email *(planned)* | Nodemailer |
| Reports | jsPDF, jspdf-autotable |
| Tools | Git, GitHub, VS Code, Postman |

## 🖼️ Screenshots

| Login | Employee Dashboard |
|---|---|
| ![Login](docs/screenshots/login.png) | ![Employee](docs/screenshots/employee-dashboard.png) |

| Manager: Team Requests | Admin Dashboard |
|---|---|
| ![Approvals](docs/screenshots/team-requests.png) | ![Admin](docs/screenshots/admin-dashboard.png) |

| Users | Reports |
|---|---|
| ![Users](docs/screenshots/users.png) | ![Reports](docs/screenshots/reports.png) |

## 📁 Project Structure

```
staff-leave-management-system/
├── docs/                 # Requirements, diagrams, wireframes, report
├── front-end/            # React application
│   └── src/
│       ├── components/   # Layout, Modal, StatCard, StatusBadge ...
│       ├── context/      # AuthContext
│       ├── data/         # Mock data (temporary, replaced by API)
│       ├── pages/        # Login, dashboards, Apply, History, Approvals, Users ...
│       └── routes/       # ProtectedRoute (role-based access)
├── back-end/             # Node.js + Express API (coming soon)
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 18 or later
- Git

### Run the front end

```bash
git clone https://github.com/sharaf-official/staff-leave-management-system.git
cd staff-leave-management-system/front-end
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

## 🔑 Demo Accounts

The front end currently uses mock data. Password for all demo accounts: `Slms@2026!`

| Role | Email |
|---|---|
| Employee | `employee@company.com` |
| Manager | `manager@company.com` |
| Admin | `admin@company.com` |

## 🗺️ Roadmap

- [x] **E1**: Requirements, use case diagram, ER design, architecture, wireframes
- [x] **E2**: React UI (login, 3 dashboards, apply, history, approvals, users, departments, leave types, reports)
- [ ] **E3**: MySQL database, REST API (CRUD), business logic, front-end integration
- [ ] **E4**: JWT authentication, role-based authorisation, security, email notifications
- [ ] **E5**: Testing, deployment, documentation
- [ ] **Final**: Report, demo and viva

## 📄 Documentation

See the [`docs`](docs) folder for requirements, diagrams and wireframes.
## 👨‍💻 Author

**Sharaf Izam**

HND in Computer Science · Final Project · Upbright

| | |
|---|---|
| 🌐 Portfolio | [www.sharafizam.com](https://www.sharafizam.com) |
| 💻 GitHub | [@sharaf-official](https://github.com/sharaf-official) |
---
<div align="center">

⭐ Built as an academic full-stack project · 🌐 [www.sharafizam.com](https://www.sharafizam.com)

</div>