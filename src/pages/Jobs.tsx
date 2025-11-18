import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { JobCard } from '@/components/JobCard';
import { FilterPanel } from '@/components/FilterPanel';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function Jobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    jobType: 'all',
    category: 'all',
    salaryMin: '',
  });

  const fetchJobs = async () => {
    setLoading(true);
    let query = supabase
      .from('jobs')
      .select('*, profiles(company_name, company_logo)')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }
    if (filters.jobType !== 'all') {
      query = query.eq('job_type', filters.jobType);
    }
    if (filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }
    if (filters.salaryMin) {
      query = query.gte('salary_min', parseFloat(filters.salaryMin) * 1000);
    }

    const { data, error } = await query;
    if (!error && data) {
      setJobs(data);
    }
    setLoading(false);
  };

  const fetchBookmarks = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('bookmarks')
      .select('job_id')
      .eq('user_id', user.id);
    
    if (data) {
      setBookmarks(new Set(data.map(b => b.job_id)));
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  useEffect(() => {
    fetchBookmarks();
  }, [user]);

  const handleClearFilters = () => {
    setFilters({
      search: '',
      location: '',
      jobType: 'all',
      category: 'all',
      salaryMin: '',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Find Your Dream Job</h1>
          <p className="text-muted-foreground">Browse thousands of job opportunities</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <FilterPanel
              filters={filters}
              onFilterChange={setFilters}
              onClear={handleClearFilters}
            />
          </div>

          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No jobs found. Try adjusting your filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    isBookmarked={bookmarks.has(job.id)}
                    onBookmarkChange={fetchBookmarks}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}