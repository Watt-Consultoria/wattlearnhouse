## Context

Conclusão de módulo/curso hoje é inteiramente derivada em runtime (`computeModulesProgress`/`computeCourseModuleProgress` em `src/modules/courses/`), a partir de `LessonProgress` e `QuizAttempt.passed` — não existe nenhum registro persistido de "o aluno X concluiu o curso Y". `User.name` vem do Google e é sobrescrito a cada login (`authService.validateGoogleUser`), então não serve como nome para um documento formal; não existe CPF em lugar nenhum do schema. O roteamento de autenticação (`src/proxy.ts`) hoje só reconhece rotas públicas por igualdade exata de path (`publicRoutes.includes(pathname)`); a única rota pública existente é `/login`, sem segmentos dinâmicos.

## Goals / Non-Goals

**Goals:**
- Certificado emitido apenas quando o curso está 100% concluído (mesma definição já usada pelo player/matrícula), reaproveitando `computeModulesProgress`.
- Coleta de `fullName`/`cpf` sob demanda (só quando o aluno tenta emitir um certificado pela primeira vez), com validação de CPF (formato + dígitos verificadores), persistidos em `User`.
- Emissão idempotente: reemitir para o mesmo curso retorna o certificado já existente, não duplica.
- Snapshot imutável do currículo concluído (módulos/aulas) e dos dados do aluno no momento da emissão, para que edições futuras de curso ou de perfil não alterem um certificado já emitido.
- Consulta pública (sem sessão) por código de verificação, expondo o mínimo necessário para validar autenticidade.

**Non-Goals:**
- Geração de PDF via lib dedicada (`pdf-lib`, `@react-pdf/renderer` etc.) — v1 usa uma página HTML estilizada para impressão/"salvar como PDF" do navegador, consistente com a ausência de libs de renderização pesadas hoje no projeto.
- Revogação/expiração de certificado, ou reemissão com dados atualizados após a emissão original.
- Validação de CPF contra uma base externa (Receita Federal). V1 valida apenas formato e dígitos verificadores (algoritmo determinístico, sem chamada externa).
- Assinatura digital/criptográfica do certificado (ex: hash assinado, PDF/A com certificado digital) — o código de verificação por si só é o mecanismo de prova em v1.

## Decisions

### 1. Novos campos `fullName`/`cpf` diretamente em `User`, não uma tabela de perfil separada
`User` ganha `fullName String?` e `cpf String?` (nullable — nem todo usuário emite certificado). Alternativa considerada: tabela `user_profiles` 1:1 — rejeitada por ser overhead sem necessidade hoje, já que são só dois campos opcionais usados por uma única capacidade; se mais campos de perfil formal surgirem depois, dá para extrair.

### 2. `cpf` sem constraint de unicidade no banco
CPF é armazenado normalizado (somente dígitos) mas sem `@unique`. Motivo: não há hoje mecanismo de mesclar contas, e um `@unique` cru bloquearia cenários legítimos (ex: aluno recria conta com outro e-mail Google) com um erro de banco pouco claro. A validação é de formato/dígito verificador, não de posse. Fica como **Open Question** se uma constraint de unicidade (com tratamento de erro amigável) deve entrar depois.

### 3. Model `Certificate` dedicado, com snapshot completo — não um "flag" em `Enrollment`
```
Certificate {
  id               uuid
  userId           -> User
  courseId         -> Course
  verificationCode String @unique   // curto, amigável, ex: "WL-7K9P-2QXR"
  fullNameSnapshot String
  cpfSnapshot      String
  courseTitleSnapshot String
  modulesSnapshot  Json    // [{ title, lessons: [{ title }] }] no momento da emissão
  issuedAt         DateTime @default(now())

  @@unique([userId, courseId])
}
```
Snapshot (nome, CPF, título do curso, módulos/aulas) é copiado no momento da emissão em vez de sempre resolvido ao vivo a partir de `User`/`Course`/`Module`/`Lesson`. Alternativa considerada: resolver tudo ao vivo via relations e só persistir `verificationCode` — rejeitada porque um certificado é um documento histórico; se o aluno corrigir o nome depois, ou o professor renomear uma aula/módulo, um certificado já emitido não deve mudar retroativamente. `@@unique([userId, courseId])` garante a idempotência (um certificado por aluno por curso).

### 4. Elegibilidade recalculada no servidor a cada tentativa de emissão, nunca confiada do client
A Server Action de emissão sempre recomputa `computeModulesProgress` (via `coursesService`) para o par curso/usuário antes de criar o `Certificate` — o botão "Emitir certificado" na UI é só uma otimização visual (só aparece quando a página já sabe que está 100%), não a fonte de verdade. Consistente com o padrão já usado em `completeLesson`/`submitQuizAttempt` (re-checagem de `isModuleUnlockedForUser` no servidor).

### 5. Código de verificação: aleatório, não derivado de dado sequencial/previsível
Gerado com um gerador aleatório criptográfico (`crypto.randomUUID()` truncado/formatado, ou `crypto.randomBytes` em base32), não a partir do `id` do certificado nem de um contador incremental — evita que alguém adivinhe/itere códigos válidos. Formato amigável para digitar (ex: agrupado em blocos, sem caracteres ambíguos como `0`/`O`, `1`/`I`).

### 6. Rota pública dinâmica exige estender `src/proxy.ts` para prefixos, não só paths exatos
Hoje `publicRoutes` é comparado com `.includes(pathname)` (igualdade exata) — não casa com `/certificates/verify/[code]`. O proxy passa a checar também uma lista de prefixos públicos (`publicRoutePrefixes`, checado com `pathname.startsWith(prefix)`), mantendo `publicRoutes` para paths exatos como hoje. `/certificates/verify` entra como prefixo público; a página de certificado do próprio aluno (`/courses/[courseId]/certificate`) **não** entra — continua exigindo sessão, pois herda o guard de `/courses/**`.

### 7. Página pública de verificação expõe dado mínimo, sem CPF completo
A consulta pública mostra nome completo do aluno, título do curso, data de emissão e a lista de módulos/aulas concluídos — mas **não** o CPF completo (mascarado, ex: `***.***.**9-87`, ou omitido). Motivo: o propósito da verificação é confirmar autenticidade para terceiros (ex: RH de uma empresa), não expor um documento de identificação completo publicamente sem controle de quem consulta.

### 8. Certificado renderizado como página HTML imprimível, sem lib de PDF
`/courses/[courseId]/certificate` renderiza um layout A4-like com CSS de impressão (`@media print`), e o aluno usa "Imprimir/Salvar como PDF" do navegador. Alternativa considerada: gerar PDF no servidor (`pdf-lib`/Puppeteer) — adiada por exigir nova dependência e infraestrutura (Puppeteer notavelmente pesado) para um ganho (arquivo PDF "oficial" vs. impressão do navegador) que não foi pedido explicitamente; reavaliar se o pedido evoluir para download automático de `.pdf` sem interação do usuário.

## Risks / Trade-offs

- **[Risco] `cpf` sem unicidade permite, em teoria, dois usuários emitirem certificados com o mesmo CPF.** → Mitigação: fora do escopo pedido (não há requisito de deduplicação de identidade); documentado como Open Question para decisão futura.
- **[Risco] Snapshot do currículo (`modulesSnapshot` em JSON) duplica dado que já existe em `Module`/`Lesson`, podendo divergir do estado atual do curso.** → Aceito deliberadamente (Decision 3): a divergência é o comportamento desejado — o certificado reflete o currículo como era na conclusão.
- **[Risco] Sem lib de PDF, o "arquivo" do certificado depende do comportamento de impressão do navegador do aluno (varia entre navegadores/SO).** → Mitigação: CSS de impressão dedicado e testado nos navegadores principais; reavaliar geração de PDF no servidor se isso gerar reclamações reais.
- **[Trade-off] Página pública de verificação é acessível por qualquer pessoa com o código, sem rate limiting.** → Aceito em v1 dado que o código é aleatório de alta entropia (não enumerável em prazo prático); reavaliar rate limiting se abuso for observado.

## Migration Plan

1. Migration Prisma: adicionar `fullName`/`cpf` a `User`; criar tabela `certificates` com `@@unique([userId, courseId])` e `verificationCode @unique`.
2. Estender `src/proxy.ts` com suporte a prefixos públicos antes de introduzir a rota `/certificates/verify/[code]`.
3. Deploy aditivo — nenhuma tabela/coluna existente é alterada de forma destrutiva; sem dado retroativo a migrar (não existiam certificados antes).
4. Rollback: migration é aditiva (novas colunas nullable, nova tabela) e reversível sem perda de dado caso a feature precise ser desativada (remover o botão de emissão da UI é suficiente para desligar o fluxo sem reverter schema).

## Open Questions

- `cpf` deveria ter constraint de unicidade (com tratamento de erro amigável na Server Action) para impedir duas contas emitindo certificado com o mesmo CPF? Fica em aberto — v1 não impõe.
- O aluno deve poder editar `fullName`/`cpf` depois de já ter emitido um certificado (sem afetar o snapshot já emitido)? Proposta: sim, mas isso é uma tela de "perfil" que não existe hoje — v1 só coleta esses dados na primeira emissão, sem tela de edição dedicada; fica para tasks.md decidir se um link simples de edição entra neste escopo ou fica para depois.
