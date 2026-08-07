import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DecisionActions } from "@/features/emergency/components/decision-actions";
import { ResolveActions } from "@/features/emergency/components/resolve-actions";

export function AvailableActionsPanel({ requestId }: { requestId: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Available actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div>
          <p className="mb-2 text-xs text-muted-foreground">
            Record a gatekeeping decision on the request itself.
          </p>
          <DecisionActions requestId={requestId} />
        </div>
        <Separator />
        <div>
          <p className="mb-2 text-xs text-muted-foreground">
            Or resolve the underlying booking directly, on the owner&apos;s behalf.
          </p>
          <ResolveActions requestId={requestId} />
        </div>
      </CardContent>
    </Card>
  );
}
