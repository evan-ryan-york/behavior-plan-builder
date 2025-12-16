"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Plan } from "@/lib/types";

interface PlanWithStudent extends Plan {
  students: {
    id: string;
    name: string;
    grade_level: string | null;
  } | null;
}

interface PlansListClientProps {
  plans: PlanWithStudent[];
}

type StatusFilter = "all" | "draft" | "in_progress" | "complete";
type SortBy = "updated_at" | "created_at" | "student_name";

function getStatusBadgeStyles(status: string) {
  switch (status) {
    case "complete":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "in_progress":
    case "assessment_complete":
    case "generating":
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
    case "assessment_complete":
      return "Assessment Done";
    case "generating":
      return "Generating";
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

export function PlansListClient({ plans }: PlansListClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("updated_at");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<PlanWithStudent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null);

  // Filter and sort plans
  const filteredPlans = useMemo(() => {
    let result = [...plans];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (plan) =>
          plan.students?.name.toLowerCase().includes(searchLower) ||
          plan.target_behavior?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "in_progress") {
        result = result.filter(
          (plan) =>
            plan.status === "in_progress" ||
            plan.status === "assessment_complete" ||
            plan.status === "generating" ||
            plan.status === "draft"
        );
      } else {
        result = result.filter((plan) => plan.status === statusFilter);
      }
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "created_at":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "student_name":
          return (a.students?.name || "").localeCompare(b.students?.name || "");
        case "updated_at":
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

    return result;
  }, [plans, search, statusFilter, sortBy]);

  const handleDelete = async () => {
    if (!planToDelete) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/plans/${planToDelete.id}/delete`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete plan");
      }

      toast.success("Plan deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete plan. Please try again.");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
    }
  };

  const handleDuplicate = async (plan: PlanWithStudent) => {
    setIsDuplicating(plan.id);
    try {
      const response = await fetch(`/api/plans/${plan.id}/duplicate`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to duplicate plan");
      }

      const data = await response.json();
      toast.success("Plan duplicated");
      router.push(`/dashboard/plans/new?planId=${data.id}`);
    } catch {
      toast.error("Failed to duplicate plan. Please try again.");
    } finally {
      setIsDuplicating(null);
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Plans</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your behavior intervention plans
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/plans/new">New Plan</Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search by student name or behavior..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="complete">Complete</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated_at">Last modified</SelectItem>
              <SelectItem value="created_at">Date created</SelectItem>
              <SelectItem value="student_name">Student name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results count */}
      {(search || statusFilter !== "all") && (
        <p className="text-sm text-muted-foreground mb-4">
          Showing {filteredPlans.length} of {plans.length} plans
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
              className="ml-2 text-primary hover:underline"
            >
              Clear filters
            </button>
          )}
        </p>
      )}

      {/* Empty state */}
      {plans.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="mb-4">
              <svg
                className="h-12 w-12 mx-auto text-muted-foreground/50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-lg mb-2">No behavior plans yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first behavior intervention plan to get started.
            </p>
            <Button asChild>
              <Link href="/dashboard/plans/new">Create New Plan</Link>
            </Button>
          </CardContent>
        </Card>
      ) : filteredPlans.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="mb-4">
              <svg
                className="h-12 w-12 mx-auto text-muted-foreground/50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-lg mb-2">No plans match your search</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters or search terms.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
            >
              Clear filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredPlans.map((plan) => {
            const student = plan.students;

            return (
              <Card key={plan.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg truncate">
                          {student?.name || "Unknown Student"}
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
                      <CardDescription className="line-clamp-2">
                        {plan.target_behavior || "No target behavior defined"}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm text-muted-foreground">
                        {formatDate(plan.updated_at)}
                      </span>
                      <Button asChild variant="outline" size="sm">
                        <Link
                          href={
                            plan.status === "complete"
                              ? `/dashboard/plans/${plan.id}`
                              : `/dashboard/plans/new?planId=${plan.id}`
                          }
                        >
                          {plan.status === "complete" ? "View" : "Continue"}
                        </Link>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                              />
                            </svg>
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/plans/${plan.id}`}>
                              View plan
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/plans/new?planId=${plan.id}`}>
                              Edit plan
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDuplicate(plan)}
                            disabled={isDuplicating === plan.id}
                          >
                            {isDuplicating === plan.id ? "Duplicating..." : "Duplicate"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => {
                              setPlanToDelete(plan);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this plan?</DialogTitle>
            <DialogDescription>
              This will permanently delete the behavior plan for{" "}
              <strong>{planToDelete?.students?.name || "this student"}</strong>.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setPlanToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
