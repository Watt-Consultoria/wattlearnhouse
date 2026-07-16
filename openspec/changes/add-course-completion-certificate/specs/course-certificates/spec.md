## ADDED Requirements

### Requirement: Certificado só pode ser emitido com o curso 100% concluído
O sistema SHALL permitir a emissão de um certificado de conclusão para um `Course` apenas quando todos os `Module` desse curso estiverem completos para o usuário (todas as `Lesson` com `LessonProgress` e, quando o módulo possuir `Quiz`, uma `QuizAttempt` aprovada), usando a mesma definição de conclusão já usada pelo player do curso. Essa condição SHALL ser reavaliada no servidor a cada tentativa de emissão, independentemente do que a interface já exibe.

#### Scenario: Curso totalmente concluído permite emissão
- **WHEN** um usuário com todos os módulos de um `Course` completos aciona a emissão do certificado desse curso
- **THEN** o certificado é emitido com sucesso

#### Scenario: Curso incompleto rejeita emissão
- **WHEN** um usuário com ao menos um módulo incompleto tenta emitir o certificado desse curso, inclusive chamando a ação diretamente sem passar pela tela
- **THEN** a emissão é rejeitada e nenhum `Certificate` é criado

### Requirement: Nome completo e CPF são coletados antes da primeira emissão
Se o usuário ainda não possui `fullName` e `cpf` preenchidos, o sistema SHALL exibir um formulário solicitando esses dados antes de emitir o primeiro certificado. Após o preenchimento válido, os dados SHALL ser persistidos no `User` e a emissão SHALL prosseguir automaticamente, sem exigir uma segunda ação do usuário.

#### Scenario: Primeira emissão sem dados de perfil
- **WHEN** um usuário sem `fullName`/`cpf` preenchidos aciona a emissão de um certificado de um curso concluído
- **THEN** o sistema exibe um formulário pedindo nome completo e CPF antes de gerar o certificado

#### Scenario: Emissões seguintes não pedem os dados novamente
- **WHEN** um usuário que já preencheu `fullName`/`cpf` anteriormente aciona a emissão do certificado de outro curso concluído
- **THEN** o certificado é emitido diretamente, sem exibir o formulário novamente

### Requirement: CPF é validado por formato e dígitos verificadores
O sistema SHALL validar que o `cpf` informado tem 11 dígitos e dígitos verificadores válidos segundo o algoritmo padrão de CPF antes de persistir. Um CPF com formato ou dígitos verificadores inválidos SHALL ser rejeitado, exibindo o erro ao usuário sem persistir nenhum dado.

#### Scenario: CPF válido é aceito
- **WHEN** o usuário informa um CPF com 11 dígitos e dígitos verificadores corretos
- **THEN** o CPF é salvo no `User` e a emissão prossegue

#### Scenario: CPF com dígito verificador inválido é rejeitado
- **WHEN** o usuário informa um CPF com 11 dígitos mas dígitos verificadores incorretos
- **THEN** o sistema rejeita o envio, exibe um erro de validação, e não persiste o valor nem emite o certificado

### Requirement: Emissão é idempotente por aluno e curso
O sistema SHALL emitir no máximo um `Certificate` por combinação de usuário e curso. Uma nova tentativa de emissão para um curso já certificado pelo mesmo usuário SHALL retornar o certificado já existente (mesmo `verificationCode`), sem criar um novo registro.

#### Scenario: Reemitir retorna o certificado existente
- **WHEN** um usuário que já emitiu certificado para um curso aciona a emissão desse mesmo curso novamente
- **THEN** o sistema exibe o mesmo certificado, com o mesmo código de verificação já emitido anteriormente

### Requirement: Certificado registra um retrato imutável do momento da emissão
Ao emitir, o sistema SHALL gravar no `Certificate` uma cópia (snapshot) do nome completo, CPF e título do curso do usuário, além da lista completa de módulos concluídos com suas respectivas aulas concluídas, no estado em que estavam no momento da emissão. Alterações posteriores ao nome/CPF do usuário, ao título do curso, ou aos módulos/aulas SHALL NOT alterar um certificado já emitido.

#### Scenario: Certificado preserva o nome usado na emissão
- **WHEN** um usuário emite um certificado e, em seguida, seu `fullName` é alterado
- **THEN** o certificado já emitido continua exibindo o nome que estava vigente no momento da emissão

### Requirement: Página do certificado é acessível apenas pelo próprio aluno
A tela de visualização do certificado emitido SHALL ser acessível apenas ao usuário autenticado que é o dono desse `Certificate`. Qualquer outro usuário autenticado tentando acessar o certificado de outra pessoa SHALL ser rejeitado.

#### Scenario: Dono do certificado acessa a própria tela de certificado
- **WHEN** o usuário dono de um `Certificate` acessa a tela de visualização desse certificado
- **THEN** a tela exibe nome completo, CPF, curso, módulos/aulas concluídos, data de emissão e código de verificação

#### Scenario: Usuário tenta acessar certificado de outra pessoa
- **WHEN** um usuário autenticado tenta acessar a URL da tela de certificado pertencente a outro usuário
- **THEN** o acesso é negado e nenhum dado do certificado é exibido
