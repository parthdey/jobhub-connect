import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Briefcase, DollarSign, Bookmark, BookmarkCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface JobCardProps {
  job: {
    id: string;
    title: string;
    description: string;
    location: string;
    job_type: string;
    category: string;
    salary_min?: number;
    salary_max?: number;
    skills: string[];
    created_at: string;
    profiles?: {
      company_name?: string;
      company_logo?: string;
    };
  };
  isBookmarked?: boolean;
  onBookmarkChange?: () => void;
}

export const JobCard = ({ job, isBookmarked: initialBookmarked = false, onBookmarkChange }: JobCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error('Please sign in to bookmark jobs');
      navigate('/auth');
      return;
    }

    setLoading(true);
    try {
      if (isBookmarked) {
        await supabase
          .from('bookmarks')
          .delete()
          .eq('job_id', job.id)
          .eq('user_id', user.id);
        toast.success('Bookmark removed');
      } else {
        await supabase
          .from('bookmarks')
          .insert({ job_id: job.id, user_id: user.id });
        toast.success('Job bookmarked');
      }
      setIsBookmarked(!isBookmarked);
      onBookmarkChange?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update bookmark');
    } finally {
      setLoading(false);
    }
  };

  const formatSalary = () => {
    if (!job.salary_min && !job.salary_max) return 'Salary not specified';
    if (job.salary_min && job.salary_max) {
      return `$${(job.salary_min / 1000).toFixed(0)}k - $${(job.salary_max / 1000).toFixed(0)}k`;
    }
    if (job.salary_min) return `From $${(job.salary_min / 1000).toFixed(0)}k`;
    return `Up to $${(job.salary_max! / 1000).toFixed(0)}k`;
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-primary/50"
      onClick={() => navigate(`/jobs/${job.id}`)}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-xl mb-1">{job.title}</CardTitle>
            <CardDescription className="flex items-center gap-1">
              {job.profiles?.company_name || 'Company Name'}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBookmark}
            disabled={loading}
          >
            {isBookmarked ? (
              <BookmarkCheck className="h-5 w-5 text-primary fill-primary" />
            ) : (
              <Bookmark className="h-5 w-5" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {job.description}
        </p>
        
        <div className="flex flex-wrap gap-2">
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
        </div>

        <div className="flex flex-wrap gap-1">
          {job.skills.slice(0, 3).map((skill) => (
            <Badge key={skill} variant="outline" className="text-xs">
              {skill}
            </Badge>
          ))}
          {job.skills.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{job.skills.length - 3} more
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={(e) => {
          e.stopPropagation();
          navigate(`/jobs/${job.id}`);
        }}>
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};