import { redirect } from "next/navigation";
import { getJwtFromCookies, getServerAccount } from "@/lib/appwrite/server";

export async function getCurrentUser() {
  const jwt = await getJwtFromCookies();
  if (!jwt) return null;

  try {
    return await getServerAccount(jwt).get();
  } catch {
    return null;
  }
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function getCurrentUserId() {
  const user = await getCurrentUser();
  return user?.$id ?? null;
}
