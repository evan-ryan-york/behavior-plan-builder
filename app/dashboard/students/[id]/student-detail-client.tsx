"use client";

import { useState } from "react";
import Link from "next/link";
import { Student, Plan } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StudentFormModal } from "@/components/student-form-modal";
import { DeleteStudentDialog } from "@/components/delete-student-dialog";
import { cn } from "@/lib/utils";

interface StudentDetailClientProps {
  student: Student;
  plans: Plan[];
}

function getStatusBadgeStyles(status: string) {
  switch (status) {
    case "complete":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "in_progress":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    case "draft":
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
  }
}

function formatStatus(status: string) {
  switch (status) {
    case "in_progress":
      return "In Progress";
    case "complete":
      return "Complete";
    case "draft":
    default:
      return "Draft";
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function StudentDetailClient({
  student,
  plans,
}: StudentDetailClientProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
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
            <p className="text-muted-foreground mt-1">
              {student.grade_level} Grade
            </p>
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
              <p className="text-muted-foreground whitespace-pre-wrap">
                {student.about}
              </p>
            ) : (
              <p className="text-muted-foreground italic">No information added</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interests</CardTitle>
            <CardDescription>Helpful for reinforcement planning</CardDescription>
          </CardHeader>
          <CardContent>
            {student.interests ? (
              <p className="text-muted-foreground whitespace-pre-wrap">
                {student.interests}
              </p>
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
            New Plan
          </Link>
        </Button>
      </div>

      {plans.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground mb-4">
              No plans yet. Create a behavior intervention plan for{" "}
              {student.name}.
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
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg truncate">
                        {plan.target_behavior || "Untitled Plan"}
                      </CardTitle>
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          getStatusBadgeStyles(plan.status)
                        )}
                      >
                        {formatStatus(plan.status)}
                      </span>
                    </div>
                    <CardDescription>
                      Created {formatDate(plan.created_at)}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {plan.status === "in_progress" ? (
                      <Button asChild>
                        <Link href={`/dashboard/plans/new?planId=${plan.id}`}>
                          Continue
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild variant="outline">
                        <Link href={`/dashboard/plans/${plan.id}`}>View</Link>
                      </Button>
                    )}
                  </div>
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
