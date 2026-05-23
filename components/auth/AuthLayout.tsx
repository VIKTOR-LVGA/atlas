import { AuthShell } from "@/components/auth/AuthShell";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

/** @deprecated Use AuthShell — kept for existing imports */
export function AuthLayout(props: AuthLayoutProps) {
  return <AuthShell {...props} />;
}
