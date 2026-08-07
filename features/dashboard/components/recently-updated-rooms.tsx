import Link from "next/link";
import { History } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoomStatusBadge } from "@/features/rooms/components/room-status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import type { Room } from "@/types";

function formatRelativeTime(dateString: string | Date): string {
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.round(diffMs / 60_000);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function RecentlyUpdatedRooms({ rooms }: { rooms: Room[] }) {
  const sorted = [...rooms]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle>Recently updated rooms</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {sorted.length === 0 ? (
          <EmptyState
            icon={History}
            title="No room activity yet"
            description="Updates to room details or availability will show up here."
          />
        ) : (
          <ul className="divide-y divide-border">
            {sorted.map((room) => (
              <li key={room.id}>
                <Link
                  href={`/rooms/${room.id}`}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm transition-colors hover:text-primary"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{room.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Updated {formatRelativeTime(room.updatedAt)}
                    </p>
                  </div>
                  <RoomStatusBadge status={room.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
