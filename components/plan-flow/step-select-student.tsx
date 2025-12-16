"use client";

import { useState } from "react";
import { Student } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface StepSelectStudentProps {
  students: Student[];
  selectedStudent: Student | null;
  onSelectStudent: (student: Student) => void;
  onContinue: () => void;
}

const gradeOptions = [
  "Pre-K",
  "Kindergarten",
  "1st",
  "2nd",
  "3rd",
  "4th",
  "5th",
  "6th",
  "7th",
  "8th",
  "9th",
  "10th",
  "11th",
  "12th",
];

export function StepSelectStudent({
  students,
  selectedStudent,
  onSelectStudent,
  onContinue,
}: StepSelectStudentProps) {
  const [showNewStudentForm, setShowNewStudentForm] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentGrade, setNewStudentGrade] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateStudent = async () => {
    if (!newStudentName.trim()) {
      setError("Name is required");
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in");
      setLoading(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("students")
      .insert({
        name: newStudentName.trim(),
        grade_level: newStudentGrade || null,
        user_id: user.id,
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    onSelectStudent(data as Student);
    setShowNewStudentForm(false);
    setNewStudentName("");
    setNewStudentGrade("");
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">Select a Student</h2>
        <p className="text-muted-foreground mt-2">
          Choose an existing student or add a new one to create a behavior plan.
        </p>
      </div>

      {students.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((student) => (
            <Card
              key={student.id}
              className={cn(
                "cursor-pointer transition-all hover:border-primary/50",
                selectedStudent?.id === student.id &&
                  "border-primary ring-2 ring-primary/20"
              )}
              onClick={() => onSelectStudent(student)}
            >
              <CardContent className="p-4">
                <div className="font-medium">{student.name}</div>
                {student.grade_level && (
                  <div className="text-sm text-muted-foreground">
                    {student.grade_level} Grade
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!showNewStudentForm ? (
        <Card
          className="cursor-pointer border-dashed hover:border-primary/50 transition-colors"
          onClick={() => setShowNewStudentForm(true)}
        >
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="font-medium">Add New Student</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">New Student</h3>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="new-student-name">Name *</Label>
                <Input
                  id="new-student-name"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="Student's name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-student-grade">Grade Level</Label>
                <Select value={newStudentGrade} onValueChange={setNewStudentGrade}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade level" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeOptions.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowNewStudentForm(false);
                    setError(null);
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateStudent}
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create & Select"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end pt-4">
        <Button onClick={onContinue} disabled={!selectedStudent} size="lg">
          Continue
        </Button>
      </div>
    </div>
  );
}
