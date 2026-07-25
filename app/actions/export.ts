"use server";

import prisma from "@/lib/prisma";

export async function searchTranscripts(query: string) {
  if (process.env.ALLOW_IMPORT !== "true") {
    throw new Error("Exportação não permitida neste ambiente.");
  }

  if (!query || query.trim().length === 0) {
    return [];
  }

  const transcripts = await prisma.transcript.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { youtubeId: { contains: query, mode: "insensitive" } },
        { channelName: { contains: query, mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      title: true,
      youtubeId: true,
      channelName: true,
      _count: { select: { segments: true } },
    },
  });

  return transcripts;
}

export async function getTranscriptForExport(id: string) {
  if (process.env.ALLOW_IMPORT !== "true") {
    throw new Error("Exportação não permitida neste ambiente.");
  }

  const transcript = await prisma.transcript.findUnique({
    where: { id },
    include: {
      segments: {
        orderBy: { start: "asc" },
        select: {
          start: true,
          end: true,
          content: true,
          translatedContent: true,
        },
      },
    },
  });

  if (!transcript) {
    throw new Error("Transcrição não encontrada.");
  }

  return transcript;
}
