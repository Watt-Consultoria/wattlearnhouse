## Context

Hoje qualquer aluno autenticado acessa qualquer curso e seu conteúdo sem nenhum gate (`courses.service.ts#listCourses`/`getCourseDetail` não checam matrícula ou dono). `UserRole` tem só `student`/`teacher`, e autorização de autoria é feita ad hoc por ownership (`teacherId`) em `authoring-actions.ts`, sem um papel global. Progresso é todo derivado, não persistido como "conclusão de módulo" (`computeModulesProgress`/`computeCourseModuleProgress`), e respostas de quiz ficam num campo `Json` solto em `QuizAttempt.answers` (`[{questionId, selectedIndex}]`), sem tabela normalizada por questão.

Esta mudança introduz três capacidades interligadas: matrícula (que também vira o gate de acesso e o denominador das estatísticas), papel `admin`, e a página de estatísticas em si.

## Goals / Non-Goals

**Goals:**
- Matrícula como pré-requisito para consumir conteúdo de aula/quiz, com prévia de currículo (nomes de módulo + títulos de aula) visível antes de matricular.
- Papel `admin` com edição irrestrita e visão de estatísticas de qualquer curso, reaproveitando o padrão de guard já existente.
- Estatísticas de conclusão por módulo e de acerto/erro por questão de quiz, calculadas sob demanda.

**Non-Goals:**
- Cache ou pré-agregação de estatísticas (fica para uma iteração futura se a performance se mostrar um problema real).
- Desmatricular, pausar matrícula, ou qualquer ciclo de vida além de "matriculado desde X".
- Estatísticas por aluno individual (ex: "relatório do aluno Y") — o escopo é agregado por curso/módulo/questão.
- Nova biblioteca de gráficos — v1 usa barras simples (componente `Progress` do shadcn já instalado) e tabelas.

## Decisions

### 1. `Enrollment` como model dedicado, não um campo em `Course`/`User`
Tabela `enrollments` (`id`, `userId`, `courseId`, `enrolledAt`), `@@unique([userId, courseId])`, cascade delete a partir de `User`/`Course`. Alternativa considerada: reaproveitar `LessonProgress` (primeira linha implicaria matrícula) — rejeitada porque não cobre cursos sem nenhuma aula concluída ainda, e porque matrícula precisa existir *antes* de qualquer progresso (é o próprio gate de acesso).

### 2. Gate de acesso vive na camada de serviço, não só na página
`courses.service.ts` ganha uma checagem de matrícula centralizada (ex: `requireEnrollment(courseId, userId)`), usada tanto pelas páginas de módulo/aula quanto pelas Server Actions de progresso/quiz (`completeLesson`, `submitQuizAttempt`). Isso evita duplicar a checagem em cada rota e garante que não dá para completar aula/quiz via action direta sem estar matriculado, mesmo que a página não tenha sido renderizada.

### 3. `getCourseDetail` ganha modo de prévia
Em vez de dois métodos paralelos, `getCourseDetail` passa a sempre retornar a grade (módulos + títulos de aula + `hasQuiz`), e só inclui `content` de aula / permite navegação para dentro do módulo quando `Enrollment` existe para o `userId`. O retorno ganha um campo `isEnrolled: boolean` que a página usa para decidir entre mostrar "Matricular-se" ou os links de navegação.

### 4. Admin como bypass, não como um path de autorização paralelo
`requireCourseOwnership`/`requireModuleOwnership`/etc. em `authoring-actions.ts` passam a aceitar `role: admin` como condição alternativa ao match de `teacherId`, em vez de introduzir um fluxo de autorização totalmente separado para admin. Mesmo padrão se aplica ao acesso da página de estatísticas: `role === "admin" || course.teacherId === user.id`. Alternativa considerada: role-based middleware central (`proxy.ts`) — rejeitada por ora porque a checagem hoje é sempre por recurso (curso específico), não por rota genérica, e isso é consistente com o padrão já existente no projeto.

### 5. Estatísticas de questão calculadas em memória a partir do JSON, sem migrar `answers` para tabela normalizada
Para cada quiz, busca-se todas as `QuizAttempt` do curso (via `quizId`), agrupa por `userId`, pega a primeira tentativa (menor `createdAt`) de cada aluno, e itera o array `answers` comparando `selectedIndex` com `QuizQuestion.correctIndex`. Alternativa considerada: normalizar `answers` numa tabela `quiz_answer_responses` (uma linha por questão por tentativa) — traria agregação via `GROUP BY` no banco, mas exige migração de dado e mudança em `submitQuizAttempt`; adiada porque o volume esperado (attempts por curso) é pequeno o bastante para agregação em Node ser aceitável, e o requisito explícito é tempo real sem infra nova.

### 6. Conclusão de módulo reaproveita `computeModulesProgress`, só troca o denominador
A lógica de "módulo completo para um usuário" não muda (todas as lições + quiz aprovado). O que a página de estatísticas adiciona é: para cada módulo, contar quantos dos `userId`s matriculados no curso satisfazem essa condição, dividido pelo total de matriculados.

### 7. Sem lib de gráficos nova em v1
Módulo: barra de progresso com `<Progress>` (shadcn) + label "X/Y (Z%)". Questão de quiz: linha de tabela com percentual e, opcionalmente, uma barra inline com Tailwind (`div` com `width` dinâmica) — sem SVG/canvas. Decisão reavaliável se o pedido evoluir para série temporal ou comparação entre cursos.

## Risks / Trade-offs

- **[Risco] Cálculo em memória do JSON de respostas pode ficar lento se um curso tiver muitos milhares de tentativas.** → Mitigação: escopo já limita a "primeira tentativa por aluno", o que bound a quantidade de linhas processadas ao número de matriculados, não ao número de tentativas totais; revisitar com cache/agregação se a base crescer.
- **[Risco] Mudança de acesso é BREAKING para qualquer fluxo que hoje assume curso aberto (ex: link direto pra uma aula compartilhado antes da mudança).** → Mitigação: não há dados de produção em `LessonProgress`/`QuizAttempt` hoje, então o impacto é só de comportamento a partir do deploy, não de dado órfão; comunicar a mudança de fluxo (matrícula obrigatória) como parte do release.
- **[Trade-off] Admin bypassa ownership em todo guard existente, ampliando a superfície de quem pode editar qualquer curso.** → Aceito conforme pedido explícito do usuário; não há attempt de granularidade extra (ex: admin só-leitura vs admin-editor) neste escopo.

## Migration Plan

1. Migration Prisma: adicionar `admin` ao enum `UserRole`, criar tabela `enrollments`.
2. Deploy do backend com o gate de matrícula habilitado — a partir daqui, aluno sem `Enrollment` perde acesso a conteúdo/quiz que antes via livremente (esperado, ver Riscos).
3. Promover manualmente o(s) primeiro(s) usuário(s) admin via update direto no banco (não há UI de "promover a admin" neste escopo).
4. Sem passo de rollback de dado: a migration é aditiva (novo enum value, nova tabela) e pode ser revertida sem perda caso o gate precise ser desligado temporariamente (feature-flag não está no escopo, mas o gate pode ser comentado/revertido via novo deploy).

## Open Questions

- Quem faz a primeira promoção de um usuário a `admin`? Fica como update manual no banco por ora — vale decidir se precisa de uma UI/seed antes de ir para produção.
- A listagem de "todos os cursos" para admin reaproveita a página `teacher/courses` (com um branch condicional por role) ou ganha uma rota própria (`/admin/courses`)? Proposta neste design: reaproveitar `teacher/courses`, listando todos os cursos quando `role === admin` em vez de só os do usuário — mas fica aberto para tasks.md decidir o formato exato.
