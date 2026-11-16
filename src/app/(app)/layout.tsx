import { AppHeader } from "@/components/site-chrome";
import { DemoBanner } from "@/components/demo-banner";
import { auth } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <div className="min-h-screen">
      {session?.user?.isDemo ? <DemoBanner /> : null}
      <AppHeader />
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
    </div>
  );
}
