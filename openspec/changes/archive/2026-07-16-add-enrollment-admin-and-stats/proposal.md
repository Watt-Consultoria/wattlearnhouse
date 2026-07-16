## Why

Professores não têm como saber se seus cursos estão funcionando: quantos alunos avançam, onde travam, quais questões de quiz confundem a turma. Hoje também não existe um papel de administração da plataforma (só `student`/`teacher` com acesso restrito ao que cada professor possui), e o acesso ao conteúdo de um curso é totalmente aberto a qualquer aluno logado, sem um conceito de matrícula — o que torna impossível calcular uma taxa de conclusão significativa ("concluído em relação a quê?").

## What Changes

- Adiciona o model `Enrollment` (aluno ⇄ curso) e uma ação para o aluno se matricular.
- **BREAKING**: acesso ao conteúdo de aula e ao quiz de um módulo passa a exigir matrícula ativa no curso. Antes de matricular, o aluno continua podendo ver a grade do curso (nomes dos módulos e títulos das aulas, e se um módulo tem quiz), mas não o conteúdo em si.
- Adiciona `admin` ao enum `UserRole`.
- Admin passa a poder editar qualquer curso (bypassa a checagem de dono usada hoje em `authoring-actions.ts`) e navegar por uma listagem de todos os cursos da plataforma (hoje só existe listagem escopada ao professor dono).
- Adiciona uma página de estatísticas por curso (`/teacher/courses/[courseId]/stats`), acessível pelo professor dono ou por qualquer admin, mostrando:
  - Percentual/contagem de alunos matriculados que concluíram cada módulo (todas as aulas + quiz aprovado, quando houver).
  - Por questão de quiz, percentual de acerto considerando a primeira tentativa de cada aluno naquele quiz.
- Cálculo das estatísticas é feito sob demanda (sem tabela de agregação nem cache).

## Capabilities

### New Capabilities
- `course-enrollment`: matrícula do aluno no curso, prévia de currículo pré-matrícula, e trava de acesso a conteúdo/quiz para não matriculados.
- `platform-admin`: papel `admin`, acesso irrestrito de edição a qualquer curso, e listagem de todos os cursos da plataforma.
- `course-statistics`: página de estatísticas por curso — conclusão por módulo e acerto/erro por questão de quiz.

### Modified Capabilities
- `course-authoring`: a restrição de acesso por dono (`teacherId`) passa a ter uma exceção — usuários com `role: admin` podem editar qualquer curso, módulo, aula e quiz, não apenas os próprios.
- `course-learning-player`: o acesso às telas de módulo e aula deixa de depender apenas de sessão autenticada — passa a exigir matrícula (`Enrollment`) no curso. A tela de detalhe do curso passa a exibir a grade (módulos e títulos de aula) mesmo sem matrícula, com um convite para se matricular.

## Impact

- **Schema** (`prisma/schema.prisma`): novo model `Enrollment`; `UserRole` ganha `admin`; nova migration.
- **Auth/autorização**: `src/modules/courses/authoring-actions.ts` (guards de ownership ganham bypass de admin), novo guard `requireAdmin`/checagem de matrícula em `src/modules/courses/courses.service.ts` e nas páginas sob `src/app/courses/[courseId]/**`.
- **Rotas novas**: matrícula (Server Action), listagem de todos os cursos para admin, `teacher/courses/[courseId]/stats/page.tsx`.
- **Serviços**: novo serviço/queries de estatísticas (agregação de `LessonProgress`, `QuizAttempt.answers` JSON e `Enrollment`).
- **Frontend**: componentes novos para a página de estatísticas (sem lib de gráficos hoje — decisão de UI em `design.md`).
- Sem dados de produção existentes em `LessonProgress`/`QuizAttempt` — nenhuma migração retroativa de matrícula é necessária.
