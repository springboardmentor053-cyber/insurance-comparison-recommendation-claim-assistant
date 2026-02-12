
import React from 'react';

const ProfileModal = ({ isOpen, onClose, user }) => {
    if (!isOpen) return null;

    const formatDate = (dateString) => {
        if (!dateString) return 'Not Provided';
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 backdrop-blur-sm p-4 md:p-0 transition-opacity">
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl transform transition-transform scale-100">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900">
                        User Profile
                    </h3>
                    <button
                        onClick={onClose}
                        type="button"
                        className="text-gray-400 bg-transparent hover:bg-gray-100 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                    </button>
                </div>
                {/* Body */}
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-center mb-6">
                        <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-3xl font-bold border-4 border-white shadow-lg">
                            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="block text-xs text-gray-500">Full Name</span>
                                <span className="block text-sm font-semibold text-gray-900">{user?.name || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="block text-xs text-gray-500">Email</span>
                                <span className="block text-sm font-semibold text-gray-900 truncate">{user?.email || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="block text-xs text-gray-500">Date of Birth</span>
                                <span className="block text-sm font-semibold text-gray-900">{formatDate(user?.dob)}</span>
                            </div>
                            <div>
                                <span className="block text-xs text-gray-500">Gender</span>
                                <span className="block text-sm font-semibold text-gray-900 capitalize">{user?.risk_profile?.gender || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="block text-xs text-gray-500">Occupation</span>
                                <span className="block text-sm font-semibold text-gray-900">{user?.risk_profile?.occupation || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="block text-xs text-gray-500">Annual Income</span>
                                <span className="block text-sm font-semibold text-gray-900">${user?.risk_profile?.annual_income || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="block text-xs text-gray-500">Phone</span>
                                <span className="block text-sm font-semibold text-gray-900">{user?.risk_profile?.phone_number || 'N/A'}</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-gray-100 mt-2">
                            <span className="text-gray-500 font-medium">Risk Profile Status</span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Low Risk (Initial)
                            </span>
                        </div>
                    </div>
                </div>
                {/* Footer */}
                <div className="flex items-center p-6 space-x-2 border-t border-gray-100 rounded-b">
                    <button
                        onClick={onClose}
                        className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 w-full"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;
