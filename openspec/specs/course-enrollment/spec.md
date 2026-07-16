## Purpose

Matrícula do aluno no curso, prévia de currículo pré-matrícula, e trava de acesso a conteúdo/quiz para não matriculados.

## Requirements

### Requirement: Aluno se matricula em um curso
O sistema SHALL permitir que um usuário autenticado se matricule em um `Course` através de uma ação explícita ("Matricular-se"), criando um registro `Enrollment` vinculando `userId` e `courseId`. A matrícula SHALL ser idempotente: repetir a ação para o mesmo usuário e curso não SHALL criar múltiplos registros nem falhar.

#### Scenario: Matricular-se em um curso pela primeira vez
- **WHEN** um usuário autenticado sem `Enrollment` prévio aciona "Matricular-se" em um `Course`
- **THEN** um registro `Enrollment` é criado vinculando esse usuário e esse curso, e o usuário passa a ter acesso ao conteúdo do curso

#### Scenario: Matricular-se em um curso já matriculado
- **WHEN** um usuário aciona "Matricular-se" em um `Course` no qual já possui `Enrollment`
- **THEN** a operação é bem-sucedida e nenhum registro duplicado é criado

### Requirement: Grade do curso é visível antes da matrícula
O sistema SHALL exibir, para qualquer usuário autenticado não matriculado, a grade do curso: nomes dos `Module` em ordem, títulos das `Lesson` de cada módulo, e se o módulo possui `Quiz` (apenas a existência, não as questões). O conteúdo (`Lesson.content`) e as questões do `Quiz` SHALL NOT ser expostos antes da matrícula.

#### Scenario: Currículo visível sem matrícula
- **WHEN** um usuário autenticado sem `Enrollment` acessa o detalhe de um `Course`
- **THEN** vê os nomes de todos os `Module` em ordem e os títulos de todas as `Lesson` de cada módulo, sem acessar o conteúdo de nenhuma aula

#### Scenario: Conteúdo de aula oculto sem matrícula
- **WHEN** um usuário autenticado sem `Enrollment` tenta visualizar o conteúdo de uma `Lesson` específica
- **THEN** o conteúdo não é retornado nem renderizado

### Requirement: Conteúdo de aula e quiz exigem matrícula ativa
O sistema SHALL bloquear o acesso ao conteúdo de uma `Lesson` e à submissão/visualização de um `Quiz` para usuários sem `Enrollment` no `Course` correspondente, tanto nas telas quanto nas Server Actions (`completeLesson`, `submitQuizAttempt`), independentemente do que a UI já esconde.

#### Scenario: Concluir aula sem matrícula é rejeitado
- **WHEN** um usuário sem `Enrollment` no curso chama a Server Action de concluir uma `Lesson` desse curso
- **THEN** a operação é rejeitada e nenhum `LessonProgress` é criado

#### Scenario: Submeter quiz sem matrícula é rejeitado
- **WHEN** um usuário sem `Enrollment` no curso chama a Server Action de submissão de um `Quiz` desse curso
- **THEN** a operação é rejeitada e nenhuma `QuizAttempt` é criada

#### Scenario: Aluno matriculado acessa normalmente
- **WHEN** um usuário com `Enrollment` no curso acessa uma `Lesson` ou submete um `Quiz` desse curso
- **THEN** a operação prossegue normalmente, sem nenhuma restrição adicional além das já existentes (ex: desbloqueio sequencial de módulo)
