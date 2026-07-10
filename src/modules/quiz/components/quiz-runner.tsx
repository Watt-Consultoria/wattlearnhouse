"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  submitQuizAttempt,
  type SubmitQuizAttemptResult,
} from "@/modules/courses/actions";

type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  order: number;
};

export function QuizRunner({
  quizId,
  questions,
  courseId,
  moduleId,
}: {
  quizId: string;
  questions: QuizQuestion[];
  courseId: string;
  moduleId: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<Extract<SubmitQuizAttemptResult, { ok: true }> | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const allAnswered = questions.every((question) => answers[question.id] !== undefined);
  const currentQuestion = questions[currentIndex];

  function selectAnswer(questionId: string, index: number) {
    setAnswers((prev) => ({ ...prev, [questionId]: index }));
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const response = await submitQuizAttempt(
        quizId,
        questions.map((question) => ({
          questionId: question.id,
          selectedIndex: answers[question.id],
        })),
      );
      if (response.ok) {
        setResult(response);
      } else {
        setError(response.error);
      }
    });
  }

  function handleRetry() {
    setAnswers({});
    setResult(null);
    setCurrentIndex(0);
    setError(null);
  }

  if (result) {
    return (
      <QuizResult result={result} courseId={courseId} moduleId={moduleId} onRetry={handleRetry} />
    );
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="mb-2 flex justify-between text-xs text-muted-foreground">
          <span>Progresso</span>
          <span className="font-mono">
            {answeredCount}/{questions.length}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-brand-gold transition-all duration-500"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {questions.map((question, index) => (
          <button
            key={question.id}
            type="button"
            onClick={() => setCurrentIndex(index)}
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-semibold transition-all",
              index === currentIndex
                ? "bg-brand-navy text-white"
                : answers[question.id] !== undefined
                  ? "bg-brand-gold/15 text-brand-gold-dark"
                  : "bg-muted text-muted-foreground hover:bg-secondary",
            )}
            aria-label={`Questão ${index + 1}${
              answers[question.id] !== undefined ? " (respondida)" : ""
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-navy font-mono text-xs font-bold text-white">
            {currentIndex + 1}
          </span>
          <p className="pt-0.5 leading-snug font-medium text-foreground">
            {currentQuestion.question}
          </p>
        </div>
        <div className="flex flex-col gap-2.5">
          {currentQuestion.options.map((option, optionIndex) => {
            const isSelected = answers[currentQuestion.id] === optionIndex;
            return (
              <button
                key={optionIndex}
                type="button"
                onClick={() => selectAnswer(currentQuestion.id, optionIndex)}
                className={cn(
                  "min-h-11 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all duration-150",
                  isSelected
                    ? "border-brand-gold bg-brand-gold/10 text-foreground"
                    : "border-border bg-muted/40 text-foreground/80 hover:border-brand-navy/30 hover:bg-card",
                )}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      isSelected ? "border-brand-gold bg-brand-gold" : "border-border",
                    )}
                  >
                    {isSelected && <span className="size-2 rounded-full bg-white" />}
                  </span>
                  {option}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="lg"
          className="min-h-11"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
        >
          Anterior
        </Button>

        {currentIndex < questions.length - 1 ? (
          <Button
            variant="secondary"
            size="lg"
            className="min-h-11"
            onClick={() =>
              setCurrentIndex((index) => Math.min(questions.length - 1, index + 1))
            }
          >
            Próxima
          </Button>
        ) : (
          <Button
            size="lg"
            className="min-h-11"
            disabled={!allAnswered || isPending}
            onClick={handleSubmit}
          >
            {isPending ? "Enviando..." : "Enviar respostas"}
          </Button>
        )}
      </div>
    </div>
  );
}

function QuizResult({
  result,
  courseId,
  moduleId,
  onRetry,
}: {
  result: Extract<SubmitQuizAttemptResult, { ok: true }>;
  courseId: string;
  moduleId: string;
  onRetry: () => void;
}) {
  const pct = Math.round((result.score / result.totalQuestions) * 100);

  return (
    <div className="flex flex-col gap-6">
      <div
        className={cn(
          "rounded-2xl border p-6 text-center sm:p-8",
          result.passed ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50",
        )}
      >
        <div
          className={cn(
            "mx-auto mb-4 flex size-16 items-center justify-center rounded-full",
            result.passed ? "bg-emerald-100" : "bg-red-100",
          )}
        >
          {result.passed ? (
            <CheckCircle2 className="size-8 text-emerald-500" />
          ) : (
            <XCircle className="size-8 text-red-500" />
          )}
        </div>
        <p
          className={cn(
            "mb-1 font-heading text-4xl font-extrabold",
            result.passed ? "text-emerald-600" : "text-red-600",
          )}
        >
          {pct}%
        </p>
        <p
          className={cn(
            "mb-1 font-heading text-lg font-semibold",
            result.passed ? "text-emerald-700" : "text-red-700",
          )}
        >
          {result.passed ? "Parabéns! Você foi aprovado." : "Não foi dessa vez."}
        </p>
        <p className={cn("text-sm", result.passed ? "text-emerald-600" : "text-red-500")}>
          {result.score} de {result.totalQuestions} questões corretas ·{" "}
          {result.passed ? "Mínimo atingido (70%)" : "Tente novamente para avançar"}
        </p>
      </div>

      <h2 className="font-heading text-lg font-bold text-foreground">Revisão das respostas</h2>

      <div className="flex flex-col gap-4">
        {result.review.map((item, index) => (
          <div
            key={item.questionId}
            className="overflow-hidden rounded-xl border border-border"
          >
            <div className="flex items-start gap-3 bg-muted px-4 py-3">
              <p className="font-medium text-foreground">
                {index + 1}. {item.question}
              </p>
            </div>
            <div className="flex flex-col gap-1.5 bg-card p-4">
              {item.options.map((option, optionIndex) => {
                const isUserChoice = item.selectedIndex === optionIndex;
                const isCorrectChoice = item.correctIndex === optionIndex;
                return (
                  <div
                    key={optionIndex}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm",
                      isCorrectChoice && "bg-emerald-50 text-emerald-800",
                      isUserChoice && !isCorrectChoice && "bg-red-50 text-red-700",
                      !isUserChoice && !isCorrectChoice && "text-muted-foreground",
                    )}
                  >
                    {option}
                    {isCorrectChoice && " ✓"}
                    {isUserChoice && !isCorrectChoice && " (sua resposta)"}
                  </div>
                );
              })}
            </div>
            <div className="border-t border-border bg-muted/60 px-4 py-3">
              <p className="mb-1 text-xs font-semibold text-muted-foreground">Explicação</p>
              <p className="text-xs leading-relaxed text-foreground/80">{item.explanation}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="outline"
          size="lg"
          className="min-h-11"
          nativeButton={false}
          render={<Link href={`/courses/${courseId}/modules/${moduleId}`} />}
        >
          Voltar ao módulo
        </Button>
        {!result.passed && (
          <Button size="lg" className="min-h-11" onClick={onRetry}>
            <RotateCcw className="size-4" />
            Tentar novamente
          </Button>
        )}
      </div>
    </div>
  );
}
