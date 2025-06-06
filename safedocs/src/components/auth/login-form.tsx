'use client';

import { cn } from "lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const { signInWithGoogle } = useAuth();

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={(e) => {
        e.preventDefault();
        signInWithGoogle();
      }}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Login to your account</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter your email below to login to your account
        </p>
      </div>
      <div className="grid gap-6">
        {/* Aquí eliminamos los inputs de email/password y el botón de GitHub */}
        <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
          <span className="bg-background text-muted-foreground relative z-10 px-2">
            Or continue with
          </span>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={signInWithGoogle}
        >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 48 48"
          className="w-5 h-5"
        >
          <path
            fill="#EA4335"
            d="M24 9.5c3.54 0 6.67 1.2 9.16 3.56l6.87-6.87C35.19 2.66 29.95 0 24 0 14.67 0 6.74 5.35 2.6 13.3l7.97 6.18C12.92 13.8 18.02 9.5 24 9.5z"
          />
          <path
            fill="#4285F4"
            d="M46.5 24c0-1.51-.13-2.98-.37-4.4H24v8.34h12.7c-.55 2.96-2.2 5.46-4.71 7.15l7.47 5.8C43.86 37.52 46.5 31.34 46.5 24z"
          />
          <path
            fill="#FBBC05"
            d="M10.57 28.48A14.88 14.88 0 019 24c0-1.36.2-2.69.57-3.93L2.6 13.9A23.975 23.975 0 000 24c0 3.8.91 7.39 2.6 10.6l7.97-6.12z"
          />
          <path
            fill="#34A853"
            d="M24 48c6.48 0 11.92-2.15 15.89-5.85l-7.47-5.8c-2.08 1.4-4.74 2.23-8.42 2.23-5.98 0-11.08-4.3-12.93-10.09l-7.97 6.18C6.74 42.65 14.67 48 24 48z"
          />
          <path fill="none" d="M0 0h48v48H0z" />
        </svg>
          Login with Google
        </Button>
      </div>
    </form>
  );
}
