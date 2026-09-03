"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/lib/store/AuthContext";
import { CrmDataProvider } from "@/lib/store/CrmDataContext";

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-page-bg">
        <div className="h-8 w-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    // Redirect já disparado pelo useEffect acima — evita renderizar o app sem usuário.
    return null;
  }

  return (
    <CrmDataProvider currentUser={user}>
      <AppShell>{children}</AppShell>
    </CrmDataProvider>
  );
}
