import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { labAPI } from '../services/api';

export function LabList({ userId }) {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLabs();
  }, [userId]);

  const loadLabs = async () => {
    try {
      const response = await labAPI.getUserLabs(userId);
      setLabs(response.data);
    } catch (error) {
      console.error('Failed to load labs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTerminate = async (labId) => {
    if (window.confirm('Are you sure you want to terminate this lab?')) {
      try {
        await labAPI.terminateLab(labId);
        loadLabs(); // Reload the list
      } catch (error) {
        console.error('Failed to terminate lab:', error);
      }
    }
  };

  const handleExtend = async (labId) => {
    try {
      await labAPI.extendLab(labId, 1); // Extend by 1 hour
      loadLabs(); // Reload the list
    } catch (error) {
      console.error('Failed to extend lab:', error);
    }
  };

  if (loading) {
    return <div>Loading labs...</div>;
  }

  return (
    <div className="space-y-4">
      {labs.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No labs found. Create your first lab to get started!
            </p>
          </CardContent>
        </Card>
      ) : (
        labs.map((lab) => (
          <Card key={lab.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{lab.name}</span>
                <span className={`text-sm px-2 py-1 rounded ${
                  lab.status === 'running' ? 'bg-green-100 text-green-800' :
                  lab.status === 'stopped' ? 'bg-yellow-100 text-yellow-800' :
                  lab.status === 'expired' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {lab.status}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Expires:</strong> {new Date(lab.expires_at).toLocaleString()}</p>
                <p><strong>Container ID:</strong> {lab.container_id || 'N/A'}</p>
                <div className="flex space-x-2">
                  {lab.status === 'running' && (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleExtend(lab.id)}
                      >
                        Extend (+1h)
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleTerminate(lab.id)}
                      >
                        Terminate
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
