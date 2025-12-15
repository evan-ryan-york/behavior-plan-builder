"use client";

import { useState } from "react";
import Link from "next/link";
import { Student } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentFormModal } from "@/components/student-form-modal";

interface StudentsClientProps {
  students: Student[];
}

export function StudentsClient({ students }: StudentsClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Students</h1>
          <p className="text-muted-foreground mt-1">
            Manage your student profiles and create behavior plans
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>Add Student</Button>
      </div>

      {students.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground mb-4">
              No students yet. Add your first student to get started.
            </p>
            <Button onClick={() => setIsModalOpen(true)}>Add Student</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((student) => (
            <Card key={student.id}>
              <CardHeader>
                <CardTitle className="text-xl">{student.name}</CardTitle>
                {student.grade_level && (
                  <CardDescription>{student.grade_level} Grade</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {student.about ? (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {student.about}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No description added
                  </p>
                )}
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button asChild variant="outline" className="flex-1">
                  <Link href={`/dashboard/students/${student.id}`}>View</Link>
                </Button>
                <Button asChild className="flex-1">
                  <Link href={`/dashboard/plans/new?studentId=${student.id}`}>
                    New Plan
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <StudentFormModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  );
}
