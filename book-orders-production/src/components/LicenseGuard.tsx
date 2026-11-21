"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { normalizeKey } from "@/lib/license";

interface LicenseInfo {
  customerName: string;
  customerEmail?: string;
  companyName?: string;
  maxUsers: number;
  maxSchools: number;
  maxBooks: number;
  expiresAt?: string;
}

export function LicenseGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo | null>(null);

  useEffect(() => {
    checkLicense();
  }, [pathname]);

  const checkLicense = async () => {
    const storedKey = localStorage.getItem("maqtabati_license_key");

    if (!storedKey) {
      // No license key, redirect to login
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      setChecking(false);
      return;
    }

    try {
      const res = await fetch("/api/license/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: storedKey,
          ipAddress: "auto",
          userAgent: navigator.userAgent,
        }),
      });

      const data = await res.json();

      if (data.valid) {
        setValid(true);
        setLicenseInfo(data.license);
      } else {
        // Invalid or expired key
        localStorage.removeItem("maqtabati_license_key");
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      }
    } catch (e) {
      console.error("License check failed:", e);
      // On network error, allow access but show warning
      setValid(true);
    } finally {
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحقق من الترخيص...</p>
        </div>
      </div>
    );
  }

  if (!valid) {
    return null; // Will be redirected
  }

  return (
    <>
      {children}
      {/* License info badge in development */}
      {process.env.NODE_ENV === "development" && licenseInfo && (
        <div className="fixed bottom-4 left-4 bg-indigo-600 text-white px-3 py-2 rounded text-xs z-50 shadow-lg">
          مرخص لـ: {licenseInfo.customerName}
          {licenseInfo.expiresAt && ` | ينتهي: ${new Date(licenseInfo.expiresAt).toLocaleDateString("ar-MA")}`}
        </div>
      )}
    </>
  );
}

export function useLicense() {
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedKey = localStorage.getItem("maqtabati_license_key");
    if (storedKey) {
      fetch("/api/license/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: storedKey }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.valid) setLicenseInfo(data.license);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("maqtabati_license_key");
    setLicenseInfo(null);
  };

  return { licenseInfo, loading, logout };
}