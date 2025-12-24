export type CompanyProfileLocal = {
  companyName?: string;
  companyCode?: string;
  photoFilename?: string;
  updatedAt?: string;
};

function storageKey(userId: number) {
  return `company_profile_${userId}`;
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function getCompanyProfileFromLocalStorage(userId?: number | null): CompanyProfileLocal {
  if (typeof window === "undefined") return {};

  const authUser = safeParse<{ companyName?: string; companyCode?: string }>(window.localStorage.getItem("auth_user"));
  const fromAuth: CompanyProfileLocal = {
    companyName: (authUser?.companyName || "").trim() || undefined,
    companyCode: (authUser?.companyCode || "").trim() || undefined,
  };

  if (!userId) return fromAuth;

  const userProfile = safeParse<CompanyProfileLocal>(window.localStorage.getItem(storageKey(userId))) || {};
  return {
    ...fromAuth,
    ...userProfile,
  };
}

export function setCompanyProfileToLocalStorage(profile: CompanyProfileLocal, userId?: number | null) {
  if (typeof window === "undefined") return;

  if (!userId) return;

  const key = storageKey(userId);
  const current = safeParse<CompanyProfileLocal>(window.localStorage.getItem(key)) || {};
  const next: CompanyProfileLocal = {
    ...current,
    ...profile,
    updatedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(key, JSON.stringify(next));
}

export function getCompanyNameFromLocalStorage(userId?: number | null) {
  if (typeof window === "undefined") return "";

  const current = getCompanyProfileFromLocalStorage(userId);
  return (current?.companyName || "").trim();
}

export function getCompanyCodeFromLocalStorage(userId?: number | null) {
  if (typeof window === "undefined") return "";

  const current = getCompanyProfileFromLocalStorage(userId);
  return (current?.companyCode || "").trim();
}
