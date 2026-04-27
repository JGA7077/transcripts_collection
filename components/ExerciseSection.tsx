"use client";

import { useState, useRef } from "react";
import { 
  generateGapFillExercises, 
  generateListeningExercises, 
  generateAudios, 
  evaluateParaphrases 
} from "@/app/actions/import";
import { ParaphraseEvaluation } from "@/app/types/genericTypes";

interface GapFillExercise {
  question: string;
  translation: string;
}

interface ListeningExercise {
  phrase: string;
  audioBase64?: string;
  userAnswer: string;
  isValidated: boolean;
  isCorrect: boolean;
}

interface ParaphraseExercise {
  original: string;
  userRewrite: string;
  evaluation?: ParaphraseEvaluation;
}

export default function ExerciseSection({ 
  transcriptText, 
  language 
}: { 
  transcriptText: string;
  language: string;
}) {
  const [gapFillExercises, setGapFillExercises] = useState<GapFillExercise[]>([]);
  const [listeningExercises, setListeningExercises] = useState<ListeningExercise[]>([]);
  const [paraphraseExercises, setParaphraseExercises] = useState<ParaphraseExercise[]>([]);
  
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showReviseMessage, setShowReviseMessage] = useState<{ [key: string]: boolean }>({});

  const generateAll = async () => {
    setLoading({ all: true });
    setErrorMsg(null);
    try {
      // 1. Gap Fill
      const gapFill = await generateGapFillExercises(transcriptText, language);
      setGapFillExercises(gapFill);

      // 2. Listening & Paraphrase (using same phrases)
      const phrases = await generateListeningExercises(transcriptText, language);
      
      const listeningData: ListeningExercise[] = await Promise.all(
        phrases.map(async (phrase) => {
          const audio = await generateAudios({ text: phrase, lang: language });
          return {
            phrase,
            audioBase64: audio.base64,
            userAnswer: "",
            isValidated: false,
            isCorrect: false
          };
        })
      );
      setListeningExercises(listeningData);

      const paraphraseData: ParaphraseExercise[] = phrases.map(phrase => ({
        original: phrase,
        userRewrite: ""
      }));
      setParaphraseExercises(paraphraseData);

    } catch (error) {
      console.error("Error generating exercises:", error);
      setErrorMsg("Erro ao gerar exercícios. Tente novamente.");
    } finally {
      setLoading({ all: false });
    }
  };

  const handleGapFillChange = (index: number, value: string) => {
    // This is handled by DOM elements directly for GapFill because of the HTML injection
  };

  const validateGapFill = () => {
    const inputs = document.querySelectorAll<HTMLInputElement>(".gap-fill-input");
    let hasError = false;
    inputs.forEach(input => {
      const answer = input.getAttribute("data-answer")?.toLowerCase().trim();
      const value = input.value.toLowerCase().trim();
      if (value !== answer) {
        input.classList.add("border-red-500", "bg-red-900/20");
        input.classList.remove("border-slate-700", "bg-slate-800/50");
        hasError = true;
      } else {
        input.classList.remove("border-red-500", "bg-red-900/20");
        input.classList.add("border-green-500", "bg-green-900/20");
      }
    });
    setShowReviseMessage(prev => ({ ...prev, gapFill: hasError }));
  };

  const validateListening = () => {
    let hasError = false;
    const newExercises = listeningExercises.map(ex => {
      const isCorrect = ex.userAnswer.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").trim() === 
                        ex.phrase.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").trim();
      if (!isCorrect) hasError = true;
      return { ...ex, isValidated: true, isCorrect };
    });
    setListeningExercises(newExercises);
    setShowReviseMessage(prev => ({ ...prev, listening: hasError }));
  };

  const handleEvaluateParaphrases = async () => {
    setLoading(prev => ({ ...prev, paraphrases: true }));
    try {
      const evaluations = await evaluateParaphrases(
        language, 
        paraphraseExercises.map(ex => ({ original: ex.original, userRewrite: ex.userRewrite }))
      );
      
      if (evaluations) {
        setParaphraseExercises(prev => prev.map((ex, i) => ({
          ...ex,
          evaluation: evaluations[i]
        })));
      }
    } catch (error) {
      console.error("Error evaluating paraphrases:", error);
    } finally {
      setLoading(prev => ({ ...prev, paraphrases: false }));
    }
  };

  const playAudio = (base64?: string) => {
    if (!base64) return;
    const audio = new Audio(`data:audio/mp3;base64,${base64}`);
    audio.play();
  };

  // Helper to render Gap Fill text with inputs
  const renderGapFillText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        const answer = part.slice(2, -2);
        return (
          <input
            key={i}
            type="text"
            data-answer={answer}
            className="gap-fill-input inline-block w-32 mx-1 px-2 py-0.5 bg-slate-800/50 border border-slate-700 rounded text-blue-400 focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="..."
          />
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="mt-12 p-6 bg-slate-900/30 rounded-3xl border border-slate-800/50 backdrop-blur-sm shadow-2xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Exercícios de Fixação</h2>
          <p className="text-slate-400 text-sm mt-1">Gere exercícios baseados no conteúdo desta transcrição.</p>
        </div>
        <button
          onClick={generateAll}
          disabled={loading.all}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
        >
          {loading.all ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Gerando...
            </>
          ) : (
            "✨ Gerar Exercícios"
          )}
        </button>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 text-red-400 rounded-xl text-center">
          {errorMsg}
        </div>
      )}

      {gapFillExercises.length > 0 && (
        <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* GAP FILL SECTION */}
          <div className="bg-slate-800/20 p-6 rounded-2xl border border-white/5">
            <h3 className="text-lg font-semibold text-blue-400 mb-4 flex items-center gap-2">
              📝 Preencha as lacunas
            </h3>
            {showReviseMessage.gapFill && (
              <p className="text-red-400 font-medium mb-4 animate-pulse">⚠️ Revise as respostas incorretas</p>
            )}
            <div className="space-y-6">
              {gapFillExercises.map((ex, i) => (
                <div key={i} className="p-4 bg-black/20 rounded-xl border border-white/5">
                  <p className="text-slate-200 leading-relaxed text-lg">
                    {renderGapFillText(ex.question)}
                  </p>
                  <p className="text-slate-500 text-sm mt-2 italic">{ex.translation}</p>
                </div>
              ))}
            </div>
            <button 
              onClick={validateGapFill}
              className="mt-6 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-all"
            >
              Verificar Respostas
            </button>
          </div>

          {/* LISTENING SECTION */}
          <div className="bg-slate-800/20 p-6 rounded-2xl border border-white/5">
            <h3 className="text-lg font-semibold text-purple-400 mb-4 flex items-center gap-2">
              🎧 Listening: Ouça e Digite
            </h3>
            {showReviseMessage.listening && (
              <p className="text-red-400 font-medium mb-4 animate-pulse">⚠️ Revise as respostas incorretas</p>
            )}
            <div className="space-y-6">
              {listeningExercises.map((ex, i) => (
                <div key={i} className="p-4 bg-black/20 rounded-xl border border-white/5 flex flex-col md:flex-row gap-4 items-center">
                  <button 
                    onClick={() => playAudio(ex.audioBase64)}
                    className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-blue-600/20 text-blue-400 rounded-full hover:bg-blue-600/30 transition-all border border-blue-500/20"
                  >
                    ▶️
                  </button>
                  <input 
                    type="text"
                    value={ex.userAnswer}
                    onChange={(e) => {
                      const newEx = [...listeningExercises];
                      newEx[i].userAnswer = e.target.value;
                      setListeningExercises(newEx);
                    }}
                    placeholder="Digite o que você ouviu..."
                    className={`flex-1 w-full bg-slate-800/50 border rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${
                      ex.isValidated 
                        ? ex.isCorrect ? "border-green-500 bg-green-900/10" : "border-red-500 bg-red-900/10"
                        : "border-slate-700"
                    }`}
                  />
                </div>
              ))}
            </div>
            <button 
              onClick={validateListening}
              className="mt-6 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-all"
            >
              Verificar Listening
            </button>
          </div>

          {/* PARAPHRASE SECTION */}
          <div className="bg-slate-800/20 p-6 rounded-2xl border border-white/5">
            <h3 className="text-lg font-semibold text-emerald-400 mb-4 flex items-center gap-2">
              🔄 Vocabulário: Reescrita de Frases
            </h3>
            <p className="text-slate-400 text-sm mb-6">Reescreva as frases abaixo usando outras palavras, mantendo o mesmo sentido.</p>
            <div className="space-y-6">
              {paraphraseExercises.map((ex, i) => (
                <div key={i} className="p-4 bg-black/20 rounded-xl border border-white/5 space-y-4">
                  <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-1">Frase Original</span>
                    <p className="text-slate-300 font-medium">{ex.original}</p>
                  </div>
                  <textarea 
                    value={ex.userRewrite}
                    onChange={(e) => {
                      const newEx = [...paraphraseExercises];
                      newEx[i].userRewrite = e.target.value;
                      setParaphraseExercises(newEx);
                    }}
                    placeholder="Sua versão da frase..."
                    rows={2}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resize-none"
                  />
                  {ex.evaluation && (
                    <div className={`p-3 rounded-lg border flex items-start gap-3 animate-in fade-in zoom-in-95 duration-300 ${
                      ex.evaluation.isCorrect 
                        ? "bg-green-900/20 border-green-500/30 text-green-300" 
                        : "bg-orange-900/20 border-orange-500/30 text-orange-300"
                    }`}>
                      <span className="text-xl">{ex.evaluation.isCorrect ? "✅" : "💡"}</span>
                      <p className="text-sm">{ex.evaluation.feedback}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button 
              onClick={handleEvaluateParaphrases}
              disabled={loading.paraphrases}
              className="mt-6 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-semibold rounded-xl transition-all flex items-center gap-2"
            >
              {loading.paraphrases ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Avaliando...
                </>
              ) : (
                "🤖 Avaliar Reescritas"
              )}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
