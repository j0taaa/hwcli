# API Explorer Discovery

When you need to work with a Huawei Cloud service API, first determine the correct service and endpoint before generating code.

Workflow:

1. Determine which Huawei Cloud service is involved.
2. Determine which exact API endpoint is needed.
3. Determine the required parameters, request body, region requirements, and whether the endpoint is regional or global.
4. Only after that, generate the code that performs the request.

A code pattern like this can be used to get all APIs for a product from API Explorer:

```ts
type ApiListItem = {
  name: string
  description: string
}

type ApiListResponse = {
  api_basic_infos?: Array<{
    name: string
    summary: string
  }>
  count?: number
}

async function getAllApis(productShort: string, regionId = "sa-brazil-1"): Promise<ApiListItem[]> {
  const allApis: ApiListItem[] = []
  const limit = 100
  let offset = 0

  while (true) {
    const res = await fetch(
      `https://${regionId}-console.huaweicloud.com/apiexplorer/new/v3/apis?offset=${offset}&limit=${limit}&product_short=${encodeURIComponent(productShort)}`,
      {
        headers: { "X-Language": "en-us" },
      },
    )

    if (!res.ok) {
      throw new Error(`Failed to fetch API list: ${res.status} ${res.statusText}`)
    }

    const data = (await res.json()) as ApiListResponse
    const batch = (data.api_basic_infos ?? []).map((api) => ({
      name: api.name,
      description: api.summary,
    }))

    allApis.push(...batch)

    if (batch.length < limit || allApis.length >= (data.count ?? 0)) {
      break
    }

    offset += limit
  }

  return allApis
}
```

A code pattern like this can be used to get specific information about one API:

```ts
type ApiParam = {
  name: string
  description: string
  type: string
  required: boolean
  in: string
  example?: unknown
}

type ApiDetails = {
  name: string
  summary: string
  description: string
  method: string
  url: string
  headers: ApiParam[]
  pathParams: ApiParam[]
  queryParams: ApiParam[]
  bodyParams: ApiParam[]
  responses: Array<{
    statusCode: string
    description: string
    example?: unknown
  }>
}

async function getApiDetails(productShort: string, action: string, regionId = "sa-brazil-1"): Promise<ApiDetails> {
  const isBssIntl = productShort.toUpperCase() === "BSSINTL"
  const hostRegion = isBssIntl ? "sa-brazil-1" : regionId
  const targetRegion = isBssIntl ? "ap-southeast-1" : regionId

  const res = await fetch(
    `https://${hostRegion}-console.huaweicloud.com/apiexplorer/new/v4/apis/detail?product_short=${encodeURIComponent(productShort)}&name=${encodeURIComponent(action)}&region_id=${encodeURIComponent(targetRegion)}`,
    {
      headers: { "X-Language": "en-us" },
    },
  )

  if (!res.ok) {
    throw new Error(`Failed to fetch API details: ${res.status} ${res.statusText}`)
  }

  const data = (await res.json()) as any

  const headers: ApiParam[] = []
  const pathParams: ApiParam[] = []
  const queryParams: ApiParam[] = []
  const bodyParams: ApiParam[] = []
  const responses: Array<{ statusCode: string; description: string; example?: unknown }> = []

  let method = "GET"
  let url = ""

  if (data.paths) {
    for (const [path, methods] of Object.entries<any>(data.paths)) {
      for (const [httpMethod, details] of Object.entries<any>(methods)) {
        method = httpMethod.toUpperCase()
        url = details["x-request-examples-url-1"] || path

        for (const p of details.parameters ?? []) {
          const param: ApiParam = {
            name: p.name,
            description: p.description || "",
            type: p.type || "string",
            required: !!p.required,
            in: p.in || "header",
            example: p["x-example"],
          }

          if (param.in === "header") headers.push(param)
          else if (param.in === "path") pathParams.push(param)
          else if (param.in === "query") queryParams.push(param)
          else if (param.in === "body") bodyParams.push(param)
        }

        for (const [statusCode, resp] of Object.entries<any>(details.responses ?? {})) {
          const example = resp?.examples ? Object.values(resp.examples)[0] : undefined
          responses.push({
            statusCode,
            description: resp?.description || "",
            example,
          })
        }

        break
      }
      break
    }
  }

  return {
    name: data.name,
    summary: data.summary || "",
    description: data.description || "",
    method,
    url,
    headers,
    pathParams,
    queryParams,
    bodyParams,
    responses,
  }
}
```
