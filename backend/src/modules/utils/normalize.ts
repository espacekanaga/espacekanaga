export function normalizeEmail(email: string | null | undefined) {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  return normalized.length ? normalized : null;
}

export function normalizeTelephone(telephone: string | null | undefined) {
  if (!telephone) return null;
  const normalized = telephone.trim().replace(/[\s.-]/g, "");
  return normalized.length ? normalized : null;
}

