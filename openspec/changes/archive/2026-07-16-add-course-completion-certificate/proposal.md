## Why

Hoje, ao concluir todos os módulos de um curso, o aluno não recebe nenhum comprovante formal disso — o único sinal é a barra de progresso em 100% dentro da própria plataforma. Não há como o aluno comprovar a conclusão para terceiros (empregador, instituição), nem como qualquer parte externa validar a autenticidade de um comprovante. Além disso, o cadastro de usuário (`User`) hoje só guarda `name`/`email` vindos do login Google — que não são adequados para um documento formal, pois `name` é sobrescrito a cada login pelo valor retornado pelo Google e não existe CPF.

## What Changes

- Adiciona os campos `fullName` e `cpf` ao `User`, preenchidos pelo próprio aluno (não vêm do Google) e persistidos no banco.
- Ao concluir 100% de um curso (todos os módulos completos, na mesma definição já usada por `computeModulesProgress`/`computeCourseModuleProgress`), o aluno passa a poder emitir um certificado de conclusão.
- Se o aluno ainda não preencheu `fullName`/`cpf`, a tentativa de emitir o certificado primeiro exibe um formulário pedindo esses dados; após salvos, o certificado é emitido na sequência.
- O certificado exibe: nome completo e CPF do aluno, título do curso, lista de todos os módulos e aulas concluídos, data de emissão e um código de verificação único.
- **Nova rota pública** (sem exigir sessão) onde qualquer pessoa pode consultar um código de verificação e confirmar a autenticidade do certificado (curso, nome do aluno, data de emissão), sem precisar estar logada.
- Reemitir/reabrir o certificado de um curso já concluído não gera um novo código — retorna o mesmo certificado já emitido (idempotente).

## Capabilities

### New Capabilities
- `course-certificates`: campos de nome completo/CPF no perfil do aluno, condição de elegibilidade (curso 100% concluído), emissão idempotente do certificado com snapshot do currículo concluído, e a tela autenticada de visualização/impressão do certificado do aluno.
- `certificate-verification`: rota pública (sem autenticação) de consulta de um código de verificação, exibindo os dados do certificado correspondente ou indicando que o código é inválido.

### Modified Capabilities
- (nenhuma — as capacidades de progresso/matrícula existentes são apenas consultadas, não alteradas)

## Impact

- **Schema** (`prisma/schema.prisma`): `User` ganha `fullName String?` e `cpf String?`; novo model `Certificate` (dados do aluno/curso no momento da emissão, snapshot dos módulos/aulas concluídos, `verificationCode` único); nova migration.
- **Autenticação/roteamento** (`src/proxy.ts`): a lista de rotas públicas hoje é uma checagem de igualdade exata (`publicRoutes.includes(pathname)`); a nova rota pública de verificação usa um segmento dinâmico (`/certificates/verify/[code]`), então o proxy precisa passar a reconhecer prefixos públicos, não só paths exatos.
- **Serviços**: novo `src/modules/certificates/certificates.service.ts` (elegibilidade, emissão idempotente, snapshot do currículo, geração/validação de código) e validação de CPF (formato + dígitos verificadores).
- **Server Actions**: `src/modules/certificates/actions.ts` — salvar `fullName`/`cpf` do usuário e emitir certificado.
- **Rotas novas**: `src/app/courses/[courseId]/certificate/page.tsx` (autenticada, visualização/impressão do próprio certificado) e `src/app/certificates/verify/[code]/page.tsx` (pública).
- **Frontend**: botão "Emitir certificado" na tela de detalhe do curso quando 100% concluído; modal/formulário de nome completo + CPF; layout do certificado (imprimível via navegador, sem lib de PDF nova).
