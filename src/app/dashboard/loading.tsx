import { LoadingScreen } from "@/components/loading-screen";

// Shown by the App Router while any /dashboard segment loads its data.
export default function DashboardLoading() {
  return <LoadingScreen />;
}
