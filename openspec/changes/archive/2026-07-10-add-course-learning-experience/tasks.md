## 1. Schema

- [x] 1.1 Estender `Course` em `prisma/schema.prisma`: `category String`, `level CourseLevel` (novo enum `beginner`/`intermediate`/`advanced`), `tags String[]`, `coverImageUrl String?` — com `@map` snake_case
- [x] 1.2 Estender `Lesson`: `durationMinutes Int` obrigatório
- [x] 1.3 Criar model `Quiz` (`id`, `moduleId` único FK para `Module`, `createdAt`, `updatedAt`), relação 1—0..1 com `Module`, `onDelete: Cascade`
- [x] 1.4 Criar model `QuizQuestion` (`id`, `quizId` FK, `question`, `options String[]`, `correctIndex Int`, `explanation`, `order Int`), `onDelete: Cascade` a partir de `Quiz`
- [x] 1.5 Criar model `QuizAttempt` (`id`, `quizId` FK, `userId` FK, `score Int`, `totalQuestions Int`, `passed Boolean`, `answers Json`, `createdAt`)
- [x] 1.6 Criar model `LessonProgress` (`id`, `userId` FK, `lessonId` FK, `completedAt`), `@@unique([userId, lessonId])`
- [x] 1.7 Todos os models novos/campos novos seguem `snake_case` no banco (`@map`/`@@map`) e `TIMESTAMPTZ` para datas, conforme `NAMING_CONVENTIONS.md`/`TIMEZONE.md`

## 2. Migration e Seed

- [x] 2.1 Gerar e aplicar a migration localmente (`prisma migrate dev`)
- [x] 2.2 Estender `prisma/seed.ts`: múltiplos cursos cobrindo categorias/níveis distintos, módulos com aulas (`durationMinutes` realista), ao menos um `Quiz` com questões, e progresso de exemplo (`LessonProgress`/`QuizAttempt`) para o usuário de teste cobrindo os estados: aula não iniciada, em andamento, concluída; módulo bloqueado e desbloqueado; quiz não feito, aprovado e reprovado
- [x] 2.3 Rodar o seed e validar manualmente a cadeia completa (curso → módulo → aula → quiz → progresso) via query

## 3. Tema e Fontes

- [x] 3.1 Adicionar `--brand-navy`/`--brand-gold` em `src/app/globals.css` (`:root` e `@theme inline` como `--color-brand-navy`/`--color-brand-gold`); apontar `--primary` para o navy da marca
- [x] 3.2 Substituir Geist Sans/Geist Mono por `Plus Jakarta Sans` (`--font-heading`) e `JetBrains Mono` (`--font-mono`) via `next/font/google` em `src/app/layout.tsx`; remover as importações do Geist não usadas
- [x] 3.3 Configurar `images.remotePatterns` em `next.config.ts` para a origem das capas de curso usadas no seed

## 4. Primitivos de UI compartilhados

- [x] 4.1 Adicionar componentes shadcn necessários (badge, input, tabs, progress) via CLI, mantendo o padrão `base-vega`/CVA já usado em `button.tsx`/`card.tsx`
- [x] 4.2 Criar `src/components/breadcrumb.tsx`: trilha de navegação com colapso para "voltar" em mobile (Decisão de design #9/#14 relacionadas — ver spec `course-learning-player`)
- [x] 4.3 Criar `src/components/progress-bar.tsx` usando os tokens de tema em vez de hex inline
- [x] 4.4 Atualizar `Navbar` (novo local, ex: `src/modules/courses/components/navbar.tsx`) para usar `useAuth()` real em vez de placeholder

## 5. Camada de dados e regras de negócio

- [x] 5.1 Criar `src/modules/courses/courses.service.ts` (DAL): listagem de cursos com filtros, curso por id com módulos/aulas, cálculo de progresso por módulo/curso a partir de `LessonProgress`
- [x] 5.2 Implementar a função de regra de desbloqueio de módulo (módulo 0 sempre acessível; módulo N requer módulo N-1 100% concluído + quiz aprovado se houver), reutilizável tanto na renderização quanto nas Server Actions
- [x] 5.3 Criar Server Action `completeLesson(lessonId)`: verifica sessão (`authService.getCurrentUser()`), verifica que o módulo da aula está desbloqueado, faz upsert em `LessonProgress`
- [x] 5.4 Criar Server Action `submitQuizAttempt(quizId, answers)`: verifica sessão, verifica módulo desbloqueado, verifica todas as questões respondidas, corrige no servidor, calcula `passed` (`score/total >= 0.7`), grava `QuizAttempt`
- [x] 5.5 Criar `src/modules/quiz/quiz.service.ts` (DAL): busca de quiz com questões, histórico de tentativas do usuário

## 6. Rotas e telas

- [x] 6.1 `src/app/courses/page.tsx`: catálogo — checagem de sessão própria da página, busca/filtro por categoria (derivada dos dados)/nível, grid responsivo (1 coluna mobile → 3 colunas desktop), estado vazio
- [x] 6.2 `src/app/courses/[courseId]/page.tsx`: detalhe do curso — header, tags, lista de módulos com progresso e indicação de bloqueio
- [x] 6.3 `src/app/courses/[courseId]/modules/[moduleId]/page.tsx`: lista de aulas do módulo (+ quiz como item final, se houver) com indicador "próxima aula"
- [x] 6.4 `src/app/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]/page.tsx`: conteúdo da aula — Markdown único com vídeo embutido inline (sem abas vídeo/texto), botão concluir aula (chama a Server Action), lista de aulas do módulo acessível em mobile via disclosure
- [x] 6.5 `src/app/courses/[courseId]/modules/[moduleId]/quiz/page.tsx`: quiz — navegador de questões, submissão via Server Action, tela de resultado com revisão (resposta do usuário, correta, explicação) e opção de tentar novamente
- [x] 6.6 `src/app/page.tsx`: redireciona para `/courses` (mantendo a checagem de sessão já existente); remover `src/view/home.tsx`

## 7. Passe de mobile/UX

- [x] 7.1 Validar em viewport 375×667 (iPhone SE) e 768px (tablet) todas as 5 telas: grids colapsam para 1 coluna, nenhuma ação depende de hover, alvos de toque com no mínimo 44×44px
- [x] 7.2 Validar que a barra sticky da tela de conteúdo de aula não consome mais que ~15% da altura em viewport pequeno
- [x] 7.3 Validar fallback de capa de curso (nula e com erro de carregamento) em telas pequenas

## 8. Validação final

- [x] 8.1 Rodar `npx tsc --noEmit` e `npm run build`
- [x] 8.2 Percorrer manualmente o fluxo completo logado: catálogo → curso → módulo bloqueado (confirmar bloqueio) → módulo 1 → concluir todas as aulas → quiz → reprovar → tentar novamente → aprovar → módulo 2 desbloqueado
- [x] 8.3 Rodar `openspec validate add-course-learning-experience --strict` antes de considerar o change pronto para implementação
