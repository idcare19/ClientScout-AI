import { cookies } from "next/headers";
import { Client, Account, Databases, Storage, Users } from "node-appwrite";
import { AUTH_COOKIE_NAME } from "./constants";
import { getAppwriteConfig } from "./config";

export function createServerClient(jwt?: string | null) {
  const config = getAppwriteConfig();
  const client = new Client();
  client.setEndpoint(config.endpoint);
  client.setProject(config.projectId);
  if (jwt) {
    client.setJWT(jwt);
  } else if (config.apiKey) {
    client.setKey(config.apiKey);
  }
  return client;
}

export function getServerAccount(jwt?: string | null) {
  return new Account(createServerClient(jwt));
}

export function getServerDatabases(jwt?: string | null) {
  return new Databases(createServerClient(jwt));
}

export function getServerStorage(jwt?: string | null) {
  return new Storage(createServerClient(jwt));
}

export function getServerUsers() {
  const client = createServerClient();
  return new Users(client);
}

export async function getJwtFromCookies() {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null;
}
