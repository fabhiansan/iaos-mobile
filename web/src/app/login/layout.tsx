import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login — IAOS Connect",
  description: "Sign in to IAOS Connect to access your alumni network.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
