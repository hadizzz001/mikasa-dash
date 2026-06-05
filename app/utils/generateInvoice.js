"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// ---- Company details (edit here if they change) -------------------------
const COMPANY = {
  name: "SANA HOME",
  email: "",
  phone: "",
};

// ---- Pricing helpers (kept in sync with the reservation page) -----------
const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getDiscountedValue = (priceLike, percentageLike, discountLike) => {
  const discountValue = toNumber(discountLike);
  if (discountValue > 0) return discountValue;

  const priceValue = toNumber(priceLike);
  const percentageValue = toNumber(percentageLike);

  if (priceValue > 0 && percentageValue > 0) {
    return priceValue - (priceValue * percentageValue) / 100;
  }

  return priceValue;
};

const resolveLineItemUnitPrice = (item) => {
  if (!item) return 0;

  const colors = Array.isArray(item.color) ? item.color : [];
  const selectedColorObj =
    colors.find((c) => c?.color === item.selectedColor) || colors[0];

  if (
    selectedColorObj &&
    Array.isArray(selectedColorObj.sizes) &&
    selectedColorObj.sizes.length > 0
  ) {
    const selectedSizeObj =
      selectedColorObj.sizes.find((s) => s?.size === item.selectedSize) ||
      selectedColorObj.sizes[0];

    if (selectedSizeObj) {
      return getDiscountedValue(
        selectedSizeObj.price,
        selectedSizeObj.percentage,
        selectedSizeObj.discount
      );
    }
  }

  if (selectedColorObj) {
    return getDiscountedValue(
      selectedColorObj.price,
      selectedColorObj.percentage,
      selectedColorObj.discount
    );
  }

  return getDiscountedValue(item.price, item.percentage, item.discount);
};

const money = (value) => `$${toNumber(value).toFixed(2)}`;

// ---- Main entry point ---------------------------------------------------
/**
 * Build and download a clean PDF invoice for a single order.
 * @param {object} order - the order object from /api/order
 */
export async function generateInvoice(order) {
  if (!order) return;

  const items = Array.isArray(order.userInfo) ? order.userInfo : [];
  const customer = order.cartItems || {};

  // Resolve the discount percentage from the applied code (if any).
  let discountPercent = 0;
  if (order.code) {
    try {
      const res = await fetch(`/api/offer/${order.code}`);
      if (res.ok) {
        const data = await res.json();
        discountPercent = toNumber(data?.per);
      }
    } catch (err) {
      // Silently ignore - invoice still prints without the discount line.
      console.error("Failed to fetch discount for invoice:", err);
    }
  }

  // Compute totals.
  let subtotal = 0;
  const rows = items.map((item, index) => {
    const unitPrice = resolveLineItemUnitPrice(item);
    const qty = parseInt(item.quantity || 1, 10) || 1;
    const lineTotal = unitPrice * qty;
    subtotal += lineTotal;

    return [
      String(index + 1),
      item.title || "-",
      item.selectedColor || "-",
      item.selectedSize || "-",
      String(qty),
      money(unitPrice),
      money(lineTotal),
    ];
  });

  const discountAmount = (subtotal * discountPercent) / 100;
  const delivery = toNumber(order.delivery);
  const grandTotal = subtotal - discountAmount + delivery;

  // ---- Build the PDF ----------------------------------------------------
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginL = 14;
  const marginR = pageWidth - 14;

  const dark = [31, 41, 55]; // slate-800
  const muted = [107, 114, 128]; // gray-500
  const line = [229, 231, 235]; // gray-200

  // --- Header: company name (left) + INVOICE (right) ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(...dark);
  doc.text(COMPANY.name, marginL, 22);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...muted);
  doc.text("INVOICE", marginR, 22, { align: "right" });

  // --- Invoice meta (right aligned) ---
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...dark);
  const metaLines = [
    `Invoice #: ${order.oid ?? "-"}`,
    `Date: ${order.date || "-"}`,
  ];
  metaLines.forEach((text, i) => {
    doc.text(text, marginR, 32 + i * 5, { align: "right" });
  });

  // --- Divider ---
  doc.setDrawColor(...line);
  doc.setLineWidth(0.3);
  doc.line(marginL, 40, marginR, 40);

  // --- Bill To ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...dark);
  doc.text("BILL TO", marginL, 50);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...muted);

  const fullName = `${customer.fname || ""} ${customer.lname || ""}`.trim();
  const addressLine = [customer.apt, customer.address].filter(Boolean).join(", ");
  const cityLine = [customer.city, customer.country].filter(Boolean).join(", ");

  const billLines = [
    fullName || "-",
    customer.phone ? `Phone: ${customer.phone}` : "",
    customer.email || "",
    addressLine,
    cityLine,
  ].filter(Boolean);

  billLines.forEach((text, i) => {
    doc.text(String(text), marginL, 56 + i * 5);
  });

  // --- Items table ---
  const tableStartY = 56 + billLines.length * 5 + 6;

  autoTable(doc, {
    startY: tableStartY,
    head: [["#", "Product", "Color", "Size", "Qty", "Unit Price", "Amount"]],
    body: rows.length ? rows : [["-", "No items", "-", "-", "-", "-", "-"]],
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 2.5,
      textColor: dark,
      lineColor: line,
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: dark,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "left",
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      4: { halign: "center", cellWidth: 14 },
      5: { halign: "right", cellWidth: 26 },
      6: { halign: "right", cellWidth: 26 },
    },
    margin: { left: marginL, right: 14 },
  });

  // --- Totals box (right aligned, below the table) ---
  let cursorY = (doc.lastAutoTable?.finalY || tableStartY) + 10;
  const labelX = marginR - 50;
  const valueX = marginR;

  const addTotalRow = (label, value, opts = {}) => {
    const { bold = false, size = 10, color = muted } = opts;
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
    doc.text(label, labelX, cursorY);
    doc.text(value, valueX, cursorY, { align: "right" });
    cursorY += size === 10 ? 6 : 7;
  };

  addTotalRow("Subtotal", money(subtotal));
  if (discountPercent > 0) {
    const codeLabel = order.code ? `Discount (${order.code} -${discountPercent}%)` : `Discount (-${discountPercent}%)`;
    addTotalRow(codeLabel, `- ${money(discountAmount)}`);
  }
  addTotalRow("Delivery", money(delivery));

  // Separator above grand total
  cursorY += 1;
  doc.setDrawColor(...line);
  doc.line(labelX, cursorY, valueX, cursorY);
  cursorY += 6;

  addTotalRow("TOTAL", money(grandTotal), {
    bold: true,
    size: 12,
    color: dark,
  });

  // --- Remark (optional) ---
  if (order.remark) {
    cursorY += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...dark);
    doc.text("Note:", marginL, cursorY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...muted);
    const wrapped = doc.splitTextToSize(String(order.remark), marginR - marginL - 14);
    doc.text(wrapped, marginL + 14, cursorY);
  }

  // --- Save ---
  doc.save(`Invoice-${order.oid ?? order.num ?? "order"}.pdf`);
}

export default generateInvoice;
