import { useState } from "react";
import { FiFileText, FiCheckCircle, FiClock, FiXCircle, FiDownload } from "react-icons/fi";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";import { reportData, departments, leaveTypeList } from "../data/mockData";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";

const initialFilters = { from: "", to: "", department: "All", type: "All", status: "All" };

export default function Reports() {
  const [filters, setFilters] = useState(initialFilters);

  const handleChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  const dateError =
    filters.from && filters.to && filters.to < filters.from
      ? "'To' date cannot be earlier than 'From' date."
      : "";

  const rows = reportData.filter((r) => {
    if (dateError) return false;
    if (filters.from && r.to < filters.from) return false;
    if (filters.to && r.from > filters.to) return false;
    if (filters.department !== "All" && r.department !== filters.department) return false;
    if (filters.type !== "All" && r.type !== filters.type) return false;
    if (filters.status !== "All" && r.status !== filters.status) return false;
    return true;
  });

  const count = (s) => rows.filter((r) => r.status === s).length;
  const totalDays = rows.reduce((sum, r) => sum + r.days, 0);
  const downloadPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // Header band
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, pageW, 80, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Staff Leave Management System", 40, 38);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text("Leave Report", 40, 60);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageW - 40, 38, { align: "right" });

    // Applied filters
    const filterText = [
      `From: ${filters.from || "Any"}`,
      `To: ${filters.to || "Any"}`,
      `Department: ${filters.department}`,
      `Type: ${filters.type}`,
      `Status: ${filters.status}`,
    ].join("   |   ");
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(10);
    doc.text(`Filters:  ${filterText}`, 40, 105);

    // Summary boxes
    const boxes = [
      { label: "Total requests", value: rows.length, color: [79, 70, 229] },
      { label: "Approved", value: count("Approved"), color: [22, 163, 74] },
      { label: "Pending", value: count("Pending"), color: [217, 119, 6] },
      { label: "Rejected", value: count("Rejected"), color: [220, 38, 38] },
      { label: "Total days", value: totalDays, color: [14, 116, 144] },
    ];
    const gap = 12;
    const boxW = (pageW - 80 - gap * (boxes.length - 1)) / boxes.length;
    boxes.forEach((b, i) => {
      const x = 40 + i * (boxW + gap);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, 120, boxW, 52, 8, 8, "FD");
      doc.setFillColor(...b.color);
      doc.rect(x, 120, 4, 52, "F");
      doc.setTextColor(...b.color);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text(String(b.value), x + 16, 148);
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(b.label, x + 16, 163);
    });

    // Table
    const statusColors = {
      Approved: [22, 163, 74],
      Pending: [217, 119, 6],
      Rejected: [220, 38, 38],
      Cancelled: [100, 116, 139],
    };
    autoTable(doc, {
      startY: 190,
      head: [["#", "Employee", "Department", "Type", "From", "To", "Days", "Status"]],
      body: rows.map((r, i) => [i + 1, r.employee, r.department, r.type, r.from, r.to, r.days, r.status]),
      theme: "striped",
      styles: { font: "helvetica", fontSize: 10, cellPadding: 7, textColor: [30, 41, 59] },
      headStyles: { fillColor: [30, 27, 75], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 40, right: 40, bottom: 40 },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 7) {
          data.cell.styles.textColor = statusColors[data.cell.raw] || [30, 41, 59];
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    // Footer on every page
    const pages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setDrawColor(226, 232, 240);
      doc.line(40, pageH - 30, pageW - 40, pageH - 30);
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text("Staff Leave Management System", 40, pageH - 16);
      doc.text(`Page ${i} of ${pages}`, pageW - 40, pageH - 16, { align: "right" });
    }

    doc.save("leave-report.pdf");
  };
  return (
    <div>
      <div className="cards cards-4">
        <StatCard icon={<FiFileText />} color="icon-blue" value={rows.length} label="Total requests" />
        <StatCard icon={<FiCheckCircle />} color="icon-green" value={count("Approved")} label="Approved" />
        <StatCard icon={<FiClock />} color="icon-amber" value={count("Pending")} label="Pending" />
        <StatCard icon={<FiXCircle />} color="icon-pink" value={count("Rejected")} label="Rejected" />
      </div>

      <div className="card">
        <h3 className="section-title">Filters</h3>
        <div className="rp-filters">
          <div className="us-field">
            <label htmlFor="from">From date</label>
            <input id="from" name="from" type="date" value={filters.from} onChange={handleChange} />
          </div>
          <div className="us-field">
            <label htmlFor="to">To date</label>
            <input id="to" name="to" type="date" value={filters.to} onChange={handleChange} />
          </div>
          <div className="us-field">
            <label htmlFor="department">Department</label>
            <select id="department" name="department" value={filters.department} onChange={handleChange}>
              <option>All</option>
              {departments.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="us-field">
            <label htmlFor="type">Leave type</label>
            <select id="type" name="type" value={filters.type} onChange={handleChange}>
              <option>All</option>
              {leaveTypeList.map((t) => <option key={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="us-field">
            <label htmlFor="status">Status</label>
            <select id="status" name="status" value={filters.status} onChange={handleChange}>
              <option>All</option>
              <option>Pending</option>
              <option>Approved</option>
              <option>Rejected</option>
              <option>Cancelled</option>
            </select>
          </div>
        </div>
        {dateError && <p className="rv-error">{dateError}</p>}
        <div className="rp-bar">
          <button className="btn rv-cancel" onClick={() => setFilters(initialFilters)}>Reset filters</button>
         <button className="btn us-add" onClick={downloadPDF} disabled={rows.length === 0 || !!dateError}>
  <FiDownload /> Download PDF
</button>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">Leave report ({rows.length} records, {totalDays} days)</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Employee</th><th>Department</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Status</th></tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: "center", color: "var(--muted)" }}>No records match the filters.</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.employee}</td>
                  <td>{r.department}</td>
                  <td>{r.type}</td>
                  <td>{r.from}</td>
                  <td>{r.to}</td>
                  <td>{r.days}</td>
                  <td><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}