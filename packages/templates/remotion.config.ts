import path from "node:path";
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setPixelFormat("yuv420p");
Config.setCodec("h264");
Config.setEntryPoint("./src/Root.tsx");

// Monorepo: dependencies are hoisted to ../../node_modules.
// Tell Webpack to also search the workspace root.
Config.overrideWebpackConfig((current) => ({
  ...current,
  resolve: {
    ...current.resolve,
    modules: [
      "node_modules",
      path.resolve(__dirname, "..", "..", "node_modules"),
    ],
  },
}));
