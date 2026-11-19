// days already used or reserved (approved + pending) for one leave type
export const usedDays = (mine, type) =>
  mine
    .filter((r) => r.type === type && (r.status === "Approved" || r.status === "Pending"))
    .reduce((s, r) => s + r.days, 0);

// types = leave types from the API ([{ name, days }])
export const buildBalances = (mine, types = []) =>
  types.map((t) => {
    const used = usedDays(mine, t.name);
    return { type: t.name, total: t.days, used, remaining: Math.max(t.days - used, 0) };
  });