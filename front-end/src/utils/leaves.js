import { leaveBalances, leaveTypeList } from "../data/mockData";

// days already used or reserved (approved + pending) for one leave type
export const usedDays = (mine, type) =>
  mine
    .filter((r) => r.type === type && (r.status === "Approved" || r.status === "Pending"))
    .reduce((s, r) => s + r.days, 0);

export const buildBalances = (mine) =>
  leaveBalances.map((b) => {
    const total = leaveTypeList.find((t) => t.name === b.type)?.days ?? b.remaining;
    const used = usedDays(mine, b.type);
    return { ...b, total, used, remaining: Math.max(total - used, 0) };
  });