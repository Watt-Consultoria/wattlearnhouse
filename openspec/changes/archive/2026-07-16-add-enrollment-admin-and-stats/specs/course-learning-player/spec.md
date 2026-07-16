## MODIFIED Requirements

### Requirement: Acesso autenticado a todas as telas do catálogo e player
Todas as telas desta capacidade (catálogo, curso, módulo, aula) SHALL exigir uma sessão de usuário válida. Um usuário sem sessão válida acessando qualquer uma dessas rotas SHALL ser redirecionado para `/login`. Dentro de uma sessão válida, o catálogo (`/courses`) e o detalhe do curso (`/courses/[courseId]`) SHALL ser acessíveis a qualquer usuário autenticado, exibindo a grade do curso (módulos e títulos de aula) independentemente de matrícula (ver `course-enrollment`); já as telas de módulo, aula e quiz SHALL exigir matrícula ativa no curso, conforme definido em `course-enrollment`.

#### Scenario: Acesso sem sessão é redirecionado
- **WHEN** um usuário sem sessão válida acessa `/courses` ou qualquer rota aninhada abaixo dela
- **THEN** o sistema redireciona para `/login` antes de renderizar qualquer dado de curso

#### Scenario: Usuário autenticado não matriculado vê o detalhe do curso
- **WHEN** um usuário autenticado sem `Enrollment` no curso acessa `/courses/[courseId]`
- **THEN** a página exibe título, descrição, categoria, capa e a grade de módulos/aulas do curso normalmente

#### Scenario: Usuário autenticado não matriculado é bloqueado ao entrar em um módulo
- **WHEN** um usuário autenticado sem `Enrollment` no curso acessa `/courses/[courseId]/modules/[moduleId]`
- **THEN** o acesso é negado e o usuário é direcionado de volta ao detalhe do curso com a opção de se matricular
