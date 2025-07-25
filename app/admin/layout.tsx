import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import { AdminNavigation } from '@/components/admin/admin-navigation';

// Check if user is admin
function isAdmin(email?: string | null): boolean {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  return email ? adminEmails.includes(email) : false;
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Redirect if not authenticated or not admin
  if (!session?.user) {
    redirect('/login?callbackUrl=/admin');
  }

  if (!isAdmin(session.user.email)) {
    redirect('/');
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-card">
        <div className="flex h-16 items-center border-b border-border px-6">
          <h1 className="text-xl font-semibold">Admin Panel</h1>
        </div>
        <AdminNavigation />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
          <h2 className="text-lg font-medium">Super Chatbot Administration</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Logged in as: {session.user.email}
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 