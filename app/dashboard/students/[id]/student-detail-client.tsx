"use client";

import { useState } from "react";
import Link from "next/link";
import { Student, Plan } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StudentFormModal } from "@/components/student-form-modal";
import { DeleteStudentDialog } from "@/components/delete-student-dialog";

interface StudentDetailClientProps {
  student: Student;
  plans: Plan[];
}

export function StudentDetailClient({ student, plans }: StudentDetailClientProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Link
          href="/dashboard/students"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Students
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{student.name}</h1>
          {student.grade_level && (
            <p className="text-muted-foreground mt-1">{student.grade_level} Grade</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            {student.about ? (
              <p className="text-muted-foreground whitespace-pre-wrap">{student.about}</p>
            ) : (
              <p className="text-muted-foreground italic">No information added</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interests</CardTitle>
            <CardDescription>
              Helpful for reinforcement planning
            </CardDescription>
          </CardHeader>
          <CardContent>
            {student.interests ? (
              <p className="text-muted-foreground whitespace-pre-wrap">{student.interests}</p>
            ) : (
              <p className="text-muted-foreground italic">No interests added</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Behavior Plans</h2>
          <p className="text-muted-foreground mt-1">
            Intervention plans for {student.name}
          </p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/plans/new?studentId=${student.id}`}>
            Create New Plan
          </Link>
        </Button>
      </div>

      {plans.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground mb-4">
              No plans yet. Create a behavior intervention plan for {student.name}.
            </p>
            <Button asChild>
              <Link href={`/dashboard/plans/new?studentId=${student.id}`}>
                Create New Plan
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {plans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {plan.target_behavior || "Untitled Plan"}
                    </CardTitle>
                    <CardDescription>
                      Status: {plan.status.charAt(0).toUpperCase() + plan.status.slice(1).replace("_", " ")}
                    </CardDescription>
                  </div>
                  <Button asChild variant="outline">
                    <Link href={`/dashboard/plans/${plan.id}`}>View Plan</Link>
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <StudentFormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        student={student}
      />

      <DeleteStudentDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        studentId={student.id}
        studentName={student.name}
      />
    </div>
  );
}
