import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminOverviewStats } from '@/lib/db/admin-queries';
import { Users, CreditCard, Activity, FileText } from 'lucide-react';

export default async function AdminPage() {
  const stats = await getAdminOverviewStats();

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      description: `${stats.guestUsers} guests, ${stats.regularUsers} registered`,
      icon: Users,
      color: 'text-blue-500'
    },
    {
      title: 'Total Credits',
      value: stats.totalCredits,
      description: `Average: ${stats.averageCredits} per user`,
      icon: CreditCard,
      color: 'text-green-500'
    },
    {
      title: 'Documents Created',
      value: stats.totalDocuments,
      description: `${stats.imagesCount} images, ${stats.videosCount} videos`,
      icon: FileText,
      color: 'text-purple-500'
    },
    {
      title: 'Recent Activity',
      value: stats.recentTransactions,
      description: 'Transactions in last 24h',
      icon: Activity,
      color: 'text-orange-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of Super Chatbot system and user activity
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
            <CardDescription>
              Latest user registrations and activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.type === 'guest' ? 'Guest User' : 'Registered User'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{user.balance} credits</p>
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(user.createdAt || '').toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common admin tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <a
              href="/admin/users"
              className="flex items-center p-3 rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <Users className="h-5 w-5 mr-3 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Manage Users</p>
                <p className="text-xs text-muted-foreground">View and edit user accounts</p>
              </div>
            </a>
            
            <a
              href="/admin/balances"
              className="flex items-center p-3 rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <CreditCard className="h-5 w-5 mr-3 text-green-500" />
              <div>
                <p className="text-sm font-medium">Manage Balances</p>
                <p className="text-xs text-muted-foreground">Add or adjust user credits</p>
              </div>
            </a>
            
            <a
              href="/admin/documents"
              className="flex items-center p-3 rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <FileText className="h-5 w-5 mr-3 text-purple-500" />
              <div>
                <p className="text-sm font-medium">View Documents</p>
                <p className="text-xs text-muted-foreground">Browse generated content</p>
              </div>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 