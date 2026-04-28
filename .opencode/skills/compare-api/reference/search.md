# Row Search

Base URL:

```txt
https://compare.hwctools.site/api
```

This matches the website search bar and returns the service rows from the comparison table.

## Route

### `GET /api/search`

- Description: search service rows
- Input:
  - query: `query` or `q`
- Output:
  - `{ query, count, rows }`

Examples:

```txt
/api/search?query=ecs
/api/search?q=codearts
```

## Example Request Code

```js
async function searchRows(query) {
  const url = new URL("https://compare.hwctools.site/api/search")
  url.searchParams.set("query", query)

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Search failed: ${response.status} ${await response.text()}`)
  }

  return response.json()
}
```

## Usage Guidance

- Use `query` as the primary parameter.
- Use search when the user wants broad discovery, category exploration, or fuzzy matching.
- If the user wants only a specific provider mapping, switch to provider lookup instead.
