import {
  BarChart3,
  Search,
  MapPin,
  Camera,
  Gauge,
  Smartphone,
  Shield,
  FileText,
  Trophy,
  Activity,
} from "lucide-react";
import type { CheckIcon } from "@/lib/webdock";

export const CHECK_ICONS: Record<
  CheckIcon,
  { Icon: typeof BarChart3; cls: string }
> = {
  access: { Icon: BarChart3, cls: "bg-blue-50 text-blue-600" },
  seo: { Icon: Search, cls: "bg-green-50 text-green-600" },
  gbp: { Icon: MapPin, cls: "bg-red-50 text-red-600" },
  sns: { Icon: Camera, cls: "bg-pink-50 text-pink-600" },
  speed: { Icon: Gauge, cls: "bg-indigo-50 text-indigo-600" },
  mobile: { Icon: Smartphone, cls: "bg-slate-100 text-slate-600" },
  security: { Icon: Shield, cls: "bg-emerald-50 text-emerald-600" },
  content: { Icon: FileText, cls: "bg-amber-50 text-amber-600" },
  competitor: { Icon: Trophy, cls: "bg-cyan-50 text-cyan-600" },
  anomaly: { Icon: Activity, cls: "bg-orange-50 text-orange-600" },
};
