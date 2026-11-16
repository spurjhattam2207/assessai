import { generatedQuestionSchema } from "../validations";
import { fixtureQuestions, type FixtureQuestion } from "./fixtures";
import type { QuestionType } from "../grading";

export type GenerateInput = {
  audience: "JEE" | "UPSC" | "COLLEGE";
  subject: string;
  topics: string[];
  difficulty: "EASY" | "MEDIUM" | "HARD";
  questionCount: number;
  types: QuestionType[];
  language: string;
  customInstructions?: string;
  sourceText?: string;
};

export type GenerateResult = {
  questions: FixtureQuestion[];
  usedFixture: boolean;
  notice: string;
};

const SYSTEM = `You generate assessment questions as JSON only.
Return {"questions":[...]}. Each question must include type (SINGLE_MCQ|MULTI_MCQ|NUMERICAL|SHORT_ANSWER), prompt, options [{id,text}], correctAnswer ({optionIds:[], value?:number, text?:string}), explanation, topic, difficulty (EASY|MEDIUM|HARD), marks, negativeMarks, optional tolerance.
For SINGLE_MCQ, options must have ids A-D and exactly one correct optionId.
For MULTI_MCQ, two or more correct optionIds and exact-match scoring.
Never invent sources as real institutions. Keep language appropriate to the audience.`;

export async function generateQuestions(input: GenerateInput): Promise<GenerateResult> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
  if (!apiKey) {
    return {
      questions: fixtureQuestions(input),
      usedFixture: true,
      notice:
        "Demo generation fixture — no AI credentials were configured. These questions are sample drafts, not a live model response. Verify every answer before publishing.",
    };
  }

  const baseUrl = process.env.AI_API_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const source = (input.sourceText || "").slice(0, 8000);

  const userPrompt = [
    `Audience: ${input.audience}`,
    `Subject/course: ${input.subject}`,
    `Topics: ${input.topics.join(", ")}`,
    `Difficulty: ${input.difficulty}`,
    `Count: ${input.questionCount}`,
    `Types: ${input.types.join(", ")}`,
    `Language: ${input.language}`,
    input.customInstructions ? `Instructions: ${input.customInstructions}` : "",
    source ? `Grounding excerpts from educator material:\n${source}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Generation failed (${response.status}): ${detail.slice(0, 400)}`);
  }

  const payload = await response.json();
  const text = payload.choices?.[0]?.message?.content;
  if (!text) throw new Error("The model returned an empty response.");
  const parsed = JSON.parse(text) as { questions?: unknown[] };
  if (!Array.isArray(parsed.questions)) throw new Error("Model output was missing a questions array.");

  const questions: FixtureQuestion[] = parsed.questions.map((item, index) => {
    const result = generatedQuestionSchema.safeParse(item);
    if (!result.success) {
      throw new Error(`Question ${index + 1} failed validation: ${result.error.message}`);
    }
    return result.data as FixtureQuestion;
  });

  return {
    questions,
    usedFixture: false,
    notice:
      "AI-generated questions and explanations are drafts. Educators should verify correctness and suitability before publishing.",
  };
}
