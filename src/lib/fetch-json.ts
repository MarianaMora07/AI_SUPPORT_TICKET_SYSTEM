/** Lee JSON de una respuesta fetch sin lanzar si el cuerpo no es JSON válido. */
export async function readJsonResponse<T>(res: Response): Promise<T | null> {
  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) return null;

  const text = await res.text();
  if (!text.trim()) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
