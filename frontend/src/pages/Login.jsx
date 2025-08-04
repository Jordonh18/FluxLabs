import React from 'react';
import { LoginForm } from '../components/LoginForm';

export function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img 
              src="/logo-with-text-dark.svg" 
              alt="FluxLabs Logo" 
              className="h-32 w-auto dark:hidden"
            />
            <img 
              src="/logo-with-text-light.svg" 
              alt="FluxLabs Logo" 
              className="h-32 w-auto hidden dark:block"
            />
          </div>
          <p className="text-muted-foreground mt-2">Access your container laboratories</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
