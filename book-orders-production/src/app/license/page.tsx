"use client";

import { useEffect, useState, useCallback } from "react";
import { formatKey, getStatusLabel, generateLicenseKey } from "@/lib/license";

interface License {
  id: string;
  key: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  companyName: string | null;
  status: string;
  expiresAt: string | null;
  maxUsers: number;
  maxSchools: number;
  maxBooks: number;
  notes: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  creator: { name: string } | null;
  _count: { usages: number };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "active", label: "نشط" },
  { value: "expired", label: "منتهي" },
  { value: "revoked", label: "ملغي" },
  { value: "suspended", label: "معلق" },
];

export default function LicensePage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingLicense, setEditingLicense] = useState<License | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    companyName: "",
    expiresAt: "",
    maxUsers: 1,
    maxSchools: 10,
    maxBooks: 1000,
    notes: "",
  });

  const fetchLicenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", pagination.page.toString());
      params.set("limit", pagination.limit.toString());
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (searchTerm) params.set("search", searchTerm);

      const res = await fetch(`/api/license?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLicenses(data.licenses);
        setPagination(data.pagination);
      }
    } catch (e) {
      console.error("Failed to fetch licenses:", e);
    }
    setLoading(false);
  }, [pagination.page, pagination.limit, statusFilter, searchTerm]);

  useEffect(() => {
    fetchLicenses();
  }, [fetchLicenses]);

  const resetForm = () => {
    setFormData({
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      companyName: "",
      expiresAt: "",
      maxUsers: 1,
      maxSchools: 10,
      maxBooks: 1000,
      notes: "",
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        resetForm();
        setShowCreateModal(false);
        fetchLicenses();
      } else {
        const err = await res.json();
        alert("فشل الإنشاء: " + (err.error || "خطأ غير معروف"));
      }
    } catch (e) {
      alert("فشل الإنشاء: " + String(e));
    }
    setCreating(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLicense) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/license/${editingLicense.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setEditingLicense(null);
        resetForm();
        fetchLicenses();
      } else {
        const err = await res.json();
        alert("فشل التحديث: " + (err.error || "خطأ غير معروف"));
      }
    } catch (e) {
      alert("فشل التحديث: " + String(e));
    }
    setSaving(false);
  };

  const startEdit = (license: License) => {
    setEditingLicense(license);
    setFormData({
      customerName: license.customerName,
      customerEmail: license.customerEmail || "",
      customerPhone: license.customerPhone || "",
      companyName: license.companyName || "",
      expiresAt: license.expiresAt ? license.expiresAt.split("T")[0] : "",
      maxUsers: license.maxUsers,
      maxSchools: license.maxSchools,
      maxBooks: license.maxBooks,
      notes: license.notes || "",
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من إلغاء هذا المفتاح؟")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/license/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchLicenses();
      } else {
        alert("فشل الإلغاء");
      }
    } catch (e) {
      alert("فشل الإلغاء: " + String(e));
    }
    setDeleting(null);
  };

  const generateKey = () => {
    setFormData((prev) => ({ ...prev, customerName: prev.customerName || "عميل جديد" }));
  };

  const statusLabel = (status: string) => getStatusLabel(status).label;
  const statusColor = (status: string) => getStatusLabel(status).color;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold">إدارة مفاتيح الترخيص</h2>
        <button
          onClick={() => { resetForm(); setShowCreateModal(true); }}
          className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          إنشاء مفتاح جديد
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded shadow flex flex-wrap gap-4">
        <div className="flex gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                statusFilter === opt.value
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="بحث (مفتاح، عميل، شركة...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchLicenses()}
            className="w-full border rounded px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      {/* Licenses Table */}
      <div className="bg-white rounded shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-8 text-gray-400">جاري التحميل...</div>
        ) : licenses.length === 0 ? (
          <div className="text-center py-8 text-gray-400">لا توجد مفاتيح ترخيص</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">المفتاح</th>
                    <th className="px-4 py-2 text-left">العميل</th>
                    <th className="px-4 py-2 text-left">الشركة</th>
                    <th className="px-4 py-2 text-left">الحالة</th>
                    <th className="px-4 py-2 text-left">ينتهي في</th>
                    <th className="px-4 py-2 text-left">الحدود</th>
                    <th className="px-4 py-2 text-left">آخر استخدام</th>
                    <th className="px-4 py-2 text-left">تاريخ الإنشاء</th>
                    <th className="px-4 py-2 text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {licenses.map((license) => (
                    <tr key={license.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-xs font-bold text-indigo-600">
                        {formatKey(license.key)}
                      </td>
                      <td className="px-4 py-2">
                        <div className="font-medium">{license.customerName}</div>
                        {license.customerEmail && (
                          <div className="text-xs text-gray-500">{license.customerEmail}</div>
                        )}
                      </td>
                      <td className="px-4 py-2 text-gray-600">{license.companyName || "—"}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor(license.status)}`}>
                          {statusLabel(license.status)}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-500">
                        {license.expiresAt ? new Date(license.expiresAt).toLocaleDateString("ar-MA") : "لا ينتهي"}
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-500">
                        {license.maxUsers} مستخدم / {license.maxSchools} مدرسة / {license.maxBooks} كتاب
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-500">
                        {license.lastUsedAt ? new Date(license.lastUsedAt).toLocaleDateString("ar-MA") : "—"}
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-500">
                        {new Date(license.createdAt).toLocaleDateString("ar-MA")}
                      </td>
                      <td className="px-4 py-2 space-x-2">
                        <button
                          onClick={() => startEdit(license)}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => handleDelete(license.id)}
                          disabled={deleting === license.id}
                          className="text-red-600 hover:underline text-xs"
                        >
                          {deleting === license.id ? "جاري..." : "إلغاء"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-4 py-3 border-t flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  صفحة {pagination.page} من {pagination.totalPages} — إجمالي {pagination.total}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                  >
                    السابق
                  </button>
                  <button
                    onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                  >
                    التالي
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingLicense) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-lg">
                {editingLicense ? "تعديل مفتاح ترخيص" : "إنشاء مفتاح ترخيص جديد"}
              </h3>
              <button
                onClick={() => { setShowCreateModal(false); setEditingLicense(null); resetForm(); }}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={editingLicense ? handleUpdate : handleCreate} className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">اسم العميل *</label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الهاتف</label>
                  <input
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الشركة</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">تاريخ الانتهاء</label>
                  <input
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الحد الأقصى للمستخدمين</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxUsers}
                    onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) || 1 })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الحد الأقصى للمدارس</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxSchools}
                    onChange={(e) => setFormData({ ...formData, maxSchools: parseInt(e.target.value) || 10 })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الحد الأقصى للكتب</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxBooks}
                    onChange={(e) => setFormData({ ...formData, maxBooks: parseInt(e.target.value) || 1000 })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">ملاحظات</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                  rows={3}
                />
              </div>

              {!editingLicense && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-sm text-blue-800">
                    سيتم توليد مفتاح ترخيص تلقائياً عند الحفظ. يمكنك نسخه من القائمة بعد الإنشاء.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setEditingLicense(null); resetForm(); }}
                  className="bg-gray-400 text-white px-4 py-2 rounded text-sm hover:bg-gray-500"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={creating || saving}
                  className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {creating ? "جاري الإنشاء..." : saving ? "جاري الحفظ..." : editingLicense ? "حفظ التعديلات" : "إنشاء المفتاح"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}