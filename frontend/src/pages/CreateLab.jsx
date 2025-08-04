import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { CreateLabForm } from '../components/CreateLabForm';
import { Layout } from '../components/Layout';
import { ArrowLeft, Plus } from 'lucide-react';

export function CreateLab() {
  const navigate = useNavigate();

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
              <div className="flex items-center">
                <img 
                  src="/logo-dark.svg" 
                  alt="FluxLabs" 
                  className="h-10 w-10 dark:hidden"
                />
                <img 
                  src="/logo-light.svg" 
                  alt="FluxLabs" 
                  className="h-10 w-10 hidden dark:block"
                />
              </div>
              Create New Lab
            </h1>
              <p className="text-muted-foreground">
                Set up a new container environment for your project
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="w-full max-w-2xl">
            <CreateLabForm />
          </div>
        </div>
      </div>
    </Layout>
  );
}
