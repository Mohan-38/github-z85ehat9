import React, { useState } from 'react';
import { 
  Settings, 
  Palette, 
  Shield, 
  Bell, 
  Globe, 
  Save,
  RefreshCw,
  Eye,
  ShoppingCart,
  Mail,
  Key,
  Database,
  Server
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../../context/ThemeContext';
import { checkBrevoConfiguration, getBrevoSetupInstructions } from '../../utils/email';
import EmailChangeForm from '../../components/auth/EmailChangeForm';

const AdminSettingsPage = () => {
  const { settings, updateSettings, isPortfolioMode, isMarketplaceMode } = useSettings();
  const { theme, setTheme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [showEmailConfig, setShowEmailConfig] = useState(false);

  const brevoConfig = checkBrevoConfiguration();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Settings are automatically saved via context
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate save delay
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleModeToggle = async (marketplaceMode: boolean) => {
    await updateSettings({ marketplaceMode });
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingCart },
    { id: 'email', label: 'Email & OTP', icon: Mail },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-200">Settings</h1>
            <p className="text-slate-500 dark:text-slate-400">Manage your application settings and preferences.</p>
          </div>
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="lg:w-3/4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm">
              {/* General Settings */}
              {activeTab === 'general' && (
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-200 mb-6">General Settings</h2>
                  
                  {/* Mode Toggle */}
                  <div className="space-y-6">
                    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                      <h3 className="text-md font-medium text-slate-900 dark:text-slate-200 mb-4">Website Mode</h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                          <div className="flex items-center">
                            <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3" />
                            <div>
                              <h4 className="font-medium text-slate-900 dark:text-slate-200">Portfolio Mode</h4>
                              <p className="text-sm text-slate-500 dark:text-slate-400">Showcase projects without e-commerce features</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleModeToggle(false)}
                            className={`px-4 py-2 rounded-md transition-colors ${
                              isPortfolioMode
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {isPortfolioMode ? 'Active' : 'Activate'}
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                          <div className="flex items-center">
                            <ShoppingCart className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
                            <div>
                              <h4 className="font-medium text-slate-900 dark:text-slate-200">Marketplace Mode</h4>
                              <p className="text-sm text-slate-500 dark:text-slate-400">Full e-commerce with checkout and payments</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleModeToggle(true)}
                            className={`px-4 py-2 rounded-md transition-colors ${
                              isMarketplaceMode
                                ? 'bg-green-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {isMarketplaceMode ? 'Active' : 'Activate'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Current Mode Status */}
                    <div className={`p-4 rounded-lg ${
                      isMarketplaceMode 
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                        : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                    }`}>
                      <div className="flex items-center">
                        {isMarketplaceMode ? (
                          <ShoppingCart className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
                        ) : (
                          <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3" />
                        )}
                        <div>
                          <h4 className={`font-medium ${
                            isMarketplaceMode 
                              ? 'text-green-800 dark:text-green-300'
                              : 'text-blue-800 dark:text-blue-300'
                          }`}>
                            Currently in {isMarketplaceMode ? 'Marketplace' : 'Portfolio'} Mode
                          </h4>
                          <p className={`text-sm ${
                            isMarketplaceMode 
                              ? 'text-green-700 dark:text-green-400'
                              : 'text-blue-700 dark:text-blue-400'
                          }`}>
                            {isMarketplaceMode 
                              ? 'E-commerce features are enabled. Users can purchase projects.'
                              : 'Portfolio showcase mode. Projects are displayed for viewing only.'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Marketplace Settings */}
              {activeTab === 'marketplace' && (
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-200 mb-6">Marketplace Settings</h2>
                  
                  <div className="space-y-6">
                    {/* E-commerce Features */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-slate-900 dark:text-slate-200">Show Prices on Projects</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Display project prices on cards and detail pages</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.showPricesOnProjects}
                            onChange={(e) => updateSettings({ showPricesOnProjects: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-slate-900 dark:text-slate-200">Enable Checkout Process</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Allow users to purchase projects through checkout</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.enableCheckoutProcess}
                            onChange={(e) => updateSettings({ enableCheckoutProcess: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-slate-900 dark:text-slate-200">Automatic Document Delivery</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Automatically send documents after successful payment</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.automaticDeliveryEnabled}
                            onChange={(e) => updateSettings({ automaticDeliveryEnabled: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-slate-900 dark:text-slate-200">Email Notifications</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Send email notifications for orders and updates</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.emailNotificationsEnabled}
                            onChange={(e) => updateSettings({ emailNotificationsEnabled: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Email & OTP Settings */}
              {activeTab === 'email' && (
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-200 mb-6">Email & OTP Settings</h2>
                  
                  <div className="space-y-6">
                    {/* Brevo Configuration Status */}
                    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                      <h3 className="text-md font-medium text-slate-900 dark:text-slate-200 mb-4">Email Service Configuration</h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <span className="text-sm font-medium">Brevo API Key</span>
                          <span className={`text-sm ${brevoConfig.apiKey ? 'text-green-600' : 'text-red-600'}`}>
                            {brevoConfig.apiKey ? '✓ Configured' : '✗ Missing'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <span className="text-sm font-medium">Sender Email</span>
                          <span className="text-sm text-slate-600 dark:text-slate-400">{brevoConfig.senderEmail}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <span className="text-sm font-medium">Overall Status</span>
                          <span className={`text-sm font-medium ${brevoConfig.configured ? 'text-green-600' : 'text-red-600'}`}>
                            {brevoConfig.configured ? '✓ Ready' : '✗ Not Ready'}
                          </span>
                        </div>
                      </div>

                      {!brevoConfig.configured && (
                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <h4 className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">Configuration Issues:</h4>
                          <ul className="text-sm text-red-700 dark:text-red-400 list-disc list-inside">
                            {brevoConfig.issues.map((issue, index) => (
                              <li key={index}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <button
                        onClick={() => setShowEmailConfig(!showEmailConfig)}
                        className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {showEmailConfig ? 'Hide' : 'Show'} Setup Instructions
                      </button>

                      {showEmailConfig && (
                        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <pre className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap overflow-x-auto">
                            {getBrevoSetupInstructions()}
                          </pre>
                        </div>
                      )}
                    </div>

                    {/* OTP Management */}
                    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                      <h3 className="text-md font-medium text-slate-900 dark:text-slate-200 mb-4">OTP Management</h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-slate-900 dark:text-slate-200">Email Verification</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Require OTP verification for email changes</p>
                          </div>
                          <span className="text-sm text-green-600 dark:text-green-400 font-medium">Enabled</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-slate-900 dark:text-slate-200">OTP Expiration</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Verification codes expire after 10 minutes</p>
                          </div>
                          <span className="text-sm text-slate-600 dark:text-slate-400">10 minutes</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-slate-900 dark:text-slate-200">Rate Limiting</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Maximum 3 OTP requests per hour per email</p>
                          </div>
                          <span className="text-sm text-slate-600 dark:text-slate-400">3/hour</span>
                        </div>
                      </div>
                    </div>

                    {/* Email Change Form */}
                    <EmailChangeForm />
                  </div>
                </div>
              )}

              {/* Appearance Settings */}
              {activeTab === 'appearance' && (
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-200 mb-6">Appearance Settings</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-md font-medium text-slate-900 dark:text-slate-200 mb-4">Theme</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                          onClick={() => setTheme('light')}
                          className={`p-4 border rounded-lg text-left transition-colors ${
                            theme === 'light'
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-slate-300 dark:border-slate-700 hover:border-slate-400'
                          }`}
                        >
                          <div className="font-medium text-slate-900 dark:text-slate-200">Light Mode</div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">Clean and bright interface</div>
                        </button>
                        
                        <button
                          onClick={() => setTheme('dark')}
                          className={`p-4 border rounded-lg text-left transition-colors ${
                            theme === 'dark'
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-slate-300 dark:border-slate-700 hover:border-slate-400'
                          }`}
                        >
                          <div className="font-medium text-slate-900 dark:text-slate-200">Dark Mode</div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">Easy on the eyes</div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Settings */}
              {activeTab === 'security' && (
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-200 mb-6">Security Settings</h2>
                  
                  <div className="space-y-6">
                    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                      <h3 className="text-md font-medium text-slate-900 dark:text-slate-200 mb-4">Authentication</h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-slate-900 dark:text-slate-200">Email Verification Required</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Users must verify email changes with OTP</p>
                          </div>
                          <span className="text-sm text-green-600 dark:text-green-400 font-medium">Enabled</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-slate-900 dark:text-slate-200">Secure Document Downloads</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Time-limited, email-verified download links</p>
                          </div>
                          <span className="text-sm text-green-600 dark:text-green-400 font-medium">Enabled</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-slate-900 dark:text-slate-200">Admin Authentication</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Supabase authentication for admin access</p>
                          </div>
                          <span className="text-sm text-green-600 dark:text-green-400 font-medium">Active</span>
                        </div>
                      </div>
                    </div>

                    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                      <h3 className="text-md font-medium text-slate-900 dark:text-slate-200 mb-4">Data Protection</h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-slate-900 dark:text-slate-200">Database Security</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Row Level Security (RLS) enabled on all tables</p>
                          </div>
                          <span className="text-sm text-green-600 dark:text-green-400 font-medium">Protected</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-slate-900 dark:text-slate-200">API Security</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Supabase API keys and authentication</p>
                          </div>
                          <span className="text-sm text-green-600 dark:text-green-400 font-medium">Secured</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettingsPage;