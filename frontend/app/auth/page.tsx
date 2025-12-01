"use client";
import { AuthFormCard } from "@/components/global/auth/auth.form";
import React from "react";

export default function Auth() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-black text-white p-4 overflow-x-hidden">
      <div className="w-full max-w-sm">
        <AuthFormCard />
      </div>
    </div>
  );
}
