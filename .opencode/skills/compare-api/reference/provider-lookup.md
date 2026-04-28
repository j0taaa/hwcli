# Provider Lookup

Base URL:

```txt
https://compare.hwctools.site/api
```

One route per provider. The `service` path segment accepts full names, short names, and fuzzy aliases.

## Routes

### `GET /api/aws/{service}`

- Description: look up an AWS service by full name, short name, or fuzzy alias
- Input:
  - path: `service`
- Output:
  - matched service and its Huawei mapping
  - or 404 when no match is found

Example:

```txt
/api/aws/EC2
```

### `GET /api/azure/{service}`

- Description: look up an Azure service by full name, short name, or fuzzy alias
- Input:
  - path: `service`
- Output:
  - matched service and its Huawei mapping
  - or 404 when no match is found

Example:

```txt
/api/azure/azure%20vm
```

### `GET /api/gcp/{service}`

- Description: look up a GCP service by full name, short name, or fuzzy alias
- Input:
  - path: `service`
- Output:
  - matched service and its Huawei mapping
  - or 404 when no match is found

Example:

```txt
/api/gcp/GCE
```

### `GET /api/huawei/{service}`

- Description: look up a Huawei service by full name, short name, or fuzzy alias
- Input:
  - path: `service`
- Output:
  - matched service and its mapped row details
  - or 404 when no match is found

Example:

```txt
/api/huawei/Elastic%20Cloud%20Compute
```

## Example Request Code

```js
async function lookup(provider, service) {
  const url = `https://compare.hwctools.site/api/${provider}/${encodeURIComponent(service)}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Lookup failed: ${response.status} ${await response.text()}`)
  }
  return response.json()
}
```
