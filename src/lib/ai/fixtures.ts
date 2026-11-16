import type { QuestionType } from "../grading";

export type FixtureQuestion = {
  type: QuestionType;
  prompt: string;
  options: { id: string; text: string }[];
  correctAnswer: { optionIds?: string[]; value?: number; text?: string };
  explanation: string;
  topic: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  marks: number;
  negativeMarks: number;
  tolerance?: number | null;
};

const bank: Record<string, FixtureQuestion[]> = {
  JEE: [
    {
      type: "SINGLE_MCQ",
      prompt: "A wire of resistance 4 Ω is stretched to twice its length. Assuming volume is constant, the new resistance is:",
      options: [
        { id: "A", text: "4 Ω" },
        { id: "B", text: "8 Ω" },
        { id: "C", text: "16 Ω" },
        { id: "D", text: "2 Ω" },
      ],
      correctAnswer: { optionIds: ["C"] },
      explanation: "R ∝ L²/V. Doubling length multiplies resistance by 4, so 4 × 4 = 16 Ω.",
      topic: "Current Electricity",
      difficulty: "MEDIUM",
      marks: 4,
      negativeMarks: 1,
    },
    {
      type: "SINGLE_MCQ",
      prompt: "Kirchhoff’s junction rule is a consequence of conservation of:",
      options: [
        { id: "A", text: "Energy" },
        { id: "B", text: "Charge" },
        { id: "C", text: "Momentum" },
        { id: "D", text: "Mass" },
      ],
      correctAnswer: { optionIds: ["B"] },
      explanation: "The algebraic sum of currents at a junction is zero because charge is conserved.",
      topic: "Current Electricity",
      difficulty: "EASY",
      marks: 4,
      negativeMarks: 1,
    },
    {
      type: "NUMERICAL",
      prompt: "A 12 V battery with internal resistance 1 Ω is connected to a 5 Ω resistor. The current in the circuit, in amperes, is:",
      options: [],
      correctAnswer: { value: 2 },
      explanation: "I = E/(R+r) = 12/(5+1) = 2 A.",
      topic: "Current Electricity",
      difficulty: "EASY",
      marks: 4,
      negativeMarks: 0,
      tolerance: 0.01,
    },
    {
      type: "MULTI_MCQ",
      prompt: "Which of the following increase the drift speed of electrons in a conductor, all else equal? Select all that apply.",
      options: [
        { id: "A", text: "Increasing potential difference across the conductor" },
        { id: "B", text: "Increasing the length of the conductor" },
        { id: "C", text: "Decreasing the cross-sectional area" },
        { id: "D", text: "Using a material with higher conductivity" },
      ],
      correctAnswer: { optionIds: ["A", "D"] },
      explanation: "vd = (σE)/ne. Larger E (from larger V at fixed length) or larger σ increases drift speed. Longer wire reduces E; smaller area does not increase E if V and L are fixed.",
      topic: "Current Electricity",
      difficulty: "HARD",
      marks: 4,
      negativeMarks: 1,
    },
  ],
  UPSC: [
    {
      type: "SINGLE_MCQ",
      prompt: "Which article of the Constitution of India deals with the right to equality before the law?",
      options: [
        { id: "A", text: "Article 14" },
        { id: "B", text: "Article 19" },
        { id: "C", text: "Article 21" },
        { id: "D", text: "Article 32" },
      ],
      correctAnswer: { optionIds: ["A"] },
      explanation: "Article 14 guarantees equality before the law and equal protection of the laws.",
      topic: "Fundamental Rights",
      difficulty: "EASY",
      marks: 2,
      negativeMarks: 0.66,
    },
    {
      type: "MULTI_MCQ",
      prompt: "Consider the following statements about Article 19. Which are correct?",
      options: [
        { id: "A", text: "It protects six freedoms for citizens." },
        { id: "B", text: "These freedoms are available to both citizens and non-citizens equally." },
        { id: "C", text: "Reasonable restrictions can be imposed on these freedoms." },
        { id: "D", text: "Article 19 can never be suspended." },
      ],
      correctAnswer: { optionIds: ["A", "C"] },
      explanation: "Article 19 freedoms are for citizens and are subject to reasonable restrictions. They may be suspended during a national emergency (except as later limited for Articles 20 and 21).",
      topic: "Fundamental Rights",
      difficulty: "MEDIUM",
      marks: 2,
      negativeMarks: 0.66,
    },
    {
      type: "SINGLE_MCQ",
      prompt: "The writ of habeas corpus is primarily issued to:",
      options: [
        { id: "A", text: "Command a public authority to perform a duty" },
        { id: "B", text: "Produce a detained person before the court" },
        { id: "C", text: "Quash the order of a lower court" },
        { id: "D", text: "Prohibit an authority from exceeding its jurisdiction" },
      ],
      correctAnswer: { optionIds: ["B"] },
      explanation: "Habeas corpus requires that a detained person be brought before the court to examine the lawfulness of detention.",
      topic: "Fundamental Rights",
      difficulty: "EASY",
      marks: 2,
      negativeMarks: 0.66,
    },
  ],
  COLLEGE: [
    {
      type: "SINGLE_MCQ",
      prompt: "The height of a complete binary tree with n nodes is:",
      options: [
        { id: "A", text: "Θ(n)" },
        { id: "B", text: "Θ(log n)" },
        { id: "C", text: "Θ(n log n)" },
        { id: "D", text: "Θ(√n)" },
      ],
      correctAnswer: { optionIds: ["B"] },
      explanation: "A complete binary tree is as balanced as possible, so height is Θ(log n).",
      topic: "Trees and Graphs",
      difficulty: "EASY",
      marks: 2,
      negativeMarks: 0,
    },
    {
      type: "NUMERICAL",
      prompt: "A binary tree has 7 nodes. The maximum possible number of leaf nodes is:",
      options: [],
      correctAnswer: { value: 4 },
      explanation: "A complete tree of 7 nodes is a perfect tree of height 2, which has 4 leaves.",
      topic: "Trees and Graphs",
      difficulty: "MEDIUM",
      marks: 2,
      negativeMarks: 0,
      tolerance: 0,
    },
    {
      type: "SHORT_ANSWER",
      prompt: "In two or three sentences, explain when breadth-first search is preferable to depth-first search on an unweighted graph.",
      options: [],
      correctAnswer: { text: "BFS finds shortest paths in unweighted graphs because it explores vertices in increasing distance from the source." },
      explanation: "BFS visits nodes level by level, so the first time a node is reached is via a shortest path in an unweighted graph.",
      topic: "Trees and Graphs",
      difficulty: "MEDIUM",
      marks: 5,
      negativeMarks: 0,
    },
  ],
};

export function fixtureQuestions(input: {
  audience: "JEE" | "UPSC" | "COLLEGE";
  topics: string[];
  questionCount: number;
  types: QuestionType[];
}): FixtureQuestion[] {
  const pool = [...(bank[input.audience] || bank.JEE)].filter((q) =>
    input.types.length ? input.types.includes(q.type) : true,
  );
  const source = pool.length ? pool : bank[input.audience] || bank.JEE;
  const out: FixtureQuestion[] = [];
  for (let i = 0; i < input.questionCount; i += 1) {
    const base = source[i % source.length];
    out.push({
      ...base,
      topic: input.topics[0] || base.topic,
      prompt: i >= source.length ? `${base.prompt} (Variant ${i + 1})` : base.prompt,
    });
  }
  return out;
}
