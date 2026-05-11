import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import ErrorMessage from '../components/common/ErrorMessage';
import axios from 'axios';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [emailError, setEmailError] = useState('');

  const validateEmail = (email) => {
    if (!email) {
      return 'Email is required';
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return 'Email is invalid';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateEmail(email);
    if (validationError) {
      setEmailError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    setEmailError('');

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/users/forgot-password`, {
        email
      });

      if (response.data.success) {
        setSuccess(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          {}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <CheckCircle size={48} className="text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Check Your Email</h1>
            <p className="text-gray-600">
              We've sent a password reset link to
            </p>
            <p className="text-purple-600 font-semibold mt-2">{email}</p>
          </div>

          {}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <p className="text-sm text-gray-700">
              <strong>Next steps:</strong>
            </p>
            <ol className="text-sm text-gray-600 mt-2 space-y-1 list-decimal list-inside">
              <li>Check your email inbox</li>
              <li>Click the reset link in the email</li>
              <li>Create your new password</li>
            </ol>
          </div>

          {}
          <div className="text-center text-sm text-gray-600 mb-6">
            <p>Didn't receive the email?</p>
            <ul className="mt-2 space-y-1">
              <li>• Check your spam folder</li>
              <li>• Make sure you entered the correct email</li>
              <li>• Wait a few minutes and check again</li>
            </ul>
          </div>

          {}
          <div className="space-y-3">
            <Button
              onClick={() => {
                setSuccess(false);
                setEmail('');
              }}
              variant="secondary"
              className="w-full"
            >
              Try Another Email
            </Button>
            <Link to="/login">
              <Button variant="primary" className="w-full">
                <ArrowLeft size={18} className="mr-2" />
                Back to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-xl mb-4">
            <Mail size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Forgot Password?</h1>
          <p className="text-gray-600">
            No worries! Enter your email and we'll send you reset instructions.
          </p>
        </div>

        {}
        {error && (
          <div className="mb-4">
            <ErrorMessage message={error} onClose={() => setError('')} />
          </div>
        )}

        {}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <Input
              type="email"
              name="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError('');
              }}
              error={emailError}
              disabled={loading}
              autoFocus
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !email}
            variant="primary"
            className="w-full"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>

        {}
        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium transition"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back to Login
          </Link>
        </div>

        {}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 text-center">
            <strong> Security Note:</strong> For your security, we'll send the reset link only if an account exists with this email.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
