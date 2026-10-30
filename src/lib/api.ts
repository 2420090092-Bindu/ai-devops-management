export async function api<T>(
  path: string,
  method = 'GET',
  body?: unknown,
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000),
  })
  if (!response.ok) {
    let message = 'Unable to retrieve data. Please try again.'
    try {
      message = (await response.json()).error || message
    } catch {}
    throw new Error(message)
  }
  return response.status === 204 ? (undefined as T) : response.json()
}
