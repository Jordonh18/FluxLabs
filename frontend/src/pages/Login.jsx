import React from 'react';
import { LoginForm } from '../components/LoginForm';

export function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">FluxLabs</h1>
          <p className="text-gray-600 mt-2">Access your container labs</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
