"use client";

import { useEffect, useState, useCallback } from "react";

interface Book {
  id: number;
  title: string;
  subject: string;
  level: string;
}

const emptyForm = { title: "", subject: "", level: "" };

export default function CatalogPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterLevel, setFilterLevel] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchBooks = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterLevel) params.set("level", filterLevel);
    if (filterSubject) params.set("subject", filterSubject);
    const res = await fetch(`/api/catalog?${params}`);
    if (res.ok) {
      setBooks(await res.json());
    }
    setLoading(false);
  }, [filterLevel, filterSubject]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const subjects = [...new Set(books.map((b) => b.subject))].sort();
  const LEVEL_ORDER = ["PS","MS","GS","CP","CE1","CE2","CM1","CM2","CE6","1AC","2AC","3AC","TC SC","1BAC SC EXP","1BAC SC MATHS","1BAC SC PC","1BAC SEG ECO","2BAC SC EXP","2BAC SC MATHS","2BAC SC PC","2BAC SEG ECO"];
  const levels = [...new Set(books.map((b) => b.level))].sort((a, b) => LEVEL_ORDER.indexOf(a) - LEVEL_ORDER.indexOf(b));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.subject.trim()) return;

    if (editingId) {
      await fetch("/api/catalog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...form }),
      });
      setEditingId(null);
    } else {
      await fetch("/api/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setForm(emptyForm);
    fetchBooks();
  }

  async function handleDelete(id: number) {
    if (!confirm("Etes-vous sur de vouloir supprimer ce livre ?")) return;
    await fetch(`/api/catalog?id=${id}`, { method: "DELETE" });
    fetchBooks();
  }

  function handleEdit(book: Book) {
    setForm({ title: book.title, subject: book.subject, level: book.level });
    setEditingId(book.id);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Catalogue des livres</h2>

      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Titre du livre</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="border rounded px-3 py-1.5 text-sm w-64"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Matiere</label>
          <input
            type="text"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="border rounded px-3 py-1.5 text-sm w-40"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Niveau</label>
          <select
            value={form.level}
            onChange={(e) => setForm({ ...form, level: e.target.value })}
            className="border rounded px-3 py-1.5 text-sm"
          >
            {levels.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-1.5 rounded text-sm hover:bg-indigo-700"
        >
          {editingId ? "Mettre a jour" : "Ajouter"}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={() => { setEditingId(null); setForm(emptyForm); }}
            className="bg-gray-400 text-white px-4 py-1.5 rounded text-sm hover:bg-gray-500"
          >
            Annuler
          </button>
        )}
      </form>

      <div className="flex gap-3">
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          className="border rounded px-3 py-1.5 text-sm"
        >
          <option value="">Tous les niveaux</option>
          {levels.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="border rounded px-3 py-1.5 text-sm"
        >
          <option value="">Toutes les matieres</option>
          {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">#</th>
              <th className="px-4 py-2 text-left">Titre</th>
              <th className="px-4 py-2 text-left">Matiere</th>
              <th className="px-4 py-2 text-left">Niveau</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-4">Chargement...</td></tr>
            ) : books.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-4 text-gray-400">Aucun livre</td></tr>
            ) : (
              books.map((book, idx) => (
                <tr key={book.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{idx + 1}</td>
                  <td className="px-4 py-2">{book.title}</td>
                  <td className="px-4 py-2">{book.subject}</td>
                  <td className="px-4 py-2">{book.level}</td>
                  <td className="px-4 py-2 space-x-2">
                    <button onClick={() => handleEdit(book)} className="text-blue-600 hover:underline text-xs">Modifier</button>
                    <button onClick={() => handleDelete(book.id)} className="text-red-600 hover:underline text-xs">Supprimer</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
