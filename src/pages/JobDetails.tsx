import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { MapPin, Briefcase, DollarSign, Calendar, Building, Loader2, ArrowLeft } from 'lucide-react';

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [hasApplied, setHasApplied] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchJob();
    checkApplication();
  }, [id, user]);

  const fetchJob = async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select('*, profiles(full_name, company_name, company_logo, email)')
      .eq('id', id)
      .single();

    if (!error && data) {
      setJob(data);
    }
    setLoading(false);
  };

  const checkApplication = async () => {
    if (!user || !id) return;
    const { data } = await supabase
      .from('applications')
      .select('id')
      .eq('job_id', id)
      .eq('job_seeker_id', user.id)
      .maybeSingle();

    setHasApplied(!!data);
  };

  const handleApply = async () => {
    if (!user) {
      toast.error('Please sign in to apply');
      navigate('/auth');
      return;
    }

    if (userRole !== 'job_seeker') {
      toast.error('Only job seekers can apply for jobs');
      return;
    }

    setApplying(true);
    try {
      const { error } = await supabase
        .from('applications')
        .insert({
          job_id: id,
          job_seeker_id: user.id,
          cover_letter: coverLetter,
        });

      if (error) throw error;

      toast.success('Application submitted successfully!');
      setHasApplied(true);
      setDialogOpen(false);
      setCoverLetter('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center items-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Job not found</h1>
          <Button onClick={() => navigate('/jobs')}>Browse Jobs</Button>
        </div>
      </div>
    );
  }

  const formatSalary = () => {
    if (!job.salary_min && !job.salary_max) return 'Salary not specified';
    if (job.salary_min && job.salary_max) {
      return `$${(job.salary_min / 1000).toFixed(0)}k - $${(job.salary_max / 1000).toFixed(0)}k per year`;
    }
    if (job.salary_min) return `From $${(job.salary_min / 1000).toFixed(0)}k per year`;
    return `Up to $${(job.salary_max / 1000).toFixed(0)}k per year`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-3xl mb-2">{job.title}</CardTitle>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building className="h-4 w-4" />
                      <span>{job.profiles?.company_name || 'Company Name'}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap gap-3">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {job.location}
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    {job.job_type}
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {formatSalary()}
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(job.created_at).toLocaleDateString()}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3">Job Description</h3>
                  <p className="text-muted-foreground whitespace-pre-line">{job.description}</p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill: string) => (
                      <Badge key={skill} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {job.experience_level && (
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Experience Level</h3>
                    <Badge>{job.experience_level}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Apply for this job</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasApplied ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                      <p className="text-success font-medium">✓ Application Submitted</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        You've already applied for this position
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate('/dashboard')}
                    >
                      View My Applications
                    </Button>
                  </div>
                ) : (
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full" size="lg">
                        Apply Now
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Apply for {job.title}</DialogTitle>
                        <DialogDescription>
                          Submit your application with a cover letter
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Cover Letter (Optional)
                          </label>
                          <Textarea
                            placeholder="Tell us why you're interested in this position..."
                            value={coverLetter}
                            onChange={(e) => setCoverLetter(e.target.value)}
                            rows={6}
                          />
                        </div>
                        <Button
                          onClick={handleApply}
                          disabled={applying}
                          className="w-full"
                        >
                          {applying ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            'Submit Application'
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2">About the Company</h4>
                  <p className="text-sm text-muted-foreground">
                    {job.profiles?.company_name || 'Company Name'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}