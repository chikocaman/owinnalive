const trimTrailingSlashes = (value: string): string => value.replace(/\/+$/, "");

export const ENV = {
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL
    ? trimTrailingSlashes(process.env.BUILT_IN_FORGE_API_URL)
    : "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
} as const;

export type ServerEnv = typeof ENV;

