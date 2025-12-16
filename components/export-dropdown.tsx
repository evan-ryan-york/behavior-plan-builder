"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";

interface ExportDropdownProps {
  planId: string;
  studentName: string;
  shareToken: string | null;
  shareEnabled: boolean;
}

export function ExportDropdown({
  planId,
  studentName,
  shareToken,
  shareEnabled,
}: ExportDropdownProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [currentShareToken, setCurrentShareToken] = useState(shareToken);
  const [currentShareEnabled, setCurrentShareEnabled] = useState(shareEnabled);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);

  const handleDownloadPdf = async () => {
    setIsLoading("pdf");
    try {
      const response = await fetch(`/api/plans/${planId}/pdf`);
      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const date = new Date().toISOString().split("T")[0];
      const safeName = studentName.replace(/[^a-z0-9]/gi, "-").toLowerCase();
      a.download = `behavior-plan-${safeName}-${date}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("PDF downloaded");
    } catch {
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsLoading(null);
    }
  };

  const handlePrint = () => {
    window.open(`/dashboard/plans/${planId}/print`, "_blank");
  };

  const handleCreateShareLink = async () => {
    setIsLoading("share");
    try {
      const response = await fetch(`/api/plans/${planId}/share`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to create share link");
      }
      const data = await response.json();
      setCurrentShareToken(data.share_token);
      setCurrentShareEnabled(true);
      setShareDialogOpen(true);
    } catch {
      toast.error("Failed to create share link. Please try again.");
    } finally {
      setIsLoading(null);
    }
  };

  const handleCopyLink = async () => {
    if (!currentShareToken) return;
    const shareUrl = `${window.location.origin}/shared/plans/${currentShareToken}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleDisableSharing = async () => {
    setIsLoading("disable");
    try {
      const response = await fetch(`/api/plans/${planId}/share`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to disable sharing");
      }
      setCurrentShareToken(null);
      setCurrentShareEnabled(false);
      setShareDialogOpen(false);
      toast.success("Sharing disabled");
    } catch {
      toast.error("Failed to disable sharing. Please try again.");
    } finally {
      setIsLoading(null);
    }
  };

  const handleDuplicate = async () => {
    setIsLoading("duplicate");
    try {
      const response = await fetch(`/api/plans/${planId}/duplicate`, {
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
      setIsLoading(null);
      setDuplicateDialogOpen(false);
    }
  };

  const shareUrl = currentShareToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/shared/plans/${currentShareToken}`
    : null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="default" disabled={isLoading !== null}>
            {isLoading === "pdf" ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Generating...
              </>
            ) : (
              <>
                Export
                <svg
                  className="h-4 w-4 ml-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={handleDownloadPdf}>
            <svg
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Download PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handlePrint}>
            <svg
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Print
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {currentShareEnabled ? (
            <DropdownMenuItem onClick={() => setShareDialogOpen(true)}>
              <svg
                className="h-4 w-4 mr-2 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              Manage share link
              <span className="ml-auto text-xs text-green-500">Active</span>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={handleCreateShareLink}>
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              Create shareable link
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setDuplicateDialogOpen(true)}>
            <svg
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Duplicate plan
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share this plan</DialogTitle>
            <DialogDescription>
              Anyone with this link can view this plan without signing in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl || ""}
                className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted"
              />
              <Button onClick={handleCopyLink} variant="outline" size="sm">
                Copy
              </Button>
            </div>
            <div className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 p-3 rounded-md">
              <strong>Privacy note:</strong> Anyone with this link can view this
              plan. Do not share links containing sensitive student information
              publicly.
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={handleDisableSharing}
              disabled={isLoading === "disable"}
            >
              {isLoading === "disable" ? "Disabling..." : "Disable sharing"}
            </Button>
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Dialog */}
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate this plan?</DialogTitle>
            <DialogDescription>
              This will create a copy of the plan that you can modify. The
              original plan will remain unchanged.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDuplicateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDuplicate}
              disabled={isLoading === "duplicate"}
            >
              {isLoading === "duplicate" ? "Duplicating..." : "Duplicate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
