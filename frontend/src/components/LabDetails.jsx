import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { dockerAPI, labAPI } from '../services/api';
import { Play, Square, Trash2, ArrowLeft, Globe } from 'lucide-react';

export function LabDetails() {
  const { containerId } = useParams();
  const navigate = useNavigate();
  const [container, setContainer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    loadContainerDetails();
    const interval = setInterval(loadContainerDetails, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [containerId]);

  const loadContainerDetails = async () => {
    try {
      const response = await labAPI.getLab(containerId);
      setContainer(response.data);
      setError('');
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Container not found - it may have been removed');
      } else {
        setError('Failed to load container details');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartContainer = async () => {
    if (!containerId) return;
    
    setActionLoading('starting');
    try {
      await dockerAPI.startContainer(containerId);
      await loadContainerDetails(); // Refresh to get updated status
    } catch (err) {
      setError('Failed to start container');
    } finally {
      setActionLoading('');
    }
  };

  const handleStopContainer = async () => {
    if (!containerId) return;
    
    setActionLoading('stopping');
    try {
      await dockerAPI.stopContainer(containerId);
      await loadContainerDetails(); // Refresh to get updated status
    } catch (err) {
      setError('Failed to stop container');
    } finally {
      setActionLoading('');
    }
  };

  const handleTerminateContainer = async () => {
    if (!confirm('Are you sure you want to terminate this container? This action cannot be undone.')) {
      return;
    }
    
    setActionLoading('terminating');
    try {
      await labAPI.deleteLab(containerId);
      navigate('/dashboard'); // Redirect back to dashboard
    } catch (err) {
      setError('Failed to terminate container');
    } finally {
      setActionLoading('');
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'running': return 'text-green-600 bg-green-100';
      case 'exited': return 'text-yellow-600 bg-yellow-100';
      case 'created': return 'text-blue-600 bg-blue-100';
      case 'paused': return 'text-orange-600 bg-orange-100';
      case 'restarting': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getSSHInfo = (container) => {
    if (!container?.Ports) return null;
    
    const sshPort = container.Ports.find(port => port.PrivatePort === 22);
    if (sshPort && sshPort.PublicPort) {
      return {
        host: 'localhost',
        port: sshPort.PublicPort,
        command: `ssh root@localhost -p ${sshPort.PublicPort}`
      };
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading container details...</p>
        </div>
      </div>
    );
  }

  if (error && !container) {
    return (
      <div className="text-center py-12">
        <Alert className="max-w-md mx-auto">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/dashboard')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const containerName = container?.Names?.[0]?.replace('/', '') || 'Unknown Container';
  const containerStatus = container?.State || 'unknown';
  const isRunning = containerStatus.toLowerCase() === 'running';
  const sshInfo = getSSHInfo(container);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{containerName}</h1>
          <div className="flex items-center space-x-4 mt-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(containerStatus)}`}>
              {containerStatus?.toUpperCase()}
            </span>
            <span className="text-sm text-muted-foreground">
              ID: {containerId?.substring(0, 12)}
            </span>
          </div>
        </div>
        <Button onClick={() => navigate('/dashboard')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      {error && (
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Container Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            {!isRunning ? (
              <Button 
                onClick={handleStartContainer} 
                disabled={actionLoading === 'starting'}
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                {actionLoading === 'starting' ? 'Starting...' : 'Start Container'}
              </Button>
            ) : (
              <Button 
                onClick={handleStopContainer} 
                disabled={actionLoading === 'stopping'}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Square className="h-4 w-4" />
                {actionLoading === 'stopping' ? 'Stopping...' : 'Stop Container'}
              </Button>
            )}
            
            <Button 
              onClick={handleTerminateContainer} 
              disabled={actionLoading === 'terminating'}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {actionLoading === 'terminating' ? 'Terminating...' : 'Terminate'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Container Information */}
      <Card>
        <CardHeader>
          <CardTitle>Container Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Container ID</label>
              <p className="text-sm font-mono">{containerId}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Image</label>
              <p className="text-sm">{container?.Config?.Image || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Created</label>
              <p className="text-sm">{formatDateTime(container?.Created)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Started</label>
              <p className="text-sm">{formatDateTime(container?.State?.StartedAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Port Mappings */}
      {container?.Ports && container.Ports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Port Mappings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {container.Ports.map((port, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                  <span className="text-sm">
                    {port.IP || '0.0.0.0'}:{port.PublicPort} → {port.PrivatePort}/{port.Type}
                  </span>
                  {port.PrivatePort === 80 && port.PublicPort && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open(`http://localhost:${port.PublicPort}`, '_blank')}
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Open
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SSH Access */}
      {sshInfo && (
        <Card>
          <CardHeader>
            <CardTitle>SSH Access</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Host</label>
                  <p className="text-sm font-mono">{sshInfo.host}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Port</label>
                  <p className="text-sm font-mono">{sshInfo.port}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Username</label>
                  <p className="text-sm font-mono">root</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">SSH Command</label>
                <div className="mt-1 p-2 bg-black text-green-400 font-mono text-sm rounded flex justify-between items-center">
                  <code>{sshInfo.command}</code>
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => navigator.clipboard.writeText(sshInfo.command)}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
