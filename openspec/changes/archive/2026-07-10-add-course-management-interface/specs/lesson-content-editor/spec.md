## ADDED Requirements

### Requirement: Preview de Markdown em tempo real
O editor de `Lesson.content` SHALL exibir, lado a lado com o campo de edição de texto, um preview renderizado do Markdown que é atualizado a cada alteração do texto, sem exigir uma ação explícita de "visualizar". O preview SHALL usar o mesmo componente de renderização usado na tela de aula do aluno, de forma que o que o professor vê no preview seja exatamente o que o aluno verá ao salvar.

#### Scenario: Digitar atualiza o preview imediatamente
- **WHEN** o professor digita `**importante**` no campo de edição
- **THEN** o preview exibe "importante" em negrito sem necessidade de recarregar ou clicar em qualquer botão

#### Scenario: Preview idêntico ao render final da aula
- **WHEN** o professor salva uma aula cujo `content` foi validado no preview do editor
- **THEN** a tela de aula do aluno renderiza esse `content` de forma visualmente idêntica ao que era exibido no preview

### Requirement: Barra de ferramentas de formatação
O editor SHALL oferecer botões que inserem ou envolvem o texto selecionado com a sintaxe Markdown correspondente para: negrito (`**texto**`), itálico (`*texto*`), código inline (`` `texto` ``), bloco de código (` ```\ntexto\n``` `), tabela (snippet de tabela Markdown com cabeçalho), e embed de vídeo do YouTube (`[youtube_video](<url>)`).

#### Scenario: Botão de negrito envolve o texto selecionado
- **WHEN** o professor seleciona um trecho de texto e clica no botão de negrito
- **THEN** o trecho selecionado passa a estar envolvido por `**` no campo de edição

#### Scenario: Botão de YouTube insere a notação com um placeholder de URL
- **WHEN** o professor clica no botão de inserir vídeo do YouTube sem texto selecionado
- **THEN** o snippet `[youtube_video](<url>)` (ou equivalente com placeholder editável) é inserido na posição do cursor

#### Scenario: Botão de tabela insere um snippet editável
- **WHEN** o professor clica no botão de tabela
- **THEN** um snippet de tabela Markdown com pelo menos duas colunas e uma linha de dados é inserido na posição do cursor, pronto para ser editado

### Requirement: Suporte a equações matemáticas no editor
A barra de ferramentas SHALL incluir um botão que insere o delimitador de equação em bloco (`$$...$$`) na posição do cursor, e o preview SHALL renderizar tanto equações inline (`$...$`) quanto em bloco (`$$...$$`) via KaTeX.

#### Scenario: Equação em bloco é renderizada no preview
- **WHEN** o campo de edição contém `$$E = mc^2$$`
- **THEN** o preview exibe a equação renderizada visualmente, não o texto literal `$$E = mc^2$$`

#### Scenario: Equação inválida não quebra o preview
- **WHEN** o campo de edição contém uma expressão LaTeX malformada entre `$...$`
- **THEN** o preview exibe um indicador de erro pontual na equação, sem impedir a renderização do restante do conteúdo

### Requirement: Editor utilizável em mobile
Quando a viewport for estreita o suficiente para não caber editor e preview lado a lado, o sistema SHALL oferecer um alternador (abas ou botão) entre o modo "Editar" e o modo "Visualizar", em vez de esconder um dos dois painéis permanentemente.

#### Scenario: Alternar entre editar e visualizar em viewport estreita
- **WHEN** o professor está em uma viewport abaixo do breakpoint de split-pane e alterna para "Visualizar"
- **THEN** o preview renderizado ocupa a tela no lugar do campo de edição, e o professor consegue voltar para "Editar" a qualquer momento
