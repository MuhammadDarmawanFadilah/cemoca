export type CompanyProfileLocal = {
  companyName?: string;
  companyCode?: string;
  photoFilename?: string;
  updatedAt?: string;
};

function storageKey(userId: number) {
  return `company_profile_${userId}`;
}

function storageKeyPublic() {
  return `company_profile_public`;
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

  const publicProfile = safeParse<CompanyProfileLocal>(window.localStorage.getItem(storageKeyPublic())) || {};
  if (!userId) return publicProfile;

  const userProfile = safeParse<CompanyProfileLocal>(window.localStorage.getItem(storageKey(userId))) || {};
  return {
    ...publicProfile,
    ...userProfile,
  };
}

export function setCompanyProfileToLocalStorage(profile: CompanyProfileLocal, userId?: number | null) {
  if (typeof window === "undefined") return;

  const key = userId ? storageKey(userId) : storageKeyPublic();
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
