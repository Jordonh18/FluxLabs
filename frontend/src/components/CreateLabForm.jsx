import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { labAPI } from '../services/api';

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
        setTemplateId(response.data[0].id);
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
    { value: 'all', label: '🗂️ All Templates' },
    { value: 'linux', label: '🐧 Linux Distributions' },
    { value: 'development', label: '💻 Development Environments' },
    { value: 'database', label: '🗄️ Databases' },
    { value: 'webserver', label: '🌐 Web Servers' },
    { value: 'tools', label: '🛠️ DevOps Tools' }
  ];

  const getTemplateIcon = (templateName) => {
    const name = templateName.toLowerCase();
    if (name.includes('ubuntu') || name.includes('debian') || name.includes('linux')) return '🐧';
    if (name.includes('python')) return '🐍';
    if (name.includes('node') || name.includes('javascript')) return '🟢';
    if (name.includes('java')) return '☕';
    if (name.includes('go')) return '🐹';
    if (name.includes('rust')) return '🦀';
    if (name.includes('php')) return '🐘';
    if (name.includes('ruby')) return '💎';
    if (name.includes('mysql') || name.includes('postgres') || name.includes('mongo')) return '🗄️';
    if (name.includes('redis')) return '🔴';
    if (name.includes('nginx') || name.includes('apache')) return '🌐';
    if (name.includes('docker')) return '🐳';
    if (name.includes('ansible')) return '📋';
    if (name.includes('terraform')) return '🏗️';
    if (name.includes('kali')) return '🔐';
    return '📦';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await labAPI.createLab({
        name,
        template_id: parseInt(templateId),
        duration_hours: duration,
        user_id: 1 // TODO: Get from auth context
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create lab');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Create New Lab</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Lab Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter lab name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="template">Template</Label>
            
            {/* Search and filter controls */}
            <div className="space-y-2">
              <Input
                placeholder="🔍 Search templates by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
              
              <div className="flex items-center justify-between">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                {filteredTemplates.length > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground whitespace-nowrap">
                    {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            
            {/* Template selection */}
            <div className="space-y-2 border rounded-md p-3 max-h-64 overflow-y-auto bg-background">
              {filteredTemplates.length === 0 ? (
                <div className="text-sm text-muted-foreground p-2">No templates found</div>
              ) : (
                filteredTemplates.map((template) => (
                  <label 
                    key={template.id} 
                    className={`flex items-start space-x-3 p-3 rounded-md border cursor-pointer transition-colors hover:bg-accent ${
                      templateId === template.id.toString() ? 'bg-accent border-primary' : 'border-border'
                    }`}
                  >
                    <input
                      type="radio"
                      name="template"
                      value={template.id}
                      checked={templateId === template.id.toString()}
                      onChange={(e) => setTemplateId(e.target.value)}
                      className="mt-1"
                      required
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm flex items-center gap-2">
                        <span>{getTemplateIcon(template.name)}</span>
                        {template.name}
                      </div>
                      <div className="text-xs text-muted-foreground">{template.description}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Image: <code className="bg-muted px-1 rounded">{template.image}</code>
                        <span className="ml-2">⏱️ {template.default_duration_hours}h default</span>
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
            
            {filteredTemplates.length === 0 && templates.length > 0 && (
              <p className="text-sm text-muted-foreground">
                No templates match your search criteria. Try adjusting your search or category filter.
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (hours)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              max="24"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              required
            />
          </div>
          
          {error && (
            <div className="text-sm text-destructive">{error}</div>
          )}
          
          <div className="flex space-x-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Lab'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
