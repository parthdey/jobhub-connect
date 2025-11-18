import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Mail, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function Applicants() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [jobId]);

  const fetchData = async () => {
    const [jobRes, applicantsRes] = await Promise.all([
      supabase.from('jobs').select('*').eq('id', jobId).single(),
      supabase
        .from('applications')
        .select('*, profiles(full_name, email, phone, resume_url)')
        .eq('job_id', jobId)
        .order('applied_at', { ascending: false }),
    ]);

    if (jobRes.data) setJob(jobRes.data);
    if (applicantsRes.data) setApplicants(applicantsRes.data);
    setLoading(false);
  };

  const updateStatus = async (applicationId: string, status: string) => {
    const { error } = await supabase
      .from('applications')
      .update({ status })
      .eq('id', applicationId);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success('Status updated');
      fetchData();
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['employer']}>
        <div className="min-h-screen bg-background">
          <Navbar />
          <div className="flex justify-center items-center h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['employer']}>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => navigate('/employer')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{job?.title}</h1>
            <p className="text-muted-foreground">{applicants.length} applicants</p>
          </div>

          {applicants.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">No applications yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {applicants.map((app) => (
                <Card key={app.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{app.profiles.full_name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Mail className="h-3 w-3" />
                          {app.profiles.email}
                        </CardDescription>
                      </div>
                      <Badge>{app.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {app.cover_letter && (
                      <div>
                        <h4 className="font-semibold mb-2">Cover Letter</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                          {app.cover_letter}
                        </p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Select
                        value={app.status}
                        onValueChange={(status) => updateStatus(app.id, status)}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="reviewed">Reviewed</SelectItem>
                          <SelectItem value="accepted">Accepted</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}