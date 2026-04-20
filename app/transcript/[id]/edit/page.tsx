import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import EditForm from "@/components/EditForm";

export default async function EditTranscriptPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;

  const transcript = await prisma.transcript.findUnique({
    where: { id },
  });

  if (!transcript) {
    notFound();
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] p-8">
      <EditForm transcript={transcript} />
    </div>
  );
}
