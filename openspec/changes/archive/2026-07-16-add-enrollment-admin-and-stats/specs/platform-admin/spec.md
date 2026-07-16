## ADDED Requirements

### Requirement: Papel admin existe no sistema
O `UserRole` SHALL incluir o valor `admin`, além de `student` e `teacher`. Não há autopromoção: a atribuição do papel `admin` a um usuário é feita fora do produto (ex: alteração direta no banco), sem fluxo de UI nesta capacidade.

#### Scenario: Usuário com role admin autentica normalmente
- **WHEN** um usuário cujo `role` é `admin` faz login
- **THEN** a sessão é criada normalmente, como para qualquer outro `role`

### Requirement: Admin edita qualquer curso da plataforma
Um usuário com `role: admin` SHALL poder criar, editar, reordenar e excluir `Course`, `Module`, `Lesson` e `Quiz` de qualquer professor, sem estar sujeito à checagem de posse (`teacherId`) usada para `teacher` (ver `course-authoring`).

#### Scenario: Admin exclui curso de outro professor
- **WHEN** um usuário `admin` confirma a exclusão de um `Course` cujo `teacherId` pertence a outro usuário
- **THEN** o curso e seus `Module`/`Lesson` são excluídos normalmente

### Requirement: Admin navega por todos os cursos da plataforma
O sistema SHALL exibir a um usuário `admin` uma listagem com todos os `Course` existentes na plataforma (independentemente de quem é o `teacherId`), a partir da qual ele pode entrar para editar ou ver estatísticas de qualquer um deles. Um usuário `teacher` continua vendo apenas os cursos dos quais é dono nessa mesma listagem.

#### Scenario: Admin vê todos os cursos na listagem de autoria
- **WHEN** um usuário `admin` acessa a listagem de cursos da área de autoria
- **THEN** todos os `Course` da plataforma são exibidos, independentemente do `teacherId`

#### Scenario: Professor continua vendo só os próprios cursos
- **WHEN** um usuário `teacher` acessa a mesma listagem
- **THEN** somente os `Course` cujo `teacherId` é o próprio `id` são exibidos
