import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from './ui/context-menu';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from './ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Eye, 
  Trash2, 
  RefreshCw,
  Plus,
  Container,
  Calendar,
  Timer,
  AlertTriangle
} from 'lucide-react';
import { labAPI } from '../services/api';
import { toast } from 'sonner';

export function LabList({ userId }) {
  console.log('🔄 LabList component initialized with userId:', userId);
  
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  console.log('🔍 LabList state - labs:', labs, 'type:', typeof labs, 'isArray:', Array.isArray(labs), 'loading:', loading);

  useEffect(() => {
    console.log('⚡ LabList useEffect triggered with userId:', userId);
    if (userId) {
      loadLabs();
      // Set up real-time polling every 10 seconds
      const interval = setInterval(loadLabs, 10000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  const loadLabs = async () => {
    console.log('🚀 loadLabs called with userId:', userId);
    if (!userId) {
      console.warn('⚠️  No userId provided to loadLabs');
      setLabs([]);
      setLoading(false);
      return;
    }

    try {
      console.log('📡 Making API call to getUserLabs...');
      const response = await labAPI.getUserLabs(userId);
      console.log('📥 Raw API response:', response);
      console.log('📥 Response data:', response?.data);
      console.log('📥 Response data type:', typeof response?.data);
      
      // Handle various API response formats
      let labsData = null;
      
      // Try different possible response structures
      if (response?.data?.data) {
        labsData = response.data.data;
        console.log('✅ Found labs in response.data.data');
      } else if (response?.data) {
        labsData = response.data;
        console.log('✅ Found labs in response.data');
      } else if (response) {
        labsData = response;
        console.log('✅ Using response directly');
      }
      
      console.log('🔍 Extracted labsData:', labsData);
      console.log('🔍 labsData type:', typeof labsData);
      console.log('🔍 labsData isArray:', Array.isArray(labsData));
      
      // CRITICAL FIX: Ensure we always set an array
      if (Array.isArray(labsData)) {
        console.log('✅ Setting labs array with', labsData.length, 'items:', labsData);
        setLabs(labsData);
      } else if (labsData === null || labsData === undefined) {
        console.log('📝 API returned null/undefined, setting empty array');
        setLabs([]);
      } else {
        console.warn('⚠️  API returned non-array data:', labsData, 'Setting empty array');
        setLabs([]);
      }
      setError('');
    } catch (err) {
      console.error('❌ Failed to load labs:', err);
      console.error('❌ Error stack:', err.stack);
      setError(`Failed to load labs: ${err.message || 'Unknown error'}`);
      setLabs([]); // Ensure labs is always an array even on error
    } finally {
      console.log('🏁 loadLabs finished, setting loading to false');
      setLoading(false);
    }
  };

  const handleQuickTerminate = async (labId) => {
    if (!labId) {
      console.error('No labId provided to handleQuickTerminate');
      toast.error('Invalid lab ID');
      return;
    }

    try {
      await labAPI.deleteLab(labId);
      setLabs(prevLabs => {
        if (!Array.isArray(prevLabs)) {
          console.error('prevLabs is not an array in handleQuickTerminate:', prevLabs);
          return [];
        }
        return prevLabs.filter(lab => lab.id !== labId);
      });
      toast.success('Lab terminated successfully');
    } catch (err) {
      console.error('Failed to terminate lab:', err);
      toast.error('Failed to terminate lab');
    }
  };

  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'running': return 'default';
      case 'stopped': return 'secondary';
      case 'creating': return 'outline';
      case 'error': return 'destructive';
      case 'expired': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'running': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'stopped': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'creating': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'error': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'expired': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const formatTimeRemaining = (expiresAt) => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const timeLeft = expiry - now;
    
    if (timeLeft <= 0) {
      return 'Expired';
    }
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const isExpiringSoon = (expiresAt) => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const timeLeft = expiry - now;
    return timeLeft > 0 && timeLeft < 30 * 60 * 1000; // Less than 30 minutes
  };

  console.log('🎯 Before rendering - labs:', labs, 'type:', typeof labs, 'isArray:', Array.isArray(labs), 'length:', labs?.length);

  if (loading) {
    console.log('⏳ Rendering loading state');
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Loading labs...</span>
      </div>
    );
  }

  if (error) {
    console.log('❌ Rendering error state:', error);
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/logo-light.svg" 
              alt="FluxLabs" 
              className="h-8 w-8 text-destructive dark:hidden opacity-50"
            />
            <img 
              src="/logo-dark.svg" 
              alt="FluxLabs" 
              className="h-8 w-8 text-destructive hidden dark:block opacity-50"
            />
          </div>
          <div className="text-destructive mb-4">{error}</div>
          <Button onClick={loadLabs}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  if (labs.length === 0) {
    console.log('📭 Rendering empty state');
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/logo-dark.svg" 
              alt="FluxLabs" 
              className="h-20 w-20 text-muted-foreground dark:hidden opacity-50"
            />
            <img 
              src="/logo-light.svg" 
              alt="FluxLabs" 
              className="h-20 w-20 text-muted-foreground hidden dark:block opacity-50"
            />
          </div>
          <h3 className="text-lg font-semibold mb-2">No labs found</h3>
          <p className="text-muted-foreground">
            No lab environments are currently available
          </p>
        </CardContent>
      </Card>
    );
  }

  // Additional safety check before rendering the labs
  if (!Array.isArray(labs)) {
    console.error('🚨 CRITICAL ERROR: Labs is not an array:', labs, typeof labs);
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-destructive mb-4">Invalid data format</div>
          <Button onClick={loadLabs}>Reload</Button>
        </CardContent>
      </Card>
    );
  }

  console.log('🎨 About to render labs list with', labs.length, 'items');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Container className="h-5 w-5" />
          <span className="text-sm text-muted-foreground">
            {Array.isArray(labs) ? labs.length : 0} lab{(Array.isArray(labs) ? labs.length : 0) !== 1 ? 's' : ''}
          </span>
        </div>
        <Button 
          onClick={loadLabs} 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2"
          aria-label="Refresh lab list"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>
      
      <div className="grid gap-4">
        {Array.isArray(labs) && labs.map((lab) => {
          console.log('🔧 Rendering lab:', lab?.id, lab?.name);
          return (
          <ContextMenu key={lab.id}>
            <ContextMenuTrigger>
              <Card className="hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/30 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{lab.name}</h3>
                    <Badge variant="outline" className={getStatusColor(lab.status)}>
                      {lab.is_docker_active ? lab.status?.toUpperCase() : 'TERMINATED'}
                    </Badge>
                    {!lab.is_docker_active && (
                      <Badge variant="outline" className="bg-gray-500/10 text-gray-400 border-gray-500/20">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        NOT IN DOCKER
                      </Badge>
                    )}
                    {lab.is_docker_active && isExpiringSoon(lab.expires_at) && (
                      <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        EXPIRING SOON
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">
                          {lab.is_docker_active ? 'Expires' : 'Expired'}
                        </div>
                        <div className="text-muted-foreground">
                          {new Date(lab.expires_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">
                          {lab.is_docker_active ? 'Time remaining' : 'Docker Status'}
                        </div>
                        <div className={`${lab.is_docker_active && isExpiringSoon(lab.expires_at) ? 'text-orange-400 font-medium' : 'text-muted-foreground'}`}>
                          {lab.is_docker_active ? formatTimeRemaining(lab.expires_at) : lab.docker_status}
                        </div>
                      </div>
                    </div>
                    
                    {lab.container_id && (
                      <div className="flex items-center gap-2">
                        <Container className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Container ID</div>
                          <div className="text-muted-foreground font-mono text-xs">
                            {typeof lab.container_id === 'string' ? lab.container_id.substring(0, 12) + '...' : lab.container_id}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Link to={`/lab/${lab.container_id || lab.id}`}>
                    <Button 
                      size="sm" 
                      className="flex items-center gap-2"
                      aria-label={`View details for ${lab.name}`}
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </Button>
                  </Link>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        aria-label={`Actions for ${lab.name}`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => handleQuickTerminate(lab.id)} 
                        className="text-destructive"
                        disabled={!lab.is_docker_active}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {lab.is_docker_active ? 'Terminate' : 'Remove from List'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onClick={() => window.open(`/lab/${lab.container_id || lab.id}`, '_blank')}>
                <Eye className="mr-2 h-4 w-4" />
                View in New Tab
              </ContextMenuItem>
              <ContextMenuSeparator />
              {lab.container_id && (
                <ContextMenuItem onClick={() => navigator.clipboard.writeText(lab.container_id || '')}>
                  <Container className="mr-2 h-4 w-4" />
                  Copy Container ID
                </ContextMenuItem>
              )}
              <ContextMenuSeparator />
              <ContextMenuItem 
                onClick={() => handleQuickTerminate(lab.id)} 
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {lab.is_docker_active ? 'Terminate Lab' : 'Remove from List'}
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
          );
        })}
      </div>
    </div>
  );
}
