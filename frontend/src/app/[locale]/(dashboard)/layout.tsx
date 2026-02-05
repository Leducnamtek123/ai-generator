'use client';

import { useState } from 'react';
import { Sidebar } from "@/components/layouts/Sidebar";
import { MobileNav } from "@/components/layouts/MobileNav";
import { MainLayout } from "@/components/layouts/MainLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <ProtectedRoute>
            <div className="flex w-full h-screen flex-col md:flex-row bg-[#0B0C0E] overflow-hidden">
                <MobileNav
                    isOpen={isMobileMenuOpen}
                    onOpenChange={setIsMobileMenuOpen}
                />
                <div className="hidden md:block h-full border-r border-white/5">
                    <Sidebar />
                </div>
                <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
                    <MainLayout onMenuClick={() => setIsMobileMenuOpen(true)}>
                        {children}
                    </MainLayout>
                </main>
            </div>
        </ProtectedRoute>
    );
}
