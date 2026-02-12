
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

const Profile = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('personal');

    // Password Change State
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordMessage({ type: '', text: '' });

        if (passwordData.new_password !== passwordData.confirm_password) {
            setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        if (passwordData.new_password.length < 6) {
            setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        setLoading(true);
        try {
            await client.put('/users/me/password', passwordData);
            setPasswordMessage({ type: 'success', text: 'Password updated successfully!' });
            setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
        } catch (err) {
            console.error("Password update error:", err);
            setPasswordMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to update password' });
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not Provided';
        return new Date(dateString).toLocaleDateString();
    };

    if (!user) return <div className="p-6">Loading profile...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">Account Settings</h2>

            {/* Profile Header Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-6">
                <div className="h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-4xl font-bold border-4 border-white shadow-md">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-gray-900">{user.name}</h3>
                    <p className="text-gray-500">{user.email}</p>
                    <div className="mt-2 flex gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {user.is_admin ? 'Administrator' : 'Standard User'}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                        </span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('personal')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'personal'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Personal Information
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'security'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Security & Password
                    </button>
                </nav>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                {activeTab === 'personal' && (
                    <div className="space-y-8 animate-fadeIn">
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Basic Details</h4>
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                                    <dd className="mt-1 text-sm text-gray-900 font-semibold">{user.name || 'N/A'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Email Address</dt>
                                    <dd className="mt-1 text-sm text-gray-900 font-semibold">{user.email}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                                    <dd className="mt-1 text-sm text-gray-900 font-semibold">{formatDate(user.dob)}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Gender</dt>
                                    <dd className="mt-1 text-sm text-gray-900 font-semibold capitalize">{user.risk_profile?.gender || 'N/A'}</dd>
                                </div>
                            </dl>
                        </div>

                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Employment & Financial</h4>
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Occupation</dt>
                                    <dd className="mt-1 text-sm text-gray-900 font-semibold">{user.risk_profile?.occupation || 'N/A'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Annual Income</dt>
                                    <dd className="mt-1 text-sm text-gray-900 font-semibold">
                                        {user.risk_profile?.annual_income ? `$${user.risk_profile.annual_income.toLocaleString()}` : 'N/A'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Marital Status</dt>
                                    <dd className="mt-1 text-sm text-gray-900 font-semibold capitalize">{user.risk_profile?.marital_status || 'N/A'}</dd>
                                </div>
                            </dl>
                        </div>

                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Contact Information</h4>
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Phone Number</dt>
                                    <dd className="mt-1 text-sm text-gray-900 font-semibold">{user.risk_profile?.phone_number || 'N/A'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Address</dt>
                                    <dd className="mt-1 text-sm text-gray-900 font-semibold">{user.risk_profile?.address || 'N/A'}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="max-w-lg animate-fadeIn">
                        <h4 className="text-lg font-semibold text-gray-900 mb-6">Change Password</h4>

                        {passwordMessage.text && (
                            <div className={`mb-4 p-4 rounded-md text-sm ${passwordMessage.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                                {passwordMessage.text}
                            </div>
                        )}

                        <form onSubmit={handlePasswordSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Current Password</label>
                                <input
                                    type="password"
                                    name="current_password"
                                    value={passwordData.current_password}
                                    onChange={handlePasswordChange}
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">New Password</label>
                                <input
                                    type="password"
                                    name="new_password"
                                    value={passwordData.new_password}
                                    onChange={handlePasswordChange}
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                                <input
                                    type="password"
                                    name="confirm_password"
                                    value={passwordData.confirm_password}
                                    onChange={handlePasswordChange}
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                            >
                                {loading ? 'Updating...' : 'Update Password'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
