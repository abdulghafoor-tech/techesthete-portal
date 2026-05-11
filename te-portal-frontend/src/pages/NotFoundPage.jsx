import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import Button from '../components/common/Button';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-white mb-4">404</h1>
          <h2 className="text-4xl font-bold text-white mb-2">Page Not Found</h2>
          <p className="text-xl text-purple-100">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => navigate(-1)}
            variant="secondary"
            className="bg-white text-purple-600 hover:bg-gray-100"
          >
            <ArrowLeft size={20} className="inline mr-2" />
            Go Back
          </Button>
          <Button
            onClick={() => navigate('/')}
            variant="primary"
            className="bg-purple-600 text-white hover:bg-purple-700"
          >
            <Home size={20} className="inline mr-2" />
            Go Home
          </Button>
        </div>

        <div className="mt-12">
          <p className="text-purple-100 text-sm">
            Need help? Contact support at{' '}
            <a href="mailto:support@example.com" className="text-white underline">
              support@example.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;