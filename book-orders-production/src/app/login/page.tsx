"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { normalizeKey } from "@/lib/license";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [licenseKey, setLicenseKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [keyValidated, setKeyValidated] = useState(false);
  const [licenseInfo, setLicenseInfo] = useState<any>(null);

  // Check if already logged in (license stored in localStorage)
  useEffect(() => {
    const storedKey = localStorage.getItem("maqtabati_license_key");
    if (storedKey) {
      validateKey(storedKey, true);
    }
  }, []);

  // Check for redirect after login
  const redirect = searchParams.get("redirect");

  useEffect(() => {
    if (redirect && keyValidated) {
      router.push(redirect);
    }
  }, [keyValidated, redirect, router]);

  const validateKey = async (key: string, silent = false) => {
    if (!silent) setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/license/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          ipAddress: "auto",
          userAgent: navigator.userAgent,
        }),
      });

      const data = await res.json();

      if (data.valid) {
        localStorage.setItem("maqtabati_license_key", normalizeKey(key));
        setKeyValidated(true);
        setLicenseInfo(data.license);
        if (!silent) {
          router.push(redirect || "/");
        }
      } else {
        if (!silent) setError(data.error || "مفتاح غير صحيح");
        localStorage.removeItem("maqtabati_license_key");
        setKeyValidated(false);
      }
    } catch (e) {
      if (!silent) setError("حدث خطأ في الاتصال بالخادم");
      console.error("License validation error:", e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = licenseKey.replace(/\s/g, "").toUpperCase();
    if (cleanKey.length < 20) {
      setError("المفتاح قصير جداً");
      return;
    }
    validateKey(cleanKey);
  };

  const handleLogout = () => {
    localStorage.removeItem("maqtabati_license_key");
    setKeyValidated(false);
    setLicenseInfo(null);
    setLicenseKey("");
  };

  if (keyValidated && licenseInfo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md w-full text-center">
          <svg className="w-16 h-16 mx-auto text-green-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <h2 className="text-xl font-bold text-green-800 mb-2">تم التحقق بنجاح</h2>
          <p className="text-green-700 mb-4">مرحباً، <strong>{licenseInfo.customerName}</strong></p>
          {licenseInfo.companyName && (
            <p className="text-green-600 text-sm mb-2">{licenseInfo.companyName}</p>
          )}
          {licenseInfo.expiresAt && (
            <p className="text-green-600 text-sm">
              صالح حتى: {new Date(licenseInfo.expiresAt).toLocaleDateString("ar-MA")}
            </p>
          )}
          <button
            onClick={handleLogout}
            className="mt-4 bg-gray-600 text-white px-6 py-2 rounded text-sm hover:bg-gray-700"
          >
            تسجيل خروج
          </button>
          <p className="mt-4 text-sm text-gray-500">
            سيتم تحويلك إلى التطبيق خلال ثوانٍ...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <div className="text-center">
        <div className="w-24 h-24 mx-auto mb-4 bg-indigo-100 rounded-full flex items-center justify-center">
          <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Maqtabati</h2>
        <p className="text-gray-500 mt-1">إدارة طلبات الكتب المدرسية</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <h3 className="text-lg font-bold text-center mb-6">دخول بمفتاح الترخيص</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              مفتاح الترخيص
            </label>
            <input
              type="text"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""))}
              placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm font-mono tracking-wider text-center"
              maxLength={29} // 24 chars + 5 dashes
              autoComplete="off"
              required
              disabled={loading}
            />
            <p className="text-xs text-gray-400 mt-1 text-center">
              أدخل المفتاح كما استلمته (مع أو بدون شرطات)
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || licenseKey.length < 20}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                جاري التحقق...
              </span>
            ) : (
              "دخول"
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center space-y-2">
            <span>لا تملك مفتاح ترخيص؟</span>
            <span>تواصل مع المطور للحصول على مفتاحك الخاص</span>
            <a href="mailto:maqtabati@gmail.com" className="text-indigo-600 hover:underline">
              maqtabati@gmail.com
            </a>
            <span>|</span>
            <a href="tel:+2120776730934" className="text-indigo-600 hover:underline">
              +212 0776730934
            </a>
          </p>
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
          <p className="font-medium text-gray-700 mb-1">تنسيق المفتاح:</p>
          <code className="font-mono">XXXX-XXXX-XXXX-XXXX-XXXX-XXXX</code>
          <p className="mt-1">(24 حرف، أرقام وأحرف كبيرة، بدون I، O، 0، 1)</p>
        </div>
      </div>
    </div>
  );
}