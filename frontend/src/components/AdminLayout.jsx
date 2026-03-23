
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const getNavLinkClass = ({ isActive }) => {
    const base = "flex items-center px-6 py-3 text-gray-300 hover:bg-slate-700 hover:text-white transition-all duration-200 group";
    const active = "bg-slate-700 text-white border-l-4 border-yellow-400";
    return isActive ? `${base} ${active}` : base;
};

const AdminLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);

    return (
        <div
            className="min-h-screen bg-slate-100 flex"
            onClick={() => dropdownOpen && setDropdownOpen(false)}
        >
            {/* ─── Admin Sidebar ─────────────────────────────── */}
            <div className="hidden md:flex md:flex-col md:w-64 bg-slate-900 h-screen fixed z-50">
                {/* Logo */}
                <div className="flex items-center justify-center h-16 bg-slate-950 shadow-md gap-2">
                    <span className="text-yellow-400 text-xl">⚙</span>
                    <span className="text-lg font-bold text-white tracking-wider">ADMIN PANEL</span>
                </div>

                {/* Admin badge */}
                <div className="px-6 py-3 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center text-slate-900 font-bold text-sm">
                            {user?.name?.charAt(0) || 'A'}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">{user?.name}</p>
                            <p className="text-xs text-yellow-400 font-semibold">Administrator</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex-1 flex flex-col overflow-y-auto mt-4">
                    <nav className="flex-1 space-y-1">

                        {/* Overview */}
                        <div className="px-6 py-2">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overview</p>
                        </div>
                        <NavLink to="/admin/dashboard" className={getNavLinkClass}>
                            <svg className="mr-3 flex-shrink-0 h-5 w-5 text-slate-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Dashboard
                        </NavLink>

                        {/* Claims */}
                        <div className="px-6 py-2 mt-2">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Claims Management</p>
                        </div>
                        <NavLink to="/admin/claims" className={getNavLinkClass}>
                            <svg className="mr-3 flex-shrink-0 h-5 w-5 text-slate-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                            Manage Claims
                        </NavLink>

                    </nav>
                </div>

                {/* Logout */}
                <div className="flex-shrink-0 border-t border-slate-700 p-4">
                    <button onClick={logout} className="flex items-center gap-3 w-full text-slate-400 hover:text-white transition px-2 py-2 rounded-md hover:bg-slate-700 text-sm">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                    </button>
                </div>
            </div>

            {/* ─── Main Content Area ──────────────────────────── */}
            <div className="flex-1 flex flex-col md:pl-64">
                {/* Top bar */}
                <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 sticky top-0 z-10 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <span className="text-yellow-500 text-xl">⚙</span>
                        <h1 className="text-lg font-bold text-gray-800">Insurance Admin Panel</h1>
                    </div>
                    <div className="relative">
                        <button
                            onClick={(e) => { e.stopPropagation(); setDropdownOpen(!dropdownOpen); }}
                            className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition focus:outline-none"
                        >
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-bold text-gray-900">{user?.name}</p>
                                <p className="text-xs text-yellow-600 font-semibold">Administrator</p>
                            </div>
                            <div className="h-9 w-9 rounded-full bg-yellow-400 flex items-center justify-center text-slate-900 font-bold text-sm">
                                {user?.name?.charAt(0) || 'A'}
                            </div>
                        </button>
                        {dropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                                <button
                                    onClick={logout}
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                <main className="flex-1 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
