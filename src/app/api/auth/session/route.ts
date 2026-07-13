import { NextResponse } from "next/server";
import { Account, Users } from "node-appwrite";
import { AUTH_COOKIE_NAME, CLIENTSCOUT_LABEL } from "@/lib/appwrite/constants";
import { createServerClient } from "@/lib/appwrite/server";

export async function POST(request: Request) {
  const { jwt } = (await request.json().catch(() => ({}))) as { jwt?: string };
  if (!jwt) {
    return NextResponse.json({ message: "Missing session token." }, { status: 400 });
  }

  const account = new Account(createServerClient(jwt));
  try {
    const user = await account.get();
    let labels = Array.isArray((user as { labels?: string[] }).labels) ? ((user as { labels?: string[] }).labels ?? []) : [];
    if (process.env.APPWRITE_API_KEY) {
      try {
        const adminUsers = new Users(createServerClient());
        const fullUser = await adminUsers.get(user.$id);
        labels = Array.isArray((fullUser as { labels?: string[] }).labels) ? ((fullUser as { labels?: string[] }).labels ?? []) : labels;
      } catch {
        // Fall back to the session payload labels if the admin lookup is unavailable.
      }
    }
    if (!labels.includes(CLIENTSCOUT_LABEL)) {
      return NextResponse.json(
        { message: "Your account does not have the required ClientScout label." },
        { status: 403 },
      );
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(AUTH_COOKIE_NAME, jwt, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json({ message: "Your session could not be verified." }, { status: 401 });
  }
}
