import { Sidebar } from "@/layouts/sidebar";
import { Topbar } from "@/layouts/topbar";
import { BreadcrumbProvider } from "@/layouts/breadcrumb-context";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <BreadcrumbProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 px-4 py-8 md:px-10 md:py-12">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </BreadcrumbProvider>
  );
}
