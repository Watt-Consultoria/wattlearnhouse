## 1. Schema

- [x] 1.1 Corrigir `User` em `prisma/schema.prisma`: adicionar `@map` snake_case em todos os campos multi-palavra (`googleId`→`google_id`, `avatarUrl`→`avatar_url`, `createdAt`→`created_at`, `updatedAt`→`updated_at`) e `@db.Timestamptz(3)` em `createdAt`/`updatedAt`
- [x] 1.2 Criar model `Course` (`id`, `teacherId` FK obrigatória para `User`, `title`, `description?`, `createdAt`, `updatedAt`), com `@map`/`@@map` snake_case e `@db.Timestamptz(3)`
- [x] 1.3 Criar model `Module` (`id`, `courseId` FK obrigatória para `Course`, `title`, `order`, `createdAt`, `updatedAt`), com `onDelete: Cascade` na relação com `Course`
- [x] 1.4 Criar model `Lesson` (`id`, `moduleId` FK obrigatória para `Module`, `title`, `content` obrigatório, `order`, `createdAt`, `updatedAt`), com `onDelete: Cascade` na relação com `Module` — sem campo `videoUrl`; vídeos ficam embutidos no `content` via notação `[youtube_video](<url>)`
- [x] 1.5 Adicionar relação inversa `courses` em `User` (um professor tem múltiplos cursos)

## 2. Migration

- [x] 2.1 Gerar a migration combinada (correção de `users` + criação de `courses`/`modules`/`lessons`) — feito via `migrate diff --script` + edição manual, já que `migrate dev` recusou rodar em modo não interativo com 1 linha existente em `users`
- [x] 2.2 Revisar o SQL gerado: confirmar `ALTER TABLE ... RENAME COLUMN` (não drop+recreate) para as colunas do `users`, e `TIMESTAMPTZ` nas colunas de data de todas as tabelas novas — SQL reescrito manualmente para usar `RENAME COLUMN` + `ALTER COLUMN ... TYPE TIMESTAMPTZ(3) USING ... AT TIME ZONE 'UTC'`, preservando o registro existente
- [x] 2.3 Aplicar a migration localmente (`prisma migrate deploy`) e confirmar que as tabelas `courses`, `modules`, `lessons` têm colunas em snake_case — confirmado via `\d users` e `migrate diff` vazio (banco == schema)
- [x] 2.4 Squash: como nenhuma migration desta feature havia sido aplicada em produção, consolidar as migrations geradas durante a iteração de design (`add_course_content_structure` + `lesson_content_only`, esta última removendo `videoUrl` e tornando `content` obrigatório) em uma única migration nova, via `prisma migrate resolve --applied` — mantendo `create_users_table` intacta e sem perda do registro real em `users`

## 3. Seed

- [x] 3.1 Criar `prisma/seed.ts` criando, em cadeia, 1 `User` (`role: teacher`), 1 `Course` vinculado a ele, 1 `Module` vinculado ao curso, e 1 `Lesson` de teste vinculada ao módulo (com `content` combinando Markdown e a notação `[youtube_video](<url>)`, para exercitar o caso "aula mista")
- [x] 3.2 Configurar o comando de seed (`migrations.seed` em `prisma.config.ts`, e script `prisma:seed` em `package.json`)
- [x] 3.3 Rodar o seed e validar manualmente que os 4 registros foram criados com os vínculos corretos — confirmado via query com JOIN, e reexecução do seed confirmou idempotência (upsert, sem duplicar)

## 4. Validação final

- [x] 4.1 Confirmar que os critérios de aceite estão satisfeitos: migrations aplicadas sem erro, banco populado com 1 curso e 1 aula de teste (via seed)
- [x] 4.2 Rodar `openspec validate add-course-content-structure --strict` antes de considerar o change pronto para implementação
