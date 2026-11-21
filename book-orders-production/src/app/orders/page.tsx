"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface Book {
  id: number;
  title: string;
  subject: string;
  level: string;
}

interface School {
  id: number;
  name: string;
  region: string;
}

interface Customer {
  id: number;
  name: string;
  phone: string;
}

interface OrderItem {
  bookId: number;
  quantity: number;
}

interface Order {
  id: number;
  schoolId: number;
  school: School;
  customerName: string;
  phone: string;
  notes: string;
  status: string;
  cmdNumber: string | null;
  items: { id: number; bookId: number; quantity: number; book: Book }[];
  createdAt: string;
}

const LEVEL_ORDER = ["PS","MS","GS","CP","CE1","CE2","CM1","CM2","CE6","1AC","2AC","3AC","TC SC","1BAC SC EXP","1BAC SC MATHS","1BAC SC PC","1BAC SEG ECO","2BAC SC EXP","2BAC SC MATHS","2BAC SC PC","2BAC SEG ECO"];

const LEVEL_LABELS: Record<string, string> = {
  "CP": "CP", "CE1": "CE1", "CE2": "CE2", "CM1": "CM1", "CM2": "CM2",
  "CE6": "CE6", "1AC": "1AC", "2AC": "2AC", "3AC": "3AC",
  "TC SC": "TC SC", "1BAC SC EXP": "1BAC SC EXP", "1BAC SC MATHS": "1BAC SC MATHS",
  "1BAC SC PC": "1BAC SC PC", "1BAC SEG ECO": "1BAC SEG ECO",
  "2BAC SC EXP": "2BAC SC EXP", "2BAC SC MATHS": "2BAC SC MATHS",
  "2BAC SC PC": "2BAC SC PC", "2BAC SEG ECO": "2BAC SEG ECO",
};

export default function OrdersPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<number>(0);
  const [selectedLevel, setSelectedLevel] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [schoolRegion, setSchoolRegion] = useState("");
  const [items, setItems] = useState<Record<number, number>>({});
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [orderFilter, setOrderFilter] = useState<"all" | "pending" | "sent">("all");
  const [historyTab, setHistoryTab] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historyDate, setHistoryDate] = useState("");
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const fetchAll = useCallback(async () => {
    const [sRes, oRes] = await Promise.all([
      fetch("/api/schools"),
      fetch("/api/orders"),
    ]);
    if (sRes.ok) setSchools(await sRes.json());
    if (oRes.ok) setOrders(await oRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const fetchBooksForSchool = useCallback(async (schoolId: number) => {
    const res = await fetch(`/api/catalog?schoolId=${schoolId}`);
    if (res.ok) {
      setBooks(await res.json());
    } else {
      setBooks([]);
    }
  }, []);

  useEffect(() => {
    if (selectedSchool) {
      fetchBooksForSchool(selectedSchool);
    } else {
      setBooks([]);
    }
  }, [selectedSchool, fetchBooksForSchool]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        nameInputRef.current &&
        !nameInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const levels = [...new Set(books.map((b) => b.level))].sort((a, b) => LEVEL_ORDER.indexOf(a) - LEVEL_ORDER.indexOf(b));

  const filteredBooks = selectedLevel
    ? books.filter((b) => b.level === selectedLevel)
    : books;

  async function searchCustomers(query: string) {
    if (query.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const res = await fetch(`/api/customers?search=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      setSuggestions(data);
      setShowSuggestions(data.length > 0);
    }
  }

  function handleCustomerNameChange(value: string) {
    setCustomerName(value);
    setSelectedCustomerId(null);
    searchCustomers(value);
  }

  function selectCustomer(customer: Customer) {
    setCustomerName(customer.name);
    setPhone(customer.phone);
    setSelectedCustomerId(customer.id);
    setShowSuggestions(false);
  }

  function selectAllForLevel(level: string) {
    const levelBooks = books.filter((b) => b.level === level);
    const newItems = { ...items };
    for (const book of levelBooks) {
      newItems[book.id] = 1;
    }
    setItems(newItems);
  }

  async function handleAddSchool(e: React.FormEvent) {
    e.preventDefault();
    if (!schoolName.trim() || !schoolRegion.trim()) return;
    const res = await fetch("/api/schools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: schoolName, region: schoolRegion }),
    });
    if (res.ok) {
      const school = await res.json();
      setSchools((prev) => [...prev, school].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedSchool(school.id);
      setSchoolName("");
      setSchoolRegion("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSchool) return;
    const orderItems: OrderItem[] = Object.entries(items)
      .filter(([, qty]) => qty > 0)
      .map(([bookId, qty]) => ({ bookId: Number(bookId), quantity: qty }));
    if (orderItems.length === 0) return;

    if (editingOrderId) {
      const order = orders.find(o => o.id === editingOrderId);
      if (!order) return;

      for (const item of order.items) {
        const newQty = items[item.bookId] ?? 0;
        if (newQty !== item.quantity) {
          await fetch("/api/orders", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: editingOrderId, action: "updateItem", itemId: item.id, quantity: newQty }),
          });
        }
      }

      for (const [bookIdStr, qty] of Object.entries(items)) {
        const bookId = Number(bookIdStr);
        const exists = order.items.some(i => i.bookId === bookId);
        if (!exists && qty > 0) {
          await fetch("/api/orders", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: editingOrderId, action: "addItem", bookId, quantity: qty }),
          });
        }
      }

      const res = await fetch("/api/orders");
      if (res.ok) setOrders(await res.json());
      resetForm();
    } else {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId: selectedSchool,
          customerName,
          phone,
          notes,
          orderDate,
          customerId: selectedCustomerId,
          items: orderItems,
        }),
      });
      if (res.ok) {
        const order = await res.json();
        setOrders((prev) => [order, ...prev]);
        resetForm();
      }
    }
  }

  function resetForm() {
    setEditingOrderId(null);
    setItems({});
    setCustomerName("");
    setPhone("");
    setNotes("");
    setOrderDate(new Date().toISOString().split("T")[0]);
    setSelectedCustomerId(null);
    setSelectedSchool(0);
    setSelectedLevel("");
  }

  function startEditOrder(order: Order) {
    setEditingOrderId(order.id);
    setSelectedSchool(order.schoolId);
    setCustomerName(order.customerName);
    setPhone(order.phone);
    setNotes(order.notes);
    setOrderDate(new Date(order.createdAt).toISOString().split("T")[0]);
    setSelectedCustomerId(null);
    setSelectedLevel("");

    const orderItems: Record<number, number> = {};
    for (const item of order.items) {
      orderItems[item.bookId] = item.quantity;
    }
    setItems(orderItems);
    setHistoryTab(false);
  }

  async function handleDeleteOrder(id: number) {
    if (!confirm("Etes-vous sur de vouloir supprimer cette commande ?")) return;
    await fetch(`/api/orders?id=${id}`, { method: "DELETE" });
    setOrders((prev) => prev.filter((o) => o.id !== id));
    if (editingOrderId === id) resetForm();
  }

  function updateQuantity(bookId: number, qty: number) {
    setItems((prev) => ({ ...prev, [bookId]: qty }));
  }

  const filteredOrders = orders.filter((o) => {
    if (orderFilter === "all") return true;
    return o.status === orderFilter;
  });

  const historyOrders = orders.filter((o) => {
    if (historySearch) {
      const q = historySearch.toLowerCase();
      const matchCmd = o.cmdNumber && o.cmdNumber.toLowerCase().includes(q);
      const matchName = o.customerName && o.customerName.toLowerCase().includes(q);
      const matchSchool = o.school.name.toLowerCase().includes(q);
      if (!matchCmd && !matchName && !matchSchool) return false;
    }
    if (historyDate) {
      const orderDate = new Date(o.createdAt).toISOString().split("T")[0];
      if (orderDate !== historyDate) return false;
    }
    return true;
  });

  const historyGroups = historyOrders.reduce<Record<string, Order[]>>((acc, order) => {
    const key = order.cmdNumber || `sans-numero-${order.id}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(order);
    return acc;
  }, {});

  if (loading) {
    return <div className="text-center py-10 text-gray-400">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Saisie des commandes</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-bold mb-3">Ajouter un etablissement</h3>
            <form onSubmit={handleAddSchool} className="flex gap-2 items-end flex-wrap">
              <input
                type="text"
                placeholder="Nom de l'etablissement"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="border rounded px-3 py-1.5 text-sm flex-1 min-w-[180px]"
                required
              />
              <input
                type="text"
                placeholder="Region"
                value={schoolRegion}
                onChange={(e) => setSchoolRegion(e.target.value)}
                className="border rounded px-3 py-1.5 text-sm w-36"
                required
              />
              <button type="submit" className="bg-indigo-600 text-white px-4 py-1.5 rounded text-sm hover:bg-indigo-700">
                Ajouter
              </button>
            </form>
          </div>

          <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow space-y-3">
            {editingOrderId && (
              <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2 flex items-center justify-between">
                <span className="text-sm font-bold text-blue-700">Modification de commande #{editingOrderId}</span>
                <button type="button" onClick={resetForm} className="text-xs text-blue-500 hover:text-blue-700 underline">Annuler la modification</button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <label className="block text-sm font-medium mb-1">Nom complet du client</label>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={customerName}
                  onChange={(e) => handleCustomerNameChange(e.target.value)}
                  onFocus={() => customerName.length >= 1 && suggestions.length > 0 && setShowSuggestions(true)}
                  className="border rounded px-3 py-1.5 text-sm w-full"
                  placeholder="Entrer le nom du client"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute z-10 w-full bg-white border rounded shadow-lg mt-1 max-h-48 overflow-y-auto"
                  >
                    {suggestions.map((customer) => (
                      <div
                        key={customer.id}
                        onClick={() => selectCustomer(customer)}
                        className="px-3 py-2 hover:bg-indigo-50 cursor-pointer text-sm border-b last:border-b-0"
                      >
                        <div className="font-medium">{customer.name}</div>
                        {customer.phone && (
                          <div className="text-xs text-gray-500">{customer.phone}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Telephone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="border rounded px-3 py-1.5 text-sm w-full"
                  placeholder="06XX XX XX XX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date de la commande</label>
                <input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="border rounded px-3 py-1.5 text-sm w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Etablissement</label>
                <select
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(Number(e.target.value))}
                  className="border rounded px-3 py-1.5 text-sm w-full"
                  required
                >
                  <option value={0}>-- Selectionner --</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.region})</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="border rounded px-3 py-1.5 text-sm w-full"
                rows={2}
                placeholder="Notes supplementaires..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Niveau scolaire</label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="border rounded px-3 py-1.5 text-sm w-full"
                >
                  <option value="">Tous les niveaux</option>
                  {levels.map((l) => <option key={l} value={l}>{LEVEL_LABELS[l] || l}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                {selectedLevel && (
                  <button
                    type="button"
                    onClick={() => selectAllForLevel(selectedLevel)}
                    className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700"
                  >
                    Tout ajouter ({books.filter((b) => b.level === selectedLevel).length})
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto border rounded">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">Livre</th>
                    <th className="px-3 py-2 text-left">Niveau</th>
                    <th className="px-3 py-2 text-left w-24">Qte</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks.length === 0 ? (
                    <tr><td colSpan={3} className="text-center py-4 text-gray-400">Aucun livre</td></tr>
                  ) : (
                    filteredBooks.map((book) => (
                      <tr key={book.id} className="border-t">
                        <td className="px-3 py-2">{book.title}</td>
                        <td className="px-3 py-2 text-xs text-gray-500">{LEVEL_LABELS[book.level] || book.level}</td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min={0}
                            value={items[book.id] ?? 0}
                            onChange={(e) => updateQuantity(book.id, Number(e.target.value))}
                            className="border rounded px-2 py-1 text-sm w-20 text-center"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <button
              type="submit"
              className={`${editingOrderId ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700"} text-white px-6 py-2 rounded w-full`}
            >
              {editingOrderId ? "Enregistrer les modifications" : "Enregistrer la commande"}
            </button>
          </form>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <div className="flex items-center gap-1 mb-3 border-b pb-2">
            <button onClick={() => setHistoryTab(false)} className={`px-3 py-1 rounded text-xs font-medium ${!historyTab ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>Commandes</button>
            <button onClick={() => setHistoryTab(true)} className={`px-3 py-1 rounded text-xs font-medium ${historyTab ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>Historique</button>
          </div>

          {!historyTab ? (
            <>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex gap-1">
                  <button onClick={() => setOrderFilter("all")} className={`px-3 py-1 rounded text-xs font-medium ${orderFilter === "all" ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>Toutes</button>
                  <button onClick={() => setOrderFilter("pending")} className={`px-3 py-1 rounded text-xs font-medium ${orderFilter === "pending" ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>En attente</button>
                  <button onClick={() => setOrderFilter("sent")} className={`px-3 py-1 rounded text-xs font-medium ${orderFilter === "sent" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>Envoyee</button>
                </div>
                <h3 className="font-bold">Commandes ({filteredOrders.length})</h3>
              </div>
              <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                {filteredOrders.length === 0 ? (
                  <p className="text-gray-400 text-center py-6">
                    {orderFilter === "all" ? "Aucune commande" : orderFilter === "pending" ? "Aucune commande en attente" : "Aucune commande envoyee"}
                  </p>
                ) : (
                  filteredOrders.map((order) => (
                    <div key={order.id} className={`border rounded p-3 ${editingOrderId === order.id ? "border-blue-400 bg-blue-50" : ""}`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{order.school.name}</span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${order.status === "sent" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                            {order.status === "sent" ? "Envoyee" : "En attente"}
                          </span>
                          {editingOrderId !== order.id && (
                            <button
                              onClick={() => startEditOrder(order)}
                              className="text-blue-500 hover:underline text-xs"
                            >
                              Modifier
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="text-red-500 hover:underline text-xs"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                      {order.cmdNumber && (
                        <p className="text-xs text-blue-600 font-mono font-bold">{order.cmdNumber}</p>
                      )}
                      {order.customerName && (
                        <p className="text-xs text-gray-600">Client: {order.customerName}</p>
                      )}
                      {order.phone && (
                        <p className="text-xs text-gray-600">Tel: {order.phone}</p>
                      )}
                      <p className="text-xs text-gray-500 mb-2">
                        {new Date(order.createdAt).toLocaleDateString("fr-FR")} — {order.items.length} livre(s) — {order.items.reduce((s, i) => s + i.quantity, 0)} ex.
                      </p>
                      {order.notes && (
                        <p className="text-xs text-gray-500 mb-2">Notes: {order.notes}</p>
                      )}
                      <div className="text-xs space-y-1">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between">
                            <span>{item.book.title}</span>
                            <span className="text-gray-500">{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-xs text-gray-500 mb-1">Rechercher (N CMD / Client / Ecole)</label>
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="CMD-22072026..."
                    className="border rounded px-3 py-1.5 text-sm w-full"
                  />
                </div>
                <div className="min-w-[150px]">
                  <label className="block text-xs text-gray-500 mb-1">Date</label>
                  <input
                    type="date"
                    value={historyDate}
                    onChange={(e) => setHistoryDate(e.target.value)}
                    className="border rounded px-3 py-1.5 text-sm w-full"
                  />
                </div>
                {(historySearch || historyDate) && (
                  <button
                    onClick={() => { setHistorySearch(""); setHistoryDate(""); }}
                    className="text-xs text-gray-500 hover:text-gray-700 mt-4"
                  >
                    Effacer
                  </button>
                )}
              </div>
              <div className="space-y-4 max-h-[65vh] overflow-y-auto">
                {Object.keys(historyGroups).length === 0 ? (
                  <p className="text-gray-400 text-center py-6">Aucune commande trouvee</p>
                ) : (
                  Object.entries(historyGroups).sort(([a], [b]) => b.localeCompare(a)).map(([cmdKey, group]) => (
                    <div key={cmdKey} className="border rounded overflow-hidden">
                      <div className="bg-blue-50 px-3 py-2 flex items-center justify-between border-b">
                        <div>
                          <span className="font-mono font-bold text-sm text-blue-700">{cmdKey.startsWith("sans-") ? "Sans numero" : cmdKey}</span>
                          <span className="text-xs text-gray-500 ml-2">({group.length} commande(s))</span>
                        </div>
                        <a
                          href={`/summary?showAll=true&cmdNumber=${encodeURIComponent(cmdKey.startsWith("sans-") ? "" : cmdKey)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600 flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          PDF
                        </a>
                      </div>
                      {group.map((order) => (
                        <div key={order.id} className="px-3 py-2 border-b last:border-b-0 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{order.school.name}</span>
                            <span className="text-gray-400">{new Date(order.createdAt).toLocaleDateString("fr-FR")}</span>
                          </div>
                          {order.customerName && <div className="text-gray-600">Client: {order.customerName}</div>}
                          <div className="text-gray-400 mt-1">{order.items.length} livre(s) — {order.items.reduce((s, i) => s + i.quantity, 0)} ex.</div>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
