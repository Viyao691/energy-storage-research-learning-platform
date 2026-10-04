import type { Metadata } from "next";
import StorageCityApplications from "@/components/research/StorageCityApplications";

export const metadata: Metadata = { title: "储能城市应用 | Energy Research Copilot" };

export default function CityApplicationsPage() {
  return <StorageCityApplications />;
}
