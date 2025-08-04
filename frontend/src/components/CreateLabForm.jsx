import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from './ui/context-menu';
import { Separator } from './ui/separator';
import { 
  Search, 
  Clock, 
  Container, 
  CheckCircle, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { labAPI } from '../services/api';
import { getCurrentUserId } from '../utils/auth';
import { toast } from 'sonner';

export function CreateLabForm() {
  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [duration, setDuration] = useState(1);
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Form validation
  const isFormValid = name.trim() && templateId && duration >= 1 && duration <= 24;

  const handleTemplateChange = (selectedTemplateId) => {
    setTemplateId(selectedTemplateId);
    
    // Find the selected template and update duration to its default
    const selectedTemplate = templates.find(template => template.id.toString() === selectedTemplateId);
    if (selectedTemplate && selectedTemplate.default_duration_hours) {
      setDuration(selectedTemplate.default_duration_hours);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchTerm, selectedCategory]);

  const loadTemplates = async () => {
    try {
      const response = await labAPI.getTemplates();
      setTemplates(response.data);
      if (response.data.length > 0) {
        const firstTemplate = response.data[0];
        setTemplateId(firstTemplate.id);
        setDuration(firstTemplate.default_duration_hours || 1);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
      setError('Failed to load templates. Please try again.');
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => {
        const name = template.name.toLowerCase();
        switch (selectedCategory) {
          case 'linux':
            return name.includes('ubuntu') || name.includes('debian') || name.includes('centos') || 
                   name.includes('alma') || name.includes('rocky') || name.includes('fedora') || 
                   name.includes('alpine') || name.includes('arch') || name.includes('opensuse') ||
                   name.includes('kali') || name.includes('amazon') || name.includes('oracle');
          case 'development':
            return name.includes('python') || name.includes('node') || name.includes('java') || 
                   name.includes('go') || name.includes('rust') || name.includes('php') || 
                   name.includes('ruby');
          case 'database':
            return name.includes('mysql') || name.includes('postgres') || name.includes('mongodb') || 
                   name.includes('redis');
          case 'webserver':
            return name.includes('nginx') || name.includes('apache');
          case 'tools':
            return name.includes('docker') || name.includes('ansible') || name.includes('terraform');
          default:
            return true;
        }
      });
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTemplates(filtered);
  };

  const categories = [
    { value: 'all', label: 'All Templates' },
    { value: 'linux', label: 'Linux Distributions' },
    { value: 'development', label: 'Development Environments' },
    { value: 'database', label: 'Databases' },
    { value: 'webserver', label: 'Web Servers' },
    { value: 'tools', label: 'DevOps Tools' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!name.trim()) {
      toast.error('Please enter a lab name');
      return;
    }
    
    if (!templateId) {
      toast.error('Please select a template');
      return;
    }
    
    if (!duration || duration < 1 || duration > 24) {
      toast.error('Please enter a valid duration between 1 and 24 hours');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      toast.loading('Creating lab...', { id: 'create-lab' });
      
      const response = await labAPI.createLab({
        name,
        template_id: parseInt(templateId),
        duration_hours: duration,
        user_id: getCurrentUserId()
      });
      
      toast.success('Lab created successfully!', { id: 'create-lab' });
      
      // Redirect to the new lab's details page
      navigate(`/lab/${response.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create lab', { id: 'create-lab' });
      setError(err.response?.data?.detail || 'Failed to create lab');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Container className="h-6 w-6" />
          Create New Lab
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base font-medium">
              Lab Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a descriptive name for your lab"
              required
              className={`text-base ${!name.trim() && name !== '' ? 'border-destructive' : ''}`}
            />
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <Label className="text-base font-medium">
              Template <span className="text-destructive">*</span>
            </Label>
            
            {/* Search and filter controls */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[240px]">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {filteredTemplates.length > 0 && (
                  <Badge variant="outline" className="ml-2">
                    {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Template selection */}
            <div className="border rounded-lg p-4 max-h-80 overflow-y-auto bg-card">
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-8">
                  <Container className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No templates found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTemplates.map((template) => (
                    <ContextMenu key={template.id}>
                      <ContextMenuTrigger>
                        <label 
                          className={`flex items-start space-x-3 p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-sm ${
                            templateId === template.id.toString() 
                              ? 'bg-primary/5 border-primary ring-2 ring-primary/20' 
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                      <div className="flex items-center mt-1">
                        {templateId === template.id.toString() ? (
                          <CheckCircle className="h-4 w-4 text-primary" />
                        ) : (
                          <div className="h-4 w-4 border border-muted-foreground rounded-full" />
                        )}
                      </div>
                      <input
                        type="radio"
                        name="template"
                        value={template.id}
                        checked={templateId === template.id.toString()}
                        onChange={(e) => handleTemplateChange(e.target.value)}
                        className="sr-only"
                        required
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-base mb-1">{template.name}</div>
                        <div className="text-sm text-muted-foreground mb-2">{template.description}</div>
                        <div className="flex items-center gap-3 text-xs">
                          <Badge variant="outline" className="font-mono">
                            {template.image}
                          </Badge>
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {template.default_duration_hours}h default
                          </Badge>
                        </div>
                      </div>
                    </label>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem onClick={() => {
                          handleTemplateChange(template.id.toString());
                          setDuration(template.default_duration_hours);
                        }}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Select Template
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={() => navigator.clipboard.writeText(template.image)}>
                          <Container className="mr-2 h-4 w-4" />
                          Copy Docker Image
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => navigator.clipboard.writeText(template.name)}>
                          Copy Template Name
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  ))}
                </div>
              )}
            </div>
            
            {filteredTemplates.length === 0 && templates.length > 0 && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                No templates match your search criteria. Try adjusting your search or category filter.
              </p>
            )}
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <Label htmlFor="duration" className="text-base font-medium">
              Duration (hours) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="duration"
              type="number"
              min="1"
              max="24"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
              required
              className={`text-base ${duration < 1 || duration > 24 ? 'border-destructive' : ''}`}
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Duration automatically set based on selected template. Choose between 1 and 24 hours.
            </p>
          </div>
          
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          
          <div className="flex space-x-3 pt-4">
            <Button 
              type="submit" 
              disabled={loading || !isFormValid}
              className={`flex items-center gap-2 ${!isFormValid ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Container className="h-4 w-4" />
                  Create Lab
                </>
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
