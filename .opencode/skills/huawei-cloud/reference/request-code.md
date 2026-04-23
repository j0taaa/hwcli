# Request Code Generation

When the user asks for a specific operation, prefer generating final code using the Huawei signer instead of only describing abstract signing rules.

Important generation rules:

- Confirm the units used by APIs before generating filters or comparisons.
- If the user needs one specific result from a large response, filter the response to only the relevant items.
- For example, if the user wants an ECS flavor with exactly 1 vCPU and 1 GB RAM, generate code that filters for those results.
- For long-running operations such as provisioning, generate polling logic for completion.
- If a later step depends on an earlier generated resource, check that it is available before proceeding.
- If the user needs to validate a newly created ECS or remote resource, generate validation commands too.

Common validation workflow:

1. Wait until the ECS becomes ACTIVE.
2. Return the IP and login details structure the user will need.
3. Generate SSH commands, connectivity tests, or service health checks.
4. For long-running validation sequences, include explicit completion markers when useful.

Pattern 1: Simple GET

```js
const crypto = require("crypto")

// include HuaweiCloudSigner here

async function main() {
  const region = "sa-brazil-1"

  const options = {
    method: "GET",
    url: `https://ecs.${region}.myhuaweicloud.com/v1/${PROJECT_ID:sa-brazil-1}/cloudservers/detail`,
    params: {},
    data: "",
    headers: { "content-type": "application/json" },
  }

  const signedHeaders = HuaweiCloudSigner.signRequest(options, "${AK}", "${SK}")
  const res = await fetch(options.url, {
    method: options.method,
    headers: signedHeaders,
  })

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${await res.text()}`)
  }

  return await res.json()
}
```

Pattern 2: GET with query params

```js
const crypto = require("crypto")

// include HuaweiCloudSigner here

async function main() {
  const region = "sa-brazil-1"
  const baseUrl = `https://ecs.${region}.myhuaweicloud.com/v1/${PROJECT_ID:sa-brazil-1}/cloudservers/detail`

  const options = {
    method: "GET",
    url: `${baseUrl}?limit=10&status=ACTIVE`,
    params: { limit: 10, status: "ACTIVE" },
    data: "",
    headers: { "content-type": "application/json" },
  }

  const signedHeaders = HuaweiCloudSigner.signRequest(options, "${AK}", "${SK}")
  const res = await fetch(options.url, {
    method: options.method,
    headers: signedHeaders,
  })

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${await res.text()}`)
  }

  return await res.json()
}
```

Pattern 3: POST with JSON body

```js
const crypto = require("crypto")

// include HuaweiCloudSigner here

async function main() {
  const region = "sa-brazil-1"

  const body = { key: "value" }

  const options = {
    method: "POST",
    url: `https://ecs.${region}.myhuaweicloud.com/v1/${PROJECT_ID:sa-brazil-1}/cloudservers`,
    params: {},
    data: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  }

  const signedHeaders = HuaweiCloudSigner.signRequest(options, "${AK}", "${SK}")
  const res = await fetch(options.url, {
    method: options.method,
    headers: signedHeaders,
    body: options.data,
  })

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${await res.text()}`)
  }

  return await res.json()
}
```
