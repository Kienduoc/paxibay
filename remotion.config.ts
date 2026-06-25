import { Config } from "@remotion/cli/config";

// Monorepo-aware Remotion config — runs from workspace ROOT so node_modules
// (hoisted) is inside the project root and Studio's file server can serve it.
// The entry file lives in packages/templates/src/Root.tsx.

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setPixelFormat("yuv420p");
Config.setCodec("h264");
Config.setEntryPoint("./packages/templates/src/Root.tsx");
