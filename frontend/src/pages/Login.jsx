import React from 'react';
import { LoginForm } from '../components/LoginForm';

export function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <img 
                src="/logo-light.svg" 
                alt="FluxLabs Logo" 
                className="h-12 w-12 dark:hidden"
              />
              <img 
                src="/logo-dark.svg" 
                alt="FluxLabs Logo" 
                className="h-12 w-12 hidden dark:block"
              />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">FluxLabs</h1>
          <p className="text-muted-foreground mt-2">Access your container laboratories</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
