import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Mail, CheckCircle, XCircle, Loader, RefreshCw } from 'lucide-react';
import Button from '../components/common/Button';
import apiClient from '../api/index';

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('verifying'); // verifying, success, error, expired
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
      return;
    }

    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    try {
      setStatus('verifying');
      console.log('Verifying email with token:', token);
      
      // Clear any existing auth data before verification
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      const response = await apiClient.get(`/users/verify-email?token=${encodeURIComponent(token)}`);
      
      console.log('Verification response:', response.data);
      
      if (response.data.success) {
        setStatus('success');
        setMessage(response.data.message);
        
        // Redirect to login immediately
        navigate('/login', { 
          replace: true,
          state: { message: 'Email verified successfully! Please login to continue.' }
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
      console.error('Error response:', error.response?.data);
      
      const errorData = error.response?.data;
      
      if (errorData?.expired) {
        setStatus('expired');
        setMessage(errorData.message);
      } else if (errorData?.alreadyVerified) {
        // Already verified, redirect to login
        navigate('/login', { 
          replace: true,
          state: { message: 'Email already verified. Please login to continue.' }
        });
      } else {
        // Any other error, redirect to login
        navigate('/login', { 
          replace: true,
          state: { message: 'Please try logging in. If you need help, contact support.' }
        });
      }
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      alert('Please enter your email address');
      return;
    }

    try {
      setResending(true);
      const response = await apiClient.post('/users/resend-verification', { email });
      
      if (response.data.success) {
        alert('Verification email sent! Please check your inbox.');
        setEmail('');
      }
    } catch (error) {
      console.error('Resend error:', error);
      alert('Failed to resend verification email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          {status === 'verifying' && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-xl mb-4 animate-pulse">
                <Loader size={32} className="text-blue-600 animate-spin" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Verifying Email...</h1>
              <p className="text-gray-600">Please wait while we verify your email address</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-xl mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Email Verified!</h1>
              <p className="text-gray-600">{message}</p>
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">
                  Redirecting to login page in 2 seconds...
                </p>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-xl mb-4">
                <XCircle size={32} className="text-red-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Verification Failed</h1>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'expired' && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-xl mb-4">
                <Mail size={32} className="text-yellow-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Link Expired</h1>
              <p className="text-gray-600">{message}</p>
              
              {/* Resend verification form */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700 mb-3 font-medium">
                  Request a new verification link:
                </p>
                <div className="space-y-3">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <Button
                    onClick={handleResendVerification}
                    disabled={resending || !email}
                    variant="primary"
                    className="w-full flex items-center justify-center gap-2"
                  >
                    {resending ? (
                      <>
                        <Loader size={18} className="animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={18} />
                        Resend Verification Email
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {status === 'success' && (
            <Button
              onClick={() => navigate('/login')}
              variant="primary"
              className="w-full"
            >
              Go to Login
            </Button>
          )}

          {(status === 'error' || status === 'expired') && (
            <>
              <Button
                onClick={() => navigate('/register')}
                variant="primary"
                className="w-full"
              >
                Back to Registration
              </Button>
              <Button
                onClick={() => navigate('/login')}
                variant="secondary"
                className="w-full"
              >
                Try to Login
              </Button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need help?{' '}
            <Link to="/forgot-password" className="text-purple-600 hover:text-purple-700 font-medium">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
