export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`/api/v1${path}`, {
    ...options,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...options.headers },
    cache: "no-store",
  });
  if (!res.ok) {
    const data = await res
      .json()
      .catch(() => ({ detail: "Service unavailable" }));
    const detail =
      typeof data.detail === "string"
        ? data.detail
        : Array.isArray(data.detail)
          ? data.detail
              .map(
                (e: { loc: string[]; msg: string }) =>
                  `${e.loc.join(".")}: ${e.msg}`,
              )
              .join("; ")
          : "Request failed";
    throw new Error(detail);
  }
  return res.json();
}
export const readable = (text: string) =>
  text
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/^./, (c) => c.toUpperCase());
export const percent = (n: number) => Math.round(n * 100);
export const datetime = (s: string) =>
  new Date(s).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
