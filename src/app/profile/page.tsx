import { AppHeader } from "@/components/site-chrome";
import { Card } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export default async function ProfilePage() {
  const user = await requireUser();
  const record = await prisma.user.findUnique({
    where: { id: user.id },
    include: { profile: true },
  });
  return (
    <div>
      <AppHeader />
      <div className="mx-auto max-w-xl px-4 py-8">
        <h1 className="serif text-3xl">Profile</h1>
        <Card className="mt-6 space-y-2 p-5 text-sm">
          <p>
            <span className="text-muted">Name</span>
            <br />
            {record?.name}
          </p>
          <p>
            <span className="text-muted">Email</span>
            <br />
            {record?.email}
          </p>
          <p>
            <span className="text-muted">Role</span>
            <br />
            {record?.role.toLowerCase()}
          </p>
          <p>
            <span className="text-muted">Context</span>
            <br />
            {record?.profile?.audience}
          </p>
          {record?.isDemo ? <p className="text-warn">Demo account — data may be reset.</p> : null}
        </Card>
      </div>
    </div>
  );
}
