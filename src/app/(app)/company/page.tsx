import { redirect } from "next/navigation";
import CompanyEditForm from "@/components/CompanyEditForm";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "会社情報 — Webドック" };

export default async function CompanyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: company } = await supabase
    .from("companies")
    .select("name, industry, area, employees, website_url, plan")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!company) redirect("/onboarding");

  return (
    <div className="max-w-2xl">
      <CompanyEditForm
        initial={{
          name: company.name,
          industry: company.industry,
          area: company.area,
          employees: company.employees,
          websiteUrl: company.website_url,
          plan: company.plan,
        }}
      />
    </div>
  );
}
