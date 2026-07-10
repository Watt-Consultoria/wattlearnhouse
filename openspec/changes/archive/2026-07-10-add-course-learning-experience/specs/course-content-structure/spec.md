## ADDED Requirements

### Requirement: Course possui metadados de catálogo
Todo `Course` SHALL ter `category` (texto livre), `level` (`beginner` | `intermediate` | `advanced`) e `tags` (lista de textos). `Course` SHALL ter um `coverImageUrl` opcional; quando ausente ou inválido, a UI que o consome SHALL exibir um fallback visual em vez de um espaço vazio ou ícone quebrado.

#### Scenario: Criar curso sem categoria, nível ou tags é rejeitado
- **WHEN** um `Course` é criado sem `category`, sem `level` ou sem `tags`
- **THEN** a operação falha por violação de constraint obrigatória

#### Scenario: Criar curso sem capa é aceito
- **WHEN** um `Course` é criado sem `coverImageUrl`
- **THEN** o registro é salvo com sucesso, com `coverImageUrl` nulo

### Requirement: Lesson possui duração em minutos
Toda `Lesson` SHALL ter um campo `durationMinutes` (inteiro, obrigatório) representando sua duração estimada em minutos.

#### Scenario: Criar aula sem duração é rejeitado
- **WHEN** uma `Lesson` é criada sem `durationMinutes`
- **THEN** a operação falha por violação de constraint obrigatória

#### Scenario: Duração de módulo e curso são somas das durações de suas aulas
- **WHEN** a duração total de um `Module` ou `Course` é exibida
- **THEN** o valor corresponde à soma de `durationMinutes` de todas as `Lesson` correspondentes
