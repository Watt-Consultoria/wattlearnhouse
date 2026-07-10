## Context

O app tem hoje a experiência completa do aluno (`course-learning-player`, `lesson-progress-tracking`, `module-quiz`) consumindo `Course` → `Module` → `Lesson` reais do banco, mas populados só via `prisma/seed.ts`. O schema já tem `Course.teacherId` (obrigatório, ver `course-content-structure`) e `User.role` (`student` | `teacher`), mas nenhuma página checa `role` ou usa `teacherId` para autorização — a única checagem de identidade hoje é "está logado?" (`authService.getCurrentUser()` em cada página, seguindo o padrão já documentado de checagem por página em vez de layout compartilhado).

O conteúdo de aula (`Lesson.content`) é Markdown renderizado por `LessonContent` (`react-markdown` + `remark-gfm`), com uma convenção própria já fixada: vídeo do YouTube via `[youtube_video](<url>)` interpretado no componente `a` customizado. Esse é o pipeline de renderização que o editor de aula precisa reaproveitar tal e qual — o preview do editor não pode ser uma segunda implementação de Markdown que diverge do render real do aluno.

## Goals / Non-Goals

**Goals:**

- Professor (`role: teacher`) cria, edita, reordena e exclui seus próprios cursos, módulos e aulas por uma UI real, sem tocar no banco ou no seed.
- Editor de aula com preview ao vivo usando o mesmo componente de renderização já usado na tela do aluno (uma única fonte de verdade para "como Markdown vira HTML" nesta app).
- Barra de ferramentas cobrindo exatamente a lista pedida: negrito, itálico, código inline, bloco de código, tabela, embed de YouTube (`[youtube_video](<url>)`) e equação (LaTeX via KaTeX).
- Autorização em duas camadas, no mesmo espírito do fluxo de auth já existente: checagem de `role` + posse (`teacherId`) tanto na página (redirect) quanto dentro de cada Server Action (não confiar só na UI escondida).

**Non-Goals:**

- Autoria de quiz (`Quiz`/`QuizQuestion`) — continua populado via seed/banco direto; não foi pedido e mexe em outra capability (`module-quiz`) já fechada.
- Matrícula ou visibilidade restrita de curso — decisão já tomada em change anterior, não revisitada aqui.
- Upload de imagem de capa — o professor cola uma URL, não há upload de arquivo.
- Colaboração multi-professor no mesmo curso, versionamento/histórico de edição, ou autosave — salvar é uma ação explícita (botão "Salvar"), sem rascunho automático.
- WYSIWYG rico (formatação por seleção visual sem Markdown bruto) — o editor é a fonte de Markdown com preview ao lado, não um rich-text editor que gera Markdown por trás.
- Promover usuário a `teacher` pela UI — continua manual (seed/banco), como hoje.

## Decisions

### 1. Preview do editor reaproveita `LessonContent`, não reimplementa renderização

O componente `LessonContent` (usado na tela de aula do aluno) é extraído/reaproveitado como o preview do editor, alimentado pelo valor corrente do textarea. Alternativa considerada: um componente de preview próprio no editor — rejeitada porque criaria duas implementações de "Markdown → HTML" que podem divergir silenciosamente (ex: professor vê um preview e o aluno vê outra coisa quando salva). Uma única implementação, dois consumidores.

### 2. Equações via `remark-math` + `rehype-katex`, adicionados ao `LessonContent` existente

`react-markdown` já suporta `remarkPlugins`/`rehypePlugins`; adiciona-se `remarkMath` (parseia `$...$`/`$$...$$`) e `rehypeKatex` (renderiza para HTML/MathML) ao array já usado em `LessonContent`, mais o import do CSS do KaTeX uma vez em `globals.css` ou `layout.tsx`. Alternativa considerada: renderizar equação como imagem via serviço externo (ex: CodeCogs) — rejeitada por dependência de rede externa em runtime e por já existir um pipeline de plugins remark/rehype no projeto, onde adicionar mais um plugin é a mudança mais simples.

### 3. Editor é textarea controlado + manipulação de seleção, não um binding de rich-text

A barra de ferramentas (negrito, itálico, código inline, tabela, bloco de código, YouTube, equação) opera sobre um `<textarea>` simples: cada botão lê `selectionStart`/`selectionEnd` do DOM, envolve ou insere o snippet de Markdown correspondente, e restaura o cursor. Alternativa considerada: um editor de rich-text (ex: contenteditable customizado ou uma lib tipo Tiptap) que gera Markdown — rejeitada por ser desproporcional ao pedido ("como no Obsidian": Obsidian também edita Markdown bruto com preview ao lado, não esconde a sintaxe) e por adicionar uma dependência pesada para um caso de uso que um textarea + toolbar resolve.

### 4. Reordenação por botões subir/descer, sem drag-and-drop

`Module.order` e `Lesson.order` são inteiros; reordenar troca o `order` do item com o do vizinho adjacente (swap simples, 1 query de leitura + 1 transação de escrita). Alternativa considerada: drag-and-drop — rejeitada por exigir uma nova dependência (`@dnd-kit` ou similar) para um ganho de UX que os botões já cobrem, e por ser mais simples de fazer funcionar corretamente em touch (mobile é prioridade no app, ver change anterior).

### 5. Autorização em duas camadas: `role` na página + posse na Server Action

Cada `page.tsx` sob `/teacher/**` chama `authService.getCurrentUser()`, redireciona para `/login` se `null` e para `/courses` se `role !== "teacher"` — mesmo padrão já usado (checagem por página, não por layout, porque layouts não re-renderizam em navegação client-side dentro deles). Toda Server Action de mutação (`createCourse`, `updateModule`, `deleteLesson`, etc.) repete a checagem de `role` e adicionalmente resolve a cadeia até `Course.teacherId` para confirmar posse antes de gravar — do mesmo jeito que `isModuleUnlockedForUser` já é checado dentro das Server Actions do aluno, não só escondido na UI.

### 6. Novo módulo/aula: form inline na própria página de listagem; só a aula ganha rota própria

Criar um `Module` ou uma `Lesson` é um formulário curto (título, e no caso da aula, o Markdown) — para módulo, um campo de texto inline com botão "Adicionar" na página do curso é suficiente e evita uma rota só para isso. Para aula, o editor de Markdown é uma experiência de tela cheia (split-pane), então ganha rota própria: `.../lessons/new` (criar) e `.../lessons/[lessonId]` (editar) — mesma URL real por nível de conteúdo, seguindo o precedente já fixado nas rotas do aluno.

### 7. `CourseCover` troca `next/image` por `<img>` simples

Hoje `CourseCover` usa `next/image`, que exige que o hostname da URL esteja em `images.remotePatterns` (`next.config.ts`) — funciona porque o seed só usa `picsum.photos`. Com o professor colando qualquer URL de capa, `next/image` lançaria erro em runtime para qualquer host não configurado (não daria só um fallback silencioso). Troca-se para `<img>` com o mesmo `onError` → fallback visual (painel navy + iniciais) que já existe, aceitando qualquer URL, ao custo de perder a otimização de imagem do Next para essa capa especificamente. Alternativa considerada: manter `next/image` e documentar que a URL "deve ser de uma origem configurada" — rejeitada porque obriga o professor a conhecer um detalhe de infra (`next.config.ts`) que não faz sentido expor.

## Risks / Trade-offs

- **[Risco] Reordenar por swap de `order` pode gerar corrida se dois cliques rápidos disparam duas trocas antes da revalidação** → mitigado fazendo o swap dentro de uma única transação Prisma (`prisma.$transaction`) e desabilitando o botão enquanto a Server Action está em voo (estado de pending do form).
- **[Trade-off] `<img>` simples perde otimização de imagem (lazy/format automático) para capas de curso** → aceitável: capas são poucas por página (grid do catálogo já é pequeno) e o ganho de suportar qualquer URL sem tocar `next.config.ts` por professor supera o custo.
- **[Trade-off] Textarea + toolbar em vez de rich-text** → professor vê Markdown bruto (ex: `**negrito**`) em vez de negrito renderizado inline no próprio editor; mitigado pelo preview ao vivo lado a lado, que é exatamente o modelo mental pedido ("como no Obsidian").
- **[Risco] `rehype-katex` falha ao parsear LaTeX inválido digitado pelo professor** → a lib já renderiza um span de erro inline em vez de quebrar a página inteira (comportamento padrão do KaTeX em modo non-strict); nenhum tratamento adicional necessário além de manter o padrão da lib.
- **[Risco] Excluir um `Module`/`Course` com conteúdo é destrutivo e cascata (`onDelete: Cascade` já no schema)** → UI exige confirmação explícita (dialog "Tem certeza?") antes de disparar a Server Action de exclusão.

## Migration Plan

1. Adicionar dependências (`remark-math`, `rehype-katex`, `katex`) e importar o CSS do KaTeX globalmente.
2. Estender `LessonContent` com os plugins de equação (afeta também a tela do aluno — nenhuma migration de dado necessária, é só renderização).
3. Trocar `CourseCover` de `next/image` para `<img>`.
4. Implementar `authoring.service.ts` + `authoring-actions.ts` com as checagens de `role`/posse.
5. Implementar as páginas `/teacher/**` na ordem: lista/criação de curso → gerenciamento de módulos → gerenciamento de aulas → editor de aula.
6. Adicionar o link "Meus Cursos" na navbar, condicionado a `role === "teacher"`.
7. Validar manualmente com o usuário seed de teacher (`TEACHER_GOOGLE_ID`) e com um usuário `student` (para confirmar que `/teacher/**` redireciona).

## Open Questions

- Nenhuma em aberto — escopo foi reduzido deliberadamente (sem autoria de quiz, sem upload de imagem, sem autosave) para manter o change focado no que foi pedido.
