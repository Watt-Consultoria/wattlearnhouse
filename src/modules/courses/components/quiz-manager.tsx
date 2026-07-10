"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp, ListChecks, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  createQuiz,
  deleteQuiz,
  deleteQuizQuestion,
  reorderQuizQuestion,
} from "@/modules/courses/authoring-actions";
import { QuizQuestionForm } from "./quiz-question-form";
import type { TeacherQuiz, TeacherQuizQuestion } from "@/modules/courses/authoring.service";

export function QuizManager({ moduleId, quiz }: { moduleId: string; quiz: TeacherQuiz | null }) {
  if (!quiz) {
    return <CreateQuizPrompt moduleId={moduleId} />;
  }
  return <QuizEditor quiz={quiz} />;
}

function CreateQuizPrompt({ moduleId }: { moduleId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      const result = await createQuiz(moduleId);
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-4 sm:p-5">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-gold/10 text-brand-gold-dark">
            <ListChecks className="size-4" />
          </span>
          <div>
            <h2 className="font-heading text-sm font-bold text-foreground">Quiz</h2>
            <p className="text-xs text-muted-foreground">
              Nenhum quiz criado para este módulo ainda.
            </p>
          </div>
        </div>
        <Button size="sm" className="min-h-11 w-full sm:w-auto" onClick={handleCreate} disabled={isPending}>
          <Plus className="size-3.5" />
          {isPending ? "Criando..." : "Criar quiz"}
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function QuizEditor({ quiz }: { quiz: TeacherQuiz }) {
  const [addingNew, setAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDeletingQuiz, startDeleteQuizTransition] = useTransition();

  function handleDeleteQuiz() {
    if (!window.confirm("Tem certeza que deseja excluir o quiz e todas as suas perguntas?")) {
      return;
    }
    setError(null);
    startDeleteQuizTransition(async () => {
      const result = await deleteQuiz(quiz.id);
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="font-heading text-sm font-bold text-foreground">Quiz</h2>
          <Badge variant="outline">
            {quiz.questions.length} {quiz.questions.length === 1 ? "pergunta" : "perguntas"}
          </Badge>
        </div>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Excluir quiz"
          onClick={handleDeleteQuiz}
          disabled={isDeletingQuiz}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      {quiz.questions.length === 0 && !addingNew && (
        <p className="mb-3 text-sm text-muted-foreground">
          Nenhuma pergunta ainda. Adicione a primeira para liberar o quiz aos alunos.
        </p>
      )}

      {error && <p className="mb-3 text-xs text-destructive">{error}</p>}

      <ol className="flex flex-col gap-2">
        {quiz.questions.map((q, index) => (
          <QuestionRow
            key={q.id}
            quizId={quiz.id}
            question={q}
            index={index}
            isFirst={index === 0}
            isLast={index === quiz.questions.length - 1}
            isEditing={editingId === q.id}
            onEdit={() => setEditingId(q.id)}
            onCancelEdit={() => setEditingId(null)}
            onSaved={() => setEditingId(null)}
          />
        ))}
      </ol>

      {addingNew ? (
        <div className="mt-3">
          <QuizQuestionForm
            quizId={quiz.id}
            onDone={() => setAddingNew(false)}
            onCancel={() => setAddingNew(false)}
          />
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => {
            setEditingId(null);
            setAddingNew(true);
          }}
        >
          <Plus className="size-3.5" />
          Nova pergunta
        </Button>
      )}
    </div>
  );
}

function QuestionRow({
  quizId,
  question,
  index,
  isFirst,
  isLast,
  isEditing,
  onEdit,
  onCancelEdit,
  onSaved,
}: {
  quizId: string;
  question: TeacherQuizQuestion;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isReordering, startReorderTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  const isPending = isReordering || isDeleting;

  function handleReorder(direction: "up" | "down") {
    setError(null);
    startReorderTransition(async () => {
      const result = await reorderQuizQuestion(question.id, direction);
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  function handleDelete() {
    if (!window.confirm("Tem certeza que deseja excluir esta pergunta?")) {
      return;
    }
    setError(null);
    startDeleteTransition(async () => {
      const result = await deleteQuizQuestion(question.id);
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  if (isEditing) {
    return (
      <li>
        <QuizQuestionForm
          quizId={quizId}
          questionId={question.id}
          initial={{
            question: question.question,
            options: question.options,
            correctIndex: question.correctIndex,
            explanation: question.explanation,
          }}
          onDone={onSaved}
          onCancel={onCancelEdit}
        />
      </li>
    );
  }

  return (
    <li className="rounded-lg border border-border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="shrink-0 rounded bg-muted px-2 py-0.5 font-mono text-xs font-semibold text-muted-foreground">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
          {question.question}
        </span>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Mover para cima"
          onClick={() => handleReorder("up")}
          disabled={isPending || isFirst}
        >
          <ChevronUp className="size-3.5" />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Mover para baixo"
          onClick={() => handleReorder("down")}
          disabled={isPending || isLast}
        >
          <ChevronDown className="size-3.5" />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="destructive"
          aria-label="Excluir pergunta"
          onClick={handleDelete}
          disabled={isPending}
        >
          <Trash2 className="size-3.5" />
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onEdit}>
          <Pencil className="size-3.5" />
          Editar
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </li>
  );
}
