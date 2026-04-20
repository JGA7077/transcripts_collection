import ImportForm from "@/components/ImportForm";
import MainLayout from "@/components/MainLayout";

export default async function ImportPage({
  searchParams
}: {
  searchParams: Promise<{ search?: string, tags?: string | string[] }>
}) {
  const sParams = await searchParams;

  return (
    <MainLayout searchParams={sParams}>
      <div className="flex items-center justify-center min-h-full p-8">
        <ImportForm />
      </div>
    </MainLayout>
  );
}

