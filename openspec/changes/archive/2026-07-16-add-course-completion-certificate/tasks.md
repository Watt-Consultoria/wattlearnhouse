## 1. Schema

- [x] 1.1 Adicionar `fullName String?` e `cpf String?` ao model `User` em `prisma/schema.prisma`
- [x] 1.2 Adicionar model `Certificate` (`id`, `userId`, `courseId`, `verificationCode` único, `fullNameSnapshot`, `cpfSnapshot`, `courseTitleSnapshot`, `modulesSnapshot` Json, `issuedAt`), com `@@unique([userId, courseId])`, relations com `onDelete: Cascade` a partir de `User`/`Course`
- [x] 1.3 Gerar e rodar a migration (`prisma migrate dev`)

## 2. Utilitário de CPF

- [x] 2.1 Criar `src/modules/certificates/cpf.ts` com `isValidCpf(cpf: string): boolean` (checagem de 11 dígitos + algoritmo de dígitos verificadores) e um formatter/mask (`maskCpf`) para exibição parcial (`***.***.**9-87`)

## 3. Serviço de certificados (course-certificates)

- [x] 3.1 Criar `src/modules/certificates/certificates.service.ts` com `isCourseComplete(courseId, userId)`, reaproveitando `computeModulesProgress`/a lógica já usada por `coursesService`
- [x] 3.2 Implementar `getCertificateForUserCourse(courseId, userId)` — retorna certificado já emitido, se existir
- [x] 3.3 Implementar geração de `verificationCode` aleatório e de alta entropia (ex: `crypto.randomBytes` em base32, formatado em blocos, sem caracteres ambíguos), com checagem de colisão antes de persistir
- [x] 3.4 Implementar `issueCertificate(courseId, userId)` — recomputa conclusão no servidor, é idempotente via `@@unique([userId, courseId])` (retorna o existente em vez de duplicar em caso de corrida), monta `modulesSnapshot` a partir dos módulos/aulas do curso
- [x] 3.5 Implementar `getCertificateByVerificationCode(code)` para uso da rota pública

## 4. Server Actions (course-certificates)

- [x] 4.1 Criar `src/modules/certificates/actions.ts` com `saveCertificateProfile(fullName, cpf)` — valida CPF via `isValidCpf`, persiste `fullName`/`cpf` no `User` autenticado, retorna erro de validação sem persistir se inválido
- [x] 4.2 Criar `issueCourseCertificate(courseId)` — checa sessão, checa `fullName`/`cpf` preenchidos (retorna sinal para a UI abrir o formulário se faltando), checa `isCourseComplete`, chama `issueCertificate`, retorna o certificado ou erro

## 5. Roteamento público (certificate-verification)

- [x] 5.1 Estender `src/proxy.ts` com uma lista `publicRoutePrefixes` checada via `pathname.startsWith(prefix)`, mantendo `publicRoutes` (igualdade exata) como está hoje
- [x] 5.2 Adicionar `/certificates/verify` a `publicRoutePrefixes`

## 6. UI — emissão e visualização (course-certificates)

- [x] 6.1 Adicionar botão "Emitir certificado" em `src/app/courses/[courseId]/page.tsx`, visível apenas quando `progressPercent === 100` (ou equivalente já retornado por `getCourseDetail`)
- [x] 6.2 Criar formulário/modal de nome completo + CPF, exibido quando `issueCourseCertificate` sinaliza dados de perfil faltando; ao salvar com sucesso, prossegue automaticamente para a emissão
- [x] 6.3 Criar página `src/app/courses/[courseId]/certificate/page.tsx` — autenticada, valida que o usuário logado é o dono do certificado (senão nega acesso), exibe nome, CPF (completo, é o próprio dono), curso, lista de módulos/aulas concluídos, data de emissão e código de verificação
- [x] 6.4 Estilo de impressão (`@media print`) para a página do certificado, formato A4-like, sem elementos de navegação da aplicação ao imprimir

## 7. UI — verificação pública (certificate-verification)

- [x] 7.1 Criar página `src/app/certificates/verify/[code]/page.tsx` — sem exigir sessão, busca via `getCertificateByVerificationCode`
- [x] 7.2 Estado "código válido": exibe nome completo do aluno, curso, data de emissão, módulos/aulas concluídos e CPF mascarado (via `maskCpf`)
- [x] 7.3 Estado "código inválido/inexistente": mensagem clara, sem erro técnico nem dado de outro certificado
- [x] 7.4 Adicionar campo/link de busca por código na própria página de verificação (para quando o visitante chega sem código na URL) ou aceitar apenas acesso via link direto — decidir no momento da implementação conforme UX mínima necessária

## 8. Verificação manual

- [x] 8.1 Fluxo completo: concluir todos os módulos de um curso de teste → clicar em "Emitir certificado" → preencher nome/CPF (com CPF inválido primeiro, confirmando rejeição, depois válido) → certificado emitido e exibido — verificado via script contra `npm run dev` + banco real: `isValidCpf` rejeita CPF com dígito verificador errado e sequência repetida, aceita CPF válido; `issueCertificate` recusa sem `fullName`/`cpf` e emite com sucesso após preenchidos, com snapshot correto (nome, CPF, 3 módulos)
- [x] 8.2 Reemitir o mesmo curso → confirmar que o código de verificação retornado é o mesmo da primeira emissão (nenhum novo registro em `Certificate`) — verificado: mesmo `id`/`verificationCode` na reemissão, exatamente 1 linha em `certificates` para o par (aluno, curso)
- [x] 8.3 Tentar emitir certificado de um curso incompleto diretamente via Server Action (sem passar pela UI) → confirmar rejeição — verificado: `issueCertificate` retorna `null` para um curso com módulo em andamento, mesmo com `fullName`/`cpf` já preenchidos
- [x] 8.4 Acessar `/courses/[courseId]/certificate` de um certificado de outro usuário → confirmar acesso negado — verificado via curl com cookie de sessão real (JWT assinado com `SESSION_SECRET`): dono recebe HTTP 200 com seus dados; segundo usuário autenticado (sem certificado nesse curso) recebe HTTP 404; sem sessão alguma, HTTP 307 para `/login`
- [x] 8.5 Acessar `/certificates/verify/[code]` sem sessão ativa (logout completo) com um código válido → confirmar que a página carrega sem redirecionar para `/login`, e que o CPF exibido está mascarado — verificado via curl sem nenhum cookie: HTTP 200 (sem redirect), payload contém `***.***.**7-35` e não contém o CPF completo (`11144477735`) em nenhum lugar da resposta
- [x] 8.6 Acessar `/certificates/verify/[code]` com um código inexistente → confirmar mensagem de "não encontrado" sem erro — verificado via curl sem sessão: HTTP 200, corpo contém "não encontrado", sem stack trace/erro técnico
