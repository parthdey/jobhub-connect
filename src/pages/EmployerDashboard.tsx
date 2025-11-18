import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Plus, Edit, Trash, Users, Loader2, AlertCircle } from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useNavigate } from 'react-router-dom';

const JOB_TYPES = ['full-time', 'part-time', 'contract', 'internship', 'freelance'];
const CATEGORIES = ['technology', 'marketing', 'design', 'sales', 'finance', 'healthcare', 'education', 'other'];

export default function EmployerDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    job_type: 'full-time',
    category: 'technology',
    salary_min: '',
    salary_max: '',
    skills: '',
    experience_level: '',
  });

  useEffect(() => {
    fetchJobs();
  }, [user]);

  const fetchJobs = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('jobs')
      .select('*, applications(count)')
      .eq('employer_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setJobs(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const jobData = {
      ...formData,
      employer_id: user!.id,
      salary_min: formData.salary_min ? parseFloat(formData.salary_min) * 1000 : null,
      salary_max: formData.salary_max ? parseFloat(formData.salary_max) * 1000 : null,
      skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
    };

    try {
      if (editingJob) {
        const { error } = await supabase
          .from('jobs')
          .update(jobData)
          .eq('id', editingJob.id);
        if (error) throw error;
        toast.success('Job updated successfully');
      } else {
        const { error } = await supabase.from('jobs').insert(jobData);
        if (error) throw error;
        toast.success('Job posted successfully');
      }

      setDialogOpen(false);
      resetForm();
      fetchJobs();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save job');
    }
  };

  const handleEdit = (job: any) => {
    setEditingJob(job);
    setFormData({
      title: job.title,
      description: job.description,
      location: job.location,
      job_type: job.job_type,
      category: job.category,
      salary_min: job.salary_min ? (job.salary_min / 1000).toString() : '',
      salary_max: job.salary_max ? (job.salary_max / 1000).toString() : '',
      skills: job.skills.join(', '),
      experience_level: job.experience_level || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return;
    
    const { error } = await supabase.from('jobs').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete job');
    } else {
      toast.success('Job deleted successfully');
      fetchJobs();
    }
  };

  const resetForm = () => {
    setEditingJob(null);
    setFormData({
      title: '',
      description: '',
      location: '',
      job_type: 'full-time',
      category: 'technology',
      salary_min: '',
      salary_max: '',
      skills: '',
      experience_level: '',
    });
  };

  const viewApplicants = (jobId: string) => {
    navigate(`/employer/applicants/${jobId}`);
  };

  if (!profile?.is_employer_approved) {
    return (
      <ProtectedRoute allowedRoles={['employer']}>
        <div className="min-h-screen bg-background">
          <Navbar />
          <div className="container mx-auto px-4 py-12">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-8 w-8 text-warning" />
                  <div>
                    <CardTitle>Pending Approval</CardTitle>
                    <CardDescription>
                      Your employer account is pending admin approval
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Thank you for registering as an employer. Your account is currently under review by our admin team.
                  You'll be able to post jobs once your account is approved.
                </p>
                <Button variant="outline" onClick={() => navigate('/')}>
                  Go to Home
                </Button>
              </CardContent>
            </Card>
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
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Employer Dashboard</h1>
              <p className="text-muted-foreground">Manage your job postings</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Post New Job
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingJob ? 'Edit Job' : 'Post New Job'}</DialogTitle>
                  <DialogDescription>
                    Fill in the details to {editingJob ? 'update' : 'create'} a job posting
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="title">Job Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        required
                        rows={5}
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="job_type">Job Type</Label>
                      <Select value={formData.job_type} onValueChange={(v) => setFormData({...formData, job_type: v})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {JOB_TYPES.map(type => (
                            <SelectItem key={type} value={type}>
                              {type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>
                              {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="experience">Experience Level</Label>
                      <Input
                        id="experience"
                        value={formData.experience_level}
                        onChange={(e) => setFormData({...formData, experience_level: e.target.value})}
                        placeholder="e.g., Entry, Mid, Senior"
                      />
                    </div>
                    <div>
                      <Label htmlFor="salary_min">Min Salary (in thousands)</Label>
                      <Input
                        id="salary_min"
                        type="number"
                        value={formData.salary_min}
                        onChange={(e) => setFormData({...formData, salary_min: e.target.value})}
                        placeholder="50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="salary_max">Max Salary (in thousands)</Label>
                      <Input
                        id="salary_max"
                        type="number"
                        value={formData.salary_max}
                        onChange={(e) => setFormData({...formData, salary_max: e.target.value})}
                        placeholder="100"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="skills">Skills (comma separated)</Label>
                      <Input
                        id="skills"
                        value={formData.skills}
                        onChange={(e) => setFormData({...formData, skills: e.target.value})}
                        placeholder="React, TypeScript, Node.js"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full">
                    {editingJob ? 'Update Job' : 'Post Job'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : jobs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Plus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No jobs posted yet</p>
                <p className="text-sm text-muted-foreground">
                  Click "Post New Job" to create your first job posting
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <Card key={job.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{job.title}</CardTitle>
                        <CardDescription>
                          {job.location} • {job.job_type}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(job)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(job.id)}>
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-3">
                        <Badge variant="secondary">{job.category}</Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {job.applications?.[0]?.count || 0} applicants
                        </Badge>
                      </div>
                      <Button variant="outline" onClick={() => viewApplicants(job.id)}>
                        View Applicants
                      </Button>
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