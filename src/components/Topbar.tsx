import { ChevronDown, CalendarDays } from "lucide-react";

export interface TopbarCompany {
  name: string;
  industry: string;
  area: string;
  employees: number;
  plan: string;
}

export default function Topbar({ company }: { company: TopbarCompany }) {
  return (
    <header className="flex flex-col gap-3 border-b border-gray-200/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
      <div className="pl-12 lg:pl-0">
        <p className="text-xs font-medium text-gray-500">
          {company.area}・{company.industry}・従業員 {company.employees}名
        </p>
        <h1 className="text-lg font-bold text-black sm:text-xl">{company.name}</h1>
      </div>

      <div className="flex items-center gap-2">
        <button className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-sm font-medium text-black shadow-sm ring-1 ring-black/[0.04] transition-colors hover:bg-gray-50">
          <CalendarDays className="h-4 w-4 text-gray-400" />
          2026年6月
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-black px-3.5 py-2 text-sm font-semibold text-white">
          {company.plan}プラン
        </span>
      </div>
    </header>
  );
}
