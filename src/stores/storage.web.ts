const isAvailable = typeof localStorage !== "undefined";

export const storage = {
  getString: (key: string) => {
    if (!isAvailable) return undefined;
    return localStorage.getItem(key) ?? undefined;
  },
  getBoolean: (key: string) => {
    if (!isAvailable) return undefined;
    const val = localStorage.getItem(key);
    return val === null ? undefined : val === "true";
  },
  set: (key: string, value: string | boolean) => {
    if (!isAvailable) return;
    localStorage.setItem(key, String(value));
  },
};
