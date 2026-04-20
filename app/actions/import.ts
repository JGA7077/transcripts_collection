"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface SegmentInput {
  start: number;
  end: number;
  text: string;
  translated_text?: string;
}

export async function importTranscript(formData: FormData) {
  const title = formData.get("title") as string;
  const youtubeId = formData.get("youtubeId") as string;
  const channelName = formData.get("channelName") as string;
  const category = formData.get("category") as string;
  const sourceLanguage = formData.get("sourceLanguage") as string;
  const jsonContent = formData.get("jsonContent") as string;

  if (!title || !jsonContent) {
    throw new Error("Título e conteúdo JSON são obrigatórios");
  }

  const segments: SegmentInput[] = JSON.parse(jsonContent);

  const transcript = await prisma.transcript.create({
    data: {
      title,
      youtubeId: youtubeId || null,
      channelName: channelName || null,
      category: category || null,
      sourceLanguage: sourceLanguage || "en",
      segments: {
        create: segments.map((s) => ({
          start: s.start,
          end: s.end,
          content: s.text,
          translatedContent: s.translated_text || null,
        })),
      },
    },
  });

  revalidatePath("/");
  return { success: true, id: transcript.id };
}
