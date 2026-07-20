import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import EditForm from "@/components/EditForm";
import MainLayout from "@/components/MainLayout";
import { redirect } from "next/navigation";

export default async function EditTranscriptPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ search?: string, tags?: string | string[] }>
}) {
  if (process.env.ALLOW_IMPORT !== "true") {
    redirect("/");
  }
  const { id } = await params;
  const sParams = await searchParams;

  const transcript = await prisma.transcript.findUnique({
    where: { id },
  });

  if (!transcript) {
    notFound();
  }

  return (
    <MainLayout searchParams={sParams}>
      <div className="flex items-center justify-center min-h-[80vh] p-8">
        <EditForm transcript={{ ...transcript, exercises: transcript.exercises as { question: string; translation: string }[][] }} />
      </div>
    </MainLayout>
  );
}

