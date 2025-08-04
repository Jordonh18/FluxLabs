import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { LabDetails } from '../components/LabDetails';

export function LabDetailsPage() {
  const navigate = useNavigate();

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
              <h1 className="text-2xl font-bold text-gray-900">FluxLabs</h1>
              <p className="text-gray-600">Container Lab Management</p>
            </div>
            <div className="flex space-x-4">
              <Button onClick={() => navigate('/dashboard')} variant="outline">
                Dashboard
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
          <LabDetails />
        </div>
      </div>
    </div>
  );
}
