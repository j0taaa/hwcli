import { withNetworkOptions } from "../network"
import { cmd } from "./cmd"
import { startWeb } from "./web"

export const SimpleCommand = cmd({
  command: "simple",
  builder: (yargs) => withNetworkOptions(yargs),
  describe: "start web interface on 0.0.0.0:8888",
  handler: async (args) => {
    await startWeb(args, {
      hostname: "0.0.0.0",
      port: 8888,
    })
  },
})
