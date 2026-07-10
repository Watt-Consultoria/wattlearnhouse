## Why

Hoje o app só tem uma home placeholder ("Você está autenticado") e o schema `Course`/`Module`/`Lesson` não tem nenhuma UI que o consuma mas usa ShadeCN. Existe um protótipo Figma validado (WattAcademy) com as 5 telas da experiência de aprendizado — catálogo, curso/módulos, aulas do módulo, conteúdo da aula e quiz — mas ele roda com dados mockados em `data.ts`, progresso e resultado de quiz vivem só em `useState` (somem ao recarregar), e a navegação é um SPA de estado em memória (sem URLs reais). Este change implementa essa experiência de verdade: conectada ao banco, ao usuário autenticado da sessão, com progresso e quiz persistidos, navegação por URL real e um passe de mobile/UX que o protótipo (feito para desktop de referência) não cobre.

## What Changes

- Substitui a home placeholder por 5 telas reais em rotas do App Router: catálogo de cursos, detalhe do curso (módulos), aulas do módulo, conteúdo da aula (vídeo/texto) e quiz — cada uma com URL própria, navegável por back/forward do navegador (crítico em mobile) e link direto.
- Adiciona rastreamento de progresso por usuário: conclusão de aula (`LessonProgress`), cálculo de progresso por módulo/curso a partir de dado real, e regra de desbloqueio de módulo (módulo N só libera quando o módulo N-1 está 100% concluído, incluindo quiz aprovado se houver).
- Adiciona quiz por módulo (opcional, no máximo 1 por módulo): banco de questões de múltipla escolha, submissão com nota mínima de 70% para aprovar, histórico de tentativas, e tela de revisão de respostas.
- Estende `Course` com `category`, `level` e `tags` (usados nos filtros do catálogo) e `coverImageUrl`; estende `Lesson` com `durationMinutes` (usado para exibir duração de aula/módulo/curso).
- Refaz a UI do protótipo com Tailwind + os primitivos shadcn já usados no projeto (em vez de estilos inline ad-hoc do Figma Make), tokens de marca (`#1A3A5C` navy, `#F0A500` gold) promovidos a variáveis de tema, e fontes (`Plus Jakarta Sans`, `JetBrains Mono`) carregadas via `next/font` em vez de `style={{ fontFamily }}` inline.
- Passe de compatibilidade mobile: touch targets, grids que colapsam para 1 coluna, tabelas/tabs roláveis, imagens responsivas via `next/image`, sem depender de hover-only para nenhuma ação.
- **BREAKING**: `/` deixa de ser a home autenticada genérica; passa a redirecionar para `/courses` (ou ser o próprio catálogo).

## Capabilities

### New Capabilities

- `course-learning-player`: UI de navegação e consumo do conteúdo — catálogo com busca/filtro, detalhe do curso com lista de módulos, lista de aulas de um módulo, e o player de conteúdo da aula (vídeo/texto), tudo mobile-first e roteável por URL.
- `lesson-progress-tracking`: conclusão de aula persistida por usuário, cálculo de progresso de módulo/curso, e regra de desbloqueio sequencial de módulos.
- `module-quiz`: banco de questões por módulo, submissão e correção do quiz, nota mínima de aprovação, histórico de tentativas e gate de progressão.

### Modified Capabilities

- `course-content-structure`: `Course` ganha `category`, `level` (enum) e `tags` (para os filtros do catálogo) e `coverImageUrl` (capa exibida no catálogo); `Lesson` ganha `durationMinutes` (exibido na UI e somado para duração de módulo/curso).

## Impact

- `prisma/schema.prisma`: campos novos em `Course` e `Lesson`; models novos `Quiz`, `QuizQuestion`, `QuizAttempt`, `LessonProgress`.
- `prisma/migrations/` e `prisma/seed.ts`: nova migration + seed estendido com conteúdo coerente (cursos, módulos, aulas com duração, quizzes) para as telas terem o que exibir.
- `src/app/`: nova árvore de rotas (`/courses`, `/courses/[courseId]`, `/courses/[courseId]/modules/[moduleId]`, `.../lessons/[lessonId]`, `.../quiz`); `/` passa a redirecionar; `src/view/home.tsx` e o placeholder atual são removidos.
- `src/modules/courses/` (novo): camada de acesso a dados (DAL) e Server Actions (`completeLesson`, `submitQuizAttempt`) para as novas capacidades.
- `src/components/ui/`: novos primitivos shadcn conforme necessário (badge, input, tabs, progress, etc.).
- `src/app/globals.css`: tokens de marca (navy/gold) adicionados ao tema; `layout.tsx` ganha as fontes `Plus Jakarta Sans` e `JetBrains Mono` via `next/font`.
- `next.config.ts`: `images.remotePatterns` para a fonte de capas de curso.
- `src/modules/auth/`: `Navbar` passa a usar o usuário real de `useAuth()` em vez do placeholder "João Silva" do protótipo.
