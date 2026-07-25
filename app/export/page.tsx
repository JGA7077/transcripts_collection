import ExportForm from "@/components/ExportForm";
import MainLayout from "@/components/MainLayout";
import { redirect } from "next/navigation";

export default async function ExportPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; tags?: string | string[] }>;
}) {
  if (process.env.ALLOW_IMPORT !== "true") {
    redirect("/");
  }

  const sParams = await searchParams;

  return (
    <MainLayout searchParams={sParams}>
      <div className="flex items-start justify-center min-h-full p-8">
        <ExportForm />
      </div>
    </MainLayout>
  );
}
