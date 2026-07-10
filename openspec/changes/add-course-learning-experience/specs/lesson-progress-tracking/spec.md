## ADDED Requirements

### Requirement: Conclusão de aula é persistida por usuário
O sistema SHALL persistir a conclusão de uma `Lesson` por usuário através de um registro `LessonProgress` vinculando `userId` e `lessonId`. Marcar uma aula como concluída SHALL ser uma operação idempotente: repetir a ação para a mesma aula e usuário não SHALL criar múltiplos registros nem falhar.

#### Scenario: Concluir uma aula pela primeira vez
- **WHEN** um usuário autenticado marca uma `Lesson` como concluída
- **THEN** um registro `LessonProgress` é criado vinculando esse usuário e essa aula

#### Scenario: Concluir uma aula já concluída
- **WHEN** um usuário marca como concluída uma `Lesson` que já possui `LessonProgress` para ele
- **THEN** a operação é bem-sucedida e nenhum registro duplicado é criado

#### Scenario: Concluir aula fora de sessão válida é rejeitado
- **WHEN** uma requisição para concluir uma aula chega sem uma sessão de usuário válida
- **THEN** a operação é rejeitada e nenhum `LessonProgress` é criado

### Requirement: Progresso de módulo e curso é calculado a partir de dado real
O progresso de um módulo para um usuário SHALL ser a proporção de `Lesson` desse módulo com `LessonProgress` registrado para ele. O progresso de um curso SHALL ser a proporção agregada de todas as `Lesson` de todos os módulos do curso.

#### Scenario: Progresso de módulo parcialmente concluído
- **WHEN** um usuário concluiu 3 de 4 aulas de um módulo
- **THEN** o progresso exibido para esse módulo e usuário é 75%

#### Scenario: Progresso de curso agrega todos os módulos
- **WHEN** um usuário concluiu aulas em múltiplos módulos de um curso
- **THEN** o progresso do curso exibido reflete o total de aulas concluídas sobre o total de aulas do curso, não apenas de um módulo

### Requirement: Módulos são desbloqueados sequencialmente
O primeiro módulo de um curso SHALL estar sempre acessível. Um módulo subsequente SHALL só ser acessível para um usuário quando o módulo anterior estiver 100% concluído para esse usuário — ou seja, todas as suas `Lesson` com `LessonProgress`, e, se o módulo anterior tiver um `Quiz`, ao menos uma `QuizAttempt` aprovada (`passed = true`) para esse `Quiz`. Essa regra SHALL ser verificada tanto na exibição (para indicar o cadeado) quanto no servidor, ao processar a conclusão de uma aula ou submissão de quiz de um módulo — a ação SHALL ser rejeitada se o módulo correspondente ainda estiver bloqueado para o usuário.

#### Scenario: Primeiro módulo sempre acessível
- **WHEN** um usuário acessa o primeiro módulo de um curso, mesmo sem nenhum progresso anterior
- **THEN** o módulo é acessível normalmente

#### Scenario: Módulo seguinte bloqueado
- **WHEN** um usuário não concluiu todas as aulas (e, se houver, não passou no quiz) do módulo anterior
- **THEN** o módulo seguinte é exibido como bloqueado e não é possível acessar seu conteúdo

#### Scenario: Módulo seguinte desbloqueado após conclusão total
- **WHEN** um usuário conclui todas as aulas do módulo anterior e, se houver `Quiz` nesse módulo, é aprovado nele
- **THEN** o módulo seguinte passa a ser acessível para esse usuário

#### Scenario: Tentativa de concluir aula de módulo bloqueado é rejeitada no servidor
- **WHEN** uma requisição tenta marcar como concluída uma `Lesson` de um módulo que ainda está bloqueado para o usuário
- **THEN** a operação é rejeitada no servidor, independentemente do que a UI do cliente permitia
