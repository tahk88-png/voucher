export type SearchParams = Record<string, string | string[] | undefined>

export function toQueryString(searchParams?: SearchParams): string {
  if (!searchParams) return ""

  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(searchParams)) {
    if (value == null) continue

    if (Array.isArray(value)) {
      for (const entry of value) {
        params.append(key, entry)
      }
      continue
    }

    params.set(key, value)
  }

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ""
}

