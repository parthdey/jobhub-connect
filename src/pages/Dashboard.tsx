import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Briefcase, BookmarkIcon, Loader2, MapPin, Calendar } from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
    fetchBookmarks();
  }, [user]);

  const fetchApplications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('applications')
      .select('*, jobs(*, profiles(company_name))')
      .eq('job_seeker_id', user.id)
      .order('applied_at', { ascending: false });

    if (data) setApplications(data);
    setLoading(false);
  };

  const fetchBookmarks = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('bookmarks')
      .select('*, jobs(*, profiles(company_name))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setBookmarks(data);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'secondary',
      reviewed: 'default',
      accepted: 'default',
      rejected: 'destructive',
    };
    const colors: Record<string, string> = {
      pending: 'bg-warning/10 text-warning border-warning/20',
      reviewed: 'bg-primary/10 text-primary border-primary/20',
      accepted: 'bg-success/10 text-success border-success/20',
      rejected: '',
    };
    
    return (
      <Badge variant={variants[status] as any} className={colors[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <ProtectedRoute allowedRoles={['job_seeker']}>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">My Dashboard</h1>
            <p className="text-muted-foreground">Track your applications and saved jobs</p>
          </div>

          <Tabs defaultValue="applications" className="space-y-6">
            <TabsList>
              <TabsTrigger value="applications" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Applications ({applications.length})
              </TabsTrigger>
              <TabsTrigger value="bookmarks" className="flex items-center gap-2">
                <BookmarkIcon className="h-4 w-4" />
                Saved Jobs ({bookmarks.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="applications" className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : applications.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">You haven't applied to any jobs yet</p>
                    <Button onClick={() => navigate('/jobs')}>Browse Jobs</Button>
                  </CardContent>
                </Card>
              ) : (
                applications.map((app) => (
                  <Card key={app.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-1">{app.jobs.title}</CardTitle>
                          <CardDescription>
                            {app.jobs.profiles?.company_name || 'Company Name'}
                          </CardDescription>
                        </div>
                        {getStatusBadge(app.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-3 mb-4">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {app.jobs.location}
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Applied {new Date(app.applied_at).toLocaleDateString()}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/jobs/${app.jobs.id}`)}
                      >
                        View Job
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="bookmarks" className="space-y-4">
              {bookmarks.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <BookmarkIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">You haven't saved any jobs yet</p>
                    <Button onClick={() => navigate('/jobs')}>Browse Jobs</Button>
                  </CardContent>
                </Card>
              ) : (
                bookmarks.map((bookmark) => (
                  <Card key={bookmark.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-xl">{bookmark.jobs.title}</CardTitle>
                      <CardDescription>
                        {bookmark.jobs.profiles?.company_name || 'Company Name'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-3 mb-4">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {bookmark.jobs.location}
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {bookmark.jobs.job_type}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/jobs/${bookmark.jobs.id}`)}
                      >
                        View Job
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
}