## 1. Schema

- [x] 1.1 Adicionar `admin` ao enum `UserRole` em `prisma/schema.prisma`
- [x] 1.2 Adicionar model `Enrollment` (`id`, `userId`, `courseId`, `enrolledAt`), `@@unique([userId, courseId])`, relations com `onDelete: Cascade` a partir de `User` e `Course`
- [x] 1.3 Gerar e rodar a migration (`prisma migrate dev`)

## 2. Matrícula (course-enrollment)

- [x] 2.1 Criar `enrollInCourse(courseId, userId)` (Server Action) — idempotente, cria `Enrollment` se não existir
- [x] 2.2 Criar helper `isEnrolled(courseId, userId)` / `requireEnrollment(courseId, userId)` em `src/modules/courses/courses.service.ts`
- [x] 2.3 Atualizar `getCourseDetail` para sempre retornar a grade (módulos, títulos de aula, `hasQuiz`) e incluir `isEnrolled: boolean`, sem expor `content` de aula fora do fluxo já existente de módulo/aula
- [x] 2.4 Bloquear acesso às páginas de módulo/aula (`src/app/courses/[courseId]/modules/**`) para usuário sem `Enrollment`, redirecionando para o detalhe do curso — resolvido centralizando a checagem em `computeCourseModuleProgress` (o `unlocked` retornado por `getModuleDetail`/`getLessonDetail` já exige matrícula, e as páginas já redirecionavam em `!unlocked`)
- [x] 2.5 Adicionar checagem de matrícula em `completeLesson` e `submitQuizAttempt` (`src/modules/courses/actions.ts`) — herdada automaticamente via `isModuleUnlockedForUser`, que agora exige matrícula
- [x] 2.6 Adicionar botão "Matricular-se" na tela de detalhe do curso, condicionado a `isEnrolled === false`

## 3. Papel admin (platform-admin)

- [x] 3.1 Criar guard `requireAdmin()` / helper `isAdminOrOwner(course, user)` reaproveitável — resolvido inline nos guards de ownership (`requireCourseOwnership` etc. em `authoring-actions.ts` já recebem o `user` completo e checam `role === "admin"`); ver 4.1 para o guard equivalente usado pela página de estatísticas
- [x] 3.2 Atualizar `requireTeacher()` (ou equivalente) para aceitar `role: admin` no acesso a `/teacher/**`
- [x] 3.3 Atualizar `requireCourseOwnership`/`requireModuleOwnership`/`requireLessonOwnership`/`requireQuizOwnership` em `authoring-actions.ts` para bypassar a checagem quando `role === admin`
- [x] 3.4 Atualizar `listCoursesByTeacher` (ou o método usado por `teacher/courses/page.tsx`) para retornar todos os `Course` quando o usuário é `admin`, mantendo o escopo por dono para `teacher`

## 4. Estatísticas (course-statistics)

- [x] 4.1 Criar `src/modules/courses/stats.service.ts` com guard de acesso (dono ou admin) reaproveitando os helpers da seção 3
- [x] 4.2 Implementar cálculo de conclusão por módulo: contar `Enrollment` do curso vs. quantos desses `userId` satisfazem conclusão completa (todas as aulas + quiz aprovado) para cada módulo
- [x] 4.3 Implementar cálculo de acerto/erro por questão: para cada `Quiz` do curso, buscar `QuizAttempt` por `quizId`, agrupar por `userId`, selecionar a tentativa de menor `createdAt` por aluno, e comparar `answers[].selectedIndex` com `QuizQuestion.correctIndex`
- [x] 4.4 Tratar casos de zero matriculados / zero tentativas sem divisão por zero (retornar 0/0 explícito)
- [x] 4.5 Criar página `src/app/teacher/courses/[courseId]/stats/page.tsx` consumindo o serviço acima
- [x] 4.6 UI: card de resumo do curso (total matriculados, % conclusão geral), lista de módulos com `ProgressBar` + contagem, e lista por quiz com percentual de acerto por questão (sem lib de gráficos nova, ver design.md)
- [x] 4.7 Adicionar link/botão para a página de estatísticas a partir de `teacher/courses/[courseId]/page.tsx`

## 5. Verificação manual

- [x] 5.1 Fluxo aluno: ver grade sem matrícula → matricular-se → acessar aula/quiz → concluir módulo — verificado via Playwright contra `npm run dev` + `prisma db seed` (seed ampliado com professor2/admin/aluno2 para estes testes): aluno sem matrícula viu todos os módulos bloqueados com títulos de aula visíveis e botão "Matricular-se"; após clicar, módulo 1 desbloqueou e módulos seguintes continuaram bloqueados pela regra sequencial; acesso direto por URL a um módulo ainda bloqueado (por sequência ou por falta de matrícula) redirecionou para o detalhe do curso
- [x] 5.2 Fluxo professor: acessar estatísticas do próprio curso; tentar acessar estatísticas de curso alheio (deve ser negado) — verificado: dono acessa normalmente, segundo professor sem posse é redirecionado para `/teacher/courses`
- [x] 5.3 Fluxo admin: editar curso de outro professor; ver listagem de todos os cursos; ver estatísticas de curso alheio — verificado: listagem mostra os 4 cursos (de outro professor), edição de descrição do curso alheio persistiu no banco (checado via query direta) e foi revertida, estatísticas de curso alheio acessíveis
- [x] 5.4 Conferir números da página de estatísticas contra dados de teste conhecidos — verificado no curso "Automação Industrial com CLP": módulo 1 (aulas completas + quiz aprovado na 2ª tentativa) 1/1 = 100%, módulo 2 (1 de 3 aulas) 0/1 = 0%, conclusão geral do curso 0%; questões do quiz refletiram exclusivamente a 1ª tentativa (reprovada) do aluno — 2 questões 0% de acerto e 1 questão 100%, batendo com o gabarito do seed
