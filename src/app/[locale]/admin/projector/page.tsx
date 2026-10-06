import { redirect } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

export default function ProjectorPage() {
  // Projector mode has been decommissioned as requested
  redirect("/admin");
  return null;
}
