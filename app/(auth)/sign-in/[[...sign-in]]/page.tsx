import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 p-4">
      <SignIn
        appearance={{
          elements: {
            card: "shadow-sm border border-border rounded-lg",
          },
        }}
      />
    </div>
  );
}
