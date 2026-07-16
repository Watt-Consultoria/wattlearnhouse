## MODIFIED Requirements

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
