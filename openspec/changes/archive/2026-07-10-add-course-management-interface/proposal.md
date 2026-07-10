## Why

Hoje `Course`, `Module` e `Lesson` só podem ser populados via `prisma/seed.ts` — não existe nenhuma UI de autoria. A experiência de aprendizado (catálogo, módulos, aulas, quiz) já está implementada e consome esses dados reais, mas o único jeito de colocar conteúdo novo no ar é editando o script de seed e rodando `prisma db seed` manualmente, o que não escala para professores reais (`role: teacher`) criarem e mantiverem seus próprios cursos. Este change fecha esse gap: uma interface de autoria para professores, com um editor de aula interativo (Markdown com preview ao vivo, no estilo Obsidian) em vez de forçar o professor a escrever `Lesson.content` cru sem ver o resultado.

## What Changes

- Nova área `/teacher/**`, acessível apenas a usuários com `role: teacher`, para criar e editar os próprios cursos, módulos e aulas (CRUD completo, sem afetar cursos de outros professores).
- Página de curso do professor: editar metadados (`title`, `description`, `category`, `coverImageUrl`) e gerenciar a lista de módulos (criar, renomear, reordenar com botões subir/descer, excluir com confirmação).
- Página de módulo do professor: gerenciar a lista de aulas do módulo (criar, reordenar, excluir) e link para o editor de cada aula.
- Editor de aula (`Lesson.content`) como split-pane: textarea de Markdown à esquerda, preview renderizado ao vivo à direita (mesmo pipeline de renderização já usado na tela de aula do aluno), com toggle editar/visualizar em mobile.
- Barra de ferramentas no editor para inserir: **negrito**, _itálico_, `código inline`, bloco de código, tabela, e embed de vídeo do YouTube na notação já suportada `[youtube_video](<url>)`.
- Suporte a equações matemáticas (LaTeX via KaTeX, notação `$...$` inline e `$$...$$` em bloco) no Markdown de `Lesson.content` — hoje não renderizado em lugar nenhum do app.
- Checagem de posse: um professor só edita/exclui cursos onde `Course.teacherId` é o próprio usuário; tentativa de acessar curso de outro professor redireciona para a lista própria.
- **BREAKING**: nenhuma — área nova, não altera rotas ou comportamento existente do aluno.

## Capabilities

### New Capabilities

- `course-authoring`: CRUD de `Course`/`Module`/`Lesson` restrito a `role: teacher` e ao próprio professor dono do curso — criação, edição, reordenação e exclusão.
- `lesson-content-editor`: experiência de edição de `Lesson.content` em Markdown com preview ao vivo, barra de ferramentas de formatação e inserção de embeds/tabelas/blocos de código/equações.

### Modified Capabilities

- `course-content-structure`: o Markdown de `Lesson.content` passa a suportar equações matemáticas (`$...$` / `$$...$$`) renderizadas via KaTeX, além do texto, tabelas, blocos de código e embed de vídeo já suportados.

## Impact

- `prisma/schema.prisma`: nenhuma mudança de schema — `Course`, `Module`, `Lesson` já têm todos os campos necessários.
- `src/app/teacher/**` (novo): rotas `/teacher/courses`, `/teacher/courses/[courseId]`, `/teacher/courses/[courseId]/modules/[moduleId]`, `.../lessons/new`, `.../lessons/[lessonId]`.
- `src/modules/courses/authoring.service.ts` e `src/modules/courses/authoring-actions.ts` (novos): camada de acesso a dados e Server Actions para as mutações de autoria, com checagem de `role` e posse (`teacherId`) em cada uma.
- `src/modules/courses/components/`: novo editor de Markdown (`lesson-editor.tsx`) e componentes de gerenciamento de curso/módulo/aula; `lesson-content.tsx` ganha plugins de equação (`remark-math`/`rehype-katex`) reaproveitados tanto na tela do aluno quanto no preview do editor.
- `src/modules/courses/components/course-cover.tsx`: troca de `next/image` para `<img>` simples, já que capas agora vêm de URLs arbitrárias digitadas pelo professor (não mais restritas às poucas origens em `next.config.ts`).
- `src/modules/courses/components/navbar.tsx`: link "Meus Cursos" exibido apenas quando `user.role === "teacher"`.
- `package.json`: novas dependências `remark-math`, `rehype-katex`, `katex`.
