import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 p-4">
      <SignUp
        appearance={{
          elements: {
            card: "shadow-sm border border-border rounded-lg",
          },
        }}
      />
    </div>
  );
}
