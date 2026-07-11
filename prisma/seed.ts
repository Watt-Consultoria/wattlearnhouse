import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const TEACHER_GOOGLE_ID = "seed-teacher-google-id";
const TEACHER2_GOOGLE_ID = "seed-teacher2-google-id";
const STUDENT_GOOGLE_ID = "seed-student-google-id";
const STUDENT2_GOOGLE_ID = "seed-student2-google-id";
const ADMIN_GOOGLE_ID = "seed-admin-google-id";

const YOUTUBE_SAMPLE_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
const COVER_A = "https://picsum.photos/id/1010/800/450";
const COVER_B = "https://picsum.photos/id/1050/800/450";
const COVER_C = "https://picsum.photos/id/1043/800/450";

type CourseSeed = {
  id: string;
  title: string;
  description: string;
  category: string;
  coverImageUrl: string | null;
  modules: ModuleSeed[];
};

type ModuleSeed = {
  id: string;
  title: string;
  order: number;
  lessons: LessonSeed[];
  quiz?: QuizSeed;
};

type LessonSeed = {
  id: string;
  title: string;
  content: string;
  order: number;
};

type QuizSeed = {
  id: string;
  questions: QuizQuestionSeed[];
};

type QuizQuestionSeed = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  order: number;
};

const COURSE_A: CourseSeed = {
  id: "11111111-0000-0000-0000-000000000000",
  title: "Fundamentos de Instalações Elétricas",
  description:
    "Aprenda os conceitos essenciais para projetar, executar e manter instalações elétricas residenciais com segurança.",
  category: "Elétrica",
  coverImageUrl: COVER_A,
  modules: [
    {
      id: "11111111-0000-0000-0001-000000000000",
      title: "Segurança em Instalações Elétricas",
      order: 1,
      lessons: [
        {
          id: "11111111-0000-0000-0001-000000000001",
          title: "Riscos elétricos e como preveni-los",
          order: 1,
          content:
            "A eletricidade é essencial no dia a dia, mas apresenta riscos reais quando manuseada sem os cuidados adequados: choques, curtos-circuitos e incêndios.\n\n" +
            `[youtube_video](${YOUTUBE_SAMPLE_URL})\n\n` +
            "## Principais riscos\n\n- Choque elétrico por contato direto ou indireto\n- Arco elétrico\n- Incêndio por sobrecarga\n\nNas próximas aulas, você vai aprender a identificar e mitigar cada um desses riscos.",
        },
        {
          id: "11111111-0000-0000-0001-000000000002",
          title: "Equipamentos de Proteção Individual (EPIs)",
          order: 2,
          content:
            "Antes de qualquer intervenção elétrica, o uso correto de EPIs é obrigatório.\n\n## EPIs essenciais\n\n1. Luvas isolantes\n2. Óculos de proteção\n3. Calçado isolante\n4. Vestimenta antichama\n\nCada EPI deve ser inspecionado antes do uso e substituído ao primeiro sinal de dano.",
        },
        {
          id: "11111111-0000-0000-0001-000000000003",
          title: "Desenergização segura de circuitos",
          order: 3,
          content:
            "Antes de intervir em qualquer instalação, siga sempre a sequência: desligar, bloquear, sinalizar e testar a ausência de tensão.\n\nEssa prática, conhecida como LOTO (*Lockout/Tagout*), evita que o circuito seja religado acidentalmente durante o serviço.",
        },
      ],
    },
    {
      id: "11111111-0000-0000-0002-000000000000",
      title: "Circuitos Residenciais Básicos",
      order: 2,
      lessons: [
        {
          id: "11111111-0000-0000-0002-000000000001",
          title: "Tensão, corrente e potência",
          order: 1,
          content:
            "Os três pilares da eletrotécnica: tensão (V), corrente (A) e potência (W), relacionados pela Lei de Ohm e pela fórmula de potência elétrica.\n\n```\nP = V x I\nV = R x I\n```\n\nEntender essas grandezas é fundamental para dimensionar qualquer circuito residencial.",
        },
        {
          id: "11111111-0000-0000-0002-000000000002",
          title: "Disjuntores e dispositivos de proteção",
          order: 2,
          content:
            "Disjuntores termomagnéticos, DRs e DPS protegem pessoas e equipamentos contra sobrecorrentes, fugas de corrente e surtos.\n\n## Quando cada um atua\n\n- **Disjuntor termomagnético**: sobrecarga e curto-circuito\n- **DR (Dispositivo Diferencial Residual)**: fuga de corrente para a terra\n- **DPS (Dispositivo de Proteção contra Surtos)**: picos de tensão, como descargas atmosféricas",
        },
        {
          id: "11111111-0000-0000-0002-000000000003",
          title: "Aterramento residencial",
          order: 3,
          content:
            "O aterramento cria um caminho seguro para correntes de fuga, reduzindo drasticamente o risco de choque.\n\nO condutor terra é identificado pela cor verde ou verde-amarelo e deve estar presente em toda tomada e equipamento metálico da instalação.",
        },
      ],
      quiz: {
        id: "11111111-0000-0000-0002-000000000999",
        questions: [
          {
            id: "11111111-0000-0000-0002-000000000991",
            question: "Qual é a tensão padrão residencial no Brasil?",
            options: ["110V ou 220V", "440V", "12V", "24V"],
            correctIndex: 0,
            explanation:
              "No Brasil, a tensão residencial padrão é 110V ou 220V, dependendo da região.",
            order: 1,
          },
          {
            id: "11111111-0000-0000-0002-000000000992",
            question: "O que é um disjuntor?",
            options: [
              "Um dispositivo de proteção contra sobrecarga e curto-circuito",
              "Um tipo de lâmpada",
              "Um cabo condutor",
              "Um transformador de tensão",
            ],
            correctIndex: 0,
            explanation:
              "O disjuntor protege o circuito contra sobrecorrentes, desarmando automaticamente.",
            order: 2,
          },
          {
            id: "11111111-0000-0000-0002-000000000993",
            question:
              "Qual cor de fio é convencionalmente usada para o condutor terra?",
            options: ["Verde ou verde-amarelo", "Vermelho", "Azul", "Preto"],
            correctIndex: 0,
            explanation:
              "A cor verde ou verde-amarelo é padronizada internacionalmente para o condutor de proteção (terra).",
            order: 3,
          },
        ],
      },
    },
    {
      id: "11111111-0000-0000-0003-000000000000",
      title: "Leitura de Diagramas Elétricos",
      order: 3,
      lessons: [
        {
          id: "11111111-0000-0000-0003-000000000001",
          title: "Símbolos elétricos essenciais",
          order: 1,
          content:
            "Todo diagrama elétrico usa uma linguagem simbólica padronizada. Reconhecer os símbolos de tomadas, interruptores, disjuntores e luminárias é o primeiro passo para interpretar qualquer projeto.",
        },
        {
          id: "11111111-0000-0000-0003-000000000002",
          title: "Interpretando um projeto residencial completo",
          order: 2,
          content:
            "Com os símbolos dominados, você já consegue seguir um diagrama unifilar do quadro de distribuição até o último ponto de consumo da instalação.",
        },
      ],
    },
  ],
};

const COURSE_B: CourseSeed = {
  id: "22222222-0000-0000-0000-000000000000",
  title: "Automação Industrial com CLP",
  description:
    "Domine os fundamentos de Controladores Lógicos Programáveis (CLPs) e a programação em linguagem Ladder para automação de processos industriais.",
  category: "Automação",
  coverImageUrl: COVER_B,
  modules: [
    {
      id: "22222222-0000-0000-0001-000000000000",
      title: "Introdução a CLPs",
      order: 1,
      lessons: [
        {
          id: "22222222-0000-0000-0001-000000000001",
          title: "O que é um CLP e onde ele é usado",
          order: 1,
          content:
            "Um Controlador Lógico Programável (CLP) é um computador industrial robusto, projetado para automatizar processos em ambientes hostis.\n\n" +
            `[youtube_video](${YOUTUBE_SAMPLE_URL})\n\n` +
            "CLPs estão presentes em linhas de montagem, estações de tratamento de água, elevadores e praticamente qualquer processo industrial automatizado.",
        },
        {
          id: "22222222-0000-0000-0001-000000000002",
          title: "Arquitetura de entradas e saídas (I/O)",
          order: 2,
          content:
            "Um CLP recebe sinais de sensores através de suas entradas (I) e comanda atuadores através de suas saídas (O), digitais ou analógicas.",
        },
        {
          id: "22222222-0000-0000-0001-000000000003",
          title: "Ciclo de varredura (scan cycle)",
          order: 3,
          content:
            "O CLP executa continuamente três etapas: leitura das entradas, processamento do programa e atualização das saídas — o chamado ciclo de varredura.",
        },
      ],
      quiz: {
        id: "22222222-0000-0000-0001-000000000999",
        questions: [
          {
            id: "22222222-0000-0000-0001-000000000991",
            question: "O que significa CLP?",
            options: [
              "Controlador Lógico Programável",
              "Circuito Lógico Paralelo",
              "Cabo de Ligação Programável",
              "Comando Local de Potência",
            ],
            correctIndex: 0,
            explanation:
              "CLP é a sigla para Controlador Lógico Programável, o cérebro dos sistemas de automação industrial.",
            order: 1,
          },
          {
            id: "22222222-0000-0000-0001-000000000992",
            question:
              "Qual linguagem é mais tradicionalmente usada para programar CLPs?",
            options: ["Ladder", "Python", "HTML", "SQL"],
            correctIndex: 0,
            explanation:
              "A linguagem Ladder é a mais tradicional e amplamente usada na programação de CLPs.",
            order: 2,
          },
          {
            id: "22222222-0000-0000-0001-000000000993",
            question:
              "Um CLP substitui, na automação moderna, principalmente:",
            options: [
              "Painéis de relés eletromecânicos",
              "Placas de vídeo",
              "Roteadores de rede",
              "Baterias industriais",
            ],
            correctIndex: 0,
            explanation:
              "CLPs surgiram para substituir os complexos painéis de relés eletromecânicos usados antes da automação digital.",
            order: 3,
          },
        ],
      },
    },
    {
      id: "22222222-0000-0000-0002-000000000000",
      title: "Programação Ladder",
      order: 2,
      lessons: [
        {
          id: "22222222-0000-0000-0002-000000000001",
          title: "Contatos e bobinas",
          order: 1,
          content:
            "A lógica Ladder é construída a partir de contatos (condições) e bobinas (saídas), organizados em degraus que se assemelham a uma escada — daí o nome.",
        },
        {
          id: "22222222-0000-0000-0002-000000000002",
          title: "Temporizadores e contadores",
          order: 2,
          content:
            "Temporizadores (TON, TOF) e contadores (CTU, CTD) permitem criar lógicas que dependem do tempo ou de eventos repetidos, essenciais em quase todo processo automatizado.",
        },
        {
          id: "22222222-0000-0000-0002-000000000003",
          title: "Boas práticas de programação Ladder",
          order: 3,
          content:
            "Comente seus degraus, use nomes de tags descritivos e organize o programa em rotinas menores — isso facilita manutenção futura por qualquer técnico da equipe.",
        },
      ],
    },
  ],
};

const COURSE_C: CourseSeed = {
  id: "33333333-0000-0000-0000-000000000000",
  title: "Eficiência Energética em Sistemas Fotovoltaicos",
  description:
    "Aprenda a dimensionar, instalar e manter sistemas de energia solar fotovoltaica com foco em eficiência e diagnóstico de falhas.",
  category: "Elétrica",
  coverImageUrl: COVER_C,
  modules: [
    {
      id: "33333333-0000-0000-0001-000000000000",
      title: "Dimensionamento de Sistemas Solares",
      order: 1,
      lessons: [
        {
          id: "33333333-0000-0000-0001-000000000001",
          title: "Irradiância solar e geração de energia",
          order: 1,
          content:
            "A irradiância solar — a potência de radiação recebida por metro quadrado — determina diretamente o potencial de geração de um sistema fotovoltaico em cada região.\n\n" +
            `[youtube_video](${YOUTUBE_SAMPLE_URL})`,
        },
        {
          id: "33333333-0000-0000-0001-000000000002",
          title: "Calculando o número de painéis necessários",
          order: 2,
          content:
            "O dimensionamento correto cruza o consumo médio mensal de energia do cliente com a irradiância local e a eficiência dos painéis disponíveis no mercado.",
        },
      ],
      quiz: {
        id: "33333333-0000-0000-0001-000000000999",
        questions: [
          {
            id: "33333333-0000-0000-0001-000000000991",
            question: "O que é irradiância solar?",
            options: [
              "A potência de radiação solar recebida por unidade de área",
              "A quantidade de painéis instalados",
              "A tensão gerada por um painel",
              "O ângulo de inclinação do telhado",
            ],
            correctIndex: 0,
            explanation:
              "Irradiância solar é a potência de radiação solar incidente por unidade de área, medida em W/m².",
            order: 1,
          },
          {
            id: "33333333-0000-0000-0001-000000000992",
            question:
              "Qual é a função de um inversor em um sistema fotovoltaico?",
            options: [
              "Converter corrente contínua (CC) em corrente alternada (CA)",
              "Armazenar energia solar",
              "Aumentar a irradiância solar",
              "Filtrar a água de resfriamento dos painéis",
            ],
            correctIndex: 0,
            explanation:
              "O inversor converte a energia CC gerada pelos painéis em CA, compatível com a rede elétrica.",
            order: 2,
          },
          {
            id: "33333333-0000-0000-0001-000000000993",
            question:
              "O dimensionamento de um sistema fotovoltaico deve considerar principalmente:",
            options: [
              "Consumo médio de energia do local e irradiância da região",
              "Apenas a cor do telhado",
              "Apenas o número de moradores",
              "Apenas o preço dos painéis",
            ],
            correctIndex: 0,
            explanation:
              "O dimensionamento correto depende do consumo médio de energia e da irradiância solar disponível na região.",
            order: 3,
          },
          {
            id: "33333333-0000-0000-0001-000000000994",
            question:
              "O que é o efeito de sombreamento parcial em um painel solar?",
            options: [
              "Redução significativa na geração de energia do painel afetado",
              "Aumento da eficiência do painel",
              "Não tem nenhum efeito",
              "Aumenta a vida útil do painel",
            ],
            correctIndex: 0,
            explanation:
              "O sombreamento parcial pode reduzir drasticamente a geração de energia, mesmo cobrindo pequena parte do painel.",
            order: 4,
          },
        ],
      },
    },
    {
      id: "33333333-0000-0000-0002-000000000000",
      title: "Manutenção e Diagnóstico",
      order: 2,
      lessons: [
        {
          id: "33333333-0000-0000-0002-000000000001",
          title: "Limpeza e inspeção periódica de painéis",
          order: 1,
          content:
            "Poeira, folhas e sujeira acumulada podem reduzir a geração de energia em até 20%. Uma rotina de limpeza trimestral é recomendada na maioria das regiões.",
        },
        {
          id: "33333333-0000-0000-0002-000000000002",
          title: "Diagnóstico de falhas comuns",
          order: 2,
          content:
            "Quedas repentinas de geração, erros no inversor e disjuntores desarmando com frequência são sinais que merecem investigação imediata.",
        },
        {
          id: "33333333-0000-0000-0002-000000000003",
          title: "Monitoramento remoto de sistemas fotovoltaicos",
          order: 3,
          content:
            "Plataformas de monitoramento permitem acompanhar a geração de energia em tempo real e identificar quedas de desempenho antes que o cliente perceba.",
        },
      ],
    },
  ],
};

const COURSE_D: CourseSeed = {
  id: "44444444-0000-0000-0000-000000000000",
  title: "Normas de Segurança do Trabalho (NR-10)",
  description:
    "Entenda os requisitos da NR-10 para garantir segurança em atividades com eletricidade, desde a prevenção até os procedimentos de emergência.",
  category: "Elétrica",
  coverImageUrl: null,
  modules: [
    {
      id: "44444444-0000-0000-0001-000000000000",
      title: "Introdução à NR-10",
      order: 1,
      lessons: [
        {
          id: "44444444-0000-0000-0001-000000000001",
          title: "Objetivo e campo de aplicação da NR-10",
          order: 1,
          content:
            "A NR-10 estabelece os requisitos mínimos para garantir a segurança de trabalhadores em instalações elétricas, em todas as suas etapas.",
        },
        {
          id: "44444444-0000-0000-0001-000000000002",
          title: "Medidas de controle de risco elétrico",
          order: 2,
          content:
            "A norma prioriza medidas de controle coletivas antes de recorrer a EPIs — sempre eliminando ou reduzindo o risco na origem, quando possível.",
        },
      ],
    },
    {
      id: "44444444-0000-0000-0002-000000000000",
      title: "Procedimentos de Emergência",
      order: 2,
      lessons: [
        {
          id: "44444444-0000-0000-0002-000000000001",
          title: "Primeiros socorros em acidentes elétricos",
          order: 1,
          content:
            "O primeiro passo em qualquer acidente elétrico é garantir que a fonte de energia esteja desligada antes de prestar socorro à vítima.",
        },
        {
          id: "44444444-0000-0000-0002-000000000002",
          title: "Planos de resposta a emergências",
          order: 2,
          content:
            "Toda instalação com risco elétrico deve ter um plano de resposta a emergências documentado, treinado e testado periodicamente com a equipe.",
        },
      ],
      quiz: {
        id: "44444444-0000-0000-0002-000000000999",
        questions: [
          {
            id: "44444444-0000-0000-0002-000000000991",
            question:
              "Segundo a NR-10, o que deve ser feito antes de iniciar qualquer serviço em instalação elétrica?",
            options: [
              "Desenergização e verificação de ausência de tensão",
              "Iniciar o serviço imediatamente",
              "Aumentar a tensão do circuito",
              "Ignorar o uso de EPIs",
            ],
            correctIndex: 0,
            explanation:
              "A NR-10 exige a desenergização segura e verificação de ausência de tensão antes de qualquer intervenção.",
            order: 1,
          },
          {
            id: "44444444-0000-0000-0002-000000000992",
            question: "O que é EPI no contexto de segurança elétrica?",
            options: [
              "Equipamento de Proteção Individual",
              "Equipamento de Produção Industrial",
              "Estação de Ponto de Interrupção",
              "Elemento de Proteção Interna",
            ],
            correctIndex: 0,
            explanation:
              "EPI significa Equipamento de Proteção Individual, essencial para proteger o trabalhador de riscos elétricos.",
            order: 2,
          },
          {
            id: "44444444-0000-0000-0002-000000000993",
            question:
              "Em caso de choque elétrico em terceiros, a primeira ação segura é:",
            options: [
              "Desenergizar o circuito antes de tocar na vítima",
              "Tocar imediatamente na vítima para socorrê-la",
              "Ignorar a situação",
              "Aumentar a tensão para religar o disjuntor",
            ],
            correctIndex: 0,
            explanation:
              "Tocar em uma vítima de choque sem antes desenergizar o circuito coloca o socorrista em risco também.",
            order: 3,
          },
        ],
      },
    },
  ],
};

const COURSES: CourseSeed[] = [COURSE_A, COURSE_B, COURSE_C, COURSE_D];

async function seedCourse(teacherId: string, course: CourseSeed) {
  const courseData = {
    teacherId,
    title: course.title,
    description: course.description,
    category: course.category,
    coverImageUrl: course.coverImageUrl,
  };
  await prisma.course.upsert({
    where: { id: course.id },
    update: courseData,
    create: { id: course.id, ...courseData },
  });

  for (const courseModule of course.modules) {
    const moduleData = {
      courseId: course.id,
      title: courseModule.title,
      order: courseModule.order,
    };
    await prisma.module.upsert({
      where: { id: courseModule.id },
      update: moduleData,
      create: { id: courseModule.id, ...moduleData },
    });

    for (const lesson of courseModule.lessons) {
      const lessonData = {
        moduleId: courseModule.id,
        title: lesson.title,
        content: lesson.content,
        order: lesson.order,
      };
      await prisma.lesson.upsert({
        where: { id: lesson.id },
        update: lessonData,
        create: { id: lesson.id, ...lessonData },
      });
    }

    if (courseModule.quiz) {
      await prisma.quiz.upsert({
        where: { id: courseModule.quiz.id },
        update: { moduleId: courseModule.id },
        create: { id: courseModule.quiz.id, moduleId: courseModule.id },
      });

      for (const question of courseModule.quiz.questions) {
        const questionData = {
          quizId: courseModule.quiz.id,
          question: question.question,
          options: question.options,
          correctIndex: question.correctIndex,
          explanation: question.explanation,
          order: question.order,
        };
        await prisma.quizQuestion.upsert({
          where: { id: question.id },
          update: questionData,
          create: { id: question.id, ...questionData },
        });
      }
    }
  }
}

async function enroll(userId: string, courseId: string) {
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: {},
    create: { userId, courseId },
  });
}

async function completeLesson(userId: string, lessonId: string) {
  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    update: {},
    create: { userId, lessonId },
  });
}

async function recordQuizAttempt(
  id: string,
  userId: string,
  quizId: string,
  answers: { questionId: string; selectedIndex: number }[],
  totalQuestions: number,
) {
  const correctByQuestion = new Map(
    (
      await prisma.quizQuestion.findMany({
        where: { quizId },
        select: { id: true, correctIndex: true },
      })
    ).map((q) => [q.id, q.correctIndex]),
  );

  const score = answers.filter(
    (answer) => correctByQuestion.get(answer.questionId) === answer.selectedIndex,
  ).length;
  const passed = score / totalQuestions >= 0.7;

  await prisma.quizAttempt.upsert({
    where: { id },
    update: { score, totalQuestions, passed, answers },
    create: { id, quizId, userId, score, totalQuestions, passed, answers },
  });
}

async function main() {
  const teacherData = {
    googleId: TEACHER_GOOGLE_ID,
    name: "Professor de Teste",
    email: "professor.teste@wattlearn.dev",
    role: "teacher" as const,
  };
  const teacher = await prisma.user.upsert({
    where: { googleId: TEACHER_GOOGLE_ID },
    update: teacherData,
    create: teacherData,
  });

  const teacher2Data = {
    googleId: TEACHER2_GOOGLE_ID,
    name: "Outro Professor",
    email: "outro.professor@wattlearn.dev",
    role: "teacher" as const,
  };
  await prisma.user.upsert({
    where: { googleId: TEACHER2_GOOGLE_ID },
    update: teacher2Data,
    create: teacher2Data,
  });

  const adminData = {
    googleId: ADMIN_GOOGLE_ID,
    name: "Admin de Teste",
    email: "admin.teste@wattlearn.dev",
    role: "admin" as const,
  };
  await prisma.user.upsert({
    where: { googleId: ADMIN_GOOGLE_ID },
    update: adminData,
    create: adminData,
  });

  const studentData = {
    googleId: STUDENT_GOOGLE_ID,
    name: "Aluno de Teste",
    email: "aluno.teste@wattlearn.dev",
    role: "student" as const,
  };
  const student = await prisma.user.upsert({
    where: { googleId: STUDENT_GOOGLE_ID },
    update: studentData,
    create: studentData,
  });

  const student2Data = {
    googleId: STUDENT2_GOOGLE_ID,
    name: "Aluno Sem Matrícula",
    email: "aluno.sem.matricula@wattlearn.dev",
    role: "student" as const,
  };
  await prisma.user.upsert({
    where: { googleId: STUDENT2_GOOGLE_ID },
    update: student2Data,
    create: student2Data,
  });

  for (const course of COURSES) {
    await seedCourse(teacher.id, course);
  }

  // O aluno de teste está matriculado em todos os cursos seed — o "aluno sem
  // matrícula" fica de fora de propósito, para exercitar a prévia de currículo
  // pré-matrícula (ver course-enrollment).
  for (const course of COURSES) {
    await enroll(student.id, course.id);
  }

  // Curso A - módulo 1: todas as aulas concluídas (100%, sem quiz) -> desbloqueia módulo 2
  for (const lesson of COURSE_A.modules[0].lessons) {
    await completeLesson(student.id, lesson.id);
  }

  // Curso A - módulo 2: 2 de 3 aulas concluídas (em andamento), quiz ainda não feito -> módulo 3 permanece bloqueado
  await completeLesson(student.id, COURSE_A.modules[1].lessons[0].id);
  await completeLesson(student.id, COURSE_A.modules[1].lessons[1].id);

  // Curso B - módulo 1: todas as aulas concluídas + quiz (1ª tentativa reprovada, 2ª aprovada) -> desbloqueia módulo 2
  for (const lesson of COURSE_B.modules[0].lessons) {
    await completeLesson(student.id, lesson.id);
  }
  const courseBQuiz = COURSE_B.modules[0].quiz!;
  await recordQuizAttempt(
    "22222222-0000-0000-0001-000000000a01",
    student.id,
    courseBQuiz.id,
    [
      { questionId: courseBQuiz.questions[0].id, selectedIndex: 1 },
      { questionId: courseBQuiz.questions[1].id, selectedIndex: 1 },
      { questionId: courseBQuiz.questions[2].id, selectedIndex: 0 },
    ],
    courseBQuiz.questions.length,
  );
  await recordQuizAttempt(
    "22222222-0000-0000-0001-000000000a02",
    student.id,
    courseBQuiz.id,
    courseBQuiz.questions.map((q) => ({
      questionId: q.id,
      selectedIndex: q.correctIndex,
    })),
    courseBQuiz.questions.length,
  );

  // Curso B - módulo 2: 1 de 3 aulas concluídas (em andamento, desbloqueado)
  await completeLesson(student.id, COURSE_B.modules[1].lessons[0].id);

  // Curso C - módulo 1: todas as aulas concluídas, mas quiz reprovado -> módulo 2 permanece bloqueado
  for (const lesson of COURSE_C.modules[0].lessons) {
    await completeLesson(student.id, lesson.id);
  }
  const courseCQuiz = COURSE_C.modules[0].quiz!;
  await recordQuizAttempt(
    "33333333-0000-0000-0001-000000000a01",
    student.id,
    courseCQuiz.id,
    [
      { questionId: courseCQuiz.questions[0].id, selectedIndex: 0 },
      { questionId: courseCQuiz.questions[1].id, selectedIndex: 1 },
      { questionId: courseCQuiz.questions[2].id, selectedIndex: 1 },
      { questionId: courseCQuiz.questions[3].id, selectedIndex: 0 },
    ],
    courseCQuiz.questions.length,
  );

  // Curso D: nenhum progresso -> módulo 1 acessível (regra do primeiro módulo), módulo 2 bloqueado

  console.log(
    `Seed concluído: ${COURSES.length} cursos, professor e aluno de teste com progresso variado.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
