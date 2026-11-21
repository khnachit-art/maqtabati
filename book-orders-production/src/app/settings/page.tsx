"use client";

import { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

interface Book {
  id: number;
  title: string;
  subject: string;
  level: string;
  school_id: number | null;
  created_at: string | null;
}

interface School {
  id: number;
  name: string;
  region: string;
  created_at: string | null;
}

interface AppSettings {
  company_name: string;
  company_phone: string;
  company_email: string;
  company_address: string;
}

const LEVEL_ORDER = ["PS","MS","GS","CP","CE1","CE2","CM1","CM2","CE6","1AC","2AC","3AC","TC SC","1BAC SC EXP","1BAC SC MATHS","1BAC SC PC","1BAC SEG ECO","2BAC SC EXP","2BAC SC MATHS","2BAC SC PC","2BAC SEG ECO"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"database" | "logo" | "settings" | "backup">("database");
  const [loading, setLoading] = useState(true);

  // Database tab
  const [books, setBooks] = useState<Book[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [filterLevel, setFilterLevel] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBook, setNewBook] = useState({ title: "", subject: "", level: "", school_id: "" });

  // Logo tab
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Settings tab
  const [settings, setSettings] = useState<AppSettings>({
    company_name: "Maqtabati",
    company_phone: "+212 0776730934",
    company_email: "maqtabati@gmail.com",
    company_address: "",
  });

  // Backup tab
  const [backupStatus, setBackupStatus] = useState("");
  const [dbPath, setDbPath] = useState("");

  const subjects = [...new Set(books.map((b) => b.subject))].sort();
  const levels = [...new Set(books.map((b) => b.level))].sort((a, b) => LEVEL_ORDER.indexOf(a) - LEVEL_ORDER.indexOf(b));

  async function loadAll() {
    setLoading(true);
    try {
      const [booksData, schoolsData, settingsData, logoData, dbPathData] = await Promise.all([
        invoke<Book[]>("get_books"),
        invoke<School[]>("get_schools"),
        invoke<AppSettings>("get_settings"),
        invoke<string | null>("get_logo"),
        invoke<string>("get_database_path"),
      ]);
      setBooks(booksData);
      setSchools(schoolsData);
      setSettings(settingsData);
      setLogoPreview(logoData);
      setDbPath(dbPathData);
    } catch (e) {
      console.error("Failed to load:", e);
    }
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  // Book CRUD
  async function handleAddBook() {
    if (!newBook.title.trim() || !newBook.subject.trim() || !newBook.level.trim()) return;
    try {
      const id = await invoke<number>("add_book", {
        title: newBook.title,
        subject: newBook.subject,
        level: newBook.level,
        school_id: newBook.school_id ? parseInt(newBook.school_id) : null,
      });
      setBooks((prev) => [...prev, { id, ...newBook, school_id: newBook.school_id ? parseInt(newBook.school_id) : null, created_at: new Date().toISOString() }]);
      setNewBook({ title: "", subject: "", level: "", school_id: "" });
      setShowAddForm(false);
    } catch (e) {
      alert("فشل الإضافة: " + String(e));
    }
  }

  async function handleUpdateBook() {
    if (!editingBook) return;
    try {
      await invoke<boolean>("update_book", {
        id: editingBook.id,
        title: newBook.title,
        subject: newBook.subject,
        level: newBook.level,
        school_id: newBook.school_id ? parseInt(newBook.school_id) : null,
      });
      setBooks((prev) => prev.map((b) => (b.id === editingBook.id ? { ...b, ...newBook, school_id: newBook.school_id ? parseInt(newBook.school_id) : null } : b)));
      setEditingBook(null);
      setNewBook({ title: "", subject: "", level: "", school_id: "" });
    } catch (e) {
      alert("فشل التحديث: " + String(e));
    }
  }

  async function handleDeleteBook(id: number) {
    if (!confirm("هل أنت متأكد من حذف هذا الكتاب؟")) return;
    try {
      await invoke<boolean>("delete_book", { id });
      setBooks((prev) => prev.filter((b) => b.id !== id));
    } catch (e) {
      alert("فشل الحذف: " + String(e));
    }
  }

  async function handleBulkDelete(type: "all" | "level" | "school") {
    let confirmMsg = "";
    let count: number;
    if (type === "all") {
      confirmMsg = "⚠️ تحذير: سيحذف هذا الإجراء جميع الكتب في قاعدة البيانات!\n\nهل أنت متأكد تماماً؟";
      if (!confirm(confirmMsg)) return;
      try {
        count = await invoke<number>("delete_all_books");
        alert(`تم حذف ${count} كتاب`);
        loadAll();
      } catch (e) {
        alert("فشل الحذف: " + String(e));
      }
    } else if (type === "level") {
      const level = prompt("أدخل المستوى المراد حذفه (مثال: CP, CE1, 1AC...):");
      if (!level) return;
      confirmMsg = `سيحذف هذا جميع كتب المستوى "${level}". متابعة؟`;
      if (!confirm(confirmMsg)) return;
      try {
        count = await invoke<number>("delete_books_by_level", { level });
        alert(`تم حذف ${count} كتاب من المستوى ${level}`);
        loadAll();
      } catch (e) {
        alert("فشل الحذف: " + String(e));
      }
    } else if (type === "school") {
      const schoolName = prompt("أدخل اسم المدرسة أو اتركه فارغاً لحذف الكتب غير المرتبطة:");
      if (schoolName === null) return;
      // Find school id
      const school = schools.find(s => s.name === schoolName);
      const schoolId = school?.id;
      confirmMsg = schoolId ? `سيحذف هذا جميع كتب "${schoolName}". متابعة؟` : "سيحذف هذا جميع الكتب غير المرتبطة بمدرسة. متابعة؟";
      if (!confirm(confirmMsg)) return;
      try {
        count = await invoke<number>("delete_books_by_school", { school_id: schoolId || 0 });
        alert(`تم حذف ${count} كتاب`);
        loadAll();
      } catch (e) {
        alert("فشل الحذف: " + String(e));
      }
    }
  }

  // Excel Import
  async function handleExcelImport() {
    const selected = await open({ multiple: false, filters: [{ name: "Excel", extensions: ["xlsx", "xls"] }] });
    if (!selected) return;

    const schoolId = prompt("معرف المدرسة (اختياري، اتركه فارغاً):");
    const defaultLevel = prompt("المستوى الافتراضي (اختياري، سيتم استنتاجه من اسم الورقة إن وجد):");

    try {
      const result = await invoke<{ created: number; skipped: number; errors: string[] }>("import_books_from_excel", {
        file_path: selected,
        school_id: schoolId ? parseInt(schoolId) : null,
        default_level: defaultLevel || null,
      });
      alert(`تم الاستيراد: ${result.created} كتاب مضاف، ${result.skipped} تخطي.${result.errors.length ? "\nأخطاء: " + result.errors.slice(0, 5).join(", ") : ""}`);
      loadAll();
    } catch (e) {
      alert("فشل الاستيراد: " + String(e));
    }
  }

  // Logo
  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("الملف يجب أن يكون صورة");
      return;
    }
    setLogoFile(file);
    const url = URL.createObjectURL(file);
    setLogoPreview(url);
  }

  async function saveLogo() {
    if (!logoFile) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        await invoke<boolean>("set_logo", { base64_data: base64 });
        alert("تم حفظ اللوجو بنجاح");
      } catch (e) {
        alert("فشل حفظ اللوجو: " + String(e));
      }
    };
    reader.readAsDataURL(logoFile);
  }

  async function removeLogo() {
    if (!confirm("حذف اللوجو الحالي؟")) return;
    try {
      await invoke<boolean>("remove_logo");
      setLogoPreview(null);
      alert("تم حذف اللوجو");
    } catch (e) {
      alert("فشل الحذف: " + String(e));
    }
  }

  // Settings
  async function saveSettings() {
    try {
      await invoke<boolean>("save_settings", { settings });
      alert("تم حفظ الإعدادات");
    } catch (e) {
      alert("فشل الحفظ: " + String(e));
    }
  }

  // Backup
  async function doBackup() {
    try {
      const path = await invoke<string>("backup_database");
      setBackupStatus(`تم النسخ الاحتياطي إلى: ${path}`);
    } catch (e) {
      setBackupStatus("فشل: " + String(e));
    }
  }

  async function doReset() {
    if (!confirm("⚠️ هذا سيحذف قاعدة البيانات بالكامل ويعيد إنشاؤها فارغة!\n\nهل أنت متأكد تماماً؟")) return;
    try {
      const msg = await invoke<string>("reset_database");
      alert(msg);
      setBackupStatus(msg);
    } catch (e) {
      setBackupStatus("فشل: " + String(e));
    }
  }

  const filteredBooks = books.filter((b) =>
    (!filterLevel || b.level === filterLevel) &&
    (!filterSubject || b.subject === filterSubject)
  );

  const startEdit = (book: Book) => {
    setEditingBook(book);
    setNewBook({ title: book.title, subject: book.subject, level: book.level, school_id: book.school_id?.toString() || "" });
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    setEditingBook(null);
    setNewBook({ title: "", subject: "", level: "", school_id: "" });
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">الإعدادات والإدارة</h2>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {([
          { id: "database", label: "قاعدة البيانات" },
          { id: "logo", label: "اللوجو" },
          { id: "settings", label: "الإعدادات" },
          { id: "backup", label: "النسخ الاحتياطي" },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Database Tab */}
      {activeTab === "database" && (
        <div className="space-y-4">
          {/* Bulk Actions */}
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <h3 className="font-bold text-red-800 mb-3">⚠️ عمليات الحذف الجماعي (خطيرة)</h3>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => handleBulkDelete("all")} className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700">
                حذف جميع الكتب
              </button>
              <button onClick={() => handleBulkDelete("level")} className="bg-red-500 text-white px-4 py-2 rounded text-sm hover:bg-red-600">
                حذف كتب مستوى معين
              </button>
              <button onClick={() => handleBulkDelete("school")} className="bg-red-400 text-white px-4 py-2 rounded text-sm hover:bg-red-500">
                حذف كتب مدرسة معينة
              </button>
            </div>
          </div>

          {/* Import */}
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <h3 className="font-bold text-blue-800 mb-3">📥 استيراد من Excel</h3>
            <p className="text-sm text-blue-700 mb-2">الملف يجب أن يحتوي على أعمدة: عنوان الكتاب، المادة، المستوى (اختياري). اسم الورقة سيستخدم لاستنتاج المستوى.</p>
            <button onClick={handleExcelImport} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              اختيار ملف Excel واستيراد
            </button>
          </div>

          {/* Add/Edit Form */}
          <div className={`bg-white p-4 rounded shadow ${showAddForm || editingBook ? "" : "hidden"}`}>
            <h3 className="font-bold mb-3">{editingBook ? "تعديل كتاب" : "إضافة كتاب جديد"}</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
              <input
                type="text"
                placeholder="عنوان الكتاب"
                value={newBook.title}
                onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                className="border rounded px-3 py-2 text-sm col-span-2"
              />
              <select
                value={newBook.subject}
                onChange={(e) => setNewBook({ ...newBook, subject: e.target.value })}
                className="border rounded px-3 py-2 text-sm"
              >
                <option value="">المادة</option>
                {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={newBook.level}
                onChange={(e) => setNewBook({ ...newBook, level: e.target.value })}
                className="border rounded px-3 py-2 text-sm"
              >
                <option value="">المستوى</option>
                {LEVEL_ORDER.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <select
                value={newBook.school_id}
                onChange={(e) => setNewBook({ ...newBook, school_id: e.target.value })}
                className="border rounded px-3 py-2 text-sm flex-1"
              >
                <option value="">بدون مدرسة</option>
                {schools.map((s) => <option key={s.id} value={s.id.toString()}>{s.name} ({s.region})</option>)}
              </select>
              <button onClick={editingBook ? handleUpdateBook : handleAddBook} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700">
                {editingBook ? "حفظ التعديلات" : "إضافة"}
              </button>
              {editingBook && (
                <button onClick={cancelEdit} className="bg-gray-400 text-white px-4 py-2 rounded text-sm hover:bg-gray-500">
                  إلغاء
                </button>
              )}
            </div>
          </div>

          {!showAddForm && !editingBook && (
            <button onClick={() => setShowAddForm(true)} className="bg-emerald-600 text-white px-4 py-2 rounded text-sm hover:bg-emerald-700">
              + إضافة كتاب جديد
            </button>
          )}

          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className="border rounded px-3 py-2 text-sm">
              <option value="">جميع المستويات</option>
              {levels.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="border rounded px-3 py-2 text-sm">
              <option value="">جميع المواد</option>
              {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Books Table */}
          <div className="bg-white rounded shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">#</th>
                  <th className="px-4 py-2 text-left">العنوان</th>
                  <th className="px-4 py-2 text-left">المادة</th>
                  <th className="px-4 py-2 text-left">المستوى</th>
                  <th className="px-4 py-2 text-left">المدرسة</th>
                  <th className="px-4 py-2 text-left">التاريخ</th>
                  <th className="px-4 py-2 text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-4">جاري التحميل...</td></tr>
                ) : filteredBooks.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-4 text-gray-400">لا توجد كتب</td></tr>
                ) : (
                  filteredBooks.map((book, idx) => (
                    <tr key={book.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2">{idx + 1}</td>
                      <td className="px-4 py-2 font-medium">{book.title}</td>
                      <td className="px-4 py-2">{book.subject}</td>
                      <td className="px-4 py-2">{book.level}</td>
                      <td className="px-4 py-2 text-gray-500">
                        {schools.find(s => s.id === book.school_id)?.name || "—"}
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-400">
                        {book.created_at ? new Date(book.created_at).toLocaleDateString("ar-MA") : "—"}
                      </td>
                      <td className="px-4 py-2 space-x-2">
                        <button onClick={() => startEdit(book)} className="text-blue-600 hover:underline text-xs">تعديل</button>
                        <button onClick={() => handleDeleteBook(book.id)} className="text-red-600 hover:underline text-xs">حذف</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Logo Tab */}
      {activeTab === "logo" && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-white p-6 rounded shadow text-center">
            <h3 className="font-bold mb-4">شعار التطبيق</h3>
            {logoPreview ? (
              <div className="space-y-4">
                <img src={logoPreview} alt="Logo" className="mx-auto max-h-40 max-w-full rounded shadow" />
                <div className="flex gap-2 justify-center">
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" id="logo-input" ref={(el) => logoFileInput = el} />
                  <button onClick={() => logoFileInput?.click()} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
                    تغيير اللوجو
                  </button>
                  <button onClick={saveLogo} disabled={!logoFile} className="bg-emerald-600 text-white px-4 py-2 rounded text-sm hover:bg-emerald-700 disabled:opacity-50">
                    حفظ
                  </button>
                  <button onClick={removeLogo} className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700">
                    حذف
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-40 h-40 mx-auto border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400">
                  لا يوجد لوجو
                </div>
                <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" id="logo-input" ref={(el) => logoFileInput = el} />
                <button onClick={() => logoFileInput?.click()} className="bg-indigo-600 text-white px-6 py-3 rounded text-sm hover:bg-indigo-700">
                  اختيار لوجو جديد
                </button>
              </div>
            )}
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm text-blue-800">
            <strong>ملاحظات:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>الأبعاد المثالية: 200×200 بكسل (سيتم تغيير الحجم تلقائياً)</li>
              <li>الصيغ المدعومة: PNG، JPG، JPEG</li>
              <li>سيظهر اللوجو في شريط التنقل العلوي وفي التقارير</li>
            </ul>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="max-w-2xl">
          <div className="bg-white p-6 rounded shadow space-y-4">
            <h3 className="font-bold text-lg">معلومات الشركة / المؤسسة</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">اسم الشركة</label>
                <input type="text" value={settings.company_name} onChange={(e) => setSettings({ ...settings, company_name: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الهاتف</label>
                <input type="tel" value={settings.company_phone} onChange={(e) => setSettings({ ...settings, company_phone: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">البريد الإلكتروني</label>
                <input type="email" value={settings.company_email} onChange={(e) => setSettings({ ...settings, company_email: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">العنوان</label>
                <input type="text" value={settings.company_address} onChange={(e) => setSettings({ ...settings, company_address: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
              </div>
            </div>
            <button onClick={saveSettings} className="bg-indigo-600 text-white px-6 py-2 rounded text-sm hover:bg-indigo-700">
              حفظ الإعدادات
            </button>
          </div>
        </div>
      )}

      {/* Backup Tab */}
      {activeTab === "backup" && (
        <div className="max-w-2xl space-y-4">
          <div className="bg-white p-6 rounded shadow">
            <h3 className="font-bold text-lg mb-4">مسار قاعدة البيانات</h3>
            <code className="text-sm bg-gray-100 px-3 py-2 rounded block break-all">{dbPath || "—"}</code>
          </div>

          <div className="bg-white p-6 rounded shadow space-y-4">
            <h3 className="font-bold text-lg mb-2">النسخ الاحتياطي</h3>
            <button onClick={doBackup} className="bg-blue-600 text-white px-6 py-3 rounded text-sm hover:bg-blue-700 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              إنشاء نسخة احتياطية الآن
            </button>
            {backupStatus && <p className="text-sm text-green-600">{backupStatus}</p>}
          </div>

          <div className="bg-red-50 border border-red-200 rounded p-6">
            <h3 className="font-bold text-red-800 mb-2">⚠️ إعادة تعيين قاعدة البيانات (خطر)</h3>
            <p className="text-red-700 text-sm mb-4">هذا سيحذف قاعدة البيانات بالكامل ويعيد إنشاؤها فارغة (مع الجداول فقط). لا يمكن التراجع.</p>
            <button onClick={doReset} className="bg-red-600 text-white px-6 py-2 rounded text-sm hover:bg-red-700">
              إعادة تعيين قاعدة البيانات
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

let logoFileInput: HTMLInputElement | null = null;