import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Search,
  Filter,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';
import { cleanupExpiredOTPs } from '../../utils/otpService';

interface OTPRecord {
  id: string;
  email: string;
  otp_code: string;
  type: string;
  user_id?: string;
  expires_at: string;
  is_used: boolean;
  verified_at?: string;
  created_at: string;
}

const AdminOTPManagementPage: React.FC = () => {
  const [otpRecords, setOtpRecords] = useState<OTPRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  useEffect(() => {
    fetchOTPRecords();
  }, []);

  const fetchOTPRecords = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('email_otps')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setOtpRecords(data || []);
    } catch (error) {
      console.error('Error fetching OTP records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupExpired = async () => {
    setIsCleaningUp(true);
    try {
      const deletedCount = await cleanupExpiredOTPs();
      alert(`Cleaned up ${deletedCount} expired OTP records`);
      await fetchOTPRecords();
    } catch (error) {
      console.error('Error cleaning up OTPs:', error);
      alert('Failed to cleanup expired OTPs');
    } finally {
      setIsCleaningUp(false);
    }
  };

  const handleDeleteOTP = async (id: string) => {
    if (!confirm('Are you sure you want to delete this OTP record?')) return;

    try {
      const { error } = await supabase
        .from('email_otps')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchOTPRecords();
    } catch (error) {
      console.error('Error deleting OTP:', error);
      alert('Failed to delete OTP record');
    }
  };

  const filteredRecords = otpRecords.filter(record => {
    const matchesSearch = record.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.otp_code.includes(searchTerm);
    
    const matchesType = typeFilter === 'all' || record.type === typeFilter;
    
    const now = new Date();
    const expiresAt = new Date(record.expires_at);
    const isExpired = now > expiresAt;
    
    let matchesStatus = true;
    if (statusFilter === 'active') {
      matchesStatus = !record.is_used && !isExpired;
    } else if (statusFilter === 'used') {
      matchesStatus = record.is_used;
    } else if (statusFilter === 'expired') {
      matchesStatus = !record.is_used && isExpired;
    }
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (record: OTPRecord) => {
    const now = new Date();
    const expiresAt = new Date(record.expires_at);
    const isExpired = now > expiresAt;

    if (record.is_used) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Used
        </span>
      );
    } else if (isExpired) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="h-3 w-3 mr-1" />
          Expired
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Clock className="h-3 w-3 mr-1" />
          Active
        </span>
      );
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      email_change: 'bg-purple-100 text-purple-800',
      password_reset: 'bg-orange-100 text-orange-800',
      signup_verification: 'bg-green-100 text-green-800'
    };

    const labels = {
      email_change: 'Email Change',
      password_reset: 'Password Reset',
      signup_verification: 'Signup Verification'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {labels[type as keyof typeof labels] || type}
      </span>
    );
  };

  const stats = {
    total: otpRecords.length,
    active: otpRecords.filter(r => !r.is_used && new Date() <= new Date(r.expires_at)).length,
    used: otpRecords.filter(r => r.is_used).length,
    expired: otpRecords.filter(r => !r.is_used && new Date() > new Date(r.expires_at)).length
  };

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-200">OTP Management</h1>
            <p className="text-slate-500 dark:text-slate-400">Monitor and manage email verification codes.</p>
          </div>
          
          <div className="flex space-x-2 mt-4 sm:mt-0">
            <button
              onClick={fetchOTPRecords}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            
            <button
              onClick={handleCleanupExpired}
              disabled={isCleaningUp}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              <Trash2 className={`h-4 w-4 mr-2 ${isCleaningUp ? 'animate-spin' : ''}`} />
              Cleanup Expired
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total OTPs</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-200">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Used</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.used}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Expired</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.expired}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search by email or OTP code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="all">All Types</option>
              <option value="email_change">Email Change</option>
              <option value="password_reset">Password Reset</option>
              <option value="signup_verification">Signup Verification</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="used">Used</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        {/* OTP Records Table */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-slate-500 dark:text-slate-400">Loading OTP records...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-200 mb-1">No OTP records found</h3>
              <p className="text-slate-500 dark:text-slate-400">
                {otpRecords.length === 0 ? "No OTP codes have been generated yet." : "No records match your search criteria."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      OTP Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Expires
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 text-slate-400 mr-2" />
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-200">
                            {record.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-sm font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                          {record.otp_code}
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTypeBadge(record.type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(record)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        {formatDate(record.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        {formatDate(record.expires_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeleteOTP(record.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                          title="Delete OTP record"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOTPManagementPage;