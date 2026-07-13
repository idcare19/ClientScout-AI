import { loadEnvConfig } from "@next/env";

async function main(): Promise<void> {
  // Load .env.local before importing Appwrite setup code
  loadEnvConfig(process.cwd());

  console.log("Environment check:", {
    endpoint: Boolean(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT),
    projectId: Boolean(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID),
    apiKey: Boolean(process.env.APPWRITE_API_KEY),
  });

  await import("./setup-appwrite");
}

main().catch((error: unknown) => {
  console.error(
    "Appwrite setup failed:",
    error instanceof Error ? error.message : error
  );
  process.exit(1);
});