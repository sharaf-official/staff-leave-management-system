import { leaveBalances, leaveTypeList } from "../data/mockData";

// days already used or reserved (approved + pending) for one leave type
export const usedDays = (mine, type) =>
  mine
    .filter((r) => r.type === type && (r.status === "Approved" || r.status === "Pending"))
    .reduce((s, r) => s + r.days, 0);

// types = leave types from the API. If it is not passed, the old mock list is used.
export const buildBalances = (mine, types) => {
  if (types === undefined) {
    return leaveBalances.map((b) => {
      const total = leaveTypeList.find((t) => t.name === b.type)?.days ?? b.remaining;
      const used = usedDays(mine, b.type);
      return { ...b, total, used, remaining: Math.max(total - used, 0) };
    });
  }
  return types.map((t) => {
    const used = usedDays(mine, t.name);
    return { type: t.name, total: t.days, used, remaining: Math.max(t.days - used, 0) };
  });
};