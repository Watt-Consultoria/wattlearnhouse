## ADDED Requirements

### Requirement: Consulta pública de código de verificação sem exigir sessão
O sistema SHALL expor uma rota pública onde qualquer visitante, autenticado ou não, pode consultar um código de verificação de certificado. Essa rota SHALL NOT redirecionar para `/login` nem exigir sessão válida, mesmo que o restante da aplicação exija autenticação por padrão.

#### Scenario: Visitante sem sessão consulta um código
- **WHEN** um visitante sem nenhuma sessão ativa acessa a rota pública de verificação com um código de certificado
- **THEN** a página é exibida normalmente, sem redirecionamento para `/login`

### Requirement: Código válido exibe os dados do certificado, sem o CPF completo
Quando o código consultado corresponde a um `Certificate` existente, o sistema SHALL exibir nome completo do aluno, título do curso, data de emissão, e a lista de módulos e aulas concluídos registrada no certificado. O CPF SHALL ser exibido mascarado (apenas os últimos dígitos visíveis) ou omitido, nunca em texto completo nessa rota pública.

#### Scenario: Código válido mostra os dados esperados
- **WHEN** um visitante consulta um código de verificação que corresponde a um certificado existente
- **THEN** a página exibe nome completo do aluno, curso, data de emissão e a lista de módulos/aulas concluídos daquele certificado

#### Scenario: CPF nunca aparece completo na consulta pública
- **WHEN** um visitante consulta um código de verificação válido
- **THEN** o CPF do aluno, se exibido, aparece mascarado, nunca com todos os 11 dígitos visíveis

### Requirement: Código inválido ou inexistente é tratado sem erro técnico
Quando o código consultado não corresponde a nenhum `Certificate`, o sistema SHALL exibir uma mensagem indicando que o código é inválido ou não foi encontrado, sem expor erro técnico nem dado de nenhum certificado existente.

#### Scenario: Código inexistente
- **WHEN** um visitante consulta um código que não corresponde a nenhum certificado emitido
- **THEN** a página informa que o código é inválido, sem exibir dado de certificado algum
