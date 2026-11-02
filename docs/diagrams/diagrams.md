# Staff Leave Management System: Diagrams

These diagrams are written in Mermaid, so they render automatically when this file is viewed on GitHub. To use them in a report or slides, take a screenshot of each diagram or paste the code into https://mermaid.live and export as PNG/SVG.

---

## 1. Use Case Diagram (equivalent model)

```mermaid
flowchart LR
    E([Employee])
    M([Manager])
    A([Admin])

    subgraph SYS[Staff Leave Management System]
        UC1(Login / Logout)
        UC2(Apply for leave)
        UC3(View leave balance)
        UC4(View leave history)
        UC5(Cancel pending request)
        UC6(Change password)
        UC7(View team pending requests)
        UC8(Approve / reject request)
        UC9(Manage users)
        UC10(Manage departments)
        UC11(Manage leave types)
        UC12(View all requests and reports)
        UC13(Send email notification)
    end

    E --> UC1
    E --> UC2
    E --> UC3
    E --> UC4
    E --> UC5
    E --> UC6

    M --> UC1
    M --> UC2
    M --> UC3
    M --> UC4
    M --> UC7
    M --> UC8

    A --> UC1
    A --> UC9
    A --> UC10
    A --> UC11
    A --> UC12

    UC8 -.->|includes| UC13
```

---

## 2. Entity Relationship (ER) Diagram

```mermaid
erDiagram
    DEPARTMENTS ||--o{ USERS : "has"
    USERS ||--o{ USERS : "manages"
    USERS ||--o{ LEAVE_REQUESTS : "submits"
    USERS ||--o{ LEAVE_REQUESTS : "reviews"
    USERS ||--o{ LEAVE_BALANCES : "owns"
    LEAVE_TYPES ||--o{ LEAVE_REQUESTS : "categorises"
    LEAVE_TYPES ||--o{ LEAVE_BALANCES : "defines"

    DEPARTMENTS {
        INT id PK
        VARCHAR name
        DATETIME created_at
    }

    USERS {
        INT id PK
        VARCHAR name
        VARCHAR email
        VARCHAR password_hash
        ENUM role "employee, manager, admin"
        INT department_id FK
        INT manager_id FK
        BOOLEAN is_active
        DATETIME created_at
    }

    LEAVE_TYPES {
        INT id PK
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
```

### Entities and relationships (summary)

- A **department** has many **users**; each user belongs to one department.
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
        MW[Middleware<br/>CORS, JWT auth, role check, validation]
        RT[Routes]
        CT[Controllers]
        SV[Services<br/>business logic]
        MD[Models / data access]
        MW --> RT --> CT --> SV --> MD
    end

    subgraph DATA[Data tier]
        DB[(MySQL database)]
    end

    EXT[Email service<br/>Nodemailer + SMTP]

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
| Email service | Send approval/rejection notifications |

### How components communicate

1. The browser sends HTTPS requests with JSON to the Express API; the JWT is sent in the `Authorization` header.
2. Middleware verifies the token and the user's role, then validates the input.
3. Controllers call services, which apply business rules and use models to query MySQL.
4. The API returns a JSON response with a status code; the front end updates the UI.
5. On approval or rejection, the service triggers an email through Nodemailer.

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
