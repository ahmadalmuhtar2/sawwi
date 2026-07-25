import { redirect } from "next/navigation";
import { getSessionClaims } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { ProfileEditor } from "@/components/dashboard/profile-editor";

export default async function ProfilePage() {
  const claims = await getSessionClaims();
  if (!claims) redirect("/login");

  const user = await getPrisma().user.findUnique({
    where: { id: claims.userId },
    select: { name: true, email: true, image: true },
  });

  return (
    <ProfileEditor
      account={{
        name: user?.name ?? "",
        email: user?.email ?? "",
        image: user?.image ?? null,
      }}
    />
  );
}
