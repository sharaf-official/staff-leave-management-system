# Staff Leave Management System: Requirements & Planning

**Programme:** HND in Computer Science | **Module:** Web Application Development
**Assessment:** Full-Stack Web Application Development Project
**Document:** Evaluation 1 – System Analysis and Project Planning

---

## 1. Assigned Project Title

**Staff Leave Management System**

## 2. System Description

A web-based application that allows an organisation's staff to apply for leave online, managers to review and approve or reject requests, and administrators to manage staff, departments and leave policies. The system keeps leave balances up to date automatically and notifies employees by email when a request is decided.

## 3. Problem Statement

Many organisations still handle leave using paper forms, emails or spreadsheets. This leads to:

- Lost or delayed leave requests
- Unclear or incorrect leave balances
- Double-booking of staff on the same dates
- No central record or reporting for HR/management
- No notification when a request is approved or rejected

## 4. Project Objectives

1. Provide a digital process for applying for, approving and tracking leave.
2. Calculate and maintain leave balances automatically.
3. Enforce role-based access for Employee, Manager and Admin users.
4. Notify employees by email when the status of a request changes.
5. Provide leave history and reports for management.
6. Build, test and deploy the system as a secure, responsive full-stack web application.

## 5. Scope

**In scope**
- Authentication (login/logout) and role-based authorisation
- Apply for leave, view leave history, cancel pending requests
- Manager approval/rejection with comments
- Automatic leave balance calculation (excluding weekends)
- Admin management of users, departments and leave types
- Email notification through an external service
- Leave reports (filter by date, department, status)
- Responsive user interface

**Out of scope**
- Payroll processing
- Biometric attendance integration
- Mobile native apps
- Multi-organisation (multi-tenant) support

## 6. Target Users and User Roles

| Role | Description | Main permissions |
|---|---|---|
| **Employee** | Any staff member | Apply for leave, view own balance/history, cancel pending requests, update own profile |
| **Manager** | Leads a department/team | All employee actions + view team requests, approve/reject with comment, view team calendar |
| **Admin** | HR / system administrator | Manage users, departments, leave types and balances; view all requests and reports |

## 7. Functional Requirements

| ID | Requirement | Role |
|---|---|---|
| FR1 | Users can register (admin-created) and log in/out securely | All |
| FR2 | Employee can submit a leave request (type, start date, end date, reason) | Employee |
| FR3 | System validates dates (end ≥ start, no past dates, no overlapping requests) | System |
| FR4 | System checks that sufficient leave balance exists before submission | System |
| FR5 | Employee can view leave balance per leave type | Employee |
| FR6 | Employee can view leave history and status (Pending / Approved / Rejected / Cancelled) | Employee |
| FR7 | Employee can cancel a request while it is still pending | Employee |
| FR8 | Manager can view pending requests from their team | Manager |
| FR9 | Manager can approve or reject a request with a comment | Manager |
| FR10 | Leave balance is deducted automatically on approval | System |
| FR11 | Email notification is sent to the employee when a request is approved/rejected | System |
| FR12 | Admin can create, view, update and delete users | Admin |
| FR13 | Admin can create, update and delete departments | Admin |
| FR14 | Admin can create, update and delete leave types (name, days per year) | Admin |
| FR15 | Admin can view all leave requests and generate reports with filters | Admin |
| FR16 | Users can change their password | All |

## 8. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Security** | Passwords hashed with bcrypt; JWT-based authentication; role-based route protection; input validation and sanitisation; secrets in environment variables |
| **Performance** | Pages load in under 3 seconds under normal load; API responses under 1 second for typical queries |
| **Usability** | Simple, consistent navigation; clear feedback messages for success and errors |
| **Responsiveness** | Works on desktop, tablet and mobile screen sizes |
| **Reliability / Data integrity** | Foreign keys and constraints in the database; transactions when updating balances |
| **Maintainability** | Layered code structure (routes, controllers, services, models); meaningful Git commits; README documentation |
| **Scalability** | Stateless REST API so it can be hosted on multiple instances; database indexing on frequently queried columns |
| **Compatibility** | Latest versions of Chrome, Edge, Firefox and Safari |

## 9. Main System Features

1. Secure login with role-based dashboards
2. Leave application with validation
3. Real-time leave balance
4. Approval workflow (Employee → Manager)
5. Email notifications
6. Admin management (users, departments, leave types)
7. Leave history, filters and reports

## 10. Proposed Software Architecture

**Three-tier (client–server) architecture** with a layered back end.

- **Presentation tier:** React single-page application
- **Application tier:** Node.js + Express REST API (routes → controllers → services → data access)
- **Data tier:** MySQL relational database
- **External service:** Email service (Nodemailer + SMTP)

See `diagrams.md` for the architecture diagram.

## 11. Technology Stack and Justification

| Layer | Technology | Justification |
|---|---|---|
| Front end | React (Vite), React Router, Axios | Component-based UI, reusable components, large community; Vite gives fast builds; suited to dashboards and forms |
| Back end | Node.js, Express.js | JavaScript on both client and server reduces learning overhead; lightweight and well suited to REST APIs |
| Database | MySQL | Structured, relational data (users, requests, balances) with foreign keys and constraints; widely supported by hosting services |
| Authentication | JWT + bcrypt | Stateless token authentication that scales; bcrypt provides secure password hashing |
| Validation | express-validator (server), form validation (client) | Protects against invalid and malicious input on both sides |
| Email | Nodemailer | Simple integration with SMTP services for notifications |
| Version control | Git + GitHub | Source management and development history |
| Deployment | Vercel (front end), Render/Railway (back end and database) | Free tiers, easy GitHub integration, environment variable support |
| Tools | VS Code, Postman, draw.io, Figma | Development, API testing, diagrams and wireframes |

## 12. Initial Project Plan and Feature List

| Evaluation | Date | Planned deliverables |
|---|---|---|
| E1 | 1 Nov 2026 | Requirements, use case diagram, wireframes, ER design, architecture, stack, GitHub setup |
| E2 | 8 Nov 2026 | React pages: login, dashboards, apply leave, history, approvals, admin; responsive layout; form validation |
| E3 | 15 Nov 2026 | MySQL schema, DB connection, CRUD APIs, business logic (balance, overlap checks), front-end to back-end integration |
| E4 | 22 Nov 2026 | JWT auth, role-based authorisation, security measures, email notification integration, error handling |
| E5 | 29 Nov 2026 | Test plan and results, deployment, environment variables, README, draft report |
| Final | 6 Dec 2026 | Final polish, report, demo and viva |

## 13. Risks and Mitigation

| Risk | Mitigation |
|---|---|
| Limited back-end experience | Learn Express + MySQL in small steps; build one feature end to end first |
| Time constraints | Follow weekly plan; keep scope realistic; start testing/documentation early |
| Deployment issues | Deploy a basic version early (by E4) |
| Secrets exposed | `.env` in `.gitignore`; use `.env.example` |
