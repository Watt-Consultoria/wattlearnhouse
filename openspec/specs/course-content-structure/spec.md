## Purpose

Modelo de dados da hierarquia Curso → Módulo → Aula, incluindo suporte a aulas textuais/em vídeo/mistas via notação de vídeo embutida no Markdown, ordenação explícita de módulos e aulas, e vínculo de autoria do curso com o professor.

## Requirements

### Requirement: Hierarquia Course → Module → Lesson
O sistema SHALL representar cursos como uma hierarquia estrita de três níveis: um `Course` possui múltiplos `Module`, e cada `Module` possui múltiplas `Lesson`. Cada `Module` SHALL pertencer a exatamente um `Course`, e cada `Lesson` SHALL pertencer a exatamente um `Module`.

#### Scenario: Apagar um Course remove seus Modules e Lessons
- **WHEN** um `Course` é deletado
- **THEN** todos os `Module` vinculados a ele são deletados em cascata, e todas as `Lesson` vinculadas a esses módulos também são deletadas

#### Scenario: Apagar um Module remove suas Lessons
- **WHEN** um `Module` é deletado
- **THEN** todas as `Lesson` vinculadas a ele são deletadas em cascata

### Requirement: Aula suporta conteúdo textual, em vídeo ou misto via Markdown
Uma `Lesson` SHALL ter um único campo `content` (Markdown, obrigatório) como fonte de todo o seu material. Vídeos do YouTube SHALL ser referenciados dentro do `content` usando a notação `[youtube_video](<url>)`, que o renderizador de aulas interpreta e transforma em embed. Equações matemáticas SHALL ser referenciadas usando notação LaTeX delimitada por `$...$` (inline) ou `$$...$$` (bloco), que o renderizador de aulas interpreta e transforma em fórmula renderizada via KaTeX. O sistema SHALL NOT ter um campo `videoUrl` separado, um campo `equations` separado, nem um campo de "tipo de aula" — o tipo de conteúdo é determinado pelo Markdown em `content`, não por um campo dedicado.

#### Scenario: Aula somente com vídeo
- **WHEN** uma `Lesson` é criada com `content` contendo apenas a notação `[youtube_video](<url>)`
- **THEN** o registro é salvo com sucesso

#### Scenario: Aula somente com texto
- **WHEN** uma `Lesson` é criada com `content` contendo texto em Markdown sem nenhuma notação `[youtube_video](<url>)`
- **THEN** o registro é salvo com sucesso

#### Scenario: Aula mista (texto e vídeo)
- **WHEN** uma `Lesson` é criada com `content` combinando texto em Markdown e a notação `[youtube_video](<url>)`
- **THEN** o registro é salvo com sucesso

#### Scenario: Aula sem conteúdo é rejeitada
- **WHEN** uma `Lesson` é criada sem `content`
- **THEN** a operação falha por violação de constraint obrigatória

#### Scenario: Aula com equação matemática
- **WHEN** uma `Lesson` é criada com `content` contendo uma expressão delimitada por `$...$` ou `$$...$$`
- **THEN** o registro é salvo com sucesso, e a tela de aula renderiza a expressão como fórmula matemática em vez de texto literal

### Requirement: Ordenação explícita de Modules e Lessons
Todo `Module` SHALL ter um campo `order` (inteiro) que determina sua posição de exibição dentro do `Course`. Toda `Lesson` SHALL ter um campo `order` (inteiro) que determina sua posição de exibição dentro do `Module`.

#### Scenario: Módulos são ordenáveis dentro de um curso
- **WHEN** múltiplos `Module` são consultados para um mesmo `Course`
- **THEN** cada um possui um valor de `order` que permite ordená-los de forma determinística

### Requirement: Course vinculado a um professor autor
Todo `Course` SHALL ter um `teacherId` obrigatório, referenciando o `User` autor/dono do curso. O sistema SHALL impedir a exclusão de um `User` que ainda possua `Course` vinculados a ele.

#### Scenario: Criar curso sem professor é rejeitado
- **WHEN** um `Course` é criado sem `teacherId`
- **THEN** a operação falha por violação de constraint obrigatória

#### Scenario: Apagar professor com cursos vinculados é rejeitado
- **WHEN** uma tentativa de deletar um `User` que possui ao menos um `Course` vinculado é executada
- **THEN** a operação falha por violação de constraint de integridade referencial

### Requirement: Colunas de banco seguem snake_case e timestamps com timezone
Todas as tabelas e colunas do schema (incluindo `User`, `Course`, `Module`, `Lesson`) SHALL usar nomes em `snake_case` no banco de dados, e todo campo de data/hora SHALL usar o tipo `TIMESTAMPTZ`.

#### Scenario: Colunas da tabela users em snake_case
- **WHEN** a tabela `users` é inspecionada no banco
- **THEN** suas colunas multi-palavra (ex: `google_id`, `avatar_url`, `created_at`, `updated_at`) estão em `snake_case`, não em `camelCase`

#### Scenario: Timestamps armazenam timezone
- **WHEN** as colunas `created_at`/`updated_at` de qualquer tabela do schema são inspecionadas
- **THEN** seu tipo é `TIMESTAMPTZ` (`timestamp with time zone`), não `TIMESTAMP` sem timezone

### Requirement: Banco populável via script de seed
O sistema SHALL fornecer um script de seed executável que popula o banco com ao menos 1 `User` professor, 1 `Course`, 1 `Module` e 1 `Lesson` de teste, respeitando a cadeia de dependência de chaves estrangeiras.

#### Scenario: Seed popula a cadeia completa
- **WHEN** o script de seed é executado em um banco vazio
- **THEN** o banco passa a conter exatamente 1 `Course`, vinculado a 1 `Module`, vinculado a 1 `Lesson`, e todos vinculados a um `User` com `role: teacher`

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
