type ApiError = Error & { code?: string };

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store", ...init });
  } catch {
    throw Object.assign(new Error("Keine Verbindung. Bitte prüfe dein Netz und versuche es erneut."), { code: "NETZ" }) as ApiError;
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw Object.assign(new Error(data?.error?.message ?? "Das hat nicht geklappt. Bitte versuche es erneut."), { code: data?.error?.code as string | undefined }) as ApiError;
  }
  return data as T;
}

export const post = <T>(url: string, body: unknown) =>
  call<T>(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
export const get = <T>(url: string) => call<T>(url);

const KEY = "jsq_party_name";
export function loadName(): string {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}
export function saveName(n: string) {
  try {
    localStorage.setItem(KEY, n.trim());
  } catch {
    /* ohne Speicher einfach weiter */
  }
}
