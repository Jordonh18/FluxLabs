import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { labAPI, containerAPI } from '../services/api';

export function LabDetails() {
  const { labId } = useParams();
  const navigate = useNavigate();
  const [lab, setLab] = useState(null);
  const [container, setContainer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    loadLabDetails();
    const interval = setInterval(loadLabDetails, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [labId]);

  const loadLabDetails = async () => {
    try {
      const labResponse = await labAPI.getLab(labId);
      setLab(labResponse.data);
      
      // If lab has a container, get container details
      if (labResponse.data.container_id) {
        try {
          const containerResponse = await containerAPI.getContainer(labResponse.data.container_id);
          setContainer(containerResponse.data);
        } catch (containerError) {
          console.warn('Failed to load container details:', containerError);
        }
      }
    } catch (err) {
      setError('Failed to load lab details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartContainer = async () => {
    if (!lab?.container_id) return;
    
    setActionLoading('starting');
    try {
      await containerAPI.startContainer(lab.container_id);
      await loadLabDetails(); // Refresh to get updated status
    } catch (err) {
      setError('Failed to start container');
    } finally {
      setActionLoading('');
    }
  };

  const handleStopContainer = async () => {
    if (!lab?.container_id) return;
    
    setActionLoading('stopping');
    try {
      await containerAPI.stopContainer(lab.container_id);
      await loadLabDetails(); // Refresh to get updated status
    } catch (err) {
      setError('Failed to stop container');
    } finally {
      setActionLoading('');
    }
  };

  const handleExtendLab = async (hours) => {
    setActionLoading('extending');
    try {
      await labAPI.extendLab(labId, hours);
      await loadLabDetails(); // Refresh to get updated expiry time
    } catch (err) {
      setError('Failed to extend lab');
    } finally {
      setActionLoading('');
    }
  };

  const handleTerminateLab = async () => {
    if (!confirm('Are you sure you want to terminate this lab? This action cannot be undone.')) {
      return;
    }
    
    setActionLoading('terminating');
    try {
      await labAPI.terminateLab(labId);
      navigate('/dashboard'); // Redirect to dashboard after termination
    } catch (err) {
      setError('Failed to terminate lab');
      setActionLoading('');
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'running': return 'text-green-600 bg-green-100';
      case 'stopped': return 'text-yellow-600 bg-yellow-100';
      case 'creating': return 'text-blue-600 bg-blue-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'expired': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatExpiryTime = (expiresAt) => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const timeLeft = expiry - now;
    
    if (timeLeft <= 0) {
      return 'Expired';
    }
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m remaining`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-lg">Loading lab details...</div>
      </div>
    );
  }

  if (!lab) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-900">Lab not found</h2>
        <Button onClick={() => navigate('/dashboard')} className="mt-4">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{lab.name}</h1>
          <div className="flex items-center space-x-4 mt-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lab.status)}`}>
              {lab.status?.toUpperCase()}
            </span>
            {container && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(container.status)}`}>
                Container: {container.status?.toUpperCase()}
              </span>
            )}
          </div>
        </div>
        <Button onClick={() => navigate('/dashboard')} variant="outline">
          Back to Dashboard
        </Button>
      </div>

      {error && (
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Lab Information */}
      <Card>
        <CardHeader>
          <CardTitle>Lab Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Lab ID</label>
              <p className="text-sm text-gray-900">{lab.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <p className="text-sm text-gray-900">{lab.status}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Expires At</label>
              <p className="text-sm text-gray-900">
                {new Date(lab.expires_at).toLocaleString()}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Time Remaining</label>
              <p className="text-sm text-gray-900">{formatExpiryTime(lab.expires_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Container Information */}
      {container && (
        <Card>
          <CardHeader>
            <CardTitle>Container Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Container ID</label>
                <p className="text-sm text-gray-900 font-mono">{container.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Image</label>
                <p className="text-sm text-gray-900 font-mono">{container.image}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <p className="text-sm text-gray-900">{container.status}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="text-sm text-gray-900">
                  {container.created_at ? new Date(container.created_at).toLocaleString() : 'Unknown'}
                </p>
              </div>
            </div>

            {/* SSH Connection Info */}
            {container.ssh_enabled && container.status === 'running' && (
              <div className="mt-6 p-4 bg-gray-50 rounded-md">
                <h4 className="font-medium text-gray-900 mb-2">SSH Connection</h4>
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Host</label>
                    <p className="text-sm text-gray-900 font-mono">{container.ssh_host || 'localhost'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Port</label>
                    <p className="text-sm text-gray-900 font-mono">{container.ssh_port || '22'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Username</label>
                    <p className="text-sm text-gray-900 font-mono">{container.ssh_username || 'root'}</p>
                  </div>
                  <div className="mt-3">
                    <label className="text-sm font-medium text-gray-500">SSH Command</label>
                    <div className="mt-1 p-2 bg-black text-green-400 font-mono text-sm rounded">
                      ssh {container.ssh_username || 'root'}@{container.ssh_host || 'localhost'} -p {container.ssh_port || '22'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {/* Container Controls */}
            {container && container.status === 'stopped' && (
              <Button 
                onClick={handleStartContainer}
                disabled={actionLoading === 'starting'}
                variant="default"
              >
                {actionLoading === 'starting' ? 'Starting...' : 'Start Container'}
              </Button>
            )}
            
            {container && container.status === 'running' && (
              <Button 
                onClick={handleStopContainer}
                disabled={actionLoading === 'stopping'}
                variant="secondary"
              >
                {actionLoading === 'stopping' ? 'Stopping...' : 'Stop Container'}
              </Button>
            )}

            {/* Extend Lab */}
            {lab.status !== 'expired' && lab.status !== 'error' && (
              <>
                <Button 
                  onClick={() => handleExtendLab(1)}
                  disabled={actionLoading === 'extending'}
                  variant="outline"
                >
                  {actionLoading === 'extending' ? 'Extending...' : 'Extend +1h'}
                </Button>
                <Button 
                  onClick={() => handleExtendLab(2)}
                  disabled={actionLoading === 'extending'}
                  variant="outline"
                >
                  Extend +2h
                </Button>
              </>
            )}

            {/* Terminate Lab */}
            <Button 
              onClick={handleTerminateLab}
              disabled={actionLoading === 'terminating'}
              variant="destructive"
            >
              {actionLoading === 'terminating' ? 'Terminating...' : 'Terminate Lab'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
