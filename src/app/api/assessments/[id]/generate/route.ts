import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireEducatorAssessment } from "@/lib/access";
import { generateQuestions } from "@/lib/ai/generate";
import { currentUser, jsonError, unauthorized } from "@/lib/http";
import { generateSchema } from "@/lib/validations";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await currentUser();
    if (!user) return unauthorized();
    const { id } = await params;
    await requireEducatorAssessment(user.id, user.role, id);
    const form = await request.formData().catch(() => null);
    let input;
    let extracted = "";
    let sourceFileId: string | undefined;
    if (form) {
      const raw = String(form.get("payload") || "{}");
      input = generateSchema.parse(JSON.parse(raw));
      const file = form.get("file");
      if (file instanceof File && file.size > 0) {
        if (file.size > 4_000_000) {
          return NextResponse.json({ error: "Upload must be under 4 MB." }, { status: 400 });
        }
        const allowed = ["application/pdf", "text/plain"];
        if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|txt)$/i)) {
          return NextResponse.json({ error: "Upload a PDF or text file." }, { status: 400 });
        }
        const buffer = Buffer.from(await file.arrayBuffer());
        if (file.type === "text/plain" || file.name.endsWith(".txt")) {
          extracted = buffer.toString("utf8");
        } else {
          const { PDFParse } = await import("pdf-parse");
          const parser = new PDFParse({ data: buffer });
          const parsed = await parser.getText();
          extracted = parsed.text || "";
          await parser.destroy();
        }
        const upload = await prisma.uploadedFile.create({
          data: {
            ownerId: user.id,
            filename: file.name,
            mimeType: file.type || "application/octet-stream",
            sizeBytes: file.size,
            extractedText: extracted.slice(0, 20000),
            extractedTextStatus: extracted ? "ready" : "empty",
          },
        });
        sourceFileId = upload.id;
      }
    } else {
      input = generateSchema.parse(await request.json());
    }

    const job = await prisma.generationJob.create({
      data: {
        educatorId: user.id,
        assessmentId: id,
        inputConfig: input,
        sourceFileId,
        status: "PENDING",
      },
    });

    try {
      const result = await generateQuestions({
        ...input,
        sourceText: extracted || input.sourceText,
      });
      await prisma.generationJob.update({
        where: { id: job.id },
        data: { status: "SUCCEEDED", usedFixture: result.usedFixture },
      });
      return NextResponse.json({
        questions: result.questions,
        usedFixture: result.usedFixture,
        notice: result.notice,
        jobId: job.id,
      });
    } catch (error) {
      await prisma.generationJob.update({
        where: { id: job.id },
        data: { status: "FAILED", error: error instanceof Error ? error.message : "Generation failed" },
      });
      throw error;
    }
  } catch (error) {
    return jsonError(error);
  }
}
