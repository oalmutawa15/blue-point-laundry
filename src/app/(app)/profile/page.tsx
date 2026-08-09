import { getSessionProfile } from "@/lib/auth";
import { ProfileView } from "@/components/customer/ProfileView";

export default async function ProfilePage() {
  const profile = await getSessionProfile();
  return <ProfileView name={profile?.full_name ?? null} phone={profile?.phone ?? ""} />;
}
