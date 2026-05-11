import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, clearError } from '../redux/slices/authSlice';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import ErrorMessage from '../components/common/ErrorMessage';
import { UserPlus, Eye, EyeOff } from 'lucide-react';

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    image: '',
    workspaceName: '', // New field for workspace name
    roleId: 3, 
    isInvited: false,
  });

  const [formErrors, setFormErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState('');
  const [emailPreviewUrl, setEmailPreviewUrl] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    
    if (!formData.workspaceName.trim()) {
      errors.workspaceName = 'Workspace name is required';
    } else if (formData.workspaceName.length < 2) {
      errors.workspaceName = 'Workspace name must be at least 2 characters';
    }
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const checkPasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength('');
      return;
    }
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]+/)) strength++;
    if (password.match(/[A-Z]+/)) strength++;
    if (password.match(/[0-9]+/)) strength++;
    if (password.match(/[$@#&!]+/)) strength++;
    
    if (strength <= 2) setPasswordStrength('weak');
    else if (strength <= 3) setPasswordStrength('medium');
    else setPasswordStrength('strong');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const result = await dispatch(registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        workspaceName: formData.workspaceName, // Include workspace name
        image: formData.image || null,
        roleId: formData.roleId,
        isInvited: formData.isInvited,
      }));
      
      // Check if registration was successful (email verification required)
      if (result.type === 'auth/register/fulfilled') {
        setRegistrationSuccess(true);
        setRegistrationMessage(result.payload?.message || 'Registration successful! Please check your email to verify your account.');
        // Only show preview URL if in test mode
        if (result.payload?.testMode && result.payload?.previewUrl) {
          setEmailPreviewUrl(result.payload.previewUrl);
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (name === 'password') {
      checkPasswordStrength(value);
    }
    
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 'weak': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'strong': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-xl mb-4">
            <UserPlus size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Create Account</h1>
          <p className="text-gray-600">Join your team's workspace today</p>
        </div>

        {/* Success Message */}
        {registrationSuccess ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-green-800 mb-1">
                    Registration Successful!
                  </h3>
                  <p className="text-sm text-green-700">
                    {registrationMessage}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-2">What's next?</h4>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Check your email inbox</li>
                <li>Click the verification link</li>
                <li>Log in to your account</li>
              </ol>
            </div>

            {/* Show email preview for testing (Ethereal) */}
            {emailPreviewUrl && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">🧪 Testing Mode</h4>
                <p className="text-xs text-yellow-700 mb-2">
                  Using test email service. View your verification email:
                </p>
                <a
                  href={emailPreviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 underline break-all"
                >
                  {emailPreviewUrl}
                </a>
              </div>
            )}

            <Button
              onClick={() => navigate('/login')}
              variant="primary"
              className="w-full"
            >
              Go to Login
            </Button>

            <p className="text-center text-sm text-gray-600">
              Didn't receive the email?{' '}
              <button 
                onClick={() => setRegistrationSuccess(false)}
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                Try again
              </button>
            </p>
          </div>
        ) : (
          <>
            {/* Error Message */}
            {error && (
              <div className="mb-4">
                <ErrorMessage 
                  message={error} 
                  onClose={() => dispatch(clearError())} 
                />
              </div>
            )}

        {/* Registration Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <Input
              type="text"
              name="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              error={formErrors.name}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Workspace Name
            </label>
            <Input
              type="text"
              name="workspaceName"
              placeholder="My Company Workspace"
              value={formData.workspaceName}
              onChange={handleChange}
              error={formErrors.workspaceName}
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Choose a name for your workspace
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <Input
              type="email"
              name="email"
              placeholder="john.doe@example.com"
              value={formData.email}
              onChange={handleChange}
              error={formErrors.email}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleChange}
                error={formErrors.password}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {formData.password && (
              <div className="mt-2">
                <div className="flex gap-1 h-1">
                  <div className={`flex-1 rounded ${passwordStrength ? getPasswordStrengthColor() : 'bg-gray-300'}`} />
                  <div className={`flex-1 rounded ${passwordStrength === 'medium' || passwordStrength === 'strong' ? getPasswordStrengthColor() : 'bg-gray-300'}`} />
                  <div className={`flex-1 rounded ${passwordStrength === 'strong' ? getPasswordStrengthColor() : 'bg-gray-300'}`} />
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Password strength: <span className="font-medium capitalize">{passwordStrength || 'Enter password'}</span>
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
                error={formErrors.confirmPassword}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Image URL (Optional)
            </label>
            <Input
              type="url"
              name="image"
              placeholder="https://example.com/avatar.jpg"
              value={formData.image}
              onChange={handleChange}
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to use default avatar
            </p>
          </div>

          <div className="pt-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                required
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="ml-2 text-sm text-gray-600">
                I agree to the{' '}
                <button className="text-purple-600 hover:text-purple-700 font-medium">
                  Terms of Service
                </button>{' '}
                and{' '}
                <button className="text-purple-600 hover:text-purple-700 font-medium">
                  Privacy Policy
                </button>
              </span>
            </label>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading}
            variant="primary"
            className="w-full"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </div>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-600 hover:text-purple-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
