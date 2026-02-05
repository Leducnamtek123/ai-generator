import { Sidebar } from "@/components/layouts/Sidebar";
import { MobileNav } from "@/components/layouts/MobileNav";
import { MainLayout } from "@/components/layouts/MainLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute>
            <div className="flex w-full h-screen flex-col md:flex-row bg-[#0B0C0E] overflow-hidden">
                <MobileNav />
                <div className="hidden md:block h-full border-r border-white/5">
                    <Sidebar />
                </div>
                <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
                    <MainLayout>{children}</MainLayout>
                </main>
            </div>
        </ProtectedRoute>
    );
}
