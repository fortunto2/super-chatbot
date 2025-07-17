import { auth } from '@/app/(auth)/auth';
import SuperDuperAIConnection from '@/components/superduperai-connection';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="flex h-dvh">
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex-1 p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Profile Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage your account settings and integrations.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold mb-4">Account Information</h2>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Email:</span>
                  <span className="ml-2 text-gray-900 dark:text-gray-100">{session.user.email}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">User ID:</span>
                  <span className="ml-2 text-gray-900 dark:text-gray-100 font-mono text-xs">{session.user.id}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Type:</span>
                  <span className="ml-2 text-gray-900 dark:text-gray-100 capitalize">{session.user.type}</span>
                </div>
              </div>
            </div>

            <SuperDuperAIConnection />

            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>
                Your SuperDuperAI connection allows you to use your personal credits for AI generation.
                When connected, all image and video generations will be charged to your SuperDuperAI account.
                If not connected, the system will use shared resources.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 