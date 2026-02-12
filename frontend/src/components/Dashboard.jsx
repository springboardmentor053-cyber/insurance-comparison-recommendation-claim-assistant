
import React from 'react';
import { useAuth } from '../context/AuthContext';
import PolicyList from './PolicyList';

const Dashboard = () => {
    const { user } = useAuth();

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name || 'User'}!</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Here are the latest insurance policies tailored for you.
                </p>
            </div>

            <PolicyList />
        </div>
    );
};

export default Dashboard;
