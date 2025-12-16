import { Card, CardContent } from "@/components/ui/card";

export default function PlansPage() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">My Plans</h1>
        <p className="text-muted-foreground mt-1">
          View and manage your behavior intervention plans
        </p>
      </div>

      <Card className="text-center py-12">
        <CardContent>
          <p className="text-muted-foreground">
            Coming soon! The plans list page will be available in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
