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
  Clock, 
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
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadLabs();
    // Set up real-time polling every 10 seconds
    const interval = setInterval(loadLabs, 10000);
    return () => clearInterval(interval);
  }, [userId]);

  const loadLabs = async () => {
    try {
      const response = await labAPI.getUserLabs(userId);
      setLabs(response.data);
      setError('');
    } catch (err) {
      console.error('Failed to load labs:', err);
      setError('Failed to load labs');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTerminate = async (labId) => {
    try {
      await labAPI.terminateLab(labId);
      setLabs(prevLabs => prevLabs.filter(lab => lab.id !== labId));
      toast.success('Lab terminated successfully');
    } catch (err) {
      console.error('Failed to terminate lab:', err);
      toast.error('Failed to terminate lab');
    }
  };

  const handleQuickExtend = async (labId, hours = 1) => {
    try {
      await labAPI.extendLab(labId, hours);
      loadLabs();
      toast.success(`Lab extended by ${hours} hour${hours > 1 ? 's' : ''}`);
    } catch (err) {
      console.error('Failed to extend lab:', err);
      toast.error('Failed to extend lab');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Loading labs...</span>
      </div>
    );
  }

  if (error) {
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Container className="h-5 w-5" />
          <span className="text-sm text-muted-foreground">
            {labs.length} lab{labs.length !== 1 ? 's' : ''}
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
        {labs.map((lab) => (
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
                        onClick={() => handleQuickExtend(lab.id, 1)} 
                        disabled={!lab.is_docker_active || lab.status === 'expired' || lab.status === 'error'}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        Extend +1h
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleQuickExtend(lab.id, 2)} 
                        disabled={!lab.is_docker_active || lab.status === 'expired' || lab.status === 'error'}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        Extend +2h
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleQuickExtend(lab.id, 6)} 
                        disabled={!lab.is_docker_active || lab.status === 'expired' || lab.status === 'error'}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        Extend +6h
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
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
              {lab.is_docker_active && lab.status !== 'expired' && lab.status !== 'error' && (
                <ContextMenuItem onClick={() => handleQuickExtend(lab.id)}>
                  <Clock className="mr-2 h-4 w-4" />
                  Extend +1h
                </ContextMenuItem>
              )}
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
        ))}
      </div>
    </div>
  );
}
