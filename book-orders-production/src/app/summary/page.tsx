"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";

interface AggregatedRow {
  bookId: number;
  title: string;
  subject: string;
  level: string;
  totalQuantity: number;
  schoolCount: number;
  schools: string[];
  customerNames: string[];
  isUnreceived?: boolean;
}

interface CatalogBook {
  id: number;
  title: string;
  subject: string;
  level: string;
}

const LEVEL_ORDER = ["PS","MS","GS","CP","CE1","CE2","CM1","CM2","CE6","1AC","2AC","3AC","TC SC","1BAC SC EXP","1BAC SC MATHS","1BAC SC PC","1BAC SEG ECO","2BAC SC EXP","2BAC SC MATHS","2BAC SC PC","2BAC SEG ECO"];

const LEVEL_LABELS: Record<string, string> = {
  "PS": "PS", "MS": "MS", "GS": "GS",
  "CP": "CP", "CE1": "CE1", "CE2": "CE2", "CM1": "CM1", "CM2": "CM2",
  "CE6": "CE6", "1AC": "1AC", "2AC": "2AC", "3AC": "3AC",
  "TC SC": "TC SC", "1BAC SC EXP": "1BAC SC EXP", "1BAC SC MATHS": "1BAC SC MATHS",
  "1BAC SC PC": "1BAC SC PC", "1BAC SEG ECO": "1BAC SEG ECO",
  "2BAC SC EXP": "2BAC SC EXP", "2BAC SC MATHS": "2BAC SC MATHS",
  "2BAC SC PC": "2BAC SC PC", "2BAC SEG ECO": "2BAC SEG ECO",
};

function isArabicBook(title: string): boolean {
  return /[\u0600-\u06FF]/.test(title);
}

function isRomanOrNovel(title: string, subject: string): boolean {
  const t = title.toLowerCase();
  if (subject === "Lecture" && /^(roman|romans|contes|contes? des)/i.test(t)) return true;
  if (/^roman|^romans|^رواية|^قصة|^contes/i.test(t)) return true;
  return false;
}

function isManhaj(title: string): boolean {
  return /منجد/i.test(title);
}

function isMorshidi(title: string): boolean {
  return /مرشدي في واجباتي/i.test(title);
}

function isMoien(title: string): boolean {
  return /المعين/i.test(title);
}

function getEndGroupPriority(title: string, subject: string): number {
  if (isRomanOrNovel(title, subject)) return 1;
  if (isManhaj(title)) return 2;
  if (isMorshidi(title)) return 3;
  if (isMoien(title)) return 4;
  return 0;
}

function sortByLevelAndTitle(rows: AggregatedRow[]): AggregatedRow[] {
  return [...rows].sort((a, b) => {
    const aEnd = getEndGroupPriority(a.title, a.subject) > 0 ? 1 : 0;
    const bEnd = getEndGroupPriority(b.title, b.subject) > 0 ? 1 : 0;
    if (aEnd !== bEnd) return aEnd - bEnd;
    const la = LEVEL_ORDER.indexOf(a.level);
    const lb = LEVEL_ORDER.indexOf(b.level);
    if (la !== lb) return la - lb;
    const aGroup = getEndGroupPriority(a.title, a.subject);
    const bGroup = getEndGroupPriority(b.title, b.subject);
    if (aGroup !== bGroup) return aGroup - bGroup;
    return a.title.localeCompare(b.title);
  });
}

export default function SummaryPage() {
  const [data, setData] = useState<AggregatedRow[]>([]);
  const [filterLevel, setFilterLevel] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [cmdNumberFilter, setCmdNumberFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [marking, setMarking] = useState(false);
  const [markResult, setMarkResult] = useState<string | null>(null);
  const [editingQty, setEditingQty] = useState<{ bookId: number; value: string } | null>(null);
  const [savingQty, setSavingQty] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [catalogBooks, setCatalogBooks] = useState<CatalogBook[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<CatalogBook[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addLevel, setAddLevel] = useState("");
  const [addQty, setAddQty] = useState("1");
  const [addingBook, setAddingBook] = useState(false);
  const [unreceivedData, setUnreceivedData] = useState<AggregatedRow[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const generateOrderNumber = useCallback(async () => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = String(now.getFullYear());
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const orders = await res.json();
        const sentCount = orders.filter((o: { status: string }) => o.status === "sent").length;
        const nextNum = String(sentCount + 1).padStart(3, "0");
        return `CMD-${dd}${mm}${yyyy}-${nextNum}`;
      }
    } catch {}
    return `CMD-${dd}${mm}${yyyy}-001`;
  }, []);

  useEffect(() => { generateOrderNumber().then(setOrderNumber); }, [generateOrderNumber]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const cmd = params.get("cmdNumber");
      if (cmd) {
        setCmdNumberFilter(cmd);
        setShowAll(true);
        setOrderNumber(cmd);
      }
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterLevel) params.set("level", filterLevel);
    if (showAll) params.set("showAll", "true");
    if (cmdNumberFilter) params.set("cmdNumber", cmdNumberFilter);
    const res = await fetch(`/api/summary?${params}`);
    if (res.ok) {
      const raw = await res.json();
      setData(raw.map((r: AggregatedRow) => ({
        ...r,
        schools: typeof r.schools === "string" ? r.schools.split(",") : r.schools,
        customerNames: typeof r.customerNames === "string" ? r.customerNames.split(",") : (r.customerNames || []),
      })));
    }
    setLoading(false);
  }, [filterLevel, showAll, cmdNumberFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    fetch("/api/catalog").then(r => r.json()).then((books: CatalogBook[]) => setCatalogBooks(books)).catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/unreceived").then(r => r.json()).then((data: AggregatedRow[]) => {
      setUnreceivedData(data.map(r => ({
        ...r,
        schools: typeof r.schools === "string" ? r.schools.split(",") : r.schools,
        customerNames: typeof r.customerNames === "string" ? r.customerNames.split(",") : (r.customerNames || []),
        isUnreceived: true,
      })));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSearchChange(val: string) {
    setSearchTerm(val);
    if (val.length < 1) { setSuggestions([]); setShowSuggestions(false); return; }
    const lower = val.toLowerCase();
    const matches = catalogBooks.filter(b => b.title.toLowerCase().includes(lower)).slice(0, 15);
    setSuggestions(matches);
    setShowSuggestions(matches.length > 0);
  }

  function selectSuggestion(book: CatalogBook) {
    setSearchTerm(book.title);
    setAddLevel(book.level);
    setShowSuggestions(false);
  }

  async function addBookManual(bookId: number | null, title: string, level: string, qty: number) {
    if (!title || qty <= 0) return;
    setAddingBook(true);
    try {
      let finalBookId = bookId;
      if (!finalBookId) {
        const res = await fetch("/api/catalog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, subject: "General", level }),
        });
        if (res.ok) { const b = await res.json(); finalBookId = b.id; }
      }
      if (finalBookId) {
        await fetch("/api/summary", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookId: finalBookId, newQuantity: qty }),
        });
        fetchData();
      }
      setSearchTerm("");
      setAddLevel("");
      setAddQty("1");
    } catch {}
    setAddingBook(false);
  }

  const sortedData = sortByLevelAndTitle(data);
  const allData = [...unreceivedData, ...sortedData];
  const arabicBooks = allData.filter(r => isArabicBook(r.title));
  const frenchBooks = allData.filter(r => !isArabicBook(r.title));
  const totalBooks = data.reduce((sum, r) => sum + r.totalQuantity, 0);
  const totalUnreceived = unreceivedData.reduce((sum, r) => sum + r.totalQuantity, 0);
  const totalSchools = new Set(data.flatMap((r) => r.schools)).size;
  const allCustomers = [...new Set(data.flatMap((r) => r.customerNames || []).filter(Boolean))];

  async function exportPdf() {
    if (arabicBooks.length === 0 && frenchBooks.length === 0) return;
    setExporting(true);

    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfW = 210;
      const pdfH = 297;
      const margin = 5;
      const bottomReserve = 10;
      const availW = pdfW - margin * 2;
      const availH = pdfH - margin - bottomReserve;

      const style = document.createElement("style");
      style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;600;700&display=swap');
        * { font-family: 'Noto Sans Arabic', Arial, sans-serif !important; }
      `;
      document.body.appendChild(style);
      await new Promise(r => setTimeout(r, 300));

      const hiddenDivs = document.querySelectorAll<HTMLElement>("[data-pdf-section]");
      let firstPage = true;

      for (const div of hiddenDivs) {
        if (!div || div.offsetHeight === 0) continue;

        const table = div.querySelector("table");
        if (!table) continue;

        const tbody = table.querySelector("tbody");
        if (!tbody) continue;
        const allRows = Array.from(tbody.querySelectorAll("tr"));
        if (allRows.length === 0) continue;

        const divRect = div.getBoundingClientRect();
        const divH = div.scrollHeight;

        const scale = 2;
        const canvas = await html2canvas(div, {
          scale: scale,
          useCORS: true,
          backgroundColor: "#ffffff",
          width: div.scrollWidth,
          windowWidth: div.scrollWidth,
        });

        const imgW = canvas.width;
        const imgH = canvas.height;
        const domToCanvasY = imgH / divH;

        const rowBoundsCanvas = allRows.map(row => {
          const r = (row as HTMLElement).getBoundingClientRect();
          return {
            top: (r.top - divRect.top) * domToCanvasY,
            bottom: (r.bottom - divRect.top) * domToCanvasY,
          };
        });

        const canvasPageH = availH / (availW / imgW);

        const pages: { startY: number; endY: number }[] = [];
        let pageStartY = 0;

        for (let i = 0; i < rowBoundsCanvas.length; i++) {
          const rb = rowBoundsCanvas[i];
          if (rb.bottom - pageStartY > canvasPageH && i > 0) {
            const prevEnd = rowBoundsCanvas[i - 1].bottom;
            pages.push({ startY: pageStartY, endY: prevEnd });
            pageStartY = prevEnd;
          }
        }
        if (pageStartY < imgH) {
          pages.push({ startY: pageStartY, endY: imgH });
        }

        for (const pg of pages) {
          const srcY = Math.floor(pg.startY);
          const srcH = Math.ceil(pg.endY - pg.startY);
          if (srcH <= 0) continue;

          const pageCanvas = document.createElement("canvas");
          pageCanvas.width = imgW;
          pageCanvas.height = srcH;
          const ctx = pageCanvas.getContext("2d")!;
          ctx.drawImage(canvas, 0, srcY, imgW, srcH, 0, 0, imgW, srcH);

          if (!firstPage) pdf.addPage();
          firstPage = false;

          const finalImgH = srcH * (availW / imgW);
          pdf.addImage(pageCanvas.toDataURL("image/png"), "PNG", margin, margin, availW, finalImgH);
        }
      }

      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(7);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`${orderNumber || ""} — Page ${i}/${pageCount}`, pdfW / 2, pdfH - 5, { align: "center" });
      }

      document.body.removeChild(style);
      pdf.save(`commandes-${orderNumber || "sans-numero"}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("Erreur lors de l'export PDF: " + String(err));
    }
    setExporting(false);
  }

  function buildSheetData(rows: AggregatedRow[]): (string | number)[][] {
    const header = ["Titre du livre", "Niveau", "Quantite"];
    const sheetRows: (string | number)[][] = [header];
    for (const row of rows) {
      sheetRows.push([
        row.title,
        LEVEL_LABELS[row.level] || row.level,
        row.totalQuantity,
      ]);
    }
    return sheetRows;
  }

  function exportExcel() {
    if (allData.length === 0) return;

    const wb = XLSX.utils.book_new();
    const cols = [{ wch: 60 }, { wch: 16 }, { wch: 8 }];

    if (arabicBooks.length > 0) {
      const wsAr = XLSX.utils.aoa_to_sheet(buildSheetData(arabicBooks));
      wsAr["!cols"] = cols;
      wsAr["!rtl"] = true;
      XLSX.utils.book_append_sheet(wb, wsAr, "الكتب العربية");
    }

    if (frenchBooks.length > 0) {
      const wsFr = XLSX.utils.aoa_to_sheet(buildSheetData(frenchBooks));
      wsFr["!cols"] = cols;
      XLSX.utils.book_append_sheet(wb, wsFr, "الكتب الفرنسية");
    }

    XLSX.writeFile(wb, `commandes-${orderNumber || "sans-numero"}.xlsx`);
  }

  async function markAllSent() {
    if (!confirm("Marquer toutes les commandes en cours comme envoyees au fournisseur ?\n\nElles n'apparaitront plus dans le rapport.")) return;
    setMarking(true);
    setMarkResult(null);
    try {
      const res = await fetch("/api/summary", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAllSent", cmdNumber: orderNumber }),
      });
      const result = await res.json();
      if (result.success) {
        setMarkResult(`${result.updated} commande(s) marquee(s) comme envoyee(s)`);
        fetchData();
        generateOrderNumber().then(setOrderNumber);
      }
    } catch {
      setMarkResult("Erreur lors de la mise a jour");
    }
    setMarking(false);
  }

  async function saveQuantity(bookId: number) {
    if (!editingQty) return;
    const qty = parseInt(editingQty.value, 10);
    if (isNaN(qty) || qty < 0) { setEditingQty(null); return; }
    setSavingQty(true);
    try {
      const res = await fetch("/api/summary", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, newQuantity: qty }),
      });
      if (res.ok) {
        setEditingQty(null);
        fetchData();
      }
    } catch {}
    setSavingQty(false);
  }

  const levels = [...new Set(data.map((d) => d.level))].sort((a, b) => LEVEL_ORDER.indexOf(a) - LEVEL_ORDER.indexOf(b));

  const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

  function renderTableSection(rows: AggregatedRow[], startIdx: number, label: string, accentColor: string) {
    const unreceivedRows = rows.filter(r => r.isUnreceived);
    const regularRows = rows.filter(r => !r.isUnreceived);

    return (
      <>
        {unreceivedRows.length > 0 && (
          <>
            <div className="px-4 py-2 font-bold text-sm" style={{ backgroundColor: "#dc2626", color: "#fff" }}>
              ⚠ Livres non reçus / إضافية للطلبية الموالية ({unreceivedRows.length})
            </div>
            <table className="w-full text-sm" style={{ direction: "ltr" }}>
              <thead style={{ backgroundColor: "#fef2f2" }}>
                <tr>
                  <th className="px-4 py-2 text-left">#</th>
                  <th className="px-4 py-2 text-left">Titre du livre</th>
                  <th className="px-4 py-2 text-left">Niveau</th>
                  <th className="px-4 py-2 text-center">Qty</th>
                  <th className="px-4 py-2 text-left">Client</th>
                </tr>
              </thead>
              <tbody>
                {unreceivedRows.map((row, idx) => (
                  <tr key={`unreceived-${row.bookId}`} className="border-t bg-red-50 hover:bg-red-100">
                    <td className="px-4 py-2 text-red-400">{idx + 1}</td>
                    <td className="px-4 py-2 font-medium text-red-900">{row.title}</td>
                    <td className="px-4 py-2 text-red-700">{LEVEL_LABELS[row.level] || row.level}</td>
                    <td className="px-4 py-2 text-center font-bold text-red-600">
                      {editingQty?.bookId === row.bookId ? (
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            min={0}
                            value={editingQty.value}
                            onChange={(e) => setEditingQty({ ...editingQty, value: e.target.value })}
                            onKeyDown={(e) => { if (e.key === "Enter") saveQuantity(row.bookId); if (e.key === "Escape") setEditingQty(null); }}
                            onBlur={() => saveQuantity(row.bookId)}
                            disabled={savingQty}
                            className="w-16 text-center border rounded px-1 py-0.5 text-sm"
                            autoFocus
                          />
                          <button onClick={() => saveQuantity(row.bookId)} disabled={savingQty} className="text-green-600 hover:text-green-800 text-xs" title="Enregistrer">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          </button>
                        </div>
                      ) : (
                        <span
                          className="cursor-pointer hover:bg-red-200 px-2 py-1 rounded inline-block"
                          onClick={() => setEditingQty({ bookId: row.bookId, value: String(row.totalQuantity) })}
                          title="Cliquer pour modifier"
                        >
                          {row.totalQuantity}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-xs text-red-500">
                      {row.customerNames && row.customerNames.length > 0
                        ? [...new Set(row.customerNames)].join(", ")
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <div className="px-4 py-2 font-bold text-sm" style={{ backgroundColor: accentColor, color: "#fff" }}>
          {label} ({regularRows.length})
        </div>
        <table className="w-full text-sm" style={{ direction: "ltr" }}>
          <thead style={{ backgroundColor: "#fdf7eb" }}>
            <tr>
              <th className="px-4 py-2 text-left">#</th>
              <th className="px-4 py-2 text-left">Titre du livre</th>
              <th className="px-4 py-2 text-left">Niveau</th>
              <th className="px-4 py-2 text-center">Qty</th>
              <th className="px-4 py-2 text-left">Client</th>
            </tr>
          </thead>
          <tbody>
            {regularRows.map((row, idx) => (
              <tr key={row.bookId} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-400">{startIdx + idx + 1}</td>
                <td className="px-4 py-2 font-medium">{row.title}</td>
                <td className="px-4 py-2">{LEVEL_LABELS[row.level] || row.level}</td>
                <td className="px-4 py-2 text-center font-bold text-indigo-600">
                  {editingQty?.bookId === row.bookId ? (
                    <div className="flex items-center justify-center gap-1">
                      <input
                        type="number"
                        min={0}
                        value={editingQty.value}
                        onChange={(e) => setEditingQty({ ...editingQty, value: e.target.value })}
                        onKeyDown={(e) => { if (e.key === "Enter") saveQuantity(row.bookId); if (e.key === "Escape") setEditingQty(null); }}
                        onBlur={() => saveQuantity(row.bookId)}
                        disabled={savingQty}
                        className="w-16 text-center border rounded px-1 py-0.5 text-sm"
                        autoFocus
                      />
                      <button onClick={() => saveQuantity(row.bookId)} disabled={savingQty} className="text-green-600 hover:text-green-800 text-xs" title="Enregistrer">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      </button>
                    </div>
                  ) : (
                    <span
                      className="cursor-pointer hover:bg-indigo-50 px-2 py-1 rounded inline-block"
                      onClick={() => setEditingQty({ bookId: row.bookId, value: String(row.totalQuantity) })}
                      title="Cliquer pour modifier"
                    >
                      {row.totalQuantity}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-xs text-gray-500">
                  {row.customerNames && row.customerNames.length > 0
                    ? [...new Set(row.customerNames)].join(", ")
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  }

  function renderPdfSection(rows: AggregatedRow[], label: string, accentColor: string) {
    const unreceivedRows = rows.filter(r => r.isUnreceived);
    const regularRows = rows.filter(r => !r.isUnreceived);
    let globalIdx = 0;

    return (
      <>
        <div data-pdf-header style={{ marginBottom: "12px", textAlign: "left" }}>
          <div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "4px", borderBottom: `2px solid ${accentColor}`, paddingBottom: "6px", color: accentColor }}>
            {label}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#111111", marginTop: "6px" }}>
            <div>
              <span style={{ fontWeight: "bold" }}>N° Commande: </span>
              <span style={{ borderBottom: "1px solid #999", minWidth: "80px", display: "inline-block" }}>{orderNumber || "............"}</span>
            </div>
            <div>
              <span style={{ fontWeight: "bold" }}>Date: </span>
              <span>{today}</span>
            </div>
          </div>
          <div style={{ fontSize: "10px", color: "#444444", marginTop: "4px" }}>
            {showAll ? "Toutes les commandes" : "Commandes en attente"} — {rows.length} livres | {totalSchools} ecoles
          </div>
          {unreceivedRows.length > 0 && (
            <div style={{ marginTop: "6px", padding: "4px 8px", backgroundColor: "#fef2f2", borderLeft: "3px solid #dc2626", fontSize: "10px", color: "#dc2626", fontWeight: "bold" }}>
              ⚠ Non reçus ({unreceivedRows.length})
            </div>
          )}
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px", tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "28px" }} />
            <col />
            <col style={{ width: "90px" }} />
            <col style={{ width: "32px" }} />
          </colgroup>
          <thead>
            <tr style={{ backgroundColor: accentColor, color: "#ffffff" }}>
              <th style={{ padding: "5px 3px", textAlign: "center", borderBottom: `2px solid ${accentColor}`, fontSize: "9px" }}>#</th>
              <th style={{ padding: "5px 3px", textAlign: "left", borderBottom: `2px solid ${accentColor}`, fontSize: "9px" }}>Titre du livre</th>
              <th style={{ padding: "5px 3px", textAlign: "center", borderBottom: `2px solid ${accentColor}`, fontSize: "9px" }}>Niveau</th>
              <th style={{ padding: "5px 3px", textAlign: "center", borderBottom: `2px solid ${accentColor}`, fontSize: "9px" }}>Qty</th>
            </tr>
          </thead>
          <tbody>
            {unreceivedRows.map((row) => {
              globalIdx++;
              return (
                <tr
                  key={`unreceived-${row.bookId}`}
                  style={{
                    backgroundColor: "#fef2f2",
                    borderBottom: "1px solid #fecaca",
                  }}
                >
                  <td style={{ padding: "3px", textAlign: "center", color: "#1e3a5f", fontWeight: "bold", fontSize: "9px" }}>{globalIdx}</td>
                  <td style={{ padding: "3px", fontWeight: 500, color: "#991b1b", fontSize: "10px" }}>{row.title}</td>
                  <td style={{ padding: "3px", textAlign: "center", color: "#dc2626", fontSize: "9px" }}>{LEVEL_LABELS[row.level] || row.level}</td>
                  <td style={{ padding: "3px", textAlign: "center", fontWeight: "bold", color: "#dc2626", fontSize: "10px" }}>{row.totalQuantity}</td>
                </tr>
              );
            })}
            {regularRows.map((row) => {
              globalIdx++;
              return (
                <tr
                  key={row.bookId}
                  style={{
                    backgroundColor: (globalIdx % 2 === 0) ? "#f0fdf4" : "#ffffff",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <td style={{ padding: "3px", textAlign: "center", color: "#1e3a5f", fontWeight: "bold", fontSize: "9px" }}>{globalIdx}</td>
                  <td style={{ padding: "3px", fontWeight: 500, color: "#111111", fontSize: "10px" }}>{row.title}</td>
                  <td style={{ padding: "3px", textAlign: "center", color: "#111111", fontSize: "9px" }}>{LEVEL_LABELS[row.level] || row.level}</td>
                  <td style={{ padding: "3px", textAlign: "center", fontWeight: "bold", color: accentColor, fontSize: "10px" }}>{row.totalQuantity}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold">
          {showAll ? "Toutes les commandes" : "Commandes en attente"}
        </h2>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">N° Commande:</label>
          <input
            type="text"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm w-44"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportPdf}
            disabled={allData.length === 0 || exporting}
            className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            {exporting ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                Export...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Exporter PDF
              </>
            )}
          </button>
          <button
            onClick={exportExcel}
            disabled={allData.length === 0}
            className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Exporter Excel
          </button>
          {!showAll && (
            <button
              onClick={markAllSent}
              disabled={data.length === 0 || marking}
              className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {marking ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Envoi...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Marquer tout envoye
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {markResult && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
          {markResult}
          <button onClick={() => setMarkResult(null)} className="mr-2 text-green-500 hover:text-green-700">x</button>
        </div>
      )}

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Niveau:</label>
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm"
          >
            <option value="">Tous les niveaux</option>
            {levels.map((l) => <option key={l} value={l}>{LEVEL_LABELS[l] || l}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
            className="rounded"
          />
          <span className="text-gray-600">Afficher toutes les commandes (y compris envoyees)</span>
        </label>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded shadow text-center border-l-4 border-indigo-500">
          <div className="text-2xl font-bold text-indigo-600">{data.length}</div>
          <div className="text-xs text-gray-500">Livres requis</div>
        </div>
        <div className="bg-white p-4 rounded shadow text-center border-l-4 border-emerald-500">
          <div className="text-2xl font-bold text-emerald-600">{totalBooks}</div>
          <div className="text-xs text-gray-500">Quantite totale</div>
        </div>
        <div className="bg-white p-4 rounded shadow text-center border-l-4 border-amber-500">
          <div className="text-2xl font-bold text-amber-600">{totalSchools}</div>
          <div className="text-xs text-gray-500">Ecoles</div>
        </div>
        <div className="bg-white p-4 rounded shadow text-center border-l-4 border-blue-500">
          <div className="text-2xl font-bold text-blue-600">{allCustomers.length}</div>
          <div className="text-xs text-gray-500">Clients</div>
        </div>
        {totalUnreceived > 0 && (
          <div className="bg-white p-4 rounded shadow text-center border-l-4 border-red-500">
            <div className="text-2xl font-bold text-red-600">{totalUnreceived}</div>
            <div className="text-xs text-gray-500">Non reçus</div>
          </div>
        )}
      </div>

      <div ref={tableRef} className="bg-white rounded shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-8 text-gray-400">Chargement...</div>
        ) : data.length === 0 && unreceivedData.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            {showAll ? "Aucune commande" : "Aucune commande en attente. Tout a ete envoye !"}
          </div>
        ) : (
          <>
            {arabicBooks.length > 0 && renderTableSection(arabicBooks, 0, "الكتب العربية - livres arabes", "#16a34a")}
            {frenchBooks.length > 0 && renderTableSection(frenchBooks, arabicBooks.length, "الكتب الفرنسية - livres français", "#2563eb")}
          </>
        )}
      </div>

      {!loading && data.length > 0 && (
        <div className="bg-white p-4 rounded shadow">
          <table className="w-full text-sm" style={{ direction: "ltr" }}>
            <tbody>
              <tr>
                <td className="font-bold">Total livres:</td>
                <td className="text-indigo-600 font-bold">{totalBooks}</td>
                <td className="font-bold">Ecoles:</td>
                <td>{totalSchools}</td>
                <td className="font-bold">Clients:</td>
                <td>{allCustomers.join(", ") || "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-bold text-sm mb-3">Ajouter un livre manuellement</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div ref={searchRef} className="relative flex-1 min-w-[250px]">
            <label className="block text-xs text-gray-500 mb-1">Titre du livre</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
              placeholder="Rechercher ou saisir un nouveau livre..."
              className="w-full border rounded px-3 py-2 text-sm"
              disabled={addingBook}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 w-full bg-white border rounded shadow-lg mt-1 max-h-60 overflow-y-auto">
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 border-b last:border-b-0"
                  >
                    <span className="font-medium">{s.title}</span>
                    <span className="text-gray-400 text-xs ml-2">({LEVEL_LABELS[s.level] || s.level})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="w-40">
            <label className="block text-xs text-gray-500 mb-1">Niveau</label>
            <select value={addLevel} onChange={(e) => setAddLevel(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" disabled={addingBook}>
              <option value="">Niveau</option>
              {LEVEL_ORDER.map((l) => <option key={l} value={l}>{LEVEL_LABELS[l] || l}</option>)}
            </select>
          </div>
          <div className="w-24">
            <label className="block text-xs text-gray-500 mb-1">Quantite</label>
            <input type="number" min={1} value={addQty} onChange={(e) => setAddQty(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" disabled={addingBook} />
          </div>
          <button
            onClick={() => {
              const qty = parseInt(addQty, 10);
              if (!searchTerm || isNaN(qty) || qty <= 0) return;
              const existing = suggestions.find(s => s.title.toLowerCase() === searchTerm.toLowerCase());
              addBookManual(existing ? existing.id : null, searchTerm, addLevel || "CP", qty);
            }}
            disabled={addingBook || !searchTerm}
            className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {addingBook ? "Ajout..." : "Ajouter"}
          </button>
        </div>
      </div>

      {/* Hidden PDF render sections */}
      {arabicBooks.length > 0 && (
        <div data-pdf-section="ar" style={{ position: "fixed", left: "-9999px", top: 0, background: "#ffffff", padding: "10px 15px", width: "794px", fontFamily: "'Noto Sans Arabic', Arial, sans-serif", direction: "ltr" }}>
          {renderPdfSection(arabicBooks, "الكتب العربية - livres arabes", "#16a34a")}
        </div>
      )}
      {frenchBooks.length > 0 && (
        <div data-pdf-section="fr" style={{ position: "fixed", left: "-9999px", top: 0, background: "#ffffff", padding: "10px 15px", width: "794px", fontFamily: "'Noto Sans Arabic', Arial, sans-serif", direction: "ltr" }}>
          {renderPdfSection(frenchBooks, "الكتب الفرنسية - livres français", "#2563eb")}
        </div>
      )}
    </div>
  );
}
