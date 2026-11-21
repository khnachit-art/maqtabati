"use client";

import { useEffect, useState, useCallback } from "react";

interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  totalOrders: number;
  totalItems: number;
  lastOrder: string | null;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await fetch(`/api/customers?${params}`);
    if (res.ok) {
      setCustomers(await res.json());
    }
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  async function handleDelete(id: number) {
    if (!confirm("Etes-vous sur de vouloir supprimer ce client ?")) return;
    await fetch(`/api/customers?id=${id}`, { method: "DELETE" });
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Liste des clients</h2>

      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Rechercher par nom ou telephone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-1.5 text-sm flex-1 max-w-md"
        />
        <button
          onClick={fetchCustomers}
          className="bg-indigo-600 text-white px-4 py-1.5 rounded text-sm hover:bg-indigo-700"
        >
          Rechercher
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow text-center">
          <div className="text-2xl font-bold text-indigo-600">{customers.length}</div>
          <div className="text-sm text-gray-500">Total clients</div>
        </div>
        <div className="bg-white p-4 rounded shadow text-center">
          <div className="text-2xl font-bold text-emerald-600">
            {customers.reduce((sum, c) => sum + c.totalOrders, 0)}
          </div>
          <div className="text-sm text-gray-500">Total commandes</div>
        </div>
        <div className="bg-white p-4 rounded shadow text-center">
          <div className="text-2xl font-bold text-amber-600">
            {customers.reduce((sum, c) => sum + c.totalItems, 0)}
          </div>
          <div className="text-sm text-gray-500">Total livres</div>
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">#</th>
              <th className="px-4 py-2 text-left">Nom</th>
              <th className="px-4 py-2 text-left">Telephone</th>
              <th className="px-4 py-2 text-left">Nb commandes</th>
              <th className="px-4 py-2 text-left">Total livres</th>
              <th className="px-4 py-2 text-left">Derniere commande</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-4">Chargement...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-4 text-gray-400">Aucun client</td></tr>
            ) : (
              customers.map((customer, idx) => (
                <tr key={customer.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{idx + 1}</td>
                  <td className="px-4 py-2 font-medium">{customer.name}</td>
                  <td className="px-4 py-2">{customer.phone || "-"}</td>
                  <td className="px-4 py-2">
                    <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded text-xs">
                      {customer.totalOrders}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs">
                      {customer.totalItems}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-500">
                    {customer.lastOrder
                      ? new Date(customer.lastOrder).toLocaleDateString("fr-FR")
                      : "-"}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleDelete(customer.id)}
                      className="text-red-600 hover:underline text-xs"
                    >
                      Supprimer
                    </button>
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
