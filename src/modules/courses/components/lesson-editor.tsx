"use client";

import { useLayoutEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Bold,
  Italic,
  Code,
  Code2,
  Table2,
  Video,
  Sigma,
  SigmaSquare,
  ImagePlus,
  Eye,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LessonContent } from "./lesson-content";
import { createLesson, updateLesson } from "@/modules/courses/authoring-actions";
import { cn } from "@/lib/utils";

type Selection = { start: number; end: number };

type EditTransform = (value: string, start: number, end: number) => { value: string } & Selection;

const TABLE_SNIPPET = "\n| Coluna 1 | Coluna 2 |\n| --- | --- |\n| Valor 1 | Valor 2 |\n";

type ToolbarAction =
  | "bold"
  | "italic"
  | "inline-code"
  | "code-block"
  | "table"
  | "youtube"
  | "image"
  | "equation-inline"
  | "equation-block";

const TOOLBAR_ITEMS: { action: ToolbarAction; label: string; icon: typeof Bold }[] = [
  { action: "bold", label: "Negrito", icon: Bold },
  { action: "italic", label: "Itálico", icon: Italic },
  { action: "inline-code", label: "Código inline", icon: Code },
  { action: "code-block", label: "Bloco de código", icon: Code2 },
  { action: "table", label: "Tabela", icon: Table2 },
  { action: "youtube", label: "Vídeo do YouTube", icon: Video },
  { action: "image", label: "Imagem", icon: ImagePlus },
  { action: "equation-inline", label: "Fórmula inline", icon: Sigma },
  { action: "equation-block", label: "Fórmula em bloco", icon: SigmaSquare },
];

type LessonEditorProps = {
  courseId: string;
  moduleId: string;
  moduleTitle: string;
  mode: "create" | "edit";
  lessonId?: string;
  initialTitle?: string;
  initialContent?: string;
};

export function LessonEditor({
  courseId,
  moduleId,
  moduleTitle,
  mode,
  lessonId,
  initialTitle = "",
  initialContent = "",
}: LessonEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingSelectionRef = useRef<Selection | null>(null);

  useLayoutEffect(() => {
    const pending = pendingSelectionRef.current;
    if (pending && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(pending.start, pending.end);
      pendingSelectionRef.current = null;
    }
  }, [content]);

  function applyEdit(transform: EditTransform) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const result = transform(textarea.value, textarea.selectionStart, textarea.selectionEnd);
    pendingSelectionRef.current = { start: result.start, end: result.end };
    setContent(result.value);
  }

  function wrapSelection(before: string, after: string, placeholder: string) {
    applyEdit((value, start, end) => {
      const selected = value.slice(start, end) || placeholder;
      const newValue = value.slice(0, start) + before + selected + after + value.slice(end);
      const selStart = start + before.length;
      return { value: newValue, start: selStart, end: selStart + selected.length };
    });
  }

  function insertSnippet(snippet: string) {
    applyEdit((value, start, end) => {
      const newValue = value.slice(0, start) + snippet + value.slice(end);
      const cursor = start + snippet.length;
      return { value: newValue, start: cursor, end: cursor };
    });
  }

  function insertYoutubeEmbed() {
    applyEdit((value, start, end) => {
      const before = "[youtube_video](<";
      const placeholder = "url";
      const after = ">)";
      const newValue = value.slice(0, start) + before + placeholder + after + value.slice(end);
      const selStart = start + before.length;
      return { value: newValue, start: selStart, end: selStart + placeholder.length };
    });
  }

  function insertImageEmbed() {
    applyEdit((value, start, end) => {
      const before = "![imagem](<";
      const placeholder = "url";
      const after = ">)";
      const newValue = value.slice(0, start) + before + placeholder + after + value.slice(end);
      const selStart = start + before.length;
      return { value: newValue, start: selStart, end: selStart + placeholder.length };
    });
  }

  function insertBlockEquation() {
    applyEdit((value, start, end) => {
      const before = value.slice(0, start);
      const after = value.slice(end);
      const leadingBreak = before.length === 0 || before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
      const trailingBreak = after.length === 0 || after.startsWith("\n\n") ? "" : after.startsWith("\n") ? "\n" : "\n\n";
      const placeholder = "E = mc^2";
      const block = `${leadingBreak}$$\n${placeholder}\n$$${trailingBreak}`;
      const newValue = before + block + after;
      const selStart = before.length + leadingBreak.length + 3;
      return { value: newValue, start: selStart, end: selStart + placeholder.length };
    });
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createLesson(moduleId, { title, content })
          : await updateLesson(lessonId!, { title, content });

      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/teacher/courses/${courseId}/modules/${moduleId}`);
    });
  }

  function handleToolbarAction(action: ToolbarAction) {
    switch (action) {
      case "bold":
        return wrapSelection("**", "**", "negrito");
      case "italic":
        return wrapSelection("*", "*", "itálico");
      case "inline-code":
        return wrapSelection("`", "`", "código");
      case "code-block":
        return wrapSelection("\n```\n", "\n```\n", "código");
      case "table":
        return insertSnippet(TABLE_SNIPPET);
      case "youtube":
        return insertYoutubeEmbed();
      case "image":
        return insertImageEmbed();
      case "equation-inline":
        return wrapSelection("$", "$", "x^2");
      case "equation-block":
        return insertBlockEquation();
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Título da aula
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: Riscos elétricos e como preveni-los"
          />
        </div>
        <Button size="lg" className="min-h-11 shrink-0" onClick={handleSave} disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <div className="flex lg:hidden">
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "edit" | "preview")}>
          <TabsList>
            <TabsTrigger value="edit">
              <Pencil className="size-3.5" />
              Editar
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="size-3.5" />
              Visualizar
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid flex-1 gap-4 lg:grid-cols-2 lg:items-start">
        <div className={cn("flex flex-col gap-2", viewMode === "preview" && "hidden lg:flex")}>
          <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-muted p-1.5">
            {TOOLBAR_ITEMS.map((item) => (
              <Button
                key={item.action}
                type="button"
                variant="ghost"
                size="icon"
                aria-label={item.label}
                title={item.label}
                onClick={() => handleToolbarAction(item.action)}
              >
                <item.icon className="size-4" />
              </Button>
            ))}
          </div>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escreva o conteúdo da aula em Markdown..."
            className="min-h-[420px] w-full flex-1 resize-y rounded-xl border border-border bg-background p-4 font-mono text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        <div
          className={cn(
            "min-h-[420px] overflow-y-auto rounded-xl border border-border bg-card p-4",
            viewMode === "edit" && "hidden lg:block",
          )}
        >
          <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Prévia · {moduleTitle}
          </p>
          {content.trim() ? (
            <LessonContent content={content} />
          ) : (
            <p className="text-sm text-muted-foreground">A prévia aparece aqui conforme você digita.</p>
          )}
        </div>
      </div>
    </div>
  );
}
