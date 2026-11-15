import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@mailfox/ui/components";
import { getWorkspaceContext } from "@/lib/auth/context";
import { PasswordForm, ProfileForm } from "./forms";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfileSettings() {
  const ctx = await getWorkspaceContext();
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Profile</CardTitle>
            <CardDescription>How you appear to your team.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <ProfileForm name={ctx.user.name ?? ""} email={ctx.user.email} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Password</CardTitle>
            <CardDescription>Use a long, unique password.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
