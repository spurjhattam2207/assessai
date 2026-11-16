import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signupSchema } from "@/lib/validations";
import { jsonError } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const body = signupSchema.parse(await request.json());
    const existing = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
    }
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email.toLowerCase(),
        passwordHash: await bcrypt.hash(body.password, 10),
        role: body.role,
        profile: {
          create: {
            audience: body.audience,
            institution: body.institution,
            interests: [],
          },
        },
      },
    });
    return NextResponse.json({ id: user.id });
  } catch (error) {
    return jsonError(error);
  }
}
