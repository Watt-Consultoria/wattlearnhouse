## Context

O schema Prisma atual (`prisma/schema.prisma`) só tem o model `User`, já migrado (`20260710023839_create_users_table`). Essa migration gerou colunas em `camelCase` (`googleId`, `avatarUrl`, `createdAt`) e timestamps `TIMESTAMP(3)` sem timezone — o que viola `.claude/rules/core/NAMING_CONVENTIONS.md` (DB deve ser `snake_case`) e `.claude/rules/core/TIMEZONE.md` (DB deve usar `TIMESTAMPTZ`). Como este change introduz o primeiro conjunto de tabelas relacionadas, é o ponto natural para corrigir essa dívida antes que ela se propague.

Não existe ainda nenhum spec em `openspec/specs/` — este é o primeiro capability formalizado no projeto.

## Goals / Non-Goals

**Goals:**
- Modelar `Course` → `Module` → `Lesson` como hierarquia estrita (cada `Module` pertence a exatamente um `Course`; cada `Lesson` pertence a exatamente um `Module`).
- Suportar aulas textuais, em vídeo (sempre YouTube) ou mistas através de um único campo `content` (Markdown), sem campo de "tipo" nem campo de URL separado.
- Garantir que módulos e aulas tenham uma ordem de exibição determinística.
- Vincular cada `Course` ao professor (`User` com `role: teacher`) autor/dono do curso.
- Corrigir as colunas do `User` para `snake_case` + `TIMESTAMPTZ`, alinhando com as regras do projeto.
- Entregar migrations aplicadas e um script de seed populando 1 curso, 1 módulo e 1 aula de teste (dependência transitiva da `Lesson`).

**Non-Goals:**
- Controle de acesso/permissão (quem pode editar o quê) — só o vínculo de dado (`teacherId`) é criado aqui; a lógica de autorização fica para uma mudança futura.
- Validação de "professor" no `teacherId` a nível de banco (ex: constraint garantindo que o `User` referenciado tem `role: teacher`) — fica como validação de aplicação.
- Parsing/renderização da notação `[youtube_video](<url>)` — fica a cargo do renderizador de aulas (fora do escopo do schema Prisma).
- Extração/normalização do ID de vídeo do YouTube a partir da URL — fica para quando o player/embed for implementado.
- Múltiplos professores por curso, matrícula de alunos, progresso do aluno — fora do escopo desta estrutura inicial.

## Decisions

### 1. Corrigir convenção de `User` nesta mesma mudança (em vez de só nos models novos)
Como o change já mexe no schema e nas migrations, isolar a correção do `User` para "depois" deixaria uma tabela inconsistente com todas as outras por tempo indefinido. A correção é uma migration adicional (`ALTER TABLE ... RENAME COLUMN` + troca de tipo de timestamp), seguro agora porque `users` só tem dado de teste.

### 2. Vídeo embutido no `content` via notação, sem campo `videoUrl` nem enum `LessonType`
`Lesson` tem um único campo de material: `content` (Markdown, obrigatório). Vídeos do YouTube são referenciados dentro do próprio Markdown com a notação `[youtube_video](<url>)`, que o renderizador de aulas (fora do escopo deste change) interpreta e transforma em embed. Uma aula só-texto é um `content` sem essa notação; uma aula só-vídeo é um `content` que contém só a notação; uma aula mista combina os dois livremente. Isso substitui o desenho anterior (campos `videoUrl`/`content` opcionais e independentes) e elimina a necessidade de um enum `type`: não há mais dois campos para dessincronizar, e uma `Lesson` sem `content` deixa de ser um estado válido — o banco já rejeita isso via `NOT NULL`.

### 3. `order: Int` explícito em `Module` e `Lesson`
Ordem de inserção em uma tabela relacional não é garantia de ordem de exibição. Sem um campo explícito, a sequência de módulos/aulas no curso fica indefinida assim que houver mais de um registro. Optamos por `Int` simples (não uma chave composta única `@@unique([courseId, order])`) para não travar a criação do seed com um único registro por nível; se a aplicação precisar garantir unicidade de ordem dentro de um curso/módulo, isso pode ser adicionado depois sem quebrar o shape atual.

### 4. `Course.teacherId` obrigatório (não opcional)
Todo curso tem um professor autor. Tornar o campo opcional abriria a possibilidade de cursos "órfãos", o que não faz sentido de produto. A relação usa o comportamento padrão do Prisma para deleção (`Restrict` implícito) — não é possível apagar um `User` que ainda tem cursos vinculados, evitando perda acidental de autoria.

### 5. Cascade delete em `courses → modules → lessons`
Apagar um `Course` remove seus `Modules`, e apagar um `Module` remove suas `Lessons` (`onDelete: Cascade`). A relação é de posse forte — um módulo não existe fora de um curso.

### 6. `content` como `String` sem `@db.Text` explícito
No provider PostgreSQL, o tipo `String` do Prisma já mapeia para a coluna nativa `text` (sem limite de tamanho) por padrão. Não é necessário anotar `@db.Text` explicitamente para armazenar Markdown de qualquer tamanho.

## Risks / Trade-offs

- **[Risco] Migration de rename em `users`** → Se `users` já tiver dados reais em produção quando este change for aplicado, o rename de coluna precisa rodar em janela controlada. Mitigação: aplicar o quanto antes, enquanto a tabela só tem dados de teste/seed.
- **[Trade-off] `order` sem unicidade garantida** → Dois módulos do mesmo curso podem acabar com o mesmo `order` se a aplicação não coordenar bem. Aceitável agora porque o seed só cria 1 registro por nível; revisar se a UI de reordenação for implementada.
- **[Trade-off] `teacherId` sem constraint de `role`** → Um `User` com `role: student` pode tecnicamente ser referenciado como `teacherId` no nível do banco. Mitigação: validação na camada de aplicação ao criar/editar um curso.
- **[Trade-off] Notação `[youtube_video](<url>)` sem validação de formato no banco** → Nada impede um Markdown malformado ou uma URL que não seja do YouTube dentro dessa notação; a validação de formato é responsabilidade do renderizador/formulário de edição, não do schema.

## Migration Plan

1. Editar `prisma/schema.prisma`: adicionar `Course`, `Module`, `Lesson`; corrigir `User` (`@map` por campo + `@db.Timestamptz(3)`).
2. Gerar a migration (via `prisma migrate diff --script` + revisão manual, dado que `migrate dev` recusa rodar em modo não interativo quando há dados existentes) cobrindo a alteração do `User` e a criação das 3 tabelas novas, já com `Lesson.content` obrigatório e sem `videoUrl`.
3. Revisar o SQL gerado antes de aplicar — confirmar que o rename de colunas do `users` não derruba dados existentes (deve ser `ALTER TABLE ... RENAME COLUMN`, não drop+create).
4. Aplicar a migration localmente (`prisma migrate deploy`).
5. Criar o script de seed e configurá-lo em `prisma.config.ts` / `package.json`.
6. Rodar o seed e validar manualmente os registros criados.

Como nenhuma dessas migrations chegou a ser aplicada em produção, o histórico local foi mantido como uma única migration nova (squash), em vez de acumular uma migration por iteração de design.
