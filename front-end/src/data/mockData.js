export const users = [
  { id: 1, name: "Amal Perera", email: "employee@company.com", password: "123456", role: "employee", department: "IT" },
  { id: 2, name: "Nimal Fernando", email: "manager@company.com", password: "123456", role: "manager", department: "IT" },
  { id: 3, name: "Sara Kumar", email: "admin@company.com", password: "123456", role: "admin", department: "HR" },
];

export const leaveBalances = [
  { type: "Annual", remaining: 14 },
  { type: "Sick", remaining: 7 },
  { type: "Casual", remaining: 5 },
];

export const leaveRequests = [
  { id: 1, type: "Annual", from: "2026-11-12", to: "2026-11-14", days: 3, status: "Pending" },
  { id: 2, type: "Sick", from: "2026-10-02", to: "2026-10-02", days: 1, status: "Approved" },
  { id: 3, type: "Casual", from: "2026-09-18", to: "2026-09-18", days: 1, status: "Rejected" },
  { id: 4, type: "Annual", from: "2026-08-05", to: "2026-08-06", days: 2, status: "Approved" },
  { id: 5, type: "Sick", from: "2026-11-20", to: "2026-11-20", days: 1, status: "Pending" },
  { id: 6, type: "Casual", from: "2026-07-10", to: "2026-07-10", days: 1, status: "Cancelled" },
];
export const teamRequests = [
  { id: 101, employee: "Amal Perera", type: "Annual", from: "2026-11-12", to: "2026-11-14", days: 3, reason: "Family function", status: "Pending", comment: "" },
  { id: 102, employee: "Kamal Silva", type: "Sick", from: "2026-11-10", to: "2026-11-10", days: 1, reason: "Fever", status: "Pending", comment: "" },
  { id: 103, employee: "Nisha Fernando", type: "Casual", from: "2026-11-18", to: "2026-11-19", days: 2, reason: "Personal work", status: "Pending", comment: "" },
  { id: 104, employee: "Amal Perera", type: "Sick", from: "2026-10-02", to: "2026-10-02", days: 1, reason: "Headache", status: "Approved", comment: "Get well soon" },
];

export const allRequests = [
  { id: 201, employee: "Amal Perera", department: "IT", type: "Annual", from: "2026-11-12", status: "Pending" },
  { id: 202, employee: "Kamal Silva", department: "IT", type: "Sick", from: "2026-11-10", status: "Pending" },
  { id: 203, employee: "Nisha Fernando", department: "Finance", type: "Casual", from: "2026-11-18", status: "Approved" },
  { id: 204, employee: "Ruwan Jayasinghe", department: "HR", type: "Annual", from: "2026-12-01", status: "Pending" },
];

export const leaveByType = [
  { type: "Annual", count: 12 },
  { type: "Sick", count: 7 },
  { type: "Casual", count: 4 },
];