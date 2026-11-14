# Leave Nest: Staff Leave Management System
## Requirements & Planning

**Programme:** HND in Computer Science | **Module:** Web Application Development
**Assessment:** Full-Stack Web Application Development Project
**Document:** Evaluation 1 – System Analysis and Project Planning

---

## 1. Assigned Project Title

**Staff Leave Management System** (product name: **Leave Nest**)

## 2. System Description

A web-based, multi-company application (Leave Nest) where a company registers itself, its staff apply for leave online, managers review and approve or reject requests, and administrators manage staff, departments and leave policies. The system keeps leave balances up to date automatically and sends email notifications to managers (new request) and employees (decision).

## 3. Problem Statement

Many organisations in Sri Lanka still handle leave using paper forms, emails or spreadsheets. This leads to:

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
- Company self-registration (company details, admin and manager), with invitation emails and temporary passwords
- Forced password change at first login
- Multi-company support: every record belongs to one company (`company_id`), so companies never see each other's data
- Authentication (login/logout) and role-based authorisation
- Apply for leave, view leave history, cancel pending requests
- Manager approval/rejection with comments
- Automatic leave balance calculation (excluding weekends)
- Admin management of employees (only the admin creates and edits employee accounts), departments and leave types
- Employees edit their own personal details; email, role, department and manager are locked
- Email to the assigned manager when an employee requests leave, and to the employee when it is decided
- Separate demo company/accounts that are not mixed with real company data
- Email notification through an external service
- Leave reports (filter by date, department, status)
- Responsive user interface

**Out of scope**
- Payroll processing
- Biometric attendance integration
- Mobile native apps
- Billing / subscription plans for companies

## 6. Target Users and User Roles

| Role | Description | Main permissions |
|---|---|---|
| **Employee** | Any staff member | Apply for leave, view own balance/history, cancel pending requests, update own profile |
| **Manager** | Leads a department/team | All employee actions + view team requests, approve/reject with comment, view team calendar |
| **Admin** | HR / system administrator | Manage users, departments, leave types and balances; view all requests and reports |

## 7. Functional Requirements

| ID | Requirement | Role |
|---|---|---|
| FR1 | Users log in/out securely (accounts are created by the admin, not self-registered) | All |
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
| FR17 | A company can register itself with company details, one admin and one manager | Company registrant |
| FR18 | System creates the admin and manager accounts and emails each an invitation with a temporary password | System |
| FR19 | A user with a temporary password must set a new password at first login; temporary passwords expire after 7 days | All |
| FR20 | Password rules are enforced (minimum length, upper/lower case, number, symbol) with a strength indicator | System |
| FR21 | Only the admin can create, edit, disable/enable employees and resend invitations; the admin assigns department and manager | Admin |
| FR22 | Employee can edit own personal details (phone, address, emergency contact, photo); email, role, department and manager are read-only | Employee |
| FR23 | The assigned manager is emailed when an employee submits a leave request | System |
| FR24 | Every email sent is recorded and can be viewed in an Email Outbox page (company-scoped) | Admin, Manager, Employee |
| FR25 | All data is scoped by `company_id`; a user can only access data of their own company | System |
| FR26 | Demo accounts are kept separate from real companies and cannot change the demo password | System |

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

1. Company registration with invitation emails and forced first-login password change
2. Secure login with role-based dashboards
3. Leave application with validation
4. Real-time leave balance
5. Approval workflow (Employee → Manager)
6. Email notifications and Email Outbox
7. Admin management (employees, departments, leave types)
8. Leave history, filters and reports

## 10. Proposed Software Architecture

**Three-tier (client–server) architecture** with a layered back end.

- **Presentation tier:** React single-page application
- **Application tier:** Node.js + Express REST API (routes → controllers → services → data access)
- **Data tier:** MySQL relational database (tenant-scoped by `company_id`)
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
| UI design | Figma (wireframes, hi-fi screens, prototype) | Design before coding; shareable prototype link |
| Tools | VS Code, Postman, draw.io, Mermaid | Development, API testing, diagrams and wireframes |

## 12. Initial Project Plan and Feature List

| Evaluation | Date | Planned deliverables |
|---|---|---|
| E1 | Planned 1 Nov 2026 (presented 15 Nov 2026) | Requirements, use case diagram, wireframes, ER design, architecture, stack, GitHub setup |
| E2 | 8 Nov 2026 | React pages: company registration, login, first-login, dashboards, apply leave, history, approvals, employees, outbox; responsive layout; form validation (front end already working with mock data) |
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
| Multi-company data leaking between companies | `company_id` on every table and in every query; tested with two companies |
| Secrets exposed | `.env` in `.gitignore`; use `.env.example` |