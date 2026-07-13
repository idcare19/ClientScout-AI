import { Client, Account, Databases, Storage } from "appwrite";
import { getBrowserAppwriteConfig } from "./config";

let browserClient: Client | null = null;

export function getBrowserClient() {
  if (typeof window === "undefined") {
    throw new Error("Browser Appwrite client can only be created in the browser.");
  }

  if (!browserClient) {
    const config = getBrowserAppwriteConfig();
    browserClient = new Client().setEndpoint(config.endpoint).setProject(config.projectId);
  }

  return browserClient;
}

export function getBrowserAccount() {
  return new Account(getBrowserClient());
}

export function getBrowserDatabases() {
  return new Databases(getBrowserClient());
}

export function getBrowserStorage() {
  return new Storage(getBrowserClient());
}
