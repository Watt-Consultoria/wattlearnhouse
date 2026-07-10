## Purpose

Quiz por módulo (opcional, no máximo 1 por módulo): banco de questões de múltipla escolha, submissão com nota mínima de 70% para aprovar, histórico de tentativas, e tela de revisão de respostas.

## Requirements

### Requirement: Um módulo tem no máximo um quiz
Um `Module` SHALL ter no máximo um `Quiz` associado (relação opcional 1—0..1). Um `Quiz` SHALL ter uma ou mais `QuizQuestion`, cada uma com opções de múltipla escolha, exatamente uma opção correta e uma explicação exibida na revisão.

#### Scenario: Módulo sem quiz
- **WHEN** um `Module` não possui `Quiz` associado
- **THEN** sua lista de aulas não exibe nenhuma etapa de quiz, e seu desbloqueio (ver `lesson-progress-tracking`) depende apenas da conclusão das aulas

#### Scenario: Módulo com quiz
- **WHEN** um `Module` possui um `Quiz` associado
- **THEN** o quiz é exibido como a etapa final desse módulo, após todas as suas aulas

### Requirement: Submissão de quiz é corrigida e pontuada no servidor
Ao submeter respostas para um `Quiz`, o sistema SHALL calcular a pontuação comparando cada resposta selecionada com a opção correta de cada `QuizQuestion`, e SHALL registrar uma `QuizAttempt` com `score`, `totalQuestions`, as respostas selecionadas e se o usuário foi aprovado (`passed`). A submissão só SHALL ser aceita quando todas as questões do quiz tiverem uma resposta selecionada.

#### Scenario: Submissão completa é aceita
- **WHEN** um usuário responde todas as questões do quiz e envia
- **THEN** uma `QuizAttempt` é criada com a pontuação calculada no servidor a partir das respostas enviadas, não confiando em uma nota calculada no cliente

#### Scenario: Submissão incompleta é rejeitada
- **WHEN** um usuário tenta enviar o quiz sem responder todas as questões
- **THEN** a submissão é rejeitada e nenhuma `QuizAttempt` é criada

### Requirement: Nota mínima de aprovação é 70%
Uma `QuizAttempt` SHALL ser marcada como `passed = true` quando `score / totalQuestions >= 0.7`, e `passed = false` caso contrário.

#### Scenario: Pontuação igual ou acima do mínimo aprova
- **WHEN** um usuário acerta 70% ou mais das questões de uma tentativa
- **THEN** a `QuizAttempt` é registrada com `passed = true`

#### Scenario: Pontuação abaixo do mínimo reprova
- **WHEN** um usuário acerta menos de 70% das questões de uma tentativa
- **THEN** a `QuizAttempt` é registrada com `passed = false`

### Requirement: Tentativas de quiz têm histórico e podem ser refeitas
O sistema SHALL manter todas as `QuizAttempt` de um usuário para um `Quiz` (histórico), permitindo múltiplas tentativas. Após uma tentativa reprovada, o usuário SHALL poder iniciar uma nova tentativa do mesmo quiz.

#### Scenario: Nova tentativa após reprovação
- **WHEN** um usuário reprova em uma tentativa e opta por tentar novamente
- **THEN** uma nova `QuizAttempt` pode ser criada para o mesmo `Quiz` e usuário, preservando a tentativa anterior no histórico

### Requirement: Revisão de tentativa mostra resposta do usuário, resposta correta e explicação
Após a submissão, a tela de resultado SHALL exibir, para cada questão, a opção escolhida pelo usuário, a opção correta e a explicação associada à questão.

#### Scenario: Revisão de uma questão respondida corretamente
- **WHEN** o usuário visualiza o resultado de uma tentativa em que acertou uma questão
- **THEN** a questão é exibida indicando a opção escolhida como correta, com a explicação da questão

#### Scenario: Revisão de uma questão respondida incorretamente
- **WHEN** o usuário visualiza o resultado de uma tentativa em que errou uma questão
- **THEN** a questão é exibida indicando tanto a opção escolhida pelo usuário (marcada como incorreta) quanto a opção correta, com a explicação da questão

### Requirement: Submissão de quiz exige sessão válida e módulo desbloqueado
Submeter um `Quiz` SHALL exigir uma sessão de usuário válida, e o módulo ao qual o quiz pertence SHALL estar desbloqueado para esse usuário (ver `lesson-progress-tracking`).

#### Scenario: Submissão sem sessão válida é rejeitada
- **WHEN** uma requisição de submissão de quiz chega sem sessão de usuário válida
- **THEN** a operação é rejeitada e nenhuma `QuizAttempt` é criada

#### Scenario: Submissão de quiz de módulo bloqueado é rejeitada
- **WHEN** um usuário tenta submeter o quiz de um módulo que ainda está bloqueado para ele
- **THEN** a operação é rejeitada no servidor
