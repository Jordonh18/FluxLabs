import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { UserProfile } from '../components/UserProfile';
import { Layout } from '../components/Layout';
import { getCurrentUserId } from '../utils/auth';
import { ArrowLeft } from 'lucide-react';

export function Profile() {
  const navigate = useNavigate();
  const userId = getCurrentUserId();

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => navigate('/dashboard')} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <img 
                  src="/logo-light.svg" 
                  alt="FluxLabs" 
                  className="h-8 w-8 dark:hidden"
                />
                <img 
                  src="/logo-dark.svg" 
                  alt="FluxLabs" 
                  className="h-8 w-8 hidden dark:block"
                />
                User Profile
              </h1>
              <p className="text-muted-foreground">
                Manage your account settings and preferences
              </p>
            </div>
          </div>
        </div>

        <UserProfile userId={userId} />
      </div>
    </Layout>
  );
}
