import { ProfilePageClient } from "@/components/profile/profile-page-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile",
};

export default function ProfilePage() {
  return <ProfilePageClient />;
}