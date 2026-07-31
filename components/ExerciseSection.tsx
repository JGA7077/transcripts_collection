"use client";

import { useState } from "react";
import { 
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

interface SequenceWord {
  id: string;
  text: string;
}

interface SequenceItem {
  original: string;
  translation: string;
  words: SequenceWord[];
  placed: SequenceWord[];
  isValidated: boolean;
  isCorrect: boolean;
}

export default function ExerciseSection({ 
  transcriptText, 
  language,
  exercises,
  listeningPhrases,
  sequenceExercises
}: { 
  transcriptText: string;
  language: string;
  exercises: GapFillExercise[][];
  listeningPhrases?: string[];
  sequenceExercises?: { original: string; translation: string }[];
}) {
  const [gapFillExercises, setGapFillExercises] = useState<GapFillExercise[]>([]);
  const [listeningExercises, setListeningExercises] = useState<ListeningExercise[]>([]);
  const [showListening, setShowListening] = useState(false);
  const [paraphraseExercises, setParaphraseExercises] = useState<ParaphraseExercise[]>([]);
  const [sequenceItems, setSequenceItems] = useState<SequenceItem[]>([]);
  const [showSequence, setShowSequence] = useState(false);
  
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showReviseMessage, setShowReviseMessage] = useState<{ [key: string]: boolean }>({});
  const [showSuccessMessage, setShowSuccessMessage] = useState<{ [key: string]: boolean }>({});

  const [gapFillAnswers, setGapFillAnswers] = useState<{ [key: string]: string }>({});
  const [gapFillValidation, setGapFillValidation] = useState<{ [key: string]: boolean | null }>({});
  const [selectedVersion, setSelectedVersion] = useState(0);

  const loadGapFill = (versionIndex: number) => {
    setSelectedVersion(versionIndex);
    setGapFillExercises(exercises[versionIndex] || []);
    setGapFillAnswers({});
    setGapFillValidation({});
    setShowReviseMessage(prev => ({ ...prev, gapFill: false }));
    setShowSuccessMessage(prev => ({ ...prev, gapFill: false }));
  };

  const loadListening = async () => {
    if (!listeningPhrases || listeningPhrases.length === 0) return;
    
    setLoading(prev => ({ ...prev, listening: true }));
    setShowListening(true);

    try {
      const exercisesWithAudio = await Promise.all(
        listeningPhrases.map(async (phrase) => {
          try {
            const result = await generateAudios({ text: phrase, lang: language });
            return {
              phrase,
              audioBase64: result.base64,
              userAnswer: "",
              isValidated: false,
              isCorrect: false
            };
          } catch {
            return {
              phrase,
              audioBase64: undefined,
              userAnswer: "",
              isValidated: false,
              isCorrect: false
            };
          }
        })
      );
      setListeningExercises(exercisesWithAudio);

      const paraphraseData: ParaphraseExercise[] = listeningPhrases.map(phrase => ({
        original: phrase,
        userRewrite: ""
      }));
      setParaphraseExercises(paraphraseData);
    } catch (error) {
      console.error("Error loading listening exercises:", error);
    } finally {
      setLoading(prev => ({ ...prev, listening: false }));
    }
  };

  const shuffleArray = <T,>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const loadSequence = () => {
    if (!sequenceExercises || sequenceExercises.length === 0) return;

    const items: SequenceItem[] = sequenceExercises.map((ex) => {
      const wordTexts = ex.original.trim().split(/\s+/);
      const words: SequenceWord[] = shuffleArray(
        wordTexts.map((text, i) => ({ id: `${i}-${Date.now()}-${Math.random()}`, text }))
      );
      return {
        original: ex.original,
        translation: ex.translation,
        words,
        placed: [],
        isValidated: false,
        isCorrect: false
      };
    });

    setSequenceItems(items);
    setShowSequence(true);
  };

  const appendToPlaced = (itemIndex: number, wordId: string) => {
    setSequenceItems(prev => prev.map((item, i) => {
      if (i !== itemIndex) return item;
      const word = item.words.find(w => w.id === wordId);
      if (!word) return item;
      return {
        ...item,
        words: item.words.filter(w => w.id !== wordId),
        placed: [...item.placed, word],
        isValidated: false
      };
    }));
  };

  const moveToPool = (itemIndex: number, wordId: string) => {
    setSequenceItems(prev => prev.map((item, i) => {
      if (i !== itemIndex) return item;
      const word = item.placed.find(w => w.id === wordId);
      if (!word) return item;
      return {
        ...item,
        placed: item.placed.filter(w => w.id !== wordId),
        words: [...item.words, word],
        isValidated: false
      };
    }));
  };

  const handleSequenceDrop = (e: React.DragEvent, itemIndex: number, slotIndex?: number) => {
    e.preventDefault();
    e.stopPropagation();
    const wordId = e.dataTransfer.getData("text/plain");
    if (!wordId) return;

    setSequenceItems(prev => {
      const item = prev[itemIndex];
      const inPool = item.words.some(w => w.id === wordId);
      const placedFrom = item.placed.findIndex(w => w.id === wordId);

      if (inPool) {
        if (slotIndex !== undefined) {
          const word = item.words.find(w => w.id === wordId)!;
          const newPlaced = [...item.placed];
          newPlaced.splice(Math.min(slotIndex, newPlaced.length), 0, word);
          return prev.map((it, i) => i !== itemIndex ? it : {
            ...it,
            words: it.words.filter(w => w.id !== wordId),
            placed: newPlaced,
            isValidated: false
          });
        }
        const word = item.words.find(w => w.id === wordId)!;
        return prev.map((it, i) => i !== itemIndex ? it : {
          ...it,
          words: it.words.filter(w => w.id !== wordId),
          placed: [...it.placed, word],
          isValidated: false
        });
      }

      if (placedFrom !== -1) {
        if (slotIndex !== undefined && slotIndex !== placedFrom) {
          const newPlaced = [...item.placed];
          const [moved] = newPlaced.splice(placedFrom, 1);
          newPlaced.splice(Math.min(slotIndex, newPlaced.length), 0, moved);
          return prev.map((it, i) => i !== itemIndex ? it : {
            ...it,
            placed: newPlaced,
            isValidated: false
          });
        }
        const word = item.placed.find(w => w.id === wordId)!;
        return prev.map((it, i) => i !== itemIndex ? it : {
          ...it,
          placed: it.placed.filter(w => w.id !== wordId),
          words: [...it.words, word],
          isValidated: false
        });
      }

      return prev;
    });
  };

  const handleDropOnPool = (e: React.DragEvent, itemIndex: number) => {
    e.preventDefault();
    const wordId = e.dataTransfer.getData("text/plain");
    if (!wordId) return;
    moveToPool(itemIndex, wordId);
  };

  const validateSequence = () => {
    const normalize = (s: string) =>
      s.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?!]/g, "").replace(/\s+/g, " ").trim();

    setSequenceItems(prev => prev.map(item => {
      const userSentence = item.placed.map(w => w.text).join(" ").trim();
      const isCorrect = item.placed.length === item.original.trim().split(/\s+/).length
        && normalize(userSentence) === normalize(item.original);
      return { ...item, isValidated: true, isCorrect };
    }));
  };

  const renderSequenceFeedback = (item: SequenceItem) => {
    const correctWords = item.original.trim().split(/\s+/);
    const normalize = (s: string) =>
      s.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?!]/g, "");

    return (
      <div className="mt-3 flex flex-wrap gap-1 p-3 bg-black/40 rounded-lg border border-white/5 animate-in fade-in slide-in-from-top-1 duration-300">
        {item.placed.map((w, i) => {
          const isWordCorrect = normalize(w.text) === normalize(correctWords[i] || "");
          return (
            <span
              key={w.id}
              className={`font-medium ${isWordCorrect ? "text-green-400" : "text-blue-400"}`}
            >
              {w.text}
            </span>
          );
        })}
        {item.placed.length < correctWords.length && (
          <span className="text-slate-600 italic text-xs flex items-center">
            (faltam palavras...)
          </span>
        )}
      </div>
    );
  };

  const validateGapFill = () => {
    let hasError = false;
    const newValidation: { [key: string]: boolean | null } = {};
    
    gapFillExercises.forEach((ex, exerciseIndex) => {
      const parts = ex.question.split(/(\*\*.*?\*\*)/g);
      parts.forEach((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          const answer = part.slice(2, -2).toLowerCase().trim();
          const inputKey = `${exerciseIndex}-${i}`;
          const value = (gapFillAnswers[inputKey] || "").toLowerCase().trim();
          
          if (value !== answer) {
            hasError = true;
            newValidation[inputKey] = false;
          } else {
            newValidation[inputKey] = true;
          }
        }
      });
    });

    setGapFillValidation(newValidation);
    setShowReviseMessage(prev => ({ ...prev, gapFill: hasError }));
    setShowSuccessMessage(prev => ({ ...prev, gapFill: !hasError && Object.keys(newValidation).length > 0 }));
  };

  const validateListening = () => {
    let hasError = false;
    const newExercises = listeningExercises.map(ex => {
      const normalizedUser = ex.userAnswer.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").trim();
      const normalizedPhrase = ex.phrase.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").trim();
      const isCorrect = normalizedUser === normalizedPhrase;
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

  const playAudio = async (phrase: string, index: number) => {
    const existing = listeningExercises[index].audioBase64;
    if (existing) {
      const audio = new Audio(`data:audio/mp3;base64,${existing}`);
      audio.play();
      return;
    }

    setLoading(prev => ({ ...prev, [`audio-${index}`]: true }));
    try {
      const result = await generateAudios({ text: phrase, lang: language });
      const newExercises = [...listeningExercises];
      newExercises[index].audioBase64 = result.base64;
      setListeningExercises(newExercises);

      const audio = new Audio(`data:audio/mp3;base64,${result.base64}`);
      audio.play();
    } catch (error) {
      console.error("Error generating audio:", error);
    } finally {
      setLoading(prev => ({ ...prev, [`audio-${index}`]: false }));
    }
  };

  const renderGapFillText = (text: string, exerciseIndex: number) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        const answer = part.slice(2, -2);
        const inputKey = `${exerciseIndex}-${i}`;
        const isCorrect = gapFillValidation[inputKey];
        return (
          <input
            key={i}
            type="text"
            data-answer={answer}
            value={gapFillAnswers[inputKey] || ""}
            onChange={(e) => setGapFillAnswers(prev => ({ ...prev, [inputKey]: e.target.value }))}
            className={`inline-block w-32 mx-1 px-2 py-0.5 rounded focus:outline-none transition-colors ${
              isCorrect === true
                ? "border border-green-500 bg-green-900/20 text-green-400 focus:border-green-400"
                : isCorrect === false
                ? "border border-red-500 bg-red-900/20 text-red-400 focus:border-red-400"
                : "bg-slate-800/50 border border-slate-700 text-blue-400 focus:border-blue-500"
            }`}
            placeholder="..."
          />
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const renderListeningFeedback = (userAnswer: string, correctPhrase: string) => {
    const userWords = userAnswer.trim().split(/\s+/);
    const correctWords = correctPhrase.trim().split(/\s+/);

    return (
      <div className="mt-2 flex flex-wrap gap-1 p-3 bg-black/40 rounded-lg border border-white/5 animate-in fade-in slide-in-from-top-1 duration-300">
        {userWords.map((word, i) => {
          const normalizedUser = word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
          const normalizedCorrect = correctWords[i]?.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
          const isWordCorrect = normalizedUser === normalizedCorrect;
          
          return (
            <span 
              key={i} 
              className={`font-medium ${isWordCorrect ? "text-green-400" : "text-blue-400"}`}
            >
              {word}
            </span>
          );
        })}
        {userWords.length < correctWords.length && (
          <span className="text-slate-600 italic text-xs flex items-center">
            (faltam palavras...)
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="mt-12 p-6 bg-slate-900/30 rounded-3xl border border-slate-800/50 backdrop-blur-sm shadow-2xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Exercícios de Fixação</h2>
          <p className="text-slate-400 text-sm mt-1">Gere exercícios baseados no conteúdo desta transcrição.</p>
        </div>
        {!gapFillExercises.length && exercises.length > 0 && (
          <button
            onClick={() => loadGapFill(0)}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
          >
            ✨ Gerar Gap Fill
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 text-red-400 rounded-xl text-center">
          {errorMsg}
        </div>
      )}

      {!gapFillExercises.length && exercises.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          Nenhum exercício disponível para esta transcrição.
        </div>
      )}

      {/* GAP FILL SECTION */}
      {gapFillExercises.length > 0 && (
        <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-slate-800/20 p-6 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-400 flex items-center gap-2">
                📝 Preencha as lacunas
              </h3>
              {exercises.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Versão:</span>
                  {exercises.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => loadGapFill(i)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                        selectedVersion === i
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {showReviseMessage.gapFill && (
              <p className="text-red-400 font-medium mb-4 animate-pulse">⚠️ Revise as respostas incorretas</p>
            )}
            {showSuccessMessage.gapFill && (
              <p className="text-green-400 font-medium mb-4 animate-pulse">🎉 Todas as respostas estão corretas!</p>
            )}
            <div className="space-y-6">
              {gapFillExercises.map((ex, i) => (
                <div key={i} className="p-4 bg-black/20 rounded-xl border border-white/5">
                  <p className="text-slate-200 leading-relaxed text-lg">
                    {renderGapFillText(ex.question, i)}
                  </p>
                  <p className="text-slate-500 text-sm mt-2 italic">{ex.translation}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-between items-center">
              <button 
                onClick={validateGapFill}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-all"
              >
                Verificar Respostas
              </button>

              {!showListening && listeningPhrases && listeningPhrases.length > 0 && (
                <button 
                  onClick={loadListening}
                  disabled={loading.listening}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2"
                >
                  {loading.listening ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Gerando áudios...
                    </>
                  ) : (
                    "🎧 Próxima Etapa: Listening & Vocabulário"
                  )}
                </button>
              )}

              {!showSequence && sequenceExercises && sequenceExercises.length > 0 && !showListening && (
                <button 
                  onClick={loadSequence}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium rounded-lg transition-all"
                >
                  🔤 Próxima Etapa: Sequence
                </button>
              )}
            </div>
          </div>

          {/* LISTENING SECTION */}
          {showListening && listeningExercises.length > 0 && (
            <div className="bg-slate-800/20 p-6 rounded-2xl border border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-lg font-semibold text-purple-400 mb-4 flex items-center gap-2">
                🎧 Listening: Ouça e Digite
              </h3>
              {showReviseMessage.listening && (
                <p className="text-red-400 font-medium mb-4 animate-pulse">⚠️ Revise as respostas incorretas</p>
              )}
              <div className="space-y-6">
                {listeningExercises.map((ex, i) => (
                  <div key={i} className="p-4 bg-black/20 rounded-xl border border-white/5 flex flex-col gap-2">
                    <div className="flex flex-col md:flex-row gap-4 items-center w-full">
                      <button 
                        onClick={() => playAudio(ex.phrase, i)}
                        disabled={loading[`audio-${i}`]}
                        className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-blue-600/20 text-blue-400 rounded-full hover:bg-blue-600/30 transition-all border border-blue-500/20"
                      >
                        {loading[`audio-${i}`] ? (
                          <span className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></span>
                        ) : (
                          "▶️"
                        )}
                      </button>
                      <input 
                        type="text"
                        value={ex.userAnswer}
                        onChange={(e) => {
                          const newEx = [...listeningExercises];
                          newEx[i].userAnswer = e.target.value;
                          setListeningExercises(newEx);
                        }}
                        data-answer={ex.phrase}
                        placeholder="Digite o que você ouviu..."
                        className={`flex-1 w-full bg-slate-800/50 border rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${
                          ex.isValidated 
                            ? ex.isCorrect ? "border-green-500 bg-green-900/10" : "border-red-500 bg-red-900/10"
                            : "border-slate-700"
                        }`}
                      />
                    </div>
                    {ex.isValidated && renderListeningFeedback(ex.userAnswer, ex.phrase)}
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-between items-center gap-4">
                <button 
                  onClick={validateListening}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-all"
                >
                  Verificar Listening
                </button>

                {!showSequence && sequenceExercises && sequenceExercises.length > 0 && (
                  <button 
                    onClick={loadSequence}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium rounded-lg transition-all"
                  >
                    🔤 Próxima Etapa: Sequence
                  </button>
                )}
              </div>
            </div>
          )}

          {/* SEQUENCE SECTION */}
          {showSequence && sequenceItems.length > 0 && (
            <div className="bg-slate-800/20 p-6 rounded-2xl border border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-lg font-semibold text-teal-400 mb-4 flex items-center gap-2">
                🔤 Sequence: Organize as Palavras
              </h3>
              <p className="text-slate-400 text-sm mb-6">
                Clique ou arraste as palavras para ordená-las, formando a frase correta. Use a tradução abaixo como guia.
              </p>
              <div className="space-y-8">
                {sequenceItems.map((item, itemIndex) => {
                  const totalWords = item.original.trim().split(/\s+/).length;
                  return (
                    <div key={itemIndex} className="p-4 bg-black/20 rounded-xl border border-white/5 space-y-4">
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleSequenceDrop(e, itemIndex)}
                        className={`min-h-[3.5rem] flex flex-wrap gap-2 items-center p-3 rounded-lg border border-dashed transition-all ${
                          item.isValidated && item.isCorrect
                            ? "border-green-500/50 bg-green-900/10"
                            : "border-slate-700"
                        }`}
                      >
                        {item.placed.length === 0 && (
                          <span className="text-slate-600 text-sm italic">
                            Arraste ou clique nas palavras abaixo para montar a frase...
                          </span>
                        )}
                        {item.placed.map((w, slotIndex) => (
                          <button
                            key={w.id}
                            draggable
                            onClick={() => moveToPool(itemIndex, w.id)}
                            onDragStart={(e) => e.dataTransfer.setData("text/plain", w.id)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleSequenceDrop(e, itemIndex, slotIndex)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-semibold cursor-grab active:cursor-grabbing transition-all border ${
                              item.isValidated && item.isCorrect
                                ? "bg-green-600/20 border-green-500/40 text-green-300"
                                : "bg-blue-600/20 border-blue-500/40 text-blue-300 hover:bg-blue-600/30"
                            }`}
                            title="Clique para remover"
                          >
                            {w.text}
                          </button>
                        ))}
                      </div>

                      <p className="text-slate-500 text-sm italic border-l-2 border-teal-500/40 pl-3">
                        {item.translation}
                      </p>

                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDropOnPool(e, itemIndex)}
                        className="flex flex-wrap gap-2 items-center p-3 rounded-lg bg-slate-900/40 border border-slate-800 min-h-[3rem]"
                      >
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mr-1">
                          Palavras ({item.words.length}/{totalWords})
                        </span>
                        {item.words.map((w) => (
                          <button
                            key={w.id}
                            draggable
                            onClick={() => appendToPlaced(itemIndex, w.id)}
                            onDragStart={(e) => e.dataTransfer.setData("text/plain", w.id)}
                            className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-slate-700 hover:bg-slate-600 text-white cursor-grab active:cursor-grabbing transition-all"
                          >
                            {w.text}
                          </button>
                        ))}
                      </div>

                      {item.isValidated && renderSequenceFeedback(item)}
                    </div>
                  );
                })}
              </div>
              <button 
                onClick={validateSequence}
                className="mt-6 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-all"
              >
                Verificar Sequence
              </button>
            </div>
          )}

          {/* PARAPHRASE SECTION */}
          {paraphraseExercises.length > 0 && (
            <div className="bg-slate-800/20 p-6 rounded-2xl border border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
          )}
        </section>
      )}
    </div>
  );
}
