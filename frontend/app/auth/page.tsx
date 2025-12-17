"use client";
import { AuthFormCard } from "@/components/global/auth/auth.form";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/user.context";

export default function Auth() {
  const router = useRouter();
  const { current: user, loading } = useUser();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [router, user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-black text-white p-4 overflow-x-hidden">
      <div className="w-full max-w-sm">
        <AuthFormCard />
      </div>
    </div>
  );
}
