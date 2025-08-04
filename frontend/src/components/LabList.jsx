import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { labAPI } from '../services/api';

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
    if (!confirm('Are you sure you want to terminate this lab?')) {
      return;
    }

    try {
      await labAPI.terminateLab(labId);
      // Immediately update the UI by removing the terminated lab
      setLabs(prevLabs => prevLabs.filter(lab => lab.id !== labId));
    } catch (err) {
      console.error('Failed to terminate lab:', err);
      alert('Failed to terminate lab');
    }
  };

  const handleQuickExtend = async (labId, hours = 1) => {
    try {
      await labAPI.extendLab(labId, hours);
      // Refresh the labs to get updated expiry times
      loadLabs();
    } catch (err) {
      console.error('Failed to extend lab:', err);
      alert('Failed to extend lab');
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
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-lg">Loading labs...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <Button onClick={loadLabs}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  if (labs.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-gray-500 mb-4">No labs found</div>
          <Link to="/create-lab">
            <Button>Create Your First Lab</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Your Labs</h2>
        <Button onClick={loadLabs} variant="outline" size="sm">
          Refresh
        </Button>
      </div>
      
      {labs.map((lab) => (
        <Card key={lab.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-medium text-gray-900">{lab.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lab.status)}`}>
                    {lab.status?.toUpperCase()}
                  </span>
                  {isExpiringSoon(lab.expires_at) && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium text-orange-600 bg-orange-100">
                      EXPIRING SOON
                    </span>
                  )}
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <div>
                    <span className="font-medium">Expires:</span> {new Date(lab.expires_at).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Time remaining:</span> 
                    <span className={isExpiringSoon(lab.expires_at) ? 'text-orange-600 font-medium' : ''}>
                      {formatTimeRemaining(lab.expires_at)}
                    </span>
                  </div>
                  {lab.container_id && (
                    <div>
                      <span className="font-medium">Container ID:</span> 
                      <span className="font-mono text-xs">{lab.container_id}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <Link to={`/lab/${lab.id}`}>
                  <Button size="sm" className="w-full">
                    View Details
                  </Button>
                </Link>
                
                {lab.status !== 'expired' && lab.status !== 'error' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleQuickExtend(lab.id)}
                    className="w-full"
                  >
                    Extend +1h
                  </Button>
                )}
                
                {lab.status !== 'expired' && (
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleQuickTerminate(lab.id)}
                    className="w-full"
                  >
                    Terminate
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
