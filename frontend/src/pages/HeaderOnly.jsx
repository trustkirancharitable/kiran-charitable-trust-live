import { useState } from 'react';
import PortalHeader from '../components/PortalHeader';
import Header from '../components/Header';
import { FaCheckCircle, FaLaptopCode, FaExchangeAlt, FaShieldAlt, FaUserCircle } from 'react-icons/fa';

export default function HeaderOnly() {
    const [activeView, setActiveView] = useState('portal'); // 'portal' | 'main'

    return (
        <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
            {/* ── Render Header Only at the top ── */}
            {activeView === 'portal' ? <PortalHeader /> : <Header />}

            {/* ── Header Inspection / Standalone Playground Canvas ── */}
            <main style={{ flex: 1, padding: '140px 24px 60px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
                
                {/* Control Bar to Compare or Inspect */}
                <div style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: 16,
                    padding: '24px 28px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                    marginBottom: 32
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    background: '#DCFCE7',
                                    color: '#15803D',
                                    fontSize: 12,
                                    fontWeight: 800,
                                    padding: '4px 10px',
                                    borderRadius: 50,
                                    border: '1px solid #BBF7D0'
                                }}>
                                    <FaCheckCircle /> Standalone Route Active
                                </span>
                                <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>
                                    Header-Only Preview Route
                                </h1>
                            </div>
                            <p style={{ margin: '6px 0 0', color: '#64748B', fontSize: '14px' }}>
                                Exact header copied from the main website code &amp; CSS, featuring the user profile menu dropdown.
                            </p>
                        </div>

                        {/* Mode Switcher */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F1F5F9', padding: 4, borderRadius: 10 }}>
                            <button
                                type="button"
                                onClick={() => setActiveView('portal')}
                                style={{
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: 8,
                                    fontSize: '13.5px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    background: activeView === 'portal' ? '#FFFFFF' : 'transparent',
                                    color: activeView === 'portal' ? '#0F52BA' : '#64748B',
                                    boxShadow: activeView === 'portal' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
                                }}
                            >
                                Copied Header (With Profile Menu)
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveView('main')}
                                style={{
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: 8,
                                    fontSize: '13.5px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    background: activeView === 'main' ? '#FFFFFF' : 'transparent',
                                    color: activeView === 'main' ? '#0F52BA' : '#64748B',
                                    boxShadow: activeView === 'main' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
                                }}
                            >
                                Original Main Site Header
                            </button>
                        </div>
                    </div>
                </div>

                {/* Architecture & Verification Checklist Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 22px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <FaUserCircle style={{ color: '#2563EB', fontSize: 20 }} />
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
                                User Profile Dropdown Menu
                            </h3>
                        </div>
                        <ul style={{ margin: 0, paddingLeft: 20, color: '#475569', fontSize: '13.5px', lineHeight: 1.7 }}>
                            <li>Click the user avatar pill on the top right to open.</li>
                            <li>Displays User Name, Registered Email, and Member ID badge.</li>
                            <li>Direct navigation to <strong>Profile &amp; Settings</strong>.</li>
                            <li>Quick links to <strong>Impact Dashboard</strong> and <strong>Main Website</strong>.</li>
                            <li>Includes <strong>Admin Console</strong> link (for admin accounts).</li>
                            <li>Dedicated <strong>Sign Out</strong> button with instant session clearing.</li>
                        </ul>
                    </div>

                    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 22px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <FaLaptopCode style={{ color: '#059669', fontSize: 20 }} />
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
                                Same-to-Same CSS &amp; Layout
                            </h3>
                        </div>
                        <ul style={{ margin: 0, paddingLeft: 20, color: '#475569', fontSize: '13.5px', lineHeight: 1.7 }}>
                            <li>Original logo frame: <code>.logo-img-wrap</code> with K Logo.</li>
                            <li>Identical font families, weights, active pill highlight (<code>#EFF6FF</code> and <code>#0F52BA</code>).</li>
                            <li>Fixed / sticky positioning matching <code>.header</code> specifications.</li>
                            <li>Matching primary <strong>Donate Now</strong> action button on the far right.</li>
                        </ul>
                    </div>
                </div>

                {/* Direct Route Links */}
                <div style={{ marginTop: 24, padding: '16px 20px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, color: '#1E40AF', fontSize: '13.5px' }}>
                    <strong>Direct URL access:</strong> You can access this isolated header view directly at <a href="/header-only" style={{ color: '#1D4ED8', fontWeight: 700 }}>/header-only</a>, <a href="/header-preview" style={{ color: '#1D4ED8', fontWeight: 700 }}>/header-preview</a>, or <a href="/header" style={{ color: '#1D4ED8', fontWeight: 700 }}>/header</a>.
                </div>
            </main>
        </div>
    );
}
