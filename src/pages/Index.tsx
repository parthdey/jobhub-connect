import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Search, Users, TrendingUp } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            Find Your Dream Job Today
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Connect with top employers and discover opportunities that match your skills
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/jobs')}>
              <Search className="mr-2 h-5 w-5" />
              Browse Jobs
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/auth?mode=signup')}>
              Get Started
            </Button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Briefcase className="h-10 w-10 text-primary mb-4" />
              <CardTitle>For Job Seekers</CardTitle>
              <CardDescription>
                Search and apply for jobs that match your skills and career goals
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-primary mb-4" />
              <CardTitle>For Employers</CardTitle>
              <CardDescription>
                Post jobs and find the perfect candidates for your team
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-primary mb-4" />
              <CardTitle>Career Growth</CardTitle>
              <CardDescription>
                Track applications and advance your career with ease
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Index;
