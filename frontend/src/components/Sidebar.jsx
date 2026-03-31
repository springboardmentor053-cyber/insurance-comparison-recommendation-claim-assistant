

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();

    // Helper to determine active state styling
    const getNavLinkClass = ({ isActive }) => {
        const baseClass = "flex items-center px-6 py-3 text-gray-300 hover:bg-blue-800 hover:text-white transition-all duration-200 group";
        const activeClass = "bg-blue-800 text-white border-l-4 border-emerald-400";
        return isActive ? `${baseClass} ${activeClass} ` : baseClass;
    };

    return (
        <div className="hidden md:flex md:flex-col md:w-64 bg-blue-900 h-screen fixed z-50">
            <div className="flex items-center justify-center h-16 bg-blue-950 shadow-md">
                <span className="text-xl font-bold text-white tracking-wider">INSURE ASSIST</span>
            </div>

            <div className="flex-1 flex flex-col overflow-y-auto mt-4">
                <nav className="flex-1 space-y-1">
                    {user?.is_admin ? (
                        <>
                            <p className="px-6 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2 pt-2">Admin Panel</p>
                            <NavLink to="/admin/dashboard" className={getNavLinkClass}>
                                <svg className="mr-3 flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                Admin Dashboard
                            </NavLink>
                            <NavLink to="/admin/claims" className={getNavLinkClass}>
                                <svg className="mr-3 flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Manage Claims
                            </NavLink>
                        </>
                    ) : (
                        <>
                            <NavLink to="/" end className={getNavLinkClass}>
                                <svg className="mr-3 flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                Dashboard
                            </NavLink>

                            <NavLink to="/compare" className={getNavLinkClass}>
                                <svg className="mr-3 flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                Compare
                            </NavLink>
                            
                            <NavLink to="/calculator" className={getNavLinkClass}>
                                <svg className="mr-3 flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                Calculator
                            </NavLink>

                            <div className="pt-4 mt-4 border-t border-blue-800">
                                <p className="px-6 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">My Account</p>
                                <NavLink to="/policies/my" className={getNavLinkClass}>
                                    <svg className="mr-3 flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    My Policies
                                </NavLink>

                                <NavLink to="/claims/my" className={getNavLinkClass}>
                                    <svg className="mr-3 flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                    </svg>
                                    My Claims
                                </NavLink>

                                <NavLink to="/profile" className={getNavLinkClass}>
                                    <svg className="mr-3 flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    Profile
                                </NavLink>
                            </div>
                        </>
                    )}
                </nav>
            </div>

            <div className="flex-shrink-0 flex border-t border-blue-800 p-4">
                <button
                    onClick={logout}
                    className="flex-shrink-0 w-full group block"
                >
                    <div className="flex items-center px-2 py-2 text-sm font-medium text-white hover:bg-blue-800 rounded-md transition-colors">
                        <svg className="mr-3 h-6 w-6 text-gray-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                    </div>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
