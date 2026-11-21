import { randomBytes } from "crypto";

const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No confusing chars (O,0,I,1)
const KEY_LENGTH = 24; // 24 chars = ~128 bits entropy
const SEGMENT_LENGTH = 4;

/**
 * Generate a secure license key
 * Format: XXXX-XXXX-XXXX-XXXX-XXXX-XXXX (24 chars)
 */
export function generateLicenseKey(): string {
  const bytes = randomBytes(KEY_LENGTH);
  let key = "";
  for (let i = 0; i < KEY_LENGTH; i++) {
    key += CHARSET[bytes[i] % CHARSET.length];
  }
  // Format with dashes
  return key.match(new RegExp(`.{1,${SEGMENT_LENGTH}}`, "g"))?.join("-") || key;
}

/**
 * Validate license key format
 */
export function validateKeyFormat(key: string): boolean {
  const cleanKey = key.replace(/-/g, "").toUpperCase();
  return cleanKey.length === KEY_LENGTH && /^[A-Z0-9]+$/.test(cleanKey);
}

/**
 * Normalize key (remove dashes, uppercase)
 */
export function normalizeKey(key: string): string {
  return key.replace(/-/g, "").toUpperCase();
}

/**
 * Format key for display (with dashes)
 */
export function formatKey(key: string): string {
  const clean = normalizeKey(key);
  return clean.match(new RegExp(`.{1,${SEGMENT_LENGTH}}`, "g"))?.join("-") || key;
}

/**
 * Check if license is expired
 */
export function isExpired(expiresAt: Date | null | undefined): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

/**
 * Get license status label
 */
export function getStatusLabel(status: string): { label: string; color: string } {
  const statuses: Record<string, { label: string; color: string }> = {
    active: { label: "نشط", color: "bg-green-100 text-green-800" },
    expired: { label: "منتهي", color: "bg-red-100 text-red-800" },
    revoked: { label: "ملغي", color: "bg-gray-100 text-gray-800" },
    suspended: { label: "معلق", color: "bg-amber-100 text-amber-800" },
  };
  return statuses[status] || { label: status, color: "bg-gray-100 text-gray-800" };
}