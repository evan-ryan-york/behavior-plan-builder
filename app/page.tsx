import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "Guided Assessment",
    description: "Answer targeted questions about student behaviors, triggers, and current interventions to build a complete picture.",
  },
  {
    title: "AI-Powered Plans",
    description: "Our AI analyzes your responses to generate comprehensive, evidence-based behavior intervention plans.",
  },
  {
    title: "Edit & Refine",
    description: "Review and customize every section of your plan to match your specific classroom context and student needs.",
  },
  {
    title: "Export & Share",
    description: "Download professional PDF documents or share directly with parents, administrators, and support teams.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
            Behavior Plan Builder
          </h1>
          <p className="text-xl text-muted-foreground">
            AI-powered behavior intervention plans for educators
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Create professional behavior intervention plans in minutes. Answer a few questions
            about your student, and our AI will generate a comprehensive plan with replacement
            behaviors, prevention strategies, and reinforcement techniques.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button asChild size="lg">
              <Link href="/signup">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="px-6 py-24 bg-muted/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {features.map((feature) => (
              <Card key={feature.title} className="bg-card">
                <CardHeader>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>Built for educators</p>
          <p>&copy; {new Date().getFullYear()} Behavior Plan Builder. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
