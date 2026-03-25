import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/profileService';
import { changePassword } from '../services/authService';

export default function Profile() {
    const { user, refreshUser } = useAuth();

    const [name, setName] = useState(user?.name || '');
    const [dob, setDob] = useState(user?.dob || '');
    const [profileMsg, setProfileMsg] = useState('');
    const [profileErr, setProfileErr] = useState('');
    const [profileLoading, setProfileLoading] = useState(false);

    const [oldPw, setOldPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [pwMsg, setPwMsg] = useState('');
    const [pwErr, setPwErr] = useState('');
    const [pwLoading, setPwLoading] = useState(false);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setProfileMsg('');
        setProfileErr('');
        setProfileLoading(true);

        try {
            await updateProfile({ name, dob: dob || null });
            await refreshUser();
            setProfileMsg('Profile updated successfully!');
        } catch (err) {
            setProfileErr(err.response?.data?.detail || 'Failed to update profile.');
        } finally {
            setProfileLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPwMsg('');
        setPwErr('');

        if (newPw.length < 6) {
            setPwErr('New password must be at least 6 characters.');
            return;
        }

        setPwLoading(true);
        try {
            await changePassword(oldPw, newPw);
            setPwMsg('Password changed successfully!');
            setOldPw('');
            setNewPw('');
        } catch (err) {
            setPwErr(err.response?.data?.detail || 'Failed to change password.');
        } finally {
            setPwLoading(false);
        }
    };

    return (
        <div className="page-wrapper">
            <div className="page-content-narrow">
                {/* ────── Header ────── */}
                <div className="animate-fade-in-up" style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.375rem' }}>My Profile</h1>
                    <p style={{ color: '#94a3b8' }}>
                        Manage your personal information and account security.
                    </p>
                </div>

                {/* ────── User Info Card ────── */}
                <div
                    className="glass-card animate-fade-in-up"
                    style={{ padding: '2rem', marginBottom: '1.5rem' }}
                >
                    {/* Avatar Row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem' }}>
                        <div
                            style={{
                                width: '4rem',
                                height: '4rem',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                color: 'white',
                                background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                                flexShrink: 0,
                            }}
                        >
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: '0.125rem' }}>
                                {user?.name}
                            </h2>
                            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.375rem' }}>
                                {user?.email}
                            </p>
                            <span
                                style={{
                                    display: 'inline-block',
                                    fontSize: '0.6875rem',
                                    fontWeight: 600,
                                    background: 'rgba(99,102,241,0.12)',
                                    color: '#a5b4fc',
                                    padding: '0.2rem 0.625rem',
                                    borderRadius: '0.375rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.06em',
                                }}
                            >
                                {user?.role || 'user'}
                            </span>
                        </div>
                    </div>

                    {/* Edit Profile Form */}
                    <h3 className="section-title">Edit Profile</h3>

                    {profileMsg && <div className="alert-success" style={{ marginBottom: '1.25rem' }}>{profileMsg}</div>}
                    {profileErr && <div className="alert-error" style={{ marginBottom: '1.25rem' }}>{profileErr}</div>}

                    <form onSubmit={handleProfileUpdate}>
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label className="label" htmlFor="prof-name">Full Name</label>
                            <input
                                id="prof-name"
                                type="text"
                                className="input-field"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div style={{ marginBottom: '1.25rem' }}>
                            <label className="label" htmlFor="prof-dob">Date of Birth</label>
                            <input
                                id="prof-dob"
                                type="date"
                                className="input-field"
                                value={dob}
                                onChange={(e) => setDob(e.target.value)}
                            />
                        </div>

                        <div style={{ marginBottom: '1.75rem' }}>
                            <label className="label">Email</label>
                            <input type="email" className="input-field" value={user?.email || ''} disabled />
                            <p style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.5rem' }}>
                                Email cannot be changed.
                            </p>
                        </div>

                        <button type="submit" className="btn-primary" disabled={profileLoading}>
                            {profileLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>
                </div>

                {/* ────── Change Password ────── */}
                <div
                    className="glass-card animate-fade-in-up-delay"
                    style={{ padding: '2rem' }}
                >
                    <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        🔐 Change Password
                    </h3>

                    {pwMsg && <div className="alert-success" style={{ marginBottom: '1.25rem' }}>{pwMsg}</div>}
                    {pwErr && <div className="alert-error" style={{ marginBottom: '1.25rem' }}>{pwErr}</div>}

                    <form onSubmit={handlePasswordChange}>
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label className="label" htmlFor="old-pw">Current Password</label>
                            <input
                                id="old-pw"
                                type="password"
                                className="input-field"
                                placeholder="Enter current password"
                                value={oldPw}
                                onChange={(e) => setOldPw(e.target.value)}
                                required
                            />
                        </div>

                        <div style={{ marginBottom: '1.75rem' }}>
                            <label className="label" htmlFor="new-pw">New Password</label>
                            <input
                                id="new-pw"
                                type="password"
                                className="input-field"
                                placeholder="Enter new password"
                                value={newPw}
                                onChange={(e) => setNewPw(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>

                        <button type="submit" className="btn-primary" disabled={pwLoading}>
                            {pwLoading ? 'Changing...' : 'Change Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
