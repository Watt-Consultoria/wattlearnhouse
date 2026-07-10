## Context

O app tem hoje: autenticação via Google + sessão assinada (JWT em cookie, com checagem otimista no `proxy` e checagem segura via `authService.getCurrentUser()` nas páginas — ver `src/proxy.ts` e `src/app/page.tsx`), e o schema `User` → `Course` → `Module` → `Lesson` (capability `course-content-structure`, já implementada e arquivada). Não existe nenhuma UI que consuma esse schema; a home atual é um placeholder estático e usa usa ShadeCN.

Existe um protótipo Figma Make em `../Internal Training Platform Design/` (fora deste repositório) com as 5 telas da experiência de aprendizado (catálogo, curso/módulos, aulas, conteúdo da aula, quiz). É a referência visual/UX para este change, mas foi construído como SPA de estado em memória, com dados mockados em `data.ts` e sem noção de usuário real, progresso persistido ou responsividade auditada — não é código a ser copiado, é a especificação visual a ser reimplementada sobre a arquitetura real do app.

## Goals / Non-Goals

**Goals:**

- Implementar as 5 telas do protótipo como rotas reais do App Router, navegáveis por URL (back/forward do navegador, deep link), consumindo `Course`/`Module`/`Lesson` reais do banco e o usuário da sessão autenticada.
- Persistir progresso do aluno (aula concluída) e resultado de quiz por usuário, substituindo o estado em memória do protótipo.
- Aplicar a regra de desbloqueio de módulo de forma consistente e verificada no servidor (não só escondida na UI).
- Fazer um passe de mobile-first genuíno: grids que colapsam, alvos de toque adequados, sem interações hover-only, imagens responsivas.
- Reduzir o CSS ad-hoc do protótipo (hex inline, `style={{fontFamily}}`) para tokens de tema e fontes carregadas via `next/font`, reaproveitando os primitivos shadcn já configurados no projeto.

**Non-Goals:**

- UI de autoria de conteúdo para professores (cursos/módulos/aulas/quiz continuam populados via seed/banco diretamente).
- Matrícula/restrição de visibilidade de curso — todo usuário autenticado vê e pode fazer todos os cursos (mesma decisão já tomada no change anterior).
- Busca full-text no servidor — filtro client-side sobre os cursos já carregados é suficiente no volume atual.
- Funcionalidades sociais (ranking, badges, certificado/PDF).
- Upload/hospedagem de vídeo — permanece embed do YouTube, decisão já fixada em `course-content-structure`.
- Internacionalização — UI continua pt-br apenas.
- Suporte offline/PWA.
- Limite de tentativas de quiz — tentativas ilimitadas por enquanto (ver Open Questions).

## Decisions

### 1. Quiz como entidade própria (1—0..1 com Module), não como uma "Lesson disfarçada"

O protótipo trata o quiz como uma `Lesson` com `type: "quiz"` — mas o spec já arquivado de `course-content-structure` decidiu deliberadamente que `Lesson` não tem campo de tipo (o vídeo é embutido no `content` via notação). Em vez de reabrir essa decisão, `Quiz` é um model novo com `moduleId` único (0 ou 1 quiz por módulo), sempre exibido após a lista de aulas do módulo na UI. Isso preserva `course-content-structure` intacto e mantém `Lesson` = "conteúdo de estudo" e `Quiz` = "avaliação", que são conceitos diferentes.

### 2. Regra de desbloqueio de módulo: sequencial e verificada no servidor

O protótipo usa uma regra ad-hoc (`index > 1 && ...`) que é um artefato do fixture de demonstração, não uma regra de produto. A regra real: o módulo N só é acessível se N = 0 (primeiro módulo) ou o módulo N-1 está 100% concluído — todas as `Lesson` com `LessonProgress` do usuário E, se houver `Quiz`, ao menos uma `QuizAttempt` com `passed = true`. Essa checagem roda tanto na UI (para desenhar o cadeado) quanto dentro das Server Actions (`completeLesson`, `submitQuizAttempt`) antes de gravar, no mesmo espírito de "checagem otimista + checagem segura" já usado no fluxo de auth (`proxy.ts` decodifica o token só para UX; a página/action confirma contra o banco) — sem isso, dá para pular módulo chamando a action direto.

### 3. Progresso de aula: tabela `LessonProgress` upsert por `(userId, lessonId)`

Marcar como concluída é idempotente (upsert), não um log de eventos — não há necessidade de histórico de "desconclusão" ou múltiplas conclusões da mesma aula agora. `@@unique([userId, lessonId])`.

### 4. Respostas do quiz guardadas como JSON na própria `QuizAttempt`, não em tabela normalizada

Cada `QuizAttempt` grava `answers: Json` (array de `{questionId, selectedIndex}`), além de `score`, `totalQuestions` e `passed`. A tela de revisão sempre lê a tentativa inteira de uma vez (não há caso de uso para agregações tipo "quantos erraram a questão X" agora), então uma tabela `QuizAttemptAnswer` separada só adicionaria joins sem benefício. Se analytics por questão vier a ser necessário, migra-se depois.

### 5. `Course.level` como enum, `Course.category`/`tags` como texto livre

`level` tem um conjunto pequeno e estável (`beginner`/`intermediate`/`advanced`) — enum Prisma, mesmo padrão já usado em `UserRole`. `category` fica como `String` livre (não enum): a lista de categorias do protótipo era hardcoded (`["Elétrica", "Automação", "Energia"]`), o que trava a adição de uma categoria nova numa migration; em vez disso, os chips de filtro do catálogo são derivados dinamicamente dos valores distintos presentes nos cursos reais. `tags` é `String[]` (array nativo do Postgres via Prisma) — são só chips de exibição/busca textual, não usados para filtro estruturado.

### 6. `coverImageUrl` opcional com fallback visual, não obrigatório

Nem todo curso terá arte de capa desde o dia 1. Quando `null` ou quando a imagem falhar ao carregar (`onError`), a UI cai para o mesmo tratamento visual do protótipo sem a foto: painel navy sólido com as iniciais do curso — nunca um ícone quebrado.

### 7. `Lesson.durationMinutes` obrigatório (`Int`)

Como o protótipo usa duração de aula extensivamente (lista de aulas, total do módulo, total do curso), tratar como opcional geraria "—" espalhado pela UI. É um campo simples que o autor do conteúdo preenche junto com `content`; como nenhum dado de produção existe ainda, adicionar como obrigatório e re-seedar é mais simples do que lidar com nulo em toda a UI.

### 8. Rotas aninhadas do App Router espelhando a hierarquia

`/courses` → `/courses/[courseId]` → `/courses/[courseId]/modules/[moduleId]` → `.../lessons/[lessonId]` (+ `.../quiz`). Cada nível é uma rota real (não estado em memória), o que dá back/forward de navegador e link direto de graça — importante em mobile, onde o gesto de voltar do SO precisa corresponder à navegação lógica da tela anterior, não fechar o app ou perder o estado.

### 9. Checagem de sessão em cada página, não em um layout compartilhado

Seguindo o mesmo cuidado já adotado em `src/app/page.tsx` (e a lição documentada no fix de sessão: Layouts não re-renderizam em navegação client-side, então um auth check só no layout pode não rodar de novo ao trocar de rota dentro dele) — cada `page.tsx` novo sob `/courses/**` chama `authService.getCurrentUser()` e redireciona para `/login` se `null`, em vez de depender de um `layout.tsx` pai para isso.

### 10. Mutations via Server Actions, não Route Handlers

`completeLesson(lessonId)` e `submitQuizAttempt(quizId, answers)` são Server Actions: disparadas direto de botões da UI sem plumbing manual de fetch, e tratadas com as mesmas exigências de segurança de um endpoint público (verificam sessão e a regra de desbloqueio antes de gravar), como orienta a doc de auth do Next.js já usada no fix de sessão.

### 11. Redução de fontes: Inter (corpo) + Plus Jakarta Sans (headings) + JetBrains Mono (dados/números)

O protótipo usa `Plus Jakarta Sans` e `JetBrains Mono` via `style={{fontFamily}}` inline, além do que o app já carrega (Geist Sans, Geist Mono, Inter — nenhum dos dois Geist é usado hoje). Decisão: descartar a dupla Geist (não faz parte da marca do protótipo e não está em uso), manter `Inter` como corpo, adicionar `Plus Jakarta Sans` (`--font-heading`) e `JetBrains Mono` (`--font-mono`) via `next/font/google`, expostas como utilities Tailwind (`font-heading`, `font-mono`) em vez de `style` inline. Menos famílias de fonte carregadas = menos bytes na primeira renderização em rede móvel.

### 12. Cores de marca como tokens de tema, não hex espalhado

`#1A3A5C` (navy) e `#F0A500` (gold) do protótipo entram em `globals.css` como variáveis (`--brand-navy`, `--brand-gold`) e em `@theme inline` (`--color-brand-navy`, `--color-brand-gold`), utilizáveis como `bg-brand-navy`/`text-brand-gold` etc. `--primary` do tema shadcn passa a apontar para o navy da marca (o `Button` default já fica com a cor certa em todo o app sem precisar sobrescrever classe a classe).

### 13. Conteúdo da aula: um único fluxo de Markdown renderizado, sem abas "Vídeo"/"Leitura"

O protótipo tem abas separadas "🎬 Vídeo" / "📖 Leitura" porque seu fixture guarda `videoId` e `body` como campos independentes. O schema real (`course-content-structure`) já decidiu o oposto: `Lesson.content` é um único Markdown, e vídeo do YouTube é embutido via notação `[youtube_video](<url>)` onde quer que apareça no texto. A implementação real renderiza esse Markdown de forma contínua (o embed aparece inline, no ponto do texto onde a notação ocorre) — sem seletor de aba, porque não há dois conteúdos independentes para alternar. Isso é mais simples e é a única opção compatível com o modelo de dados já fixado.

### 14. Lista de aulas do módulo acessível em mobile, não só como sidebar desktop

No protótipo, a lista de aulas do módulo ao lado do player é `hidden lg:block` — some completamente em mobile, restando só os botões linear "Anterior"/"Próxima". Como isso reduz a navegabilidade justamente na plataforma que este change prioriza, a versão real expõe a mesma lista como um disclosure/drawer expansível (ex: um botão "Aulas deste módulo" que abre a lista) abaixo do breakpoint `lg`, em vez de simplesmente ocultá-la.

## Risks / Trade-offs

- **[Risco] Migration adiciona campos obrigatórios em `Course`/`Lesson`** → dados de seed existentes (do change anterior) não têm `category`/`level`/`durationMinutes`. Mitigação: como nada está em produção, resetar e re-seedar com conteúdo coerente (mesmo precedente do change anterior).
- **[Risco] Cálculo de progresso/bloqueio com N+1 queries por módulo** → buscar todo o `LessonProgress`/`QuizAttempt` do usuário para o curso inteiro em 1-2 queries por carregamento de página e computar em memória, em vez de round-trip por módulo.
- **[Trade-off] `answers` como JSON na `QuizAttempt`** → simples e suficiente para o caso de uso atual (revisão da própria tentativa); perde a capacidade de agregar erros por questão entre usuários sem parsear JSON. Aceitável agora.
- **[Trade-off] `category` como texto livre** → sem enum, então nada impede duplicar categoria com grafia diferente (`"Elétrica"` vs `"eletrica"`); mitigado por derivar os chips de filtro dos valores reais distintos em vez de uma lista hardcoded, mas a consistência de cadastro fica por conta de quem popular o banco.
- **[Risco] `next/image` com URLs externas (capa de curso)** → exige `images.remotePatterns` no `next.config.ts`; se a URL cair ou 404, a capa quebra. Mitigação: fallback visual (painel navy + iniciais) tanto para `coverImageUrl` nulo quanto para erro de carregamento (`onError`), nunca um ícone de imagem quebrada.
- **[Risco] Espaço vertical em mobile na tela de conteúdo da aula** (breadcrumb + barra sticky + player) → validar em viewport pequeno (375×667) que a barra sticky não consome mais que ~15% da altura; colapsar o breadcrumb para um único "← Voltar" abaixo de um breakpoint em vez de tentar caber a trilha completa.

## Migration Plan

1. Editar `prisma/schema.prisma`: campos novos em `Course` (`category`, `level`, `tags`, `coverImageUrl`) e `Lesson` (`durationMinutes`); models novos `Quiz`, `QuizQuestion`, `QuizAttempt`, `LessonProgress`.
2. Gerar e aplicar a migration localmente (`prisma migrate dev`, já que nenhum dado de produção existe).
3. Estender `prisma/seed.ts` com um catálogo coerente (múltiplos cursos, módulos, aulas com `durationMinutes`, ao menos um quiz) suficiente para exercitar todas as 5 telas e os estados de progresso (aula não iniciada / em andamento / concluída, módulo bloqueado / desbloqueado, quiz não feito / aprovado / reprovado).
4. Rodar o seed e validar manualmente a cadeia completa via query.
5. Implementar as rotas, Server Actions e UI; validar mobile em pelo menos um viewport pequeno (375px) e um médio (768px) além do desktop.

## Open Questions

- Deve haver limite de tentativas de quiz por usuário, ou tentativas ilimitadas (como no protótipo) ficam valendo indefinidamente? Assumindo ilimitadas por enquanto — revisar se abuso/gaming da nota virar problema real.
