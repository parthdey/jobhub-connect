import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Users, Briefcase, CheckCircle, XCircle } from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function AdminDashboard() {
  const [pendingEmployers, setPendingEmployers] = useState<any[]>([]);
  const [stats, setStats] = useState({ users: 0, jobs: 0, applications: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [employersRes, statsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('*, user_roles(role)')
        .eq('is_employer_approved', false),
      supabase.rpc('get_admin_stats' as any),
    ]);

    if (employersRes.data) {
      const employers = employersRes.data.filter((p: any) =>
        p.user_roles?.some((r: any) => r.role === 'employer')
      );
      setPendingEmployers(employers);
    }

    const [usersCount, jobsCount, appsCount] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('jobs').select('id', { count: 'exact', head: true }),
      supabase.from('applications').select('id', { count: 'exact', head: true }),
    ]);

    setStats({
      users: usersCount.count || 0,
      jobs: jobsCount.count || 0,
      applications: appsCount.count || 0,
    });
  };

  const approveEmployer = async (id: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_employer_approved: true })
      .eq('id', id);

    if (error) {
      toast.error('Failed to approve employer');
    } else {
      toast.success('Employer approved');
      fetchData();
    }
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.users}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.jobs}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Applications</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.applications}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Pending Employer Approvals ({pendingEmployers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingEmployers.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No pending approvals</p>
              ) : (
                <div className="space-y-4">
                  {pendingEmployers.map((employer) => (
                    <div key={employer.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold">{employer.full_name}</p>
                        <p className="text-sm text-muted-foreground">{employer.email}</p>
                        {employer.company_name && (
                          <Badge variant="secondary" className="mt-1">{employer.company_name}</Badge>
                        )}
                      </div>
                      <Button onClick={() => approveEmployer(employer.id)}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}