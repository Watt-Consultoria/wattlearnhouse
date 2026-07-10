"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  createQuizQuestion,
  updateQuizQuestion,
  type QuizQuestionInput,
} from "@/modules/courses/authoring-actions";

const MAX_OPTIONS = 6;
const MIN_OPTIONS = 2;

type QuizQuestionFormProps = {
  quizId: string;
  questionId?: string;
  initial?: QuizQuestionInput;
  onDone: () => void;
  onCancel: () => void;
};

export function QuizQuestionForm({
  quizId,
  questionId,
  initial,
  onDone,
  onCancel,
}: QuizQuestionFormProps) {
  const [question, setQuestion] = useState(initial?.question ?? "");
  const [options, setOptions] = useState<string[]>(initial?.options ?? ["", ""]);
  const [correctIndex, setCorrectIndex] = useState(initial?.correctIndex ?? 0);
  const [explanation, setExplanation] = useState(initial?.explanation ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateOption(index: number, value: string) {
    setOptions((prev) => prev.map((option, i) => (i === index ? value : option)));
  }

  function addOption() {
    if (options.length >= MAX_OPTIONS) return;
    setOptions((prev) => [...prev, ""]);
  }

  function removeOption(index: number) {
    if (options.length <= MIN_OPTIONS) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
    setCorrectIndex((prev) => {
      if (index === prev) return 0;
      return index < prev ? prev - 1 : prev;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const input: QuizQuestionInput = { question, options, correctIndex, explanation };
    startTransition(async () => {
      const result = questionId
        ? await updateQuizQuestion(questionId, input)
        : await createQuizQuestion(quizId, input);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onDone();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-border bg-muted/40 p-3 sm:p-4"
    >
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Enunciado da pergunta
        </label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ex.: Qual é a tensão padrão da rede elétrica residencial no Brasil?"
          rows={2}
          className="min-h-[4.5rem] w-full resize-y rounded-md border border-input bg-background p-2.5 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Alternativas — selecione a correta
        </label>
        <div className="flex flex-col gap-2">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <button
                type="button"
                aria-label={`Marcar alternativa ${index + 1} como correta`}
                onClick={() => setCorrectIndex(index)}
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  correctIndex === index
                    ? "border-emerald-500 bg-emerald-500/15"
                    : "border-border hover:border-emerald-500/50",
                )}
              >
                {correctIndex === index && <span className="size-3 rounded-full bg-emerald-500" />}
              </button>
              <Input
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Alternativa ${index + 1}`}
                className="min-h-11 flex-1"
              />
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label="Remover alternativa"
                onClick={() => removeOption(index)}
                disabled={options.length <= MIN_OPTIONS}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
        {options.length < MAX_OPTIONS && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={addOption}
          >
            <Plus className="size-3.5" />
            Adicionar alternativa
          </Button>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Explicação da resposta
        </label>
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="Explique por que essa é a resposta correta — o aluno vê isso após responder."
          rows={2}
          className="min-h-[4.5rem] w-full resize-y rounded-md border border-input bg-background p-2.5 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar pergunta"}
        </Button>
      </div>
    </form>
  );
}
