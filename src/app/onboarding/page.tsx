import { redirect } from "next/navigation";
import OnboardingWizard from "@/components/OnboardingWizard";
import { getOnboardingStatus } from "@/lib/queries";

export const metadata = { title: "初期設定 — NY33 Company Dock" };

export default async function OnboardingPage() {
  const { authed, onboarded } = await getOnboardingStatus();
  if (!authed) redirect("/login");
  if (onboarded) redirect("/");

  return (
    <div className="min-h-dvh bg-background px-5 py-10">
      <OnboardingWizard />
    </div>
  );
}
