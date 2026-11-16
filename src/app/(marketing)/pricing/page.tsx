import type { Metadata } from "next";
import { Badge, Card } from "@/components/ui";

export const metadata: Metadata = { title: "Pricing" };

const plans = [
  {
    name: "Free",
    price: "₹0",
    items: ["1 educator seat", "Draft and publish assessments", "Student attempts and review"],
  },
  {
    name: "Pro",
    price: "₹1,499 / month",
    items: ["AI generation allowance", "CSV export", "Longer assessments"],
  },
  {
    name: "Institution",
    price: "Talk to us",
    items: ["Multiple faculty", "Shared question banks", "Priority support"],
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <Badge tone="warn">Indicative pricing — payments are not enabled in this MVP</Badge>
      <h1 className="serif mt-4 text-4xl">Simple plans</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Figures below are for conversation only. Explore the demo without checkout.
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.name} className="p-5">
            <h2 className="serif text-2xl">{plan.name}</h2>
            <p className="mt-2 text-lg">{plan.price}</p>
            <ul className="mt-4 space-y-2 text-sm text-muted">
              {plan.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
