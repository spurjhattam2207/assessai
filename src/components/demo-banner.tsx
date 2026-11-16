export function DemoBanner({ label = "Demo data" }: { label?: string }) {
  return (
    <div className="border-b border-line bg-indigo-50 px-4 py-2 text-center text-sm text-accent-deep">
      {label}. Sample accounts and assessments are fictional and for product walkthroughs only.
    </div>
  );
}
