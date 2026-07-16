## Purpose

Controle de acesso e regras de autoria para a área de professor, garantindo que apenas usuários com `role: teacher` possam acessar rotas de autoria e que cada professor só possa criar, editar, reordenar e excluir os `Course`, `Module` e `Lesson` dos quais é o dono (`teacherId`).

## Requirements

### Requirement: Acesso restrito a usuários com role teacher
O sistema SHALL restringir todas as rotas e Server Actions de autoria (`/teacher/**` e mutações de `Course`/`Module`/`Lesson`) a usuários autenticados cujo `role` seja `teacher` ou `admin`. Um usuário sem sessão SHALL ser redirecionado para `/login`; um usuário autenticado com `role: student` SHALL ser redirecionado para `/courses`.

#### Scenario: Usuário não autenticado acessa área de autoria
- **WHEN** um visitante sem sessão válida acessa qualquer rota sob `/teacher`
- **THEN** é redirecionado para `/login`

#### Scenario: Aluno tenta acessar área de autoria
- **WHEN** um usuário autenticado com `role: student` acessa qualquer rota sob `/teacher`
- **THEN** é redirecionado para `/courses`

#### Scenario: Professor acessa a própria área de autoria
- **WHEN** um usuário autenticado com `role: teacher` acessa `/teacher/courses`
- **THEN** a página é exibida normalmente

#### Scenario: Admin acessa a área de autoria
- **WHEN** um usuário autenticado com `role: admin` acessa qualquer rota sob `/teacher`
- **THEN** a página é exibida normalmente, sem restrição de posse de curso

### Requirement: Professor só edita cursos dos quais é o teacherId
O sistema SHALL permitir que um `Course` seja criado, editado ou excluído pelo usuário cujo `id` seja igual ao `teacherId` do curso, ou por qualquer usuário com `role: admin`. Toda Server Action de mutação sobre `Course`, `Module` ou `Lesson` SHALL verificar essa posse (ou o papel `admin`) resolvendo a cadeia até o `Course` antes de gravar, independentemente do que a UI já esconde.

#### Scenario: Professor edita curso próprio
- **WHEN** um usuário `teacher` chama a mutação de edição de um `Course` onde `teacherId` é o próprio `id`
- **THEN** a alteração é persistida com sucesso

#### Scenario: Professor tenta editar curso de outro professor
- **WHEN** um usuário `teacher` chama a mutação de edição de um `Course` cujo `teacherId` pertence a outro usuário
- **THEN** a operação é rejeitada e nenhuma alteração é persistida

#### Scenario: Professor tenta editar módulo de curso de outro professor
- **WHEN** um usuário `teacher` chama a mutação de edição/exclusão de um `Module` cujo `Course.teacherId` pertence a outro usuário
- **THEN** a operação é rejeitada e nenhuma alteração é persistida

#### Scenario: Professor tenta editar aula de módulo de outro professor
- **WHEN** um usuário `teacher` chama a mutação de edição/exclusão de uma `Lesson` cujo `Module.Course.teacherId` pertence a outro usuário
- **THEN** a operação é rejeitada e nenhuma alteração é persistida

#### Scenario: Admin edita curso de qualquer professor
- **WHEN** um usuário `admin` chama a mutação de edição/exclusão de um `Course`, `Module` ou `Lesson` cujo `teacherId` (resolvido até o `Course`) pertence a outro usuário
- **THEN** a alteração é persistida com sucesso, sem checagem de posse

### Requirement: CRUD de Course pelo professor autor
O sistema SHALL permitir que um professor crie um novo `Course` (com `title`, `description` opcional, `category` e `coverImageUrl` opcional, `teacherId` fixado automaticamente para o usuário atual), edite esses campos, e exclua o curso (removendo em cascata seus `Module` e `Lesson`, conforme já definido em `course-content-structure`).

#### Scenario: Criar curso preenche teacherId automaticamente
- **WHEN** um usuário `teacher` submete o formulário de novo curso com `title` e `category` preenchidos
- **THEN** um `Course` é criado com `teacherId` igual ao `id` do usuário atual, sem que o formulário exponha esse campo

#### Scenario: Excluir curso remove módulos e aulas em cascata
- **WHEN** um professor confirma a exclusão de um `Course` que possui `Module` e `Lesson`
- **THEN** o `Course` e todos os `Module`/`Lesson` vinculados deixam de existir

### Requirement: CRUD e reordenação de Module dentro do Course
O sistema SHALL permitir que o professor autor de um `Course` crie, renomeie, exclua e reordene os `Module` desse curso. Um novo `Module` SHALL receber `order` igual ao maior `order` existente no curso mais um. Reordenar SHALL trocar o `order` do módulo selecionado com o do módulo adjacente (anterior ou seguinte).

#### Scenario: Novo módulo entra no fim da lista
- **WHEN** um professor cria um novo `Module` em um curso que já tem módulos com `order` 1 e 2
- **THEN** o novo módulo é criado com `order` 3

#### Scenario: Mover módulo para cima troca posição com o anterior
- **WHEN** um professor aciona "mover para cima" no módulo de `order` 2
- **THEN** o módulo que tinha `order` 2 passa a ter `order` 1, e o que tinha `order` 1 passa a ter `order` 2

### Requirement: CRUD e reordenação de Lesson dentro do Module
O sistema SHALL permitir que o professor autor do `Course` ao qual um `Module` pertence crie, edite (`title` e `content`), exclua e reordene as `Lesson` desse módulo, com a mesma regra de `order` (nova aula no fim; reordenar troca `order` com o vizinho adjacente) usada para `Module`.

#### Scenario: Nova aula entra no fim da lista do módulo
- **WHEN** um professor cria uma nova `Lesson` em um módulo que já tem aulas com `order` 1 e 2
- **THEN** a nova aula é criada com `order` 3

#### Scenario: Editar título e conteúdo de uma aula existente
- **WHEN** um professor salva alterações de `title` e `content` de uma `Lesson` existente
- **THEN** os novos valores são persistidos e refletidos na tela de aula do aluno na próxima visita
