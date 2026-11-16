import { redirect } from "next/navigation";
import { auth } from "./auth";

export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/signin");
  return user;
}

export async function requireEducator() {
  const user = await requireUser();
  if (user.role !== "EDUCATOR") redirect("/student");
  return user;
}

export async function requireStudent() {
  const user = await requireUser();
  if (user.role !== "STUDENT") redirect("/educator");
  return user;
}
