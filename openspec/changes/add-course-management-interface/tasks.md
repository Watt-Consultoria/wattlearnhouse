## 1. Dependências e renderização de equações

- [x] 1.1 Adicionar `remark-math`, `rehype-katex` e `katex` ao `package.json`
- [x] 1.2 Importar o CSS do KaTeX globalmente (`globals.css` ou `layout.tsx`)
- [x] 1.3 Estender `LessonContent` (`src/modules/courses/components/lesson-content.tsx`) com `remarkMath`/`rehypeKatex` nos plugins existentes, garantindo que a notação `[youtube_video](<url>)` continua funcionando junto com equações no mesmo documento
- [x] 1.4 Validar manualmente: uma `Lesson` de teste com `$...$`, `$$...$$` e `[youtube_video](<url>)` no mesmo `content` renderiza tudo corretamente na tela de aula do aluno

## 2. Camada de dados e autorização de autoria

- [x] 2.1 Criar `src/modules/courses/authoring.service.ts` com funções de leitura para o professor: listar cursos próprios (`listCoursesByTeacher`), detalhe de curso próprio com módulos, detalhe de módulo próprio com aulas, detalhe de aula própria
- [x] 2.2 Implementar helper de checagem de posse (resolve `Module`/`Lesson` até `Course.teacherId` e compara com o usuário atual) reutilizável pelas Server Actions
- [x] 2.3 Criar `src/modules/courses/authoring-actions.ts` com Server Actions: `createCourse`, `updateCourse`, `deleteCourse`
- [x] 2.4 Adicionar a `authoring-actions.ts`: `createModule`, `updateModule`, `deleteModule`, `reorderModule` (swap de `order` via `prisma.$transaction`)
- [x] 2.5 Adicionar a `authoring-actions.ts`: `createLesson`, `updateLesson`, `deleteLesson`, `reorderLesson` (mesmo padrão de swap)
- [x] 2.6 Cada Server Action verifica `role === "teacher"` e a posse via o helper de 2.2 antes de qualquer escrita, retornando um resultado de erro tipado (mesmo padrão de `CompleteLessonResult` em `actions.ts`) em vez de lançar exceção

## 3. Trocar CourseCover para aceitar URLs arbitrárias

- [x] 3.1 Substituir `next/image` por `<img>` em `src/modules/courses/components/course-cover.tsx`, mantendo o `onError` → fallback visual existente
- [x] 3.2 Confirmar visualmente que o catálogo do aluno (`/courses`) continua exibindo as capas do seed sem regressão

## 4. Editor de aula (Markdown + preview ao vivo)

- [x] 4.1 Criar `src/modules/courses/components/lesson-editor.tsx`: textarea controlado + painel de preview usando `LessonContent`, layout split-pane em telas largas
- [x] 4.2 Implementar alternador "Editar"/"Visualizar" para viewports estreitas (abaixo do breakpoint de split-pane)
- [x] 4.3 Implementar barra de ferramentas com manipulação de seleção do textarea: negrito, itálico, código inline
- [x] 4.4 Estender a barra de ferramentas: inserir bloco de código, inserir tabela, inserir embed do YouTube (`[youtube_video](<url>)`), inserir bloco de equação (`$$...$$`)
- [x] 4.5 Validar em viewport mobile (375px) que a barra de ferramentas e o alternador editar/visualizar são utilizáveis por toque

## 5. Rotas de autoria (`/teacher/**`)

- [x] 5.1 `src/app/teacher/courses/page.tsx`: lista dos cursos do professor autenticado + formulário inline de criação de curso; redireciona para `/login` (sem sessão) ou `/courses` (`role !== "teacher"`)
- [x] 5.2 `src/app/teacher/courses/[courseId]/page.tsx`: edição de metadados do curso + lista de módulos com criação inline, reordenação (subir/descer) e exclusão com confirmação; checa posse e redireciona para `/teacher/courses` se o curso não pertencer ao usuário
- [x] 5.3 `src/app/teacher/courses/[courseId]/modules/[moduleId]/page.tsx`: edição do título do módulo + lista de aulas com reordenação, exclusão com confirmação e link para o editor de cada aula
- [x] 5.4 `src/app/teacher/courses/[courseId]/modules/[moduleId]/lessons/new/page.tsx`: editor de aula em modo criação
- [x] 5.5 `src/app/teacher/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]/page.tsx`: editor de aula em modo edição, pré-carregado com `title`/`content` existentes

## 6. Navegação

- [x] 6.1 Adicionar link "Meus Cursos" em `src/modules/courses/components/navbar.tsx`, visível apenas quando `user.role === "teacher"`, apontando para `/teacher/courses`

## 7. Validação manual end-to-end

- [x] 7.1 Como usuário `teacher` (seed `TEACHER_GOOGLE_ID`): criar um curso, um módulo e uma aula do zero usando só a UI, incluindo negrito, tabela, bloco de código, vídeo do YouTube e uma equação no conteúdo
- [x] 7.2 Confirmar que a aula criada aparece corretamente na tela de aula do aluno (`/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]`)
- [x] 7.3 Como usuário `student` (seed `STUDENT_GOOGLE_ID`): confirmar que qualquer rota sob `/teacher` redireciona para `/courses`
- [x] 7.4 Confirmar que reordenar módulos/aulas persiste corretamente após reload da página
- [x] 7.5 Confirmar que excluir um módulo com aulas remove as aulas em cascata e some da UI do aluno
