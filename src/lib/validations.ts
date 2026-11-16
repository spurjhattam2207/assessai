import { z } from "zod";

export const audienceSchema = z.enum(["JEE", "UPSC", "COLLEGE"]);
export const difficultySchema = z.enum(["EASY", "MEDIUM", "HARD"]);
export const questionTypeSchema = z.enum(["SINGLE_MCQ", "MULTI_MCQ", "NUMERICAL", "SHORT_ANSWER"]);

export const signupSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  role: z.enum(["EDUCATOR", "STUDENT"]),
  audience: audienceSchema,
  institution: z.string().max(120).optional(),
});

export const assessmentSchema = z.object({
  title: z.string().min(3).max(140),
  description: z.string().max(2000).optional().default(""),
  audience: audienceSchema,
  subject: z.string().min(2).max(120),
  topics: z.array(z.string().min(1).max(80)).max(12).default([]),
  difficulty: difficultySchema.default("MEDIUM"),
  durationMinutes: z.coerce.number().int().min(5).max(300),
  negativeMarking: z.boolean().default(false),
  instructions: z.string().max(4000).optional().default(""),
  accessMode: z.enum(["PUBLIC_LINK", "SIGNED_IN"]).default("SIGNED_IN"),
});

export const questionSchema = z.object({
  id: z.string().optional(),
  type: questionTypeSchema,
  prompt: z.string().min(4),
  options: z
    .array(z.object({ id: z.string(), text: z.string().min(1) }))
    .default([]),
  correctAnswer: z.object({
    optionIds: z.array(z.string()).optional(),
    value: z.number().optional(),
    text: z.string().optional(),
  }),
  explanation: z.string().max(4000).optional().default(""),
  topic: z.string().min(1).max(80),
  difficulty: difficultySchema.default("MEDIUM"),
  marks: z.coerce.number().min(0.5).max(100),
  negativeMarks: z.coerce.number().min(0).max(100).default(0),
  tolerance: z.coerce.number().min(0).optional().nullable(),
  flagForReview: z.boolean().optional().default(false),
  generated: z.boolean().optional().default(false),
  sourceRef: z.string().optional().nullable(),
});

export const generateSchema = z.object({
  audience: audienceSchema,
  subject: z.string().min(2),
  topics: z.array(z.string()).min(1),
  difficulty: difficultySchema,
  questionCount: z.coerce.number().int().min(1).max(20),
  types: z.array(questionTypeSchema).min(1),
  language: z.string().default("English"),
  customInstructions: z.string().max(2000).optional().default(""),
  sourceText: z.string().max(20000).optional().default(""),
});

export const generatedQuestionSchema = z.object({
  type: questionTypeSchema,
  prompt: z.string().min(4),
  options: z.array(z.object({ id: z.string(), text: z.string() })).default([]),
  correctAnswer: z.object({
    optionIds: z.array(z.string()).optional(),
    value: z.number().optional(),
    text: z.string().optional(),
  }),
  explanation: z.string(),
  topic: z.string(),
  difficulty: difficultySchema,
  marks: z.number(),
  negativeMarks: z.number().default(0),
  tolerance: z.number().nullable().optional(),
});
