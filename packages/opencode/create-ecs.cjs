const crypto = require("crypto")

const AK = "HPUAN9Q5XBMYMCBIYJOB"
const SK = "zOPTPPsAT9DAMZaiJvlXJaZRv0FJUb4ZQuRrGFPz"
const REGION = "sa-brazil-1"

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
  console.log("Getting project ID...")
  const projectData = await signedRequest(
    `https://iam.${REGION}.myhuaweicloud.com/v3/projects`,
    "GET",
    AK,
    SK
  )
  const project = projectData.projects?.find((p) => p.name === REGION)
  if (!project) {
    throw new Error(`No project found for region ${REGION}`)
  }
  const PROJECT_ID = project.id
  console.log(`Project ID: ${PROJECT_ID}`)

  const az = "sa-brazil-1a"
  console.log(`Using AZ: ${az}`)

  console.log("Getting VPCs...")
  const vpcData = await signedRequest(
    `https://vpc.${REGION}.myhuaweicloud.com/v1/${PROJECT_ID}/vpcs`,
    "GET",
    AK,
    SK
  )
  const vpcs = vpcData.vpcs || []
  if (vpcs.length === 0) {
    throw new Error("No VPCs found")
  }
  const vpc = vpcs[0]
  console.log(`Using VPC: ${vpc.id} (${vpc.name})`)

  console.log("Getting subnets...")
  const subnetData = await signedRequest(
    `https://vpc.${REGION}.myhuaweicloud.com/v1/${PROJECT_ID}/subnets`,
    "GET",
    AK,
    SK
  )
  const subnets = subnetData.subnets || []
  const subnet = subnets.find((s) => s.vpc_id === vpc.id) || subnets[0]
  console.log(`Using Subnet: ${subnet.id} (${subnet.name})`)

  console.log("Getting security groups...")
  const sgData = await signedRequest(
    `https://vpc.${REGION}.myhuaweicloud.com/v1/${PROJECT_ID}/security-groups`,
    "GET",
    AK,
    SK
  )
  const sgs = sgData.security_groups || []
  const sg = sgs.find((g) => g.name === "sg-free") || sgs[0]
  console.log(`Using Security Group: ${sg.id} (${sg.name})`)

  console.log("Getting flavors...")
  const flavorData = await signedRequest(
    `https://ecs.${REGION}.myhuaweicloud.com/v1/${PROJECT_ID}/cloudservers/flavors`,
    "GET",
    AK,
    SK
  )
  const flavors = flavorData.flavors || []
  const targetFlavor = flavors.find((f) => f.name === "t6.small.1") || flavors.find((f) => f.vcpus === 1 && f.ram >= 1024)
  if (!targetFlavor) {
    throw new Error("No 1 vCPU flavor found")
  }
  console.log(`Using Flavor: ${targetFlavor.id} - ${targetFlavor.vcpus} vCPU, ${targetFlavor.ram}MB RAM`)

  console.log("Getting Linux image...")
  const imageData = await signedRequest(
    `https://ims.${REGION}.myhuaweicloud.com/v2/cloudimages?architecture=x86_64&limit=20`,
    "GET",
    AK,
    SK
  )
  const images = imageData.images || []
  const linuxImage = images.find((i) => i.name && i.name.toLowerCase().includes("debian"))
  if (!linuxImage) {
    throw new Error("No Debian image found")
  }
  console.log(`Using Image: ${linuxImage.id} (${linuxImage.name})`)

  console.log("Creating ECS...")
  const password = "Opencode123!"

  const createData = {
    server: {
      name: "my-ecs",
      imageRef: linuxImage.id,
      flavorRef: targetFlavor.id,
      availability_zone: az,
      vpcid: vpc.id,
      nics: [{ subnet_id: subnet.id }],
      security_groups: [{ id: sg.id }],
      adminpass: password,
      root_volume: {
        size: 40,
        volumetype: "SAS",
      },
    },
  }

  const result = await signedRequest(
    `https://ecs.${REGION}.myhuaweicloud.com/v1/${PROJECT_ID}/cloudservers`,
    "POST",
    AK,
    SK,
    createData
  )

  console.log("ECS creation initiated!")
  console.log(JSON.stringify(result, null, 2))

  const serverId = result.server?.id || result.job_id
  console.log(`Server ID / Job ID: ${serverId}`)

  if (result.job_id) {
    console.log("Waiting for job completion...")
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 5000))
      const jobData = await signedRequest(
        `https://ecs.${REGION}.myhuaweicloud.com/v1/${PROJECT_ID}/jobs/${result.job_id}`,
        "GET",
        AK,
        SK
      )
      console.log(`Job status: ${jobData.job?.status}`)
      if (jobData.job?.status === "SUCCESS") {
        console.log("ECS created successfully!")
        break
      }
      if (jobData.job?.status === "FAIL") {
        throw new Error("ECS creation failed: " + JSON.stringify(jobData.job?.fail_reason))
      }
    }
  }

  console.log("\n=== ECS Details ===")
  console.log(`Name: my-ecs`)
  console.log(`Password: ${password}`)
  console.log(`Region: ${REGION}`)
  console.log(`AZ: ${az}`)
}

main().catch(console.error)