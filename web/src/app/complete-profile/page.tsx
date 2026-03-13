import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CompleteProfileForm } from "./complete-profile-form";

export default async function CompleteProfilePage() {
  const session = await auth();

  if (session?.user.profileComplete) {
    redirect("/news");
  }

  return <CompleteProfileForm />;
}
