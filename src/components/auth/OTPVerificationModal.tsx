import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Mail, 
  Shield, 
  Clock, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Loader
} from 'lucide-react';
import { sendOTP, verifyOTP, formatOTP, validateOTPFormat, cleanOTPInput } from '../../utils/otpService';

interface OTPVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  type: 'email_change' | 'password_reset' | 'signup_verification';
  userId?: string;
  onSuccess: (result: any) => void;
  onError: (error: string) => void;
}

const OTPVerificationModal: React.FC<OTPVerificationModalProps> = ({
  isOpen,
  onClose,
  email,
  type,
  userId,
  onSuccess,
  onError
}) => {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  
  const otpInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout>();

  const typeLabels = {
    email_change: 'Email Change Verification',
    password_reset: 'Password Reset',
    signup_verification: 'Account Verification'
  };

  const typeDescriptions = {
    email_change: 'We\'ve sent a verification code to confirm your email change.',
    password_reset: 'We\'ve sent a verification code to reset your password.',
    signup_verification: 'We\'ve sent a verification code to verify your account.'
  };

  // Auto-send OTP when modal opens
  useEffect(() => {
    if (isOpen && !otpSent) {
      handleSendOTP();
    }
  }, [isOpen]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && otpInputRef.current) {
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && otpSent) {
      setCanResend(true);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeLeft, otpSent]);

  const handleSendOTP = async () => {
    setIsSending(true);
    setError('');
    setSuccess('');

    try {
      const result = await sendOTP({
        email,
        type,
        user_id: userId
      });

      if (result.success) {
        setOtpSent(true);
        setTimeLeft(600); // 10 minutes
        setCanResend(false);
        setSuccess('Verification code sent successfully!');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Failed to send verification code');
      }
    } catch (error) {
      setError('Failed to send verification code. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOTP = async () => {
    const cleanedOTP = cleanOTPInput(otp);
    
    if (!validateOTPFormat(cleanedOTP)) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await verifyOTP({
        email,
        otp_code: cleanedOTP,
        type
      });

      if (result.valid) {
        setSuccess('Verification successful!');
        setTimeout(() => {
          onSuccess(result);
          onClose();
        }, 1000);
      } else {
        setError(result.message || 'Invalid or expired verification code');
      }
    } catch (error) {
      setError('Verification failed. Please try again.');
      onError('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = cleanOTPInput(e.target.value);
    setOtp(formatOTP(value));
    setError('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && otp.replace(/\s/g, '').length === 6) {
      handleVerifyOTP();
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center">
            <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-200">
              {typeLabels[type]}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Email Display */}
          <div className="flex items-center mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3" />
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Verification code sent to:
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400">{email}</p>
            </div>
          </div>

          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {typeDescriptions[type]}
          </p>

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

          {/* OTP Input */}
          <div className="mb-6">
            <label htmlFor="otp" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Enter 6-digit verification code
            </label>
            <input
              ref={otpInputRef}
              type="text"
              id="otp"
              value={otp}
              onChange={handleOTPChange}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200"
              placeholder="000 000"
              maxLength={7} // 6 digits + 1 space
              disabled={isLoading}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Enter the 6-digit code sent to your email
            </p>
          </div>

          {/* Timer */}
          {otpSent && timeLeft > 0 && (
            <div className="mb-4 flex items-center justify-center text-sm text-slate-600 dark:text-slate-400">
              <Clock className="h-4 w-4 mr-2" />
              Code expires in {formatTime(timeLeft)}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleVerifyOTP}
              disabled={isLoading || otp.replace(/\s/g, '').length !== 6}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Verify Code
                </>
              )}
            </button>

            {/* Resend Button */}
            <button
              onClick={handleSendOTP}
              disabled={isSending || !canResend}
              className="w-full py-2 px-4 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              {isSending ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {canResend ? 'Resend Code' : `Resend in ${formatTime(timeLeft)}`}
                </>
              )}
            </button>
          </div>

          {/* Security Notice */}
          <div className="mt-6 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
            <h4 className="text-sm font-medium text-slate-900 dark:text-slate-200 mb-2">
              🔒 Security Notice
            </h4>
            <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <li>• Code is valid for 10 minutes only</li>
              <li>• Never share this code with anyone</li>
              <li>• Code expires after successful verification</li>
              <li>• Contact support if you don't receive the code</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPVerificationModal;