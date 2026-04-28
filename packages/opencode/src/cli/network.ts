import type { Argv, InferredOptionTypes } from "yargs"
import { Config } from "../config"
import { AppRuntime } from "@/effect/app-runtime"

const options = {
  port: {
    type: "number" as const,
    describe: "port to listen on",
    default: 0,
  },
  hostname: {
    type: "string" as const,
    describe: "hostname to listen on",
    default: "127.0.0.1",
  },
  mdns: {
    type: "boolean" as const,
    describe: "enable mDNS service discovery (defaults hostname to 0.0.0.0)",
    default: false,
  },
  "mdns-domain": {
    type: "string" as const,
    describe: "custom domain name for mDNS service (default: hwcli.local)",
    default: "hwcli.local",
  },
  cors: {
    type: "string" as const,
    array: true,
    describe: "additional domains to allow for CORS",
    default: [] as string[],
  },
}

export type NetworkOptions = InferredOptionTypes<typeof options>
type NetworkOptionDefaults = Partial<Pick<NetworkOptions, "hostname" | "port" | "mdns">>

export function withNetworkOptions<T>(yargs: Argv<T>) {
  return yargs.options(options)
}
export async function resolveNetworkOptions(args: NetworkOptions, defaults?: NetworkOptionDefaults) {
  const config = await AppRuntime.runPromise(Config.Service.use((cfg) => cfg.getGlobal()))
  return resolveNetworkOptionsNoConfig(args, config, defaults)
}

export function resolveNetworkOptionsNoConfig(
  args: NetworkOptions,
  config?: Config.Info,
  defaults?: NetworkOptionDefaults,
) {
  const portExplicitlySet = process.argv.includes("--port")
  const hostnameExplicitlySet = process.argv.includes("--hostname")
  const mdnsExplicitlySet = process.argv.includes("--mdns")
  const mdnsDomainExplicitlySet = process.argv.includes("--mdns-domain")
  const mdns = mdnsExplicitlySet ? args.mdns : (defaults?.mdns ?? config?.server?.mdns ?? args.mdns)
  const mdnsDomain = mdnsDomainExplicitlySet ? args["mdns-domain"] : (config?.server?.mdnsDomain ?? args["mdns-domain"])
  const port = portExplicitlySet ? args.port : (defaults?.port ?? config?.server?.port ?? args.port)
  const hostnameDefault = defaults?.hostname ?? (mdns && !config?.server?.hostname ? "0.0.0.0" : undefined)
  const hostname = hostnameExplicitlySet
    ? args.hostname
    : (hostnameDefault ?? config?.server?.hostname ?? args.hostname)
  const configCors = config?.server?.cors ?? []
  const argsCors = Array.isArray(args.cors) ? args.cors : args.cors ? [args.cors] : []
  const cors = [...configCors, ...argsCors]

  return { hostname, port, mdns, mdnsDomain, cors }
}
