## ADDED Requirements

### Requirement: Acesso à página de estatísticas restrito a dono ou admin
O sistema SHALL exibir a página de estatísticas de um `Course` (`/teacher/courses/[courseId]/stats`) apenas a usuários com `role: admin`, ou a usuários com `role: teacher` cujo `id` seja igual ao `teacherId` do curso. Qualquer outro usuário SHALL ser rejeitado, sem revelar dados do curso.

#### Scenario: Dono do curso acessa as estatísticas
- **WHEN** um usuário `teacher` cujo `id` é o `teacherId` do curso acessa a página de estatísticas desse curso
- **THEN** a página é exibida normalmente

#### Scenario: Admin acessa estatísticas de qualquer curso
- **WHEN** um usuário `admin` acessa a página de estatísticas de um curso cujo `teacherId` pertence a outro usuário
- **THEN** a página é exibida normalmente

#### Scenario: Professor tenta ver estatísticas de curso alheio
- **WHEN** um usuário `teacher` cujo `id` não é o `teacherId` do curso tenta acessar a página de estatísticas desse curso
- **THEN** o acesso é negado e nenhum dado do curso é retornado

### Requirement: Conclusão por módulo calculada sobre alunos matriculados
Para cada `Module` do curso, o sistema SHALL exibir a quantidade e o percentual de alunos matriculados (`Enrollment` no `Course`) que concluíram esse módulo, onde "concluído" segue a mesma definição usada em `lesson-progress-tracking` (todas as `Lesson` do módulo com `LessonProgress`, e `Quiz` aprovado quando o módulo possuir um). O denominador SHALL ser o total de `Enrollment` do curso; alunos não matriculados SHALL NOT ser contados, mesmo que possuam `LessonProgress`/`QuizAttempt` remanescentes.

#### Scenario: Módulo com parte dos matriculados concluindo
- **WHEN** um curso tem 10 `Enrollment` e 4 desses alunos satisfazem a condição de conclusão de um `Module`
- **THEN** a página exibe 4 de 10 (40%) para esse módulo

#### Scenario: Curso sem nenhum matriculado
- **WHEN** um curso não possui nenhum `Enrollment`
- **THEN** cada módulo exibe 0 de 0, sem erro nem divisão indefinida

### Requirement: Acerto e erro por questão de quiz considerando a primeira tentativa
Para cada `QuizQuestion` de um `Quiz` do curso, o sistema SHALL exibir a quantidade e o percentual de alunos que acertaram e que erraram essa questão, considerando exclusivamente a primeira `QuizAttempt` (menor `createdAt`) de cada aluno para aquele `Quiz`. Tentativas subsequentes do mesmo aluno para o mesmo quiz SHALL NOT influenciar esse cálculo. O acerto/erro de cada questão SHALL ser derivado comparando o `selectedIndex` correspondente em `QuizAttempt.answers` com o `correctIndex` da `QuizQuestion`.

#### Scenario: Aluno com múltiplas tentativas conta uma vez por questão
- **WHEN** um aluno responde um `Quiz` duas vezes, errando a questão 1 na primeira tentativa e acertando na segunda
- **THEN** a estatística da questão 1 conta esse aluno como erro, refletindo apenas a primeira tentativa

#### Scenario: Questão com alto índice de erro
- **WHEN** 7 dos 10 alunos que fizeram um `Quiz` pela primeira vez erraram a questão 2
- **THEN** a página exibe 70% de erro (7 de 10) para a questão 2

#### Scenario: Quiz sem nenhuma tentativa
- **WHEN** um `Quiz` do curso ainda não recebeu nenhuma `QuizAttempt`
- **THEN** suas questões exibem 0 de 0 tentativas, sem erro nem divisão indefinida
