const crypto = require("crypto")

const AK = "HPUAN9Q5XBMYMCBIYJOB"
const SK = "zOPTPPsAT9DAMZaiJvlXJaZRv0FJUb4ZQuRrGFPz"
const REGION = "sa-brazil-1"
const PROJECT_ID = "9803447aabf141f495dfa6939e308f6e"
const SERVER_ID = "a4cca5bc-d150-41d9-86a6-df4ccb356c92"

class HuaweiCloudSigner {
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

  static signRequest(options, ak, sk) {
    return this.signStandardRequest(options, ak, sk)
  }
}

async function signedRequest(url, method, ak, sk, data = null, params = {}) {
  let options
  if (method === "GET" || method === "HEAD") {
    options = {
      method,
      url,
      params,
      data: null,
      headers: { "content-type": "application/json" },
    }
  } else {
    options = {
      method,
      url,
      params,
      data: data ? JSON.stringify(data) : "",
      headers: { "content-type": "application/json" },
    }
  }

  const signedHeaders = HuaweiCloudSigner.signRequest(options, ak, sk)
  const fetchOpts = { method, headers: signedHeaders }
  if (options.data) {
    fetchOpts.body = options.data
  }
  const response = await fetch(url, fetchOpts)

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Request failed: ${response.status} ${text}`)
  }
  return response.json()
}

async function main() {
  console.log("Verifying ECS is deleted...")

  try {
    const serverData = await signedRequest(
      `https://ecs.${REGION}.myhuaweicloud.com/v1/${PROJECT_ID}/cloudservers/${SERVER_ID}`,
      "GET",
      AK,
      SK
    )
    console.log("Server status:", serverData.server?.status)
  } catch (e) {
    if (e.message.includes("404")) {
      console.log("ECS not found - deleted successfully!")
    } else {
      throw e
    }
  }
}

main().catch(console.error)