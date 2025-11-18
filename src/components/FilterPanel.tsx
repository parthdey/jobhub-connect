import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X } from 'lucide-react';

interface FilterPanelProps {
  filters: {
    search: string;
    location: string;
    jobType: string;
    category: string;
    salaryMin: string;
  };
  onFilterChange: (filters: any) => void;
  onClear: () => void;
}

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'];
const CATEGORIES = ['Technology', 'Marketing', 'Design', 'Sales', 'Finance', 'Healthcare', 'Education', 'Other'];

export const FilterPanel = ({ filters, onFilterChange, onClear }: FilterPanelProps) => {
  const updateFilter = (key: string, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Job title or keywords..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            placeholder="City, state, or remote"
            value={filters.location}
            onChange={(e) => updateFilter('location', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="jobType">Job Type</Label>
          <Select value={filters.jobType} onValueChange={(value) => updateFilter('jobType', value)}>
            <SelectTrigger id="jobType">
              <SelectValue placeholder="Any type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any type</SelectItem>
              {JOB_TYPES.map((type) => (
                <SelectItem key={type} value={type.toLowerCase()}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
            <SelectTrigger id="category">
              <SelectValue placeholder="Any category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any category</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat.toLowerCase()}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="salaryMin">Minimum Salary (in thousands)</Label>
          <Input
            id="salaryMin"
            type="number"
            placeholder="e.g., 50"
            value={filters.salaryMin}
            onChange={(e) => updateFilter('salaryMin', e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
};