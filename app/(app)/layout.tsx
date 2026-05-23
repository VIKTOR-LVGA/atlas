import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { ProfileProvider } from "@/components/profile/ProfileProvider";
import { getCurrentProfile } from "@/lib/profiles";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  return (
    <ProfileProvider profile={profile}>
      <div className="flex min-h-screen bg-[#f1f5f9]">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col lg:pl-0">
          <TopBar />
          <main className="flex-1 overflow-auto">
            <div className="mx-auto w-full max-w-[1200px] px-4 py-5 sm:px-6 sm:py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProfileProvider>
  );
}
