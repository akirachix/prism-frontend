export type Body = Record<string, any>;

export async function bodyOf(request: Request): Promise<Body> {
  const data: unknown = await request
    .clone()
    .json()
    .catch(() => ({}));
  return data && typeof data === "object" && !Array.isArray(data) ? (data as Body) : {};
}
