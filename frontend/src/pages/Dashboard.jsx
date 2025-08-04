import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { LabList } from '../components/LabList';

export function Dashboard() {
  const navigate = useNavigate();
  const userId = 1; // TODO: Get from auth context

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">FluxLabs Dashboard</h1>
              <p className="text-gray-600">Manage your container labs</p>
            </div>
            <div className="flex space-x-4">
              <Button onClick={() => navigate('/create-lab')}>
                Create Lab
              </Button>
              <Button onClick={() => navigate('/profile')} variant="outline">
                Profile
              </Button>
              <Button onClick={handleLogout} variant="outline">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900">Your Labs</h2>
            <p className="text-gray-600">View and manage your active labs</p>
          </div>
          <LabList userId={userId} />
        </div>
      </div>
    </div>
  );
}
