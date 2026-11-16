import { PrismaClient, QuestionType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_EDUCATOR = "educator@demo.assessai.app";
const DEMO_STUDENT = "student@demo.assessai.app";
const OTHER_STUDENT = "kavya@demo.assessai.app";
const EDUCATOR_PASSWORD = "DemoEducator!23";
const STUDENT_PASSWORD = "DemoStudent!23";

type Q = {
  position: number;
  type: QuestionType;
  prompt: string;
  options: { id: string; text: string }[];
  correctAnswer: object;
  explanation: string;
  topic: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  marks: number;
  negativeMarks: number;
  tolerance?: number | null;
};

async function upsertUser(data: {
  email: string;
  name: string;
  role: "EDUCATOR" | "STUDENT";
  password: string;
  audience: "JEE" | "UPSC" | "COLLEGE";
  institution?: string;
  interests: string[];
}) {
  const passwordHash = await bcrypt.hash(data.password, 10);
  return prisma.user.upsert({
    where: { email: data.email },
    update: { name: data.name, passwordHash, role: data.role, isDemo: true },
    create: {
      email: data.email,
      name: data.name,
      passwordHash,
      role: data.role,
      isDemo: true,
      profile: {
        create: {
          audience: data.audience,
          institution: data.institution,
          interests: data.interests,
        },
      },
    },
  });
}

async function replaceAssessment(
  creatorId: string,
  accessCode: string,
  data: {
    title: string;
    description: string;
    audience: "JEE" | "UPSC" | "COLLEGE";
    subject: string;
    topics: string[];
    difficulty: "EASY" | "MEDIUM" | "HARD";
    durationMinutes: number;
    negativeMarking: boolean;
    instructions: string;
    status: "DRAFT" | "PUBLISHED" | "CLOSED";
    questions: Q[];
  },
) {
  await prisma.assessment.deleteMany({ where: { accessCode } });
  const totalMarks = data.questions.reduce((sum, q) => sum + q.marks, 0);
  return prisma.assessment.create({
    data: {
      creatorId,
      accessCode,
      title: data.title,
      description: data.description,
      audience: data.audience,
      subject: data.subject,
      topics: data.topics,
      difficulty: data.difficulty,
      durationMinutes: data.durationMinutes,
      negativeMarking: data.negativeMarking,
      instructions: data.instructions,
      status: data.status,
      publishedAt: data.status === "PUBLISHED" ? new Date() : null,
      totalMarks,
      questions: {
        create: data.questions.map((q) => ({
          position: q.position,
          type: q.type,
          prompt: q.prompt,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          topic: q.topic,
          difficulty: q.difficulty,
          marks: q.marks,
          negativeMarks: q.negativeMarks,
          tolerance: q.tolerance ?? null,
        })),
      },
    },
    include: { questions: { orderBy: { position: "asc" } } },
  });
}

function snapshotOf(assessment: { questions: Array<Record<string, unknown>> }) {
  return assessment.questions.map((q) => ({
    id: q.id,
    position: q.position,
    type: q.type,
    prompt: q.prompt,
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    topic: q.topic,
    difficulty: q.difficulty,
    marks: q.marks,
    negativeMarks: q.negativeMarks,
    tolerance: q.tolerance,
  }));
}

async function main() {
  const educator = await upsertUser({
    email: DEMO_EDUCATOR,
    name: "Priya Nair",
    role: "EDUCATOR",
    password: EDUCATOR_PASSWORD,
    audience: "JEE",
    institution: "North Ridge Coaching (demo)",
    interests: ["Physics", "Polity", "Data Structures"],
  });
  const student = await upsertUser({
    email: DEMO_STUDENT,
    name: "Arjun Mehta",
    role: "STUDENT",
    password: STUDENT_PASSWORD,
    audience: "JEE",
    interests: ["Physics", "Polity"],
  });
  const other = await upsertUser({
    email: OTHER_STUDENT,
    name: "Kavya Rao",
    role: "STUDENT",
    password: STUDENT_PASSWORD,
    audience: "COLLEGE",
    interests: ["Data Structures"],
  });

  await prisma.questionNote.deleteMany({
    where: { student: { email: { in: [DEMO_STUDENT, OTHER_STUDENT] } } },
  });
  await prisma.assessmentAttempt.deleteMany({
    where: {
      OR: [{ studentId: student.id }, { studentId: other.id }, { assessment: { creatorId: educator.id } }],
    },
  });

  const jee = await replaceAssessment(educator.id, "JEECE1", {
    title: "JEE Physics — Current Electricity",
    description: "Timed practice on circuit laws, resistance and drift speed. Demo data.",
    audience: "JEE",
    subject: "Physics",
    topics: ["Current Electricity", "Kirchhoff’s laws"],
    difficulty: "MEDIUM",
    durationMinutes: 30,
    negativeMarking: true,
    instructions:
      "Single-correct and numerical questions follow JEE Main style marking: +4, −1 for incorrect MCQs. Numerical items have no negative marking. Multiple-select requires an exact option match.",
    status: "PUBLISHED",
    questions: [
      {
        position: 1,
        type: "SINGLE_MCQ",
        prompt: "The SI unit of electrical conductivity is:",
        options: [
          { id: "A", text: "ohm" },
          { id: "B", text: "siemens per metre" },
          { id: "C", text: "ohm-metre" },
          { id: "D", text: "ampere" },
        ],
        correctAnswer: { optionIds: ["B"] },
        explanation: "Conductivity σ is the reciprocal of resistivity, with SI unit S m⁻¹.",
        topic: "Current Electricity",
        difficulty: "EASY",
        marks: 4,
        negativeMarks: 1,
      },
      {
        position: 2,
        type: "SINGLE_MCQ",
        prompt: "A wire of resistance 4 Ω is stretched to twice its length. If volume is constant, the new resistance is:",
        options: [
          { id: "A", text: "4 Ω" },
          { id: "B", text: "8 Ω" },
          { id: "C", text: "16 Ω" },
          { id: "D", text: "2 Ω" },
        ],
        correctAnswer: { optionIds: ["C"] },
        explanation: "R ∝ L²/V. Doubling L multiplies R by 4 → 16 Ω.",
        topic: "Current Electricity",
        difficulty: "MEDIUM",
        marks: 4,
        negativeMarks: 1,
      },
      {
        position: 3,
        type: "SINGLE_MCQ",
        prompt: "Kirchhoff’s junction rule is a consequence of conservation of:",
        options: [
          { id: "A", text: "Energy" },
          { id: "B", text: "Charge" },
          { id: "C", text: "Momentum" },
          { id: "D", text: "Mass" },
        ],
        correctAnswer: { optionIds: ["B"] },
        explanation: "Net current into a junction is zero because charge is conserved.",
        topic: "Kirchhoff’s laws",
        difficulty: "EASY",
        marks: 4,
        negativeMarks: 1,
      },
      {
        position: 4,
        type: "MULTI_MCQ",
        prompt: "Which of the following increase drift speed in a metallic conductor, all else equal?",
        options: [
          { id: "A", text: "Increasing the potential difference (fixed length)" },
          { id: "B", text: "Increasing the length (fixed V)" },
          { id: "C", text: "Decreasing temperature in a typical metal" },
          { id: "D", text: "Decreasing the number density of free electrons" },
        ],
        correctAnswer: { optionIds: ["A", "C"] },
        explanation: "vd = eEτ/m. Larger E or larger τ (lower T) increases drift speed.",
        topic: "Current Electricity",
        difficulty: "HARD",
        marks: 4,
        negativeMarks: 1,
      },
      {
        position: 5,
        type: "NUMERICAL",
        prompt: "A 12 V battery of internal resistance 1 Ω is connected to a 5 Ω resistor. Current in amperes is:",
        options: [],
        correctAnswer: { value: 2 },
        explanation: "I = 12 / (5+1) = 2 A.",
        topic: "Current Electricity",
        difficulty: "EASY",
        marks: 4,
        negativeMarks: 0,
        tolerance: 0.01,
      },
      {
        position: 6,
        type: "NUMERICAL",
        prompt: "Three 6 Ω resistors are connected in parallel. The equivalent resistance in ohms is:",
        options: [],
        correctAnswer: { value: 2 },
        explanation: "1/Req = 3/6 = 1/2 ⇒ Req = 2 Ω.",
        topic: "Current Electricity",
        difficulty: "EASY",
        marks: 4,
        negativeMarks: 0,
        tolerance: 0.01,
      },
    ],
  });

  const upsc = await replaceAssessment(educator.id, "UPSFR1", {
    title: "UPSC Polity — Fundamental Rights",
    description: "Prelims-style statements on Part III. Demo data.",
    audience: "UPSC",
    subject: "Polity",
    topics: ["Fundamental Rights", "Writs"],
    difficulty: "MEDIUM",
    durationMinutes: 20,
    negativeMarking: true,
    instructions: "+2 for a correct item, −0.66 for an incorrect MCQ. Multiple-select requires every correct statement and no extras.",
    status: "PUBLISHED",
    questions: [
      {
        position: 1,
        type: "SINGLE_MCQ",
        prompt: "Equality before the law and equal protection of the laws are guaranteed by:",
        options: [
          { id: "A", text: "Article 14" },
          { id: "B", text: "Article 15" },
          { id: "C", text: "Article 16" },
          { id: "D", text: "Article 17" },
        ],
        correctAnswer: { optionIds: ["A"] },
        explanation: "Article 14 is the core equality clause.",
        topic: "Fundamental Rights",
        difficulty: "EASY",
        marks: 2,
        negativeMarks: 0.66,
      },
      {
        position: 2,
        type: "MULTI_MCQ",
        prompt: "Which of the following statements about Article 19 are correct?",
        options: [
          { id: "A", text: "It lists six freedoms for citizens." },
          { id: "B", text: "The freedoms apply equally to non-citizens." },
          { id: "C", text: "Reasonable restrictions may be imposed." },
          { id: "D", text: "Freedom of speech is unlimited." },
        ],
        correctAnswer: { optionIds: ["A", "C"] },
        explanation: "Article 19 freedoms are for citizens and are subject to reasonable restrictions.",
        topic: "Fundamental Rights",
        difficulty: "MEDIUM",
        marks: 2,
        negativeMarks: 0.66,
      },
      {
        position: 3,
        type: "SINGLE_MCQ",
        prompt: "Habeas corpus is issued to:",
        options: [
          { id: "A", text: "Compel performance of a public duty" },
          { id: "B", text: "Produce a detained person before the court" },
          { id: "C", text: "Quash a lower court’s order" },
          { id: "D", text: "Transfer a case" },
        ],
        correctAnswer: { optionIds: ["B"] },
        explanation: "The writ tests the lawfulness of detention.",
        topic: "Writs",
        difficulty: "EASY",
        marks: 2,
        negativeMarks: 0.66,
      },
      {
        position: 4,
        type: "SINGLE_MCQ",
        prompt: "The right to constitutional remedies is provided in:",
        options: [
          { id: "A", text: "Article 21" },
          { id: "B", text: "Article 22" },
          { id: "C", text: "Article 32" },
          { id: "D", text: "Article 226" },
        ],
        correctAnswer: { optionIds: ["C"] },
        explanation: "Article 32 is the right to move the Supreme Court for enforcement of fundamental rights.",
        topic: "Fundamental Rights",
        difficulty: "MEDIUM",
        marks: 2,
        negativeMarks: 0.66,
      },
    ],
  });

  const college = await replaceAssessment(educator.id, "COLDS1", {
    title: "CS201 — Trees and Graphs",
    description: "Module quiz for an undergraduate data structures course. Demo data.",
    audience: "COLLEGE",
    subject: "Data Structures",
    topics: ["Trees", "Graphs"],
    difficulty: "MEDIUM",
    durationMinutes: 25,
    negativeMarking: false,
    instructions: "No negative marking. Short answers are marked by the educator after submission.",
    status: "PUBLISHED",
    questions: [
      {
        position: 1,
        type: "SINGLE_MCQ",
        prompt: "The height of a complete binary tree with n nodes is:",
        options: [
          { id: "A", text: "Θ(n)" },
          { id: "B", text: "Θ(log n)" },
          { id: "C", text: "Θ(n log n)" },
          { id: "D", text: "Θ(√n)" },
        ],
        correctAnswer: { optionIds: ["B"] },
        explanation: "A complete binary tree is balanced, so height is logarithmic.",
        topic: "Trees",
        difficulty: "EASY",
        marks: 2,
        negativeMarks: 0,
      },
      {
        position: 2,
        type: "NUMERICAL",
        prompt: "A perfect binary tree has 7 nodes. How many leaves does it have?",
        options: [],
        correctAnswer: { value: 4 },
        explanation: "A perfect tree of height 2 has 2² = 4 leaves.",
        topic: "Trees",
        difficulty: "MEDIUM",
        marks: 2,
        negativeMarks: 0,
        tolerance: 0,
      },
      {
        position: 3,
        type: "SINGLE_MCQ",
        prompt: "BFS on an unweighted graph computes:",
        options: [
          { id: "A", text: "Minimum spanning tree" },
          { id: "B", text: "Shortest paths from the source" },
          { id: "C", text: "Strongly connected components" },
          { id: "D", text: "Topological order in all graphs" },
        ],
        correctAnswer: { optionIds: ["B"] },
        explanation: "BFS explores by distance from the source, yielding shortest paths in unweighted graphs.",
        topic: "Graphs",
        difficulty: "EASY",
        marks: 2,
        negativeMarks: 0,
      },
      {
        position: 4,
        type: "SHORT_ANSWER",
        prompt: "In two sentences, when is DFS preferable to BFS?",
        options: [],
        correctAnswer: {
          text: "DFS is preferable for cycle detection, topological sort, and connectivity in large sparse graphs when shortest paths are not required.",
        },
        explanation: "DFS uses less memory on deep searches and underpins several graph algorithms that BFS does not.",
        topic: "Graphs",
        difficulty: "MEDIUM",
        marks: 5,
        negativeMarks: 0,
      },
    ],
  });

  await replaceAssessment(educator.id, "DRAFT1", {
    title: "JEE Chemistry — Chemical Bonding (draft)",
    description: "Unpublished draft for walkthrough of the builder.",
    audience: "JEE",
    subject: "Chemistry",
    topics: ["Chemical Bonding"],
    difficulty: "MEDIUM",
    durationMinutes: 20,
    negativeMarking: true,
    instructions: "Draft — not visible to students until published.",
    status: "DRAFT",
    questions: [
      {
        position: 1,
        type: "SINGLE_MCQ",
        prompt: "Which molecule has a trigonal planar shape?",
        options: [
          { id: "A", text: "NH3" },
          { id: "B", text: "BF3" },
          { id: "C", text: "H2O" },
          { id: "D", text: "CH4" },
        ],
        correctAnswer: { optionIds: ["B"] },
        explanation: "BF3 has three bonding pairs and no lone pair on boron.",
        topic: "Chemical Bonding",
        difficulty: "EASY",
        marks: 4,
        negativeMarks: 1,
      },
    ],
  });

  const { gradeAttempt } = await import("../src/lib/grading");

  async function seedAttempt(
    assessment: typeof jee,
    studentId: string,
    answers: Record<number, object | null>,
    startedMinutesAgo: number,
    durationSeconds: number,
  ) {
    await prisma.assessmentAttempt.deleteMany({
      where: { assessmentId: assessment.id, studentId },
    });
    const questions = assessment.questions;
    const responses: Record<string, object | null> = {};
    questions.forEach((q) => {
      responses[q.id] = answers[q.position] ?? null;
    });
    const graded = gradeAttempt(
      questions.map((q) => ({
        id: q.id,
        type: q.type,
        marks: q.marks,
        negativeMarks: q.negativeMarks,
        tolerance: q.tolerance,
        correctAnswer: q.correctAnswer as { optionIds: string[] } | { value: number },
      })),
      responses,
    );
    const startedAt = new Date(Date.now() - startedMinutesAgo * 60_000);
    const submittedAt = new Date(startedAt.getTime() + durationSeconds * 1000);
    const attempt = await prisma.assessmentAttempt.create({
      data: {
        assessmentId: assessment.id,
        studentId,
        startedAt,
        submittedAt,
        status: "SUBMITTED",
        score: graded.score,
        percentage: graded.percentage,
        correctCount: graded.correctCount,
        incorrectCount: graded.incorrectCount,
        unansweredCount: graded.unansweredCount,
        awaitingReviewCount: graded.awaitingReviewCount,
        totalTimeSeconds: durationSeconds,
        snapshot: snapshotOf(assessment) as object[],
        responses: {
          create: questions.map((q) => {
            const result = graded.perQuestion[q.id];
            return {
              questionId: q.id,
              response: responses[q.id] ?? undefined,
              isCorrect: result.isCorrect,
              awaitingReview: result.awaitingReview,
              marksAwarded: result.marksAwarded,
              timeSpentSeconds: Math.round(durationSeconds / questions.length),
              markedForReview: q.position === 4,
            };
          }),
        },
      },
    });
    return attempt;
  }

  const arjunJee = await seedAttempt(
    jee,
    student.id,
    {
      1: { optionIds: ["B"] },
      2: { optionIds: ["B"] },
      3: { optionIds: ["B"] },
      4: { optionIds: ["A"] },
      5: { value: 2 },
      6: null,
    },
    2 * 24 * 60,
    18 * 60,
  );

  await seedAttempt(
    upsc,
    student.id,
    {
      1: { optionIds: ["A"] },
      2: { optionIds: ["A", "C"] },
      3: { optionIds: ["A"] },
      4: { optionIds: ["C"] },
    },
    24 * 60,
    12 * 60,
  );

  await seedAttempt(
    college,
    other.id,
    {
      1: { optionIds: ["B"] },
      2: { value: 4 },
      3: { optionIds: ["B"] },
      4: { text: "DFS uses less memory and finds cycles." },
    },
    6 * 60,
    10 * 60,
  );

  const wrongJee = jee.questions.find((q) => q.position === 2)!;
  await prisma.questionNote.create({
    data: {
      studentId: student.id,
      attemptId: arjunJee.id,
      questionId: wrongJee.id,
      noteText: "I used R ∝ L instead of R ∝ L². Revise stretching of wire before the next timed set.",
    },
  });

  console.log("Seed complete.");
  console.log("Educator:", DEMO_EDUCATOR, EDUCATOR_PASSWORD);
  console.log("Student:", DEMO_STUDENT, STUDENT_PASSWORD);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
