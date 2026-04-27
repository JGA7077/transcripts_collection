"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ParaphraseEvaluation } from "../types/genericTypes";

interface SegmentInput {
  start: number;
  end: number;
  text: string;
  translated_text?: string;
}

export async function importTranscript(formData: FormData) {
  // Verificação de Segurança
  if (process.env.ALLOW_IMPORT !== "true") {
    throw new Error("Importação não permitida neste ambiente.");
  }

  const title = formData.get("title") as string;

  const youtubeId = formData.get("youtubeId") as string;
  const channelName = formData.get("channelName") as string;
  const categoryString = formData.get("category") as string;
  const sourceLanguage = formData.get("sourceLanguage") as string;
  const jsonContent = formData.get("jsonContent") as string;

  if (!title || !jsonContent) {
    throw new Error("Título e conteúdo JSON são obrigatórios");
  }

  const categories = categoryString 
    ? categoryString.split(",").map(s => s.trim()).filter(Boolean)
    : [];

  const segments: SegmentInput[] = JSON.parse(jsonContent);

  const transcript = await prisma.transcript.create({
    data: {
      title,
      youtubeId: youtubeId || null,
      channelName: channelName || null,
      categories: categories,
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

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function generateGapFillExercises(
  extractedText: string,
  idiom: string
) {

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0.8 },
    });

    const prompt = `
      Atue como um professor de idiomas. O usuário me enviou este texto no idioma ${idiom}.
      A partir desse texto, você deve gerar um exercício de preenchimento de lacunas em formato JSON.
      
      IMPORTANTE: Escolha frases aleatórias e variadas do texto. Não repita sempre as mesmas frases.
      Seed aleatória: ${Math.random().toString(36).substring(7)}
      
      Crie exatamente 5 frases completas com até 10 palavras retiradas do texto para testar gramática e vocabulário. Em cada uma dessas frases, remova uma palavra-chave, envolvendo a palavra original APENAS com ** (por exemplo: **been**).
      Para testar o idioma e não apenas a memória, adicione uma dica ou a forma base da palavra em inglês entre parênteses logo após a lacuna, por exemplo: "I have **been** (to be) working".
      
      Retorne APENAS um JSON seguindo estritamente o esquema abaixo, sem nenhum texto adicional antes ou depois. As traduções em 'questionnaire' devem ser da frase inteira para o Português.

      Esquema JSON:
      {
        "questionnaire": [
          {
            "question": string,
            "translation": string
          }
        ]
      }

      Texto do Usuário:
      "${extractedText}"
    `;

    const result = await model.generateContent(prompt);
    let outputText = result.response.text();
    
    if (outputText.includes('```json')) {
      outputText = outputText.replace(/```json/g, '').replace(/```/g, '').trim();
    } else if (outputText.startsWith('```')) {
      outputText = outputText.replace(/```/g, '').trim();
    }

    return JSON.parse(outputText).questionnaire;
  } catch (error) {
    console.error("Error generating gap-fill exercises:", error);
    throw error;
  }
}

export async function generateListeningExercises(
  extractedText: string,
  idiom: string
) {

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0.9 },
    });

    const prompt = `
      Atue como um professor de ${idiom}. Gere exatamente 3 frases completas com até 10 palavras baseando-se no texto original, não precisam estar no texto original.
      
      IMPORTANTE: Varie as frases. Explore diferentes partes do texto fornecido.
      Seed aleatória: ${Math.random().toString(36).substring(7)}

      Retorne APENAS um JSON válido, sem textos adicionais, seguindo estritamente o esquema abaixo:
      {
        "listeningExercises": [
          string, string, string
        ]
      }

      Texto:
      "${extractedText}"
    `;

    const result = await model.generateContent(prompt);
    let outputText = result.response.text();
    
    if (outputText.includes('```json')) {
      outputText = outputText.replace(/```json/g, '').replace(/```/g, '').trim();
    } else if (outputText.startsWith('```')) {
      outputText = outputText.replace(/```/g, '').trim();
    }

    return JSON.parse(outputText).listeningExercises as string[];
  } catch (error) {
    console.error("Error generating listening exercises:", error);
    throw error;
  }
}

export async function generateParaphrasingExercises(
  extractedText: string,
  idiom: string,
  level: string
) {

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0.5 },
    });

    const prompt = `
      Atue como um professor de idiomas. O usuário me enviou este texto no idioma ${idiom} e ele possui o nível de proficiência ${level} no CEFR.
      A partir desse texto, você deve gerar um exercício de reescrita (paráfrase).
      
      Escolha exatamente 3 frases completas com até 10 palavras do texto original que tenham expressões, vocabulário rico ou uma estrutura flexível. Estas frases devem estar intactas.
      
      Retorne APENAS um JSON seguindo estritamente o esquema abaixo:
      {
        "paraphrasingExercises": [
          string, string, string
        ]
      }

      Texto:
      "${extractedText}"
    `;

    const result = await model.generateContent(prompt);
    let outputText = result.response.text();
    
    if (outputText.includes('```json')) {
      outputText = outputText.replace(/```json/g, '').replace(/```/g, '').trim();
    } else if (outputText.startsWith('```')) {
      outputText = outputText.replace(/```/g, '').trim();
    }

    return JSON.parse(outputText).paraphrasingExercises as string[];
  } catch (error) {
    console.error("Error generating paraphrasing exercises:", error);
    throw error;
  }
}

export async function evaluateParaphrases(
  idiom: string,
  exercises: { original: string; userRewrite: string }[]
): Promise<ParaphraseEvaluation[] | null> {

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: "Você é um professor de idiomas amigável e focado em encorajar o aluno.",
    });

    const prompt = `
      O aluno realizou um exercício de reescrita de frases com outras palavras no idioma ${idiom}.
      
      Aqui estão as frases originais e as reescritas fornecidas pelo aluno:
      ${JSON.stringify(exercises, null, 2)}
      
      Para cada exercício, avalie:
      1. Se o sentido original foi mantido de forma adequada na nova frase.
      2. Se a gramática e o vocabulário usados estão corretos.
      
      Forneça um feedback, se errou, explique gentilmente o motivo e como corrigir.
      
      Retorne APENAS um JSON Array contendo as avaliações na mesma ordem que os exercícios, seguindo este formato rigorosamente:
      [
        {
          "isCorrect": boolean,
          "feedback": string
        }
      ]
    `;

    const result = await model.generateContent(prompt);
    let outputText = result.response.text();
    
    console.log("Raw Paraphrase Output:", outputText);

    if (outputText.includes('\`\`\`json')) {
      outputText = outputText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    } else if (outputText.startsWith('\`\`\`')) {
      outputText = outputText.replace(/\`\`\`/g, '').trim();
    }

    const parsedData = JSON.parse(outputText) as ParaphraseEvaluation[];
    return parsedData;
  } catch (error) {
    console.error("Error evaluating paraphrases:", error);
    throw new Error("Falha ao avaliar respostas com a Inteligência Artificial.");
  }
}
