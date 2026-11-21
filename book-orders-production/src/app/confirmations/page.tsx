"use client";

import { useState, useEffect } from "react";

interface AggregatedBook {
  bookIds: number[];
  title: string;
  level: string;
  subject: string;
  totalOrdered: number;
  totalReceived: number;
  confirmed: boolean;
  cmdNumber: string;
  orderId: number;
  customers: {
    orderItemId: number;
    customerName: string;
    schoolName: string;
    quantity: number;
    received: boolean | null;
  }[];
}

interface ConfirmResult {
  bookIds: number[];
  bookTitle: string;
  totalOrdered: number;
  received: number;
  unreceived: number;
  addedToNextOrder: number;
}

export default function ConfirmationsPage() {
  const [books, setBooks] = useState<AggregatedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [receivedInputs, setReceivedInputs] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [undoing, setUndoing] = useState<number | null>(null);
  const [results, setResults] = useState<ConfirmResult[] | null>(null);
  const [expandedBook, setExpandedBook] = useState<string | null>(null);
  const [cmdNumberFilter, setCmdNumberFilter] = useState("");
  const [allCmdNumbers, setAllCmdNumbers] = useState<string[]>([]);

  useEffect(() => {
    fetchBooks();
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [cmdNumberFilter]);

  async function fetchBooks() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (cmdNumberFilter) params.set("cmdNumber", cmdNumberFilter);
      const res = await fetch(`/api/confirmations?${params}`);
      const data = await res.json();
      setBooks(data);

      if (!cmdNumberFilter) {
        const cmds = [...new Set(data.map((b: AggregatedBook) => b.cmdNumber).filter(Boolean))] as string[];
        setAllCmdNumbers(cmds);
      }

      const inputs: Record<string, string> = {};
      data.forEach((b: AggregatedBook) => {
        const key = b.bookIds.join(",");
        if (b.confirmed) {
          inputs[key] = String(b.totalReceived);
        } else {
          inputs[key] = String(b.totalOrdered);
        }
      });
      setReceivedInputs(inputs);
    } catch (error) {
      console.error("Failed to fetch:", error);
    }
    setLoading(false);
  }

  async function confirmAll() {
    setSubmitting(true);
    setResults(null);
    try {
      const payload = books.map((b) => ({
        bookIds: b.bookIds,
        receivedQuantity: parseInt(receivedInputs[b.bookIds.join(",")] || "0", 10) || 0,
      }));
      const res = await fetch("/api/confirmations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload }),
      });
      const data = await res.json();
      if (data.success) {
        setResults(data.results);
        fetchBooks();
      }
    } catch (error) {
      console.error("Failed to confirm:", error);
    }
    setSubmitting(false);
  }

  async function undoBook(bookIds: number[]) {
    if (!confirm("Annuler la confirmation de ce livre ? Les données seront réinitialisées.")) return;
    setUndoing(bookIds[0]);
    try {
      const res = await fetch("/api/confirmations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookIds }),
      });
      const data = await res.json();
      if (data.success) {
        setResults((prev) => prev ? prev.filter((r) => JSON.stringify(r.bookIds) !== JSON.stringify(bookIds)) : null);
        fetchBooks();
      }
    } catch (error) {
      console.error("Failed to undo:", error);
    }
    setUndoing(null);
  }

  async function undoAll() {
    if (!results || results.length === 0) return;
    if (!confirm("Annuler toutes les confirmations ?")) return;
    setSubmitting(true);
    for (const r of results) {
      await fetch("/api/confirmations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookIds: r.bookIds }),
      });
    }
    setResults(null);
    fetchBooks();
    setSubmitting(false);
  }

  const unconfirmedBooks = books.filter(b => !b.confirmed);
  const confirmedBooks = books.filter(b => b.confirmed);
  const totalOrderedAll = books.reduce((s, b) => s + b.totalOrdered, 0);
  const totalReceivedAll = books.reduce((s, b) => s + (parseInt(receivedInputs[b.bookIds.join(",")] || "0", 10) || 0), 0);
  const totalDiff = totalOrderedAll - totalReceivedAll;

  const groupedByCmd: Record<string, AggregatedBook[]> = {};
  for (const book of books) {
    const key = book.cmdNumber || "sans-numero";
    if (!groupedByCmd[key]) groupedByCmd[key] = [];
    groupedByCmd[key].push(book);
  }
  const sortedCmdKeys = Object.keys(groupedByCmd).sort((a, b) => b.localeCompare(a));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-2">Aucun livre à confirmer</div>
        <p className="text-sm text-gray-500">Les commandes envoyées apparaîtront ici.</p>
      </div>
    );
  }

  function renderBookRow(book: AggregatedBook, idx: number, isConfirmedSection: boolean) {
    const bookKey = book.bookIds.join(",");
    const received = parseInt(receivedInputs[bookKey] || "0", 10) || 0;
    const diff = book.totalOrdered - received;
    const isPartial = diff > 0 && received > 0;

    return (
      <>
        <tr
          key={bookKey}
          className={`border-t cursor-pointer ${
            isConfirmedSection
              ? "bg-green-50/50 hover:bg-green-50"
              : isPartial ? "bg-orange-50 hover:bg-orange-100" : "hover:bg-gray-50"
          }`}
          onClick={() => setExpandedBook(expandedBook === bookKey ? null : bookKey)}
        >
          <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
          <td className="px-4 py-3">
            <div className="flex items-center gap-2">
              {isConfirmedSection && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white text-xs">✓</span>
              )}
              <div>
                <div className="font-medium">{book.title}</div>
                {book.customers.length > 0 && (
                  <div className="text-xs text-gray-400 mt-0.5">
                    {book.customers.map(c => c.customerName).join(", ")}
                  </div>
                )}
              </div>
            </div>
          </td>
          <td className="px-4 py-3">{book.level}</td>
          <td className="px-4 py-3 text-center font-bold">{book.totalOrdered}</td>
          <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
            <input
              type="number"
              min={0}
              max={book.totalOrdered}
              value={receivedInputs[bookKey] || ""}
              onChange={(e) => setReceivedInputs({ ...receivedInputs, [bookKey]: e.target.value })}
              className={`w-20 text-center font-bold border-2 rounded-lg px-2 py-1 focus:outline-none ${
                isConfirmedSection
                  ? "border-green-300 focus:border-green-500"
                  : isPartial ? "border-orange-300 focus:border-orange-500" : "border-green-300 focus:border-green-500"
              }`}
            />
          </td>
          <td className="px-4 py-3 text-center">
            <span className={`font-bold ${diff > 0 ? "text-orange-600" : "text-green-600"}`}>
              {diff > 0 ? diff : 0}
            </span>
          </td>
          <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
            {isConfirmedSection && (
              <button
                onClick={() => undoBook(book.bookIds)}
                disabled={undoing === book.bookIds[0]}
                className="text-xs text-red-600 hover:text-red-800 font-medium disabled:opacity-50 bg-red-50 px-2 py-1 rounded"
              >
                {undoing === book.bookIds[0] ? "..." : "Annuler"}
              </button>
            )}
          </td>
        </tr>
        {expandedBook === bookKey && (
          <tr key={`detail-${bookKey}`}>
            <td colSpan={6} className="px-4 py-3 bg-gray-50 border-t">
              <div className="text-xs font-medium text-gray-500 mb-2">
                Détail par client (ordre chronologique — les premiers servis en premier):
              </div>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  let remaining = received;
                  return book.customers.map((c) => {
                    const fulfilled = remaining > 0;
                    if (fulfilled) remaining--;
                    return (
                      <div
                        key={c.orderItemId}
                        className={`text-xs px-3 py-1.5 rounded-full border ${
                          fulfilled
                            ? "bg-green-100 border-green-300 text-green-800"
                            : "bg-red-50 border-red-200 text-red-700"
                        }`}
                      >
                        <span className="font-medium">{c.customerName}</span>
                        <span className="mx-1">·</span>
                        <span>{c.schoolName}</span>
                        <span className="mx-1">·</span>
                        <span className="font-bold">×{c.quantity}</span>
                        {fulfilled ? " ✓" : " ✗"}
                      </div>
                    );
                  });
                })()}
              </div>
            </td>
          </tr>
        )}
      </>
    );
  }

  return (
    <div className="space-y-6">
      {results && results.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-green-800">Confirmation enregistrée</h3>
            <button
              onClick={undoAll}
              className="text-sm text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              Annuler tout
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-green-200">
                  <th className="text-left py-1 px-2">Livre</th>
                  <th className="text-center py-1 px-2">Commandé</th>
                  <th className="text-center py-1 px-2">Reçu</th>
                  <th className="text-center py-1 px-2">Reste</th>
                  <th className="text-center py-1 px-2">→ Cmd suivante</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.bookIds.join(",")} className="border-b border-green-100 last:border-0">
                    <td className="py-1 px-2 font-medium text-green-900">{r.bookTitle}</td>
                    <td className="py-1 px-2 text-center">{r.totalOrdered}</td>
                    <td className="py-1 px-2 text-center font-bold text-green-700">{r.received}</td>
                    <td className="py-1 px-2 text-center font-bold text-orange-600">{r.unreceived}</td>
                    <td className="py-1 px-2 text-center font-bold text-red-600">{r.addedToNextOrder}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={() => setResults(null)} className="mt-2 text-xs text-green-600 hover:text-green-800">
            Fermer
          </button>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Confirmation de réception</h2>
          <p className="text-sm text-gray-500 mt-1">
            {unconfirmedBooks.length > 0
              ? `${unconfirmedBooks.length} livre(s) en attente de confirmation.`
              : "Tous les livres ont été confirmés."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={confirmAll}
            disabled={books.length === 0 || submitting}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                Traitement...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Confirmer
              </>
            )}
          </button>
        </div>
      </div>

      {allCmdNumbers.length > 0 && (
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">N° Commande:</label>
          <select
            value={cmdNumberFilter}
            onChange={(e) => setCmdNumberFilter(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm"
          >
            <option value="">Toutes les commandes</option>
            {allCmdNumbers.map(cmd => (
              <option key={cmd} value={cmd}>{cmd}</option>
            ))}
          </select>
          {cmdNumberFilter && (
            <button onClick={() => setCmdNumberFilter("")} className="text-xs text-gray-500 hover:text-gray-700 underline">
              Effacer le filtre
            </button>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {sortedCmdKeys.map((cmdKey) => {
          const cmdBooks = groupedByCmd[cmdKey];
          const cmdUnconfirmed = cmdBooks.filter(b => !b.confirmed);
          const cmdConfirmed = cmdBooks.filter(b => b.confirmed);
          const cmdTotal = cmdBooks.reduce((s, b) => s + b.totalOrdered, 0);
          const cmdReceived = cmdBooks.reduce((s, b) => s + (parseInt(receivedInputs[b.bookIds.join(",")] || "0", 10) || 0), 0);

          return (
            <div key={cmdKey} className="border-b last:border-b-0">
              <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-800">{cmdKey === "sans-numero" ? "Sans numéro" : cmdKey}</span>
                  <span className="text-xs text-gray-500">{cmdBooks.length} livre(s)</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span>Commandé: <strong>{cmdTotal}</strong></span>
                  <span>Reçu: <strong className="text-green-600">{cmdReceived}</strong></span>
                  <span>Reste: <strong className="text-orange-600">{cmdTotal - cmdReceived > 0 ? cmdTotal - cmdReceived : 0}</strong></span>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead style={{ backgroundColor: "#fdf7eb" }}>
                  <tr>
                    <th className="px-4 py-2 text-left">#</th>
                    <th className="px-4 py-2 text-left">Titre du livre</th>
                    <th className="px-4 py-2 text-left">Niveau</th>
                    <th className="px-4 py-2 text-center">Commandé</th>
                    <th className="px-4 py-2 text-center">Reçu</th>
                    <th className="px-4 py-2 text-center">Reste</th>
                    <th className="px-4 py-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cmdUnconfirmed.length > 0 && (
                    <>
                      <tr>
                        <td colSpan={7} className="px-4 py-2 bg-orange-50 text-orange-700 font-bold text-sm">
                          ⚠ En attente ({cmdUnconfirmed.length})
                        </td>
                      </tr>
                      {cmdUnconfirmed.map((book, idx) => renderBookRow(book, idx, false))}
                    </>
                  )}
                  {cmdConfirmed.length > 0 && (
                    <>
                      <tr>
                        <td colSpan={7} className="px-4 py-2 bg-green-50 text-green-700 font-bold text-sm">
                          ✓ Confirmés ({cmdConfirmed.length})
                        </td>
                      </tr>
                      {cmdConfirmed.map((book, idx) => renderBookRow(book, cmdUnconfirmed.length + idx, true))}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}
