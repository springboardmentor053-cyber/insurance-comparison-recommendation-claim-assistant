import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

// Condition options user can select from
const CONDITION_OPTIONS = [
    { value: 'diabetes', label: 'Diabetes' },
    { value: 'hypertension', label: 'Hypertension' },
    { value: 'heart_disease', label: 'Heart Disease' },
    { value: 'asthma', label: 'Asthma' },
    { value: 'kidney_disease', label: 'Kidney Disease' },
    { value: 'cancer_history', label: 'Cancer History' },
    { value: 'arthritis', label: 'Arthritis' },
    { value: 'thyroid', label: 'Thyroid Disorder' },
];

const buildInitialRiskProfile = (user) => {
    const rp = user?.risk_profile || {};
    return {
        occupation: rp.occupation || '',
        annual_income: rp.annual_income || '',
        gender: rp.gender || '',
        marital_status: rp.marital_status || '',
        phone_number: rp.phone_number || '',
        address: rp.address || '',
        employment_type: rp.employment_type || '',
        family_size: rp.family_size || '',
        num_dependents: rp.num_dependents || '',
        has_vehicle: rp.has_vehicle || false,
        smoker: rp.smoker || false,
        alcohol_consumption: rp.alcohol_consumption || '',
        exercise_frequency: rp.exercise_frequency || '',
        bmi_category: rp.bmi_category || '',
        existing_conditions: rp.existing_conditions || [],
        risk_appetite: rp.risk_appetite || '',
        coverage_priority: rp.coverage_priority || '',
    };
};

const inputClass = "mt-1 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5";
const selectClass = "mt-1 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 bg-white";
const labelClass = "block text-sm font-medium text-gray-700";

const Profile = () => {
    const { user, fetchUser } = useAuth();
    const [activeTab, setActiveTab] = useState('personal');

    // Risk Profile State
    const [riskProfile, setRiskProfile] = useState(() => buildInitialRiskProfile(user));
    const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
    const [profileLoading, setProfileLoading] = useState(false);

    // Password Change State
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
    const [passwordLoading, setPasswordLoading] = useState(false);

    // Basic Info Change State
    const [isEditingPersonal, setIsEditingPersonal] = useState(false);
    const [basicData, setBasicData] = useState({
        name: user?.name || '',
        dob: user?.dob ? user.dob.split('T')[0] : '',
    });

    React.useEffect(() => {
        if (user) {
            setBasicData({ 
                name: user.name || '', 
                dob: user.dob ? user.dob.split('T')[0] : '' 
            });
            setRiskProfile(buildInitialRiskProfile(user));
        }
    }, [user]);

    const handleBasicChange = (e) => setBasicData({ ...basicData, [e.target.name]: e.target.value });

    const handlePersonalSubmit = async (e) => {
        e.preventDefault();
        setProfileMessage({ type: '', text: '' });
        setProfileLoading(true);
        try {
            const basicPayload = { ...basicData };
            if (!basicPayload.dob) delete basicPayload.dob;
            await client.put('/users/me/basic-info', basicPayload);

            const rpPayload = { ...riskProfile };
            if (rpPayload.annual_income !== '') rpPayload.annual_income = parseFloat(rpPayload.annual_income);
            else delete rpPayload.annual_income;
            if (rpPayload.family_size !== '') rpPayload.family_size = parseInt(rpPayload.family_size);
            else delete rpPayload.family_size;
            if (rpPayload.num_dependents !== '') rpPayload.num_dependents = parseInt(rpPayload.num_dependents);
            else delete rpPayload.num_dependents;

            await client.put('/users/me/profile', rpPayload);

            await fetchUser();
            setIsEditingPersonal(false);
            setProfileMessage({ type: 'success', text: 'Personal details updated successfully!' });
        } catch (err) {
            setProfileMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to update personal details.' });
        } finally {
            setProfileLoading(false);
        }
    };

    const handleRiskChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox' && name === 'existing_conditions') {
            const current = riskProfile.existing_conditions;
            const updated = checked
                ? [...current, value]
                : current.filter(c => c !== value);
            setRiskProfile({ ...riskProfile, existing_conditions: updated });
        } else if (type === 'checkbox') {
            setRiskProfile({ ...riskProfile, [name]: checked });
        } else {
            setRiskProfile({ ...riskProfile, [name]: value });
        }
    };

    const handleRiskSubmit = async (e) => {
        e.preventDefault();
        setProfileMessage({ type: '', text: '' });
        setProfileLoading(true);
        try {
            const payload = { ...riskProfile };
            // Clean up: convert empty strings to null, numbers to int/float
            if (payload.annual_income !== '') payload.annual_income = parseFloat(payload.annual_income);
            else delete payload.annual_income;
            if (payload.family_size !== '') payload.family_size = parseInt(payload.family_size);
            else delete payload.family_size;
            if (payload.num_dependents !== '') payload.num_dependents = parseInt(payload.num_dependents);
            else delete payload.num_dependents;

            await client.put('/users/me/profile', payload);
            await fetchUser(); // Refresh global user context
            setProfileMessage({ type: 'success', text: 'Risk profile saved! Your recommendations will be updated.' });
        } catch (err) {
            console.error("Profile update error:", err);
            setProfileMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to update profile.' });
        } finally {
            setProfileLoading(false);
        }
    };

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
        setPasswordLoading(true);
        try {
            await client.put('/users/me/password', passwordData);
            setPasswordMessage({ type: 'success', text: 'Password updated successfully!' });
            setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
        } catch (err) {
            setPasswordMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to update password' });
        } finally {
            setPasswordLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not Provided';
        return new Date(dateString).toLocaleDateString();
    };

    if (!user) return <div className="p-6">Loading profile...</div>;

    const tabs = [
        { id: 'personal', label: 'Personal Info' },
        { id: 'risk', label: '🎯 Risk Profile' },
        { id: 'security', label: 'Security' },
    ];

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
                        {user.risk_profile?.risk_appetite && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
                                {user.risk_profile.risk_appetite} Risk Appetite
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

                {/* ── PERSONAL INFO TAB ── */}
                {activeTab === 'personal' && (
                    <div className="space-y-8 animate-fadeIn">
                        {profileMessage.text && (
                            <div className={`p-4 rounded-lg text-sm font-medium ${profileMessage.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                                {profileMessage.text}
                            </div>
                        )}
                        <div>
                            <div className="flex justify-between items-center mb-4 border-b pb-2">
                                <h4 className="text-lg font-semibold text-gray-900">Personal Details</h4>
                                <button
                                    onClick={() => setIsEditingPersonal(!isEditingPersonal)}
                                    className="text-gray-400 hover:text-indigo-600 transition p-1 bg-gray-50 rounded-md ring-1 ring-gray-200"
                                    title="Edit Personal Details"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </button>
                            </div>
                            
                            {isEditingPersonal ? (
                                <form onSubmit={handlePersonalSubmit} className="space-y-6 bg-gray-50 p-6 rounded-xl border border-gray-200">
                                    <h5 className="text-sm font-semibold text-gray-700">Basic Info</h5>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>Full Name</label>
                                            <input type="text" name="name" value={basicData.name} onChange={handleBasicChange} required className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Email Address</label>
                                            <input type="email" value={user.email} disabled className={`${inputClass} bg-gray-200 text-gray-500 cursor-not-allowed`} title="Contact support to change email" />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Date of Birth</label>
                                            <input type="date" name="dob" value={basicData.dob} onChange={handleBasicChange} className={inputClass} max={new Date().toISOString().split('T')[0]} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Gender</label>
                                            <select name="gender" value={riskProfile.gender} onChange={handleRiskChange} className={selectClass}>
                                                <option value="">Select</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <h5 className="text-sm font-semibold text-gray-700 pt-4 border-t border-gray-200">Contact Information</h5>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>Phone Number</label>
                                            <input type="tel" name="phone_number" value={riskProfile.phone_number} onChange={handleRiskChange} className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Address</label>
                                            <input type="text" name="address" value={riskProfile.address} onChange={handleRiskChange} className={inputClass} />
                                        </div>
                                    </div>

                                    <h5 className="text-sm font-semibold text-gray-700 pt-4 border-t border-gray-200">Employment & Financial</h5>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>Occupation</label>
                                            <input type="text" name="occupation" value={riskProfile.occupation} onChange={handleRiskChange} className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Annual Income (₹)</label>
                                            <input type="number" name="annual_income" value={riskProfile.annual_income} onChange={handleRiskChange} className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Employment Type</label>
                                            <select name="employment_type" value={riskProfile.employment_type} onChange={handleRiskChange} className={selectClass}>
                                                <option value="">Select</option>
                                                <option value="salaried">Salaried / Government</option>
                                                <option value="self_employed">Self-Employed</option>
                                                <option value="business_owner">Business Owner</option>
                                                <option value="freelancer">Freelancer / Contractor</option>
                                                <option value="retired">Retired</option>
                                                <option value="student">Student</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Marital Status</label>
                                            <select name="marital_status" value={riskProfile.marital_status} onChange={handleRiskChange} className={selectClass}>
                                                <option value="">Select</option>
                                                <option value="single">Single</option>
                                                <option value="married">Married</option>
                                                <option value="divorced">Divorced</option>
                                                <option value="widowed">Widowed</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-2 pt-4">
                                        <button type="button" onClick={() => setIsEditingPersonal(false)} className="bg-white border text-gray-700 px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-50">
                                            Cancel
                                        </button>
                                        <button type="submit" disabled={profileLoading} className="bg-indigo-600 text-white px-6 py-2 text-sm font-medium rounded-md hover:bg-indigo-700 shadow-sm">
                                            {profileLoading ? 'Saving...' : 'Save All Changes'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-8">
                                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                                        <div><dt className="text-sm font-medium text-gray-500">Full Name</dt><dd className="mt-1 text-sm text-gray-900 font-semibold">{user.name || 'N/A'}</dd></div>
                                        <div><dt className="text-sm font-medium text-gray-500">Email Address</dt><dd className="mt-1 text-sm text-gray-900 font-semibold">{user.email}</dd></div>
                                        <div><dt className="text-sm font-medium text-gray-500">Date of Birth</dt><dd className="mt-1 text-sm text-gray-900 font-semibold">{formatDate(user.dob)}</dd></div>
                                        <div><dt className="text-sm font-medium text-gray-500">Gender</dt><dd className="mt-1 text-sm text-gray-900 font-semibold capitalize">{user.risk_profile?.gender || 'N/A'}</dd></div>
                                    </dl>
                                    
                                    <div>
                                        <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Contact Information</h4>
                                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                                            <div><dt className="text-sm font-medium text-gray-500">Phone Number</dt><dd className="mt-1 text-sm text-gray-900 font-semibold">{user.risk_profile?.phone_number || 'N/A'}</dd></div>
                                            <div><dt className="text-sm font-medium text-gray-500">Address</dt><dd className="mt-1 text-sm text-gray-900 font-semibold">{user.risk_profile?.address || 'N/A'}</dd></div>
                                        </dl>
                                    </div>

                                    <div>
                                        <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Employment & Financial</h4>
                                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                                            <div><dt className="text-sm font-medium text-gray-500">Occupation</dt><dd className="mt-1 text-sm text-gray-900 font-semibold">{user.risk_profile?.occupation || 'N/A'}</dd></div>
                                            <div><dt className="text-sm font-medium text-gray-500">Annual Income</dt><dd className="mt-1 text-sm text-gray-900 font-semibold">{user.risk_profile?.annual_income ? `₹${Number(user.risk_profile.annual_income).toLocaleString()}` : 'N/A'}</dd></div>
                                            <div><dt className="text-sm font-medium text-gray-500">Marital Status</dt><dd className="mt-1 text-sm text-gray-900 font-semibold capitalize">{user.risk_profile?.marital_status || 'N/A'}</dd></div>
                                            <div><dt className="text-sm font-medium text-gray-500">Employment Type</dt><dd className="mt-1 text-sm text-gray-900 font-semibold capitalize">{user.risk_profile?.employment_type?.replace('_', ' ') || 'N/A'}</dd></div>
                                        </dl>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── RISK PROFILE TAB ── */}
                {activeTab === 'risk' && (
                    <form onSubmit={handleRiskSubmit} className="space-y-8 animate-fadeIn">
                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-700">
                            <strong>Why this matters:</strong> These details power our recommendation engine to suggest the most relevant insurance plans for your specific situation.
                        </div>

                        {profileMessage.text && (
                            <div className={`p-4 rounded-lg text-sm font-medium ${profileMessage.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                                {profileMessage.text}
                            </div>
                        )}

                        {/* ── Section 1: Basic ── */}
                        <div>
                            <h4 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <span className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">1</span>
                                Basic & Financial Info
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className={labelClass}>Occupation</label>
                                    <input type="text" name="occupation" value={riskProfile.occupation} onChange={handleRiskChange} placeholder="e.g. Software Engineer" className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Annual Income (₹)</label>
                                    <input type="number" name="annual_income" value={riskProfile.annual_income} onChange={handleRiskChange} placeholder="e.g. 60000" className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Marital Status</label>
                                    <select name="marital_status" value={riskProfile.marital_status} onChange={handleRiskChange} className={selectClass}>
                                        <option value="">Select</option>
                                        <option value="single">Single</option>
                                        <option value="married">Married</option>
                                        <option value="divorced">Divorced</option>
                                        <option value="widowed">Widowed</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Employment Type</label>
                                    <select name="employment_type" value={riskProfile.employment_type} onChange={handleRiskChange} className={selectClass}>
                                        <option value="">Select</option>
                                        <option value="salaried">Salaried / Government</option>
                                        <option value="self_employed">Self-Employed</option>
                                        <option value="business_owner">Business Owner</option>
                                        <option value="freelancer">Freelancer / Contractor</option>
                                        <option value="retired">Retired</option>
                                        <option value="student">Student</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* ── Section 2: Family ── */}
                        <div>
                            <h4 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <span className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">2</span>
                                Family & Lifestyle
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className={labelClass}>Family Size (including yourself)</label>
                                    <input type="number" name="family_size" min="1" max="15" value={riskProfile.family_size} onChange={handleRiskChange} placeholder="e.g. 4" className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Number of Financial Dependents</label>
                                    <input type="number" name="num_dependents" min="0" max="10" value={riskProfile.num_dependents} onChange={handleRiskChange} placeholder="e.g. 2" className={inputClass} />
                                </div>
                            </div>
                            {/* Toggles */}
                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition">
                                    <input type="checkbox" name="has_vehicle" checked={riskProfile.has_vehicle} onChange={handleRiskChange} className="h-5 w-5 rounded text-indigo-600 border-gray-300" />
                                    <div>
                                        <span className="font-medium text-gray-800">Own a Vehicle?</span>
                                        <p className="text-xs text-gray-500">Used to recommend auto insurance</p>
                                    </div>
                                </label>
                                <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition">
                                    <input type="checkbox" name="smoker" checked={riskProfile.smoker} onChange={handleRiskChange} className="h-5 w-5 rounded text-indigo-600 border-gray-300" />
                                    <div>
                                        <span className="font-medium text-gray-800">Current Smoker?</span>
                                        <p className="text-xs text-gray-500">Affects health plan recommendations</p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* ── Section 3: Health ── */}
                        <div>
                            <h4 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <span className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">3</span>
                                Health Details
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                <div>
                                    <label className={labelClass}>Alcohol Consumption</label>
                                    <select name="alcohol_consumption" value={riskProfile.alcohol_consumption} onChange={handleRiskChange} className={selectClass}>
                                        <option value="">Select</option>
                                        <option value="never">Never</option>
                                        <option value="occasionally">Occasionally</option>
                                        <option value="regularly">Regularly</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Exercise Frequency</label>
                                    <select name="exercise_frequency" value={riskProfile.exercise_frequency} onChange={handleRiskChange} className={selectClass}>
                                        <option value="">Select</option>
                                        <option value="rarely">Rarely</option>
                                        <option value="sometimes">Sometimes (1–2x/week)</option>
                                        <option value="regularly">Regularly (3+x/week)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>BMI Category</label>
                                    <select name="bmi_category" value={riskProfile.bmi_category} onChange={handleRiskChange} className={selectClass}>
                                        <option value="">Select</option>
                                        <option value="underweight">Underweight (&lt;18.5)</option>
                                        <option value="normal">Normal (18.5–24.9)</option>
                                        <option value="overweight">Overweight (25–29.9)</option>
                                        <option value="obese">Obese (30+)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Existing Conditions */}
                            <div className="mt-5">
                                <label className={`${labelClass} mb-3`}>Pre-existing Medical Conditions <span className="text-gray-400 font-normal">(select all that apply)</span></label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {CONDITION_OPTIONS.map(opt => (
                                        <label key={opt.value} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition text-sm ${riskProfile.existing_conditions.includes(opt.value)
                                                ? 'border-indigo-400 bg-indigo-50 text-indigo-700 font-medium'
                                                : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                                            }`}>
                                            <input
                                                type="checkbox"
                                                name="existing_conditions"
                                                value={opt.value}
                                                checked={riskProfile.existing_conditions.includes(opt.value)}
                                                onChange={handleRiskChange}
                                                className="h-4 w-4 rounded text-indigo-600"
                                            />
                                            {opt.label}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ── Section 4: Insurance Preferences ── */}
                        <div>
                            <h4 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <span className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">4</span>
                                Insurance Preferences
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className={labelClass}>Risk Appetite</label>
                                    <div className="mt-2 grid grid-cols-3 gap-3">
                                        {['low', 'medium', 'high'].map(opt => (
                                            <label key={opt} className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition text-sm font-medium capitalize ${riskProfile.risk_appetite === opt
                                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                                }`}>
                                                <input type="radio" name="risk_appetite" value={opt} checked={riskProfile.risk_appetite === opt} onChange={handleRiskChange} className="sr-only" />
                                                <span className="text-lg mb-1">{opt === 'low' ? '🛡️' : opt === 'medium' ? '⚖️' : '🚀'}</span>
                                                {opt}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Coverage Priority</label>
                                    <div className="mt-2 grid grid-cols-3 gap-3">
                                        {[
                                            { value: 'cost_saving', label: 'Cost Saving', icon: '💰' },
                                            { value: 'balanced', label: 'Balanced', icon: '⚖️' },
                                            { value: 'comprehensive', label: 'Full Cover', icon: '🏆' },
                                        ].map(opt => (
                                            <label key={opt.value} className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition text-sm font-medium ${riskProfile.coverage_priority === opt.value
                                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                                }`}>
                                                <input type="radio" name="coverage_priority" value={opt.value} checked={riskProfile.coverage_priority === opt.value} onChange={handleRiskChange} className="sr-only" />
                                                <span className="text-lg mb-1">{opt.icon}</span>
                                                {opt.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="pt-4 border-t border-gray-100">
                            <button
                                type="submit"
                                disabled={profileLoading}
                                className={`px-8 py-3 rounded-xl text-sm font-bold text-white shadow-sm transition-all ${profileLoading
                                        ? 'bg-indigo-400 cursor-not-allowed'
                                        : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md transform hover:-translate-y-0.5'
                                    }`}
                            >
                                {profileLoading ? 'Saving...' : '💾 Save Risk Profile'}
                            </button>
                            <p className="mt-2 text-xs text-gray-400">Saving will refresh your Dashboard recommendations automatically.</p>
                        </div>
                    </form>
                )}

                {/* ── SECURITY TAB ── */}
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
                                <input type="password" name="current_password" value={passwordData.current_password} onChange={handlePasswordChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">New Password</label>
                                <input type="password" name="new_password" value={passwordData.new_password} onChange={handlePasswordChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                                <input type="password" name="confirm_password" value={passwordData.confirm_password} onChange={handlePasswordChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
                            </div>
                            <button type="submit" disabled={passwordLoading} className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${passwordLoading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                                {passwordLoading ? 'Updating...' : 'Update Password'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
