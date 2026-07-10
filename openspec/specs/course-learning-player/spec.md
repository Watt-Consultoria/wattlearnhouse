## Purpose

UI de navegação e consumo do conteúdo do aluno — catálogo com busca/filtro, detalhe do curso com lista de módulos, lista de aulas de um módulo, e o player de conteúdo da aula (vídeo/texto), tudo mobile-first e roteável por URL real.

## Requirements

### Requirement: Acesso autenticado a todas as telas do catálogo e player
Todas as telas desta capacidade (catálogo, curso, módulo, aula) SHALL exigir uma sessão de usuário válida. Um usuário sem sessão válida acessando qualquer uma dessas rotas SHALL ser redirecionado para `/login`.

#### Scenario: Acesso sem sessão é redirecionado
- **WHEN** um usuário sem sessão válida acessa `/courses` ou qualquer rota aninhada abaixo dela
- **THEN** o sistema redireciona para `/login` antes de renderizar qualquer dado de curso

### Requirement: Catálogo de cursos lista todos os cursos com metadados essenciais
A rota `/courses` SHALL listar todos os `Course` do banco, exibindo título, descrição, categoria, nível, duração total (soma de `durationMinutes` das aulas do curso) e capa (ou fallback visual quando ausente/indisponível).

#### Scenario: Catálogo sem filtro ativo lista todos os cursos
- **WHEN** o usuário acessa `/courses` sem aplicar nenhum filtro
- **THEN** todos os `Course` existentes são exibidos

#### Scenario: Capa ausente usa fallback visual
- **WHEN** um `Course` tem `coverImageUrl` nulo, ou a URL falha ao carregar
- **THEN** o card do curso exibe um painel sólido com as iniciais do curso, nunca um ícone de imagem quebrada

### Requirement: Catálogo é filtrável por categoria/nível e pesquisável por texto
O catálogo SHALL permitir filtrar cursos por categoria e por nível, e pesquisar por texto que corresponda ao título ou às tags do curso. Os filtros de categoria exibidos SHALL ser derivados dos valores distintos de `category` presentes nos cursos existentes, não de uma lista fixa no código.

#### Scenario: Filtrar por categoria
- **WHEN** o usuário seleciona uma categoria no filtro
- **THEN** somente cursos com `category` igual à selecionada são exibidos

#### Scenario: Buscar por termo
- **WHEN** o usuário digita um termo que corresponde ao título ou a uma tag de ao menos um curso
- **THEN** somente os cursos correspondentes são exibidos

#### Scenario: Nenhum resultado encontrado
- **WHEN** a combinação de filtro/busca não corresponde a nenhum curso
- **THEN** a tela exibe um estado vazio explicando que nenhum curso foi encontrado, sem erro

### Requirement: Navegação por URL real entre catálogo, curso, módulo e aula
Cada nível da hierarquia (catálogo, curso, módulo, aula, quiz) SHALL ter uma URL própria e navegável diretamente (deep link), com suporte nativo aos botões voltar/avançar do navegador.

#### Scenario: Acesso direto a uma URL de aula
- **WHEN** um usuário com sessão válida acessa diretamente a URL de uma aula específica (sem navegar a partir do catálogo)
- **THEN** a aula correspondente é renderizada normalmente, com a mesma trilha de navegação (breadcrumb) que teria ao chegar navegando

#### Scenario: Botão voltar do navegador
- **WHEN** o usuário navega do catálogo até uma aula e aciona o botão "voltar" do navegador
- **THEN** a tela anterior na hierarquia é exibida, refletindo a URL correspondente

### Requirement: Trilha de navegação (breadcrumb) adaptada para mobile
Toda tela abaixo do catálogo SHALL exibir uma trilha de navegação indicando curso > módulo > aula (conforme aplicável). Abaixo de um breakpoint mobile, a trilha completa SHALL ser substituída por, no mínimo, uma ação de "voltar" para o nível imediatamente anterior.

#### Scenario: Breadcrumb completo em telas largas
- **WHEN** a tela de conteúdo de aula é exibida em um viewport largo (desktop)
- **THEN** a trilha completa curso > módulo > aula é exibida e cada nível é clicável

#### Scenario: Breadcrumb colapsado em mobile
- **WHEN** a mesma tela é exibida em um viewport mobile
- **THEN** ao menos uma ação de voltar para o nível anterior está visível e acionável, sem exigir rolagem horizontal

### Requirement: Conteúdo da aula renderiza o Markdown único, com vídeo embutido inline
A tela de conteúdo de aula SHALL renderizar o campo `content` da `Lesson` como um único fluxo de Markdown. Onde a notação `[youtube_video](<url>)` ocorrer dentro do `content`, um player de vídeo embutido SHALL ser renderizado naquele ponto do fluxo. A tela SHALL NOT depender de um seletor de aba entre "vídeo" e "texto".

#### Scenario: Aula somente texto
- **WHEN** uma `Lesson` tem `content` em Markdown sem a notação de vídeo
- **THEN** a tela renderiza o texto formatado, sem nenhum player de vídeo

#### Scenario: Aula mista (texto e vídeo)
- **WHEN** uma `Lesson` tem `content` combinando texto e a notação de vídeo
- **THEN** a tela renderiza o texto e o player de vídeo embutido no ponto correspondente do conteúdo

### Requirement: Lista de aulas do módulo acessível em qualquer tamanho de tela
A partir da tela de conteúdo de aula, a lista das demais aulas do módulo SHALL estar acessível tanto em telas largas quanto em telas pequenas — em mobile, através de um controle expansível, não apenas oculta.

#### Scenario: Lista de aulas em mobile
- **WHEN** a tela de conteúdo de aula é exibida em um viewport mobile
- **THEN** o usuário consegue abrir e visualizar a lista das demais aulas do módulo sem sair da tela atual
