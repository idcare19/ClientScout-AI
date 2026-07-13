import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getJwtFromCookies } from "@/lib/appwrite/server";
import { createSettingsServices } from "@/lib/services/settings-service";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsForm } from "@/features/settings/settings-form";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const jwt = await getJwtFromCookies();
  if (!jwt) redirect("/login");

  const services = createSettingsServices(jwt);
  const settings = await services.getSettings(user.$id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Your personal defaults and operating preferences."
      />
      <SettingsForm initialValues={settings ?? undefined} email={user.email} />
    </div>
  );
}
