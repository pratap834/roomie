"use client";

import * as React from "react";
import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDecideEmergency } from "@/features/emergency/hooks/use-decide-emergency";

export function DecisionActions({ requestId }: { requestId: string }) {
  const [pendingDecision, setPendingDecision] = React.useState<"APPROVE" | "REJECT" | null>(null);
  const [note, setNote] = React.useState("");
  const decide = useDecideEmergency(requestId);

  function handleConfirm() {
    if (!pendingDecision) return;
    decide.mutate(
      { decision: pendingDecision, resolution: note.trim() || undefined },
      {
        onSuccess: () => {
          setPendingDecision(null);
          setNote("");
        },
      },
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="text-success hover:text-success"
          onClick={() => setPendingDecision("APPROVE")}
        >
          <Check className="h-3.5 w-3.5" />
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-destructive hover:text-destructive"
          onClick={() => setPendingDecision("REJECT")}
        >
          <X className="h-3.5 w-3.5" />
          Reject
        </Button>
      </div>

      <Dialog open={pendingDecision !== null} onOpenChange={(open) => !open && setPendingDecision(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingDecision === "APPROVE" ? "Approve this request" : "Reject this request"}
            </DialogTitle>
            <DialogDescription>
              {pendingDecision === "APPROVE"
                ? "Approve this emergency override request for your room."
                : "Decline this emergency override request to keep your existing room booking."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="decision-note">Note (optional)</Label>
            <Textarea
              id="decision-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add context for this decision..."
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDecision(null)} disabled={decide.isPending}>
              Go back
            </Button>
            <Button onClick={handleConfirm} disabled={decide.isPending}>
              {decide.isPending
                ? "Saving..."
                : pendingDecision === "APPROVE"
                  ? "Approve"
                  : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
