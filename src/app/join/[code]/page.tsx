import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";

export default async function JoinCodePage({ params }: { params: Promise<{ code: string }> }) {
  const user = await getSessionUser();
  const { code } = await params;
  if (!user) {
    redirect(`/signin?from=/join/${code}`);
  }
  if (user.role !== "STUDENT") {
    redirect("/educator");
  }
  redirect(`/student/join?code=${encodeURIComponent(code)}`);
}
