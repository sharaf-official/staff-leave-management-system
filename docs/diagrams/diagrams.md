# Leave Nest: Staff Leave Management System - Diagrams

These diagrams are written in Mermaid, so they render automatically when this file is viewed on GitHub. To use them in a report or slides, take a screenshot of each diagram or paste the code into https://mermaid.live and export as PNG/SVG.

---

## 1. Use Case Diagram (equivalent model)

```mermaid
flowchart LR
    R([Company Registrant])
    E([Employee])
    M([Manager])
    A([Admin])
    EM([Email service])

    subgraph SYS[Leave Nest]
        UC0(Register company)
        UC1(Login / Logout)
        UC1b(Change password at first login)
        UC2(Apply for leave)
        UC3(View leave balance)
        UC4(View leave history)
        UC5(Cancel pending request)
        UC6(Change password / edit own details)
        UC7(View team pending requests)
        UC8(Approve / reject request)
        UC9(Manage employees and invitations)
        UC10(Manage departments)
        UC11(Manage leave types)
        UC12(View all requests and reports)
        UC13(Send email notification)
        UC14(View email outbox)
    end

    R --> UC0
    E --> UC1
    E --> UC2
    E --> UC3
    E --> UC4
    E --> UC5
    E --> UC6
    E --> UC14

    M --> UC1
    M --> UC2
    M --> UC3
    M --> UC4
    M --> UC7
    M --> UC8
    M --> UC14

    A --> UC1
    A --> UC9
    A --> UC10
    A --> UC11
    A --> UC12
    A --> UC14

    UC0 -.->|includes| UC13
    UC9 -.->|includes| UC13
    UC2 -.->|includes| UC13
    UC8 -.->|includes| UC13
    UC1 -.->|extends| UC1b
    UC13 --- EM
```

---

## 2. Entity Relationship (ER) Diagram

```mermaid
erDiagram
    COMPANIES ||--o{ DEPARTMENTS : "has"
    COMPANIES ||--o{ USERS : "employs"
    COMPANIES ||--o{ LEAVE_TYPES : "defines"
    COMPANIES ||--o{ LEAVE_REQUESTS : "owns"
    COMPANIES ||--o{ EMAIL_LOGS : "owns"
    DEPARTMENTS ||--o{ USERS : "has"
    USERS ||--o{ USERS : "manages"
    USERS ||--o| EMPLOYEE_PROFILES : "has"
    USERS ||--o{ LEAVE_REQUESTS : "submits"
    USERS ||--o{ LEAVE_REQUESTS : "reviews"
    USERS ||--o{ LEAVE_BALANCES : "owns"
    USERS ||--o{ EMAIL_LOGS : "receives"
    LEAVE_TYPES ||--o{ LEAVE_REQUESTS : "categorises"
    LEAVE_TYPES ||--o{ LEAVE_BALANCES : "defines"

    COMPANIES {
        INT id PK
        VARCHAR name
        VARCHAR registration_no
        VARCHAR industry
        VARCHAR size_range
        VARCHAR phone
        VARCHAR email
        VARCHAR address
        VARCHAR city
        VARCHAR country
        BOOLEAN is_demo
        DATETIME created_at
    }

    DEPARTMENTS {
        INT id PK
        INT company_id FK
        VARCHAR name
        DATETIME created_at
    }

    USERS {
        INT id PK
        INT company_id FK
        VARCHAR name
        VARCHAR email "unique"
        VARCHAR password_hash
        ENUM role "employee, manager, admin"
        INT department_id FK
        INT manager_id FK
        ENUM status "invited, active, disabled"
        BOOLEAN must_change_password
        DATETIME temp_password_expires_at
        DATETIME created_at
    }

    EMPLOYEE_PROFILES {
        INT id PK
        INT user_id FK
        VARCHAR phone
        VARCHAR address
        VARCHAR emergency_contact
        VARCHAR photo_url
    }

    LEAVE_TYPES {
        INT id PK
        INT company_id FK
        VARCHAR name
        INT days_per_year
        DATETIME created_at
    }

    LEAVE_BALANCES {
        INT id PK
        INT user_id FK
        INT leave_type_id FK
        INT year
        DECIMAL remaining_days
    }

    LEAVE_REQUESTS {
        INT id PK
        INT company_id FK
        INT user_id FK
        INT leave_type_id FK
        DATE start_date
        DATE end_date
        DECIMAL total_days
        TEXT reason
        ENUM status "pending, approved, rejected, cancelled"
        INT reviewed_by FK
        TEXT review_comment
        DATETIME reviewed_at
        DATETIME created_at
    }

    EMAIL_LOGS {
        INT id PK
        INT company_id FK
        INT to_user_id FK
        ENUM type "invitation, leave_request, decision"
        VARCHAR to_email
        VARCHAR subject
        TEXT body
        ENUM status "sent, failed"
        DATETIME created_at
    }
```

### Entities and relationships (summary)

- A **company** is the tenant: departments, users, leave types, leave requests and email logs all carry its `company_id`, so one company can never read another's data.
- A **department** has many **users**; each user belongs to one department.
- A **user** has at most one **employee profile** (phone, address, emergency contact, photo) that the employee edits; email, role, department and manager stay admin-controlled.
- An **email log** records every invitation, leave-request and decision email.
- A **user** may manage many other users (self-relationship via `manager_id`).
- A **user** submits many **leave requests**; a request is reviewed by one manager/admin (`reviewed_by`).
- A **leave type** is used by many leave requests and balances.
- A **leave balance** links one user, one leave type and one year (unique combination).

---

## 3. Software Architecture Diagram

```mermaid
flowchart TB
    subgraph CLIENT[Presentation tier: Browser]
        UI[React SPA<br/>React Router, Axios<br/>Form validation]
    end

    subgraph SERVER[Application tier: Node.js + Express REST API]
        MW[Middleware<br/>CORS, JWT auth, role check, company scope, validation, rate limit]
        RT[Routes]
        CT[Controllers]
        SV[Services<br/>business logic]
        MD[Models / data access]
        MW --> RT --> CT --> SV --> MD
    end

    subgraph DATA[Data tier]
        DB[(MySQL database)]
    end

    EXT[Email service<br/>Nodemailer + Gmail SMTP]

    UI -- "HTTPS, JSON, JWT" --> MW
    MD -- "SQL queries" --> DB
    SV -- "send notification" --> EXT
```

### Component responsibilities

| Component | Responsibility |
|---|---|
| React front end | Display pages, collect input, client-side validation, call the API |
| Express API | Authentication, authorisation, server-side validation, business logic, error handling |
| MySQL | Persistent storage, constraints and relationships |
| Email service | Send invitation, leave-request and decision emails |

### How components communicate

1. The browser sends HTTPS requests with JSON to the Express API; the JWT is sent in the `Authorization` header.
2. Middleware verifies the token and the user's role, then validates the input.
3. Controllers call services, which apply business rules and use models to query MySQL.
4. The API returns a JSON response with a status code; the front end updates the UI.
5. Middleware adds the user's `company_id` to every query (tenant isolation).
6. Emails are triggered by company registration and employee creation (invitation with temporary password), by a new leave request (to the manager) and by approval/rejection (to the employee). Each email is saved in `email_logs`.

---

## 4. Leave Request Flow (supporting model)

```mermaid
sequenceDiagram
    actor Emp as Employee
    participant UI as React UI
    participant API as Express API
    participant DB as MySQL
    actor Mgr as Manager

    Emp->>UI: Fill and submit leave form
    UI->>API: POST /api/leaves (JWT)
    API->>DB: Check balance and overlapping dates
    DB-->>API: OK
    API->>DB: Insert request (status = pending)
    API-->>UI: 201 Created
    Mgr->>UI: Open pending requests
    UI->>API: GET /api/leaves/pending
    Mgr->>UI: Approve with comment
    UI->>API: PATCH /api/leaves/:id/approve
    API->>DB: Update status and deduct balance
    API-->>Emp: Email notification
    API-->>UI: 200 OK
```

---

## 5. Company Onboarding Flow (supporting model)

```mermaid
sequenceDiagram
    actor Reg as Company registrant
    participant UI as React UI
    participant API as Express API
    participant DB as MySQL
    participant Mail as Email service
    actor Adm as Admin / Manager

    Reg->>UI: Fill company, admin and manager details
    UI->>API: POST /api/companies/register
    API->>DB: Create company, admin and manager (temp passwords, status = invited)
    API->>Mail: Send invitation emails
    API-->>UI: 201 Created
    Adm->>UI: Sign in with temporary password
    UI->>API: POST /api/auth/login
    API-->>UI: must_change_password = true
    Adm->>UI: Choose a new password
    UI->>API: PATCH /api/auth/password
    API->>DB: Save hash, status = active
```

---

## 6. Screen Navigation Map

```mermaid
flowchart LR
    L[Login] --> D[Role dashboard]
    L --> RC[Register company] --> L
    L --> FL[First login: set password] --> D
    D --> AL[Apply leave]
    D --> H[My history]
    D --> P[Profile]
    D --> O[Email outbox]
    D --> AP[Team requests - manager]
    D --> U[Employees - admin]
    D --> DP[Departments - admin]
    D --> LT[Leave types - admin]
    D --> RP[Reports - admin]
```