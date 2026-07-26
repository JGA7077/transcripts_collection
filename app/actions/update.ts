"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function updateTranscript(id: string, formData: FormData) {
  const title = formData.get("title") as string;
  const youtubeId = formData.get("youtubeId") as string;
  const channelName = formData.get("channelName") as string;
  const categoryString = formData.get("categories") as string;
  const sourceLanguage = formData.get("sourceLanguage") as string;
  const exercisesJson = formData.get("exercises") as string | null;
  const listeningExercisesJson = formData.get("listeningExercises") as string | null;

  if (!title) {
    throw new Error("O título é obrigatório");
  }

  const categories = categoryString 
    ? categoryString.split(",").map(s => s.trim()).filter(Boolean)
    : [];

  let exercises: { question: string; translation: string }[][] | undefined;
  if (exercisesJson !== null) {
    try {
      const parsed = JSON.parse(exercisesJson);
      if (Array.isArray(parsed)) {
        if (Array.isArray(parsed[0])) {
          exercises = parsed.slice(0, 3);
        } else if (parsed.length > 0 && typeof parsed[0] === "object") {
          exercises = [parsed];
        } else {
          exercises = [];
        }
      } else {
        exercises = [];
      }
    } catch {
      exercises = [];
    }
  }

  let listeningExercises: string[] | undefined;
  if (listeningExercisesJson !== null) {
    try {
      const parsed = JSON.parse(listeningExercisesJson);
      if (Array.isArray(parsed) && parsed.every((s: unknown) => typeof s === "string")) {
        listeningExercises = parsed.slice(0, 3);
      } else {
        listeningExercises = [];
      }
    } catch {
      listeningExercises = [];
    }
  }

  await prisma.transcript.update({
    where: { id },
    data: {
      title,
      youtubeId: youtubeId || null,
      channelName: channelName || null,
      categories: categories,
      sourceLanguage: sourceLanguage || "Inglês",
      ...(exercises !== undefined && { exercises: exercises as unknown as Prisma.InputJsonValue }),
      ...(listeningExercises !== undefined && { listeningExercises: listeningExercises as unknown as Prisma.InputJsonValue }),
    },
  });

  revalidatePath(`/transcript/${id}`);
  revalidatePath("/");
  
  return { success: true };
}
