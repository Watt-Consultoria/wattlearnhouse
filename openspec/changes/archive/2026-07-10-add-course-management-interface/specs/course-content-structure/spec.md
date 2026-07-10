## MODIFIED Requirements

### Requirement: Aula suporta conteúdo textual, em vídeo ou misto via Markdown
Uma `Lesson` SHALL ter um único campo `content` (Markdown, obrigatório) como fonte de todo o seu material. Vídeos do YouTube SHALL ser referenciados dentro do `content` usando a notação `[youtube_video](<url>)`, que o renderizador de aulas interpreta e transforma em embed. Equações matemáticas SHALL ser referenciadas usando notação LaTeX delimitada por `$...$` (inline) ou `$$...$$` (bloco), que o renderizador de aulas interpreta e transforma em fórmula renderizada via KaTeX. O sistema SHALL NOT ter um campo `videoUrl` separado, um campo `equations` separado, nem um campo de "tipo de aula" — o tipo de conteúdo é determinado pelo Markdown em `content`, não por um campo dedicado.

#### Scenario: Aula somente com vídeo
- **WHEN** uma `Lesson` é criada com `content` contendo apenas a notação `[youtube_video](<url>)`
- **THEN** o registro é salvo com sucesso

#### Scenario: Aula somente com texto
- **WHEN** uma `Lesson` é criada com `content` contendo texto em Markdown sem nenhuma notação `[youtube_video](<url>)`
- **THEN** o registro é salvo com sucesso

#### Scenario: Aula mista (texto e vídeo)
- **WHEN** uma `Lesson` é criada com `content` combinando texto em Markdown e a notação `[youtube_video](<url>)`
- **THEN** o registro é salvo com sucesso

#### Scenario: Aula sem conteúdo é rejeitada
- **WHEN** uma `Lesson` é criada sem `content`
- **THEN** a operação falha por violação de constraint obrigatória

#### Scenario: Aula com equação matemática
- **WHEN** uma `Lesson` é criada com `content` contendo uma expressão delimitada por `$...$` ou `$$...$$`
- **THEN** o registro é salvo com sucesso, e a tela de aula renderiza a expressão como fórmula matemática em vez de texto literal
