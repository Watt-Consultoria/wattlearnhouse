## Why

Hoje o schema Prisma só tem `User`. Não existe nenhuma estrutura de dados para representar cursos, seus módulos e as aulas dentro de cada módulo — pré-requisito para qualquer feature de catálogo, player de aula ou editor de conteúdo. Além disso, a tabela `users` já existente foi migrada com colunas em camelCase e `TIMESTAMP` sem timezone, violando as regras do projeto (`NAMING_CONVENTIONS.md`, `TIMEZONE.md`); como este change mexe no schema de qualquer forma, é o momento certo para corrigir isso antes que mais tabelas repliquem o padrão errado.

## What Changes

- Adiciona os models `Course`, `Module` e `Lesson` ao schema Prisma, formando a hierarquia `Course` 1—N `Module` 1—N `Lesson`.
- `Lesson` suporta aula textual, em vídeo ou mista através de um único campo `content` (Markdown, obrigatório); vídeos do YouTube são referenciados dentro do texto com a notação `[youtube_video](<url>)`, que o renderizador de aulas (fora de escopo aqui) transforma em embed.
- `Module` e `Lesson` recebem um campo `order: Int` explícito para controlar a sequência de exibição, já que a ordem de inserção não é confiável para isso.
- `Course` recebe `teacherId` (FK obrigatória para `User`), estabelecendo o professor autor/dono do curso.
- **BREAKING**: corrige as colunas do `User` para `snake_case` (`google_id`, `avatar_url`, `created_at`, `updated_at`) e `TIMESTAMPTZ`, via nova migration — muda os nomes de coluna de uma tabela já migrada.
- Adiciona script de seed populando 1 `User` (teacher), 1 `Course`, 1 `Module` e 1 `Lesson` de teste.

## Capabilities

### New Capabilities
- `course-content-structure`: modelo de dados da hierarquia Curso → Módulo → Aula, incluindo suporte a aulas textuais/em vídeo/mistas via notação de vídeo embutida no Markdown, ordenação e vínculo de autoria com o professor.

### Modified Capabilities
(nenhuma — não há specs existentes; a correção de convenção em `User` é um detalhe de implementação de schema, não uma mudança de requisito de comportamento)

## Impact

- `prisma/schema.prisma`: novos models `Course`, `Module`, `Lesson`; ajustes no model `User`.
- `prisma/migrations/`: nova migration para os models novos + nova migration corrigindo colunas/tipo de timestamp de `users`.
- Novo script de seed (ex: `prisma/seed.ts`) e configuração de seed em `prisma.config.ts`.
- `src/generated/prisma/*`: regenerado pelo `prisma generate` (via `postinstall`).
