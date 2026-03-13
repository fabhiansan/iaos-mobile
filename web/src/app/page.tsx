"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { TextInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type SplashPhase = 0 | 1 | 2 | 3 | 4;

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

export default function Home() {
  const [phase, setPhase] = useState<SplashPhase>(0);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const isFormValid = email.trim() !== "" && password.trim() !== "";

  const handleLogin = async () => {
    setIsLoading(true);
    setError("");
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/news");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),
      setTimeout(() => setPhase(2), 1600),
      setTimeout(() => setPhase(3), 2400),
      setTimeout(() => setPhase(4), 3200),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="auth-gradient flex min-h-screen flex-col items-center bg-white">
      <div className="relative z-10 flex w-full max-w-md flex-col items-center px-4">
        {/* Logo */}
        <div
          className="flex flex-col items-center transition-all duration-700 ease-in-out"
          style={{
            marginTop: phase >= 3 ? 100 : "calc(50vh - 50px)",
          }}
        >
          {/* Clip container — icon only → full logo reveal */}
          <div
            className="overflow-hidden rounded-lg transition-all duration-700 ease-in-out"
            style={{
              direction: "rtl",
              width: phase >= 1 ? 141 : 55,
              height: 72,
            }}
          >
            <div
              className="flex items-center justify-center p-1"
              style={{ direction: "ltr", width: 141, height: 72 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="IAOS Connect Logo"
                width={133}
                height={64}
              />
            </div>
          </div>

          {/* "IAOS Connect" text */}
          <span
            className="mt-2 font-[family-name:var(--font-work-sans)] text-[22px] font-medium text-brand-900 transition-all duration-500 ease-in-out"
            style={{
              opacity: phase >= 2 ? 1 : 0,
              transform: phase >= 2 ? "translateY(0)" : "translateY(8px)",
            }}
          >
            IAOS Connect
          </span>
        </div>

        {/* Login content — fades in after splash */}
        <div
          className="w-full transition-all duration-700 ease-in-out"
          style={{
            opacity: phase >= 4 ? 1 : 0,
            transform: phase >= 4 ? "translateY(0)" : "translateY(20px)",
            pointerEvents: phase >= 4 ? "auto" : "none",
          }}
        >
          {/* Welcome text */}
          <div className="mt-8 w-full">
            <h1 className="font-[family-name:var(--font-work-sans)] text-[32px] font-semibold leading-[42px] text-neutral-800">
              Welcome Back,
              <br />
              Alumni
            </h1>
            <p className="mt-2 font-[family-name:var(--font-work-sans)] text-base text-neutral-600">
              Sign in to connect with your network
            </p>
          </div>

          {/* Form */}
          <div className="mt-8 flex w-full flex-col gap-4">
            <TextInput
              label="Email"
              type="email"
              placeholder="Enter your email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <TextInput
              label="Password"
              type="password"
              placeholder="Enter your password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Link
              href="/forgot-password"
              className="font-[family-name:var(--font-work-sans)] text-sm font-medium text-brand-600"
            >
              Forget Password?
            </Link>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <Button
              variant={isFormValid && !isLoading ? "primary" : "disabled"}
              disabled={!isFormValid || isLoading}
              onClick={handleLogin}
            >
              {isLoading ? "Signing in..." : "Login"}
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-neutral-400" />
              <span className="font-[family-name:var(--font-work-sans)] text-sm text-neutral-600">
                or
              </span>
              <div className="h-px flex-1 bg-neutral-400" />
            </div>

            <Button
              variant="secondary"
              icon={<GoogleIcon />}
              onClick={() => signIn("google")}
            >
              Continue with Google
            </Button>

            {/* Sign up link */}
            <p className="mt-2 mb-8 text-center font-[family-name:var(--font-work-sans)] text-sm text-neutral-600">
              New to IAOS Connect?{" "}
              <Link
                href="/register"
                className="font-medium text-brand-600"
              >
                Create an Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
