
import React from 'react';
import ForgotPasswordForm from '@/components/auth/ForgotPassword';
import { Link } from 'react-router-dom';
import ThemeSelector from '@/components/ThemeSelector';

const ForgotPasswordPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="absolute top-4 right-4">
        <ThemeSelector />
      </div>
      
      <div className="w-full max-w-md p-6 bg-card border border-border rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-foreground">Reset Password</h1>
        <ForgotPasswordForm />
        
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
