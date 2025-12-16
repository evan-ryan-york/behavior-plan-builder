"use client";

import { useState, useEffect } from "react";
import { Student } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface StepStudentContextProps {
  student: Student;
  onBack: () => void;
  onContinue: (updatedStudent: Student) => void;
}

export function StepStudentContext({
  student,
  onBack,
  onContinue,
}: StepStudentContextProps) {
  const [about, setAbout] = useState(student.about || "");
  const [interests, setInterests] = useState(student.interests || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAbout(student.about || "");
    setInterests(student.interests || "");
  }, [student]);

  const handleContinue = async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();

    const { data, error: updateError } = await supabase
      .from("students")
      .update({
        about: about.trim() || null,
        interests: interests.trim() || null,
      })
      .eq("id", student.id)
      .select()
      .single();

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    onContinue(data as Student);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">
          Tell us more about {student.name}
        </h2>
        <p className="text-muted-foreground mt-2">
          The more context you provide, the better the plan will be.
        </p>
      </div>

      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="grid gap-2">
          <Label htmlFor="about" className="text-base font-medium">
            About this student
          </Label>
          <p className="text-sm text-muted-foreground">
            What should we know about this student? Personality, strengths,
            challenges, relevant history.
          </p>
          <Textarea
            id="about"
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder="e.g., Marcus is a 4th grader who loves building things and struggles with transitions between activities..."
            rows={4}
            className="resize-none"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="interests" className="text-base font-medium">
            Interests & Motivators
          </Label>
          <p className="text-sm text-muted-foreground">
            What activities, items, or topics motivate this student? This helps
            us suggest effective reinforcement strategies.
          </p>
          <Textarea
            id="interests"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            placeholder="e.g., Minecraft, basketball, drawing, extra recess time, helping the teacher..."
            rows={4}
            className="resize-none"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <p className="text-sm text-muted-foreground text-center italic">
          Both fields are optional but encouraged.
        </p>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack} size="lg">
          Back
        </Button>
        <Button onClick={handleContinue} disabled={loading} size="lg">
          {loading ? "Saving..." : "Continue"}
        </Button>
      </div>
    </div>
  );
}
