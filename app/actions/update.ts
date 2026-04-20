"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateTranscript(id: string, formData: FormData) {
  const title = formData.get("title") as string;
  const youtubeId = formData.get("youtubeId") as string;
  const channelName = formData.get("channelName") as string;
  const categoryString = formData.get("categories") as string;
  const sourceLanguage = formData.get("sourceLanguage") as string;

  if (!title) {
    throw new Error("O título é obrigatório");
  }

  const categories = categoryString 
    ? categoryString.split(",").map(s => s.trim()).filter(Boolean)
    : [];

  await prisma.transcript.update({
    where: { id },
    data: {
      title,
      youtubeId: youtubeId || null,
      channelName: channelName || null,
      categories: categories,
      sourceLanguage: sourceLanguage || "en",
    },
  });

  revalidatePath(`/transcript/${id}`);
  revalidatePath("/");
  
  return { success: true };
}
