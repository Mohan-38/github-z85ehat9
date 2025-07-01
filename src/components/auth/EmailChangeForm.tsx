import React, { useState } from 'react';
import { Mail, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { checkEmailChangeRateLimit } from '../../utils/otpService';
import OTPVerificationModal from './OTPVerificationModal';

const EmailChangeForm: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [newEmail, setNewEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showOTPModal, setShowOTPModal] = useState(false);

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleEmailChangeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEmail || !validateEmail(newEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    if (newEmail.toLowerCase() === user?.email?.toLowerCase()) {
      setError('New email must be different from current email');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Check rate limiting
      const canProceed = await checkEmailChangeRateLimit(newEmail);
      if (!canProceed) {
        setError('Too many email change attempts. Please try again later.');
        return;
      }

      // Show OTP modal to send verification code
      setShowOTPModal(true);

    } catch (error) {
      setError('Failed to initiate email change. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPSuccess = async (result: any) => {
    try {
      if (result.action_result?.success) {
        setSuccess('Email address updated successfully!');
        setNewEmail('');
        
        // Update local user context if needed
        if (updateProfile) {
          await updateProfile({ email: newEmail });
        }
        
        // Refresh the page to update auth state
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setError(result.action_result?.error || 'Failed to update email address');
      }
    } catch (error) {
      setError('Failed to update email address');
    }
  };

  const handleOTPError = (error: string) => {
    setError(error);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center mb-4">
        <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-200">
          Change Email Address
        </h3>
      </div>

      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Current Email:</strong> {user?.email}
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-lg flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      <form onSubmit={handleEmailChangeRequest} className="space-y-4">
        <div>
          <label htmlFor="newEmail" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            New Email Address
          </label>
          <input
            type="email"
            id="newEmail"
            value={newEmail}
            onChange={(e) => {
              setNewEmail(e.target.value);
              setError('');
            }}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200"
            placeholder="Enter your new email address"
            required
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !newEmail}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Send Verification Code
            </>
          )}
        </button>
      </form>

      {/* Security Notice */}
      <div className="mt-6 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-200 mb-2">
          🔒 Security Information
        </h4>
        <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
          <li>• A verification code will be sent to your new email address</li>
          <li>• You must verify the new email before the change takes effect</li>
          <li>• The verification code expires in 10 minutes</li>
          <li>• You can request up to 3 codes per hour</li>
        </ul>
      </div>

      {/* OTP Verification Modal */}
      <OTPVerificationModal
        isOpen={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        email={newEmail}
        type="email_change"
        userId={user?.id}
        onSuccess={handleOTPSuccess}
        onError={handleOTPError}
      />
    </div>
  );
};

export default EmailChangeForm;