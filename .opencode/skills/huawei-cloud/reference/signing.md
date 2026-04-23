# Request Signing

Huawei Cloud request signing is needed for API calls associated with an account. When generating code for authenticated Huawei Cloud API calls, include signing code directly in the generated solution or reuse a shared signer implementation.

Generate code using the user's AK/SK for these signed requests. Do not ask the user for project IDs up front unless there is a specific reason you cannot derive them programmatically.

Before asking, check whether these env vars are already available:

- `HUAWEI_CLOUD_AK`
- `HUAWEI_CLOUD_SK`

Project IDs are region-specific, so operations in Sao Paulo and Santiago use different project IDs. Fetch them using AK/SK when needed.

For standard Huawei Cloud service APIs, use HMAC-SHA256 signing with Huawei Cloud canonical request format.

For OBS APIs, use OBS-specific HMAC-SHA1 signing and OBS authorization format.

## Project ID Discovery

When a standard Huawei Cloud service API needs a project ID, derive it from AK/SK instead of asking the user for it.

Workflow:

1. Call `https://iam.myhuaweicloud.com/v3/regions` to list available regions.
2. For each region, call `https://iam.<region>.myhuaweicloud.com/v3/projects`.
3. Match the desired target region and use that project's ID.

Use a simpler standalone version of this pattern in generated code:

```js
const crypto = require("crypto")

class HuaweiCloudSigner {
  static EMPTY_BODY_SHA256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"

  static urlEncode(str) {
    if (typeof str !== "string") str = String(str)
    return encodeURIComponent(str).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase())
  }

  static getDateTime() {
    return new Date().toISOString().replace(/[:-]/g, "").split(".")[0] + "Z"
  }

  static buildCanonicalURI(pathname) {
    if (!pathname) return "/"
    const segments = pathname.split("/").map((segment) => this.urlEncode(segment))
    let uri = segments.join("/")
    if (!uri.endsWith("/")) uri += "/"
    return uri
  }

  static buildCanonicalQueryString(params = {}) {
    return Object.keys(params)
      .sort()
      .flatMap((key) => {
        const value = params[key]
        const encodedKey = this.urlEncode(key)
        if (Array.isArray(value)) {
          return [...value].sort().map((item) => `${encodedKey}=${this.urlEncode(item)}`)
        }
        return `${encodedKey}=${this.urlEncode(value)}`
      })
      .join("&")
  }

  static buildCanonicalHeaders(headers) {
    return Object.keys(headers)
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
      .map((key) => `${key.toLowerCase()}:${String(headers[key]).trim()}\n`)
      .join("")
  }

  static buildSignedHeaders(headers) {
    return Object.keys(headers)
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
      .map((key) => key.toLowerCase())
      .join(";")
  }

  static hashPayload(data) {
    const payload = data ?? ""
    const content = typeof payload === "string" ? payload : JSON.stringify(payload)
    return crypto.createHash("sha256").update(content).digest("hex")
  }

  static signStandardRequest(options, ak, sk) {
    const url = new URL(options.url)
    const method = (options.method || "GET").toUpperCase()
    const headersToSign = {
      host: url.host,
      "content-type": options.headers?.["content-type"] || "application/json",
      "x-sdk-date": this.getDateTime(),
    }

    const mergedParams = { ...(options.params || {}) }
    url.searchParams.forEach((value, key) => {
      if (mergedParams[key]) {
        mergedParams[key] = Array.isArray(mergedParams[key])
          ? [...mergedParams[key], value]
          : [mergedParams[key], value]
        return
      }
      mergedParams[key] = value
    })

    const canonicalRequest = [
      method,
      this.buildCanonicalURI(url.pathname),
      this.buildCanonicalQueryString(mergedParams),
      this.buildCanonicalHeaders(headersToSign),
      this.buildSignedHeaders(headersToSign),
      this.hashPayload(options.data),
    ].join("\n")

    const stringToSign = [
      "SDK-HMAC-SHA256",
      headersToSign["x-sdk-date"],
      crypto.createHash("sha256").update(canonicalRequest).digest("hex"),
    ].join("\n")

    const signature = crypto.createHmac("sha256", sk).update(stringToSign).digest("hex")

    return {
      ...headersToSign,
      Authorization: `SDK-HMAC-SHA256 Access=${ak}, SignedHeaders=${this.buildSignedHeaders(headersToSign)}, Signature=${signature}`,
    }
  }
}

async function signedJson(url, ak, sk) {
  const headers = HuaweiCloudSigner.signStandardRequest(
    {
      method: "GET",
      url,
      headers: { "content-type": "application/json" },
    },
    ak,
    sk,
  )
  const response = await fetch(url, { method: "GET", headers })
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${await response.text()}`)
  }
  return response.json()
}

async function fetchRegions(ak, sk) {
  const data = await signedJson("https://iam.myhuaweicloud.com/v3/regions", ak, sk)
  return (data.regions ?? []).map((region) => region.id ?? region.region_id).filter(Boolean)
}

async function fetchProjectsForRegion(region, ak, sk) {
  const data = await signedJson(`https://iam.${region}.myhuaweicloud.com/v3/projects`, ak, sk)
  return (data.projects ?? []).map((project) => ({
    region,
    projectId: project.id,
    name: project.name,
  }))
}

async function fetchProjectIds(ak, sk) {
  const regions = await fetchRegions(ak, sk)
  const results = await Promise.allSettled(regions.map((region) => fetchProjectsForRegion(region, ak, sk)))
  const entries = []
  const errors = []
  const seenProjectIds = new Set()

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      result.value.forEach((project) => {
        if (seenProjectIds.has(project.projectId)) return
        seenProjectIds.add(project.projectId)
        entries.push(project)
      })
      return
    }
    const message = result.reason instanceof Error ? result.reason.message : String(result.reason)
    errors.push(`${regions[index]}: ${message}`)
  })

  return { entries, errors }
}
```

Use the derived project ID for the target region in the final generated request code.

Reusable signer:

```js
const crypto = require("crypto")

class HuaweiCloudSigner {
  static EMPTY_BODY_SHA256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"

  static urlEncode(str) {
    if (typeof str !== "string") str = String(str)
    return encodeURIComponent(str).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase())
  }

  static getDateTime() {
    return new Date().toISOString().replace(/[:-]/g, "").split(".")[0] + "Z"
  }

  static buildCanonicalURI(path) {
    if (!path) return "/"
    const segments = path.split("/").map((seg) => this.urlEncode(seg))
    let uri = segments.join("/")
    if (!uri.endsWith("/")) uri += "/"
    return uri
  }

  static buildCanonicalQueryString(params = {}) {
    return Object.keys(params)
      .sort()
      .flatMap((key) => {
        const value = params[key]
        const encodedKey = this.urlEncode(key)
        if (Array.isArray(value)) {
          return [...value].sort().map((v) => `${encodedKey}=${this.urlEncode(v)}`)
        }
        return `${encodedKey}=${this.urlEncode(value)}`
      })
      .join("&")
  }

  static buildCanonicalHeaders(headers) {
    return Object.keys(headers)
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
      .map((key) => `${key.toLowerCase()}:${String(headers[key]).trim()}\n`)
      .join("")
  }

  static buildSignedHeaders(headers) {
    return Object.keys(headers)
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
      .map((k) => k.toLowerCase())
      .join(";")
  }

  static hashPayload(data) {
    if (!data) return this.EMPTY_BODY_SHA256
    const str = typeof data === "string" ? data : JSON.stringify(data)
    return crypto.createHash("sha256").update(str).digest("hex")
  }

  static buildOBSCanonicalResource(url) {
    const hostname = url.hostname
    const match = hostname.match(/^(.+)\.obs\.[^.]+\.(myhuaweicloud\.com)$/)
    if (match) {
      const bucket = match[1]
      return `/${bucket}${url.pathname || "/"}`
    }
    return url.pathname || "/"
  }

  static signRequest(options, ak, sk) {
    const url = new URL(options.url)
    const host = url.host
    const isOBS = host.includes(".obs.") || host.startsWith("obs.")
    return isOBS ? this.signOBSRequest(options, ak, sk) : this.signStandardRequest(options, ak, sk)
  }

  static signStandardRequest(options, ak, sk) {
    const url = new URL(options.url)
    const method = (options.method || "GET").toUpperCase()

    const headersToSign = {
      host: url.host,
      "content-type": options.headers?.["content-type"] || "application/json",
      "x-sdk-date": this.getDateTime(),
    }

    if (options.headers?.["x-project-id"]) {
      headersToSign["x-project-id"] = options.headers["x-project-id"]
    }

    const canonicalRequest = [
      method,
      this.buildCanonicalURI(url.pathname),
      this.buildCanonicalQueryString(options.params || {}),
      this.buildCanonicalHeaders(headersToSign),
      this.buildSignedHeaders(headersToSign),
      this.hashPayload(options.data),
    ].join("\n")

    const stringToSign = [
      "SDK-HMAC-SHA256",
      headersToSign["x-sdk-date"],
      crypto.createHash("sha256").update(canonicalRequest).digest("hex"),
    ].join("\n")

    const signature = crypto.createHmac("sha256", sk).update(stringToSign).digest("hex")

    return {
      ...headersToSign,
      Authorization: `SDK-HMAC-SHA256 Access=${ak}, SignedHeaders=${this.buildSignedHeaders(headersToSign)}, Signature=${signature}`,
    }
  }

  static signOBSRequest(options, ak, sk) {
    const url = new URL(options.url)
    const method = (options.method || "GET").toUpperCase()
    const contentType = options.headers?.["content-type"] || ""
    const dateStr = new Date().toUTCString()
    const canonicalResource = this.buildOBSCanonicalResource(url)
    const stringToSign = `${method}\n\n${contentType}\n${dateStr}\n${canonicalResource}`
    const signature = crypto.createHmac("sha1", sk).update(stringToSign).digest("base64")

    return {
      Host: url.host,
      "Content-Type": contentType,
      Date: dateStr,
      Authorization: `OBS ${ak}:${signature}`,
    }
  }
}
```

OBS differences:

- OBS uses HMAC-SHA1, not SHA256
- Authorization format is `OBS <accesskey>:<signature>`
- No project ID is required in the URL
- Virtual-hosted OBS URLs need the bucket name included in the canonical resource

When generating OBS request code, ensure the signer handles both:

- `https://obs.<region>.myhuaweicloud.com/<bucket>/<key>`
- `https://<bucket>.obs.<region>.myhuaweicloud.com/<key>`
