import { FaHeart, FaGraduationCap, FaStethoscope, FaUsers, FaLeaf, FaHome, FaTint, FaFemale, FaHandshake, FaStar, FaFistRaised, FaGlobeAmericas } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import './About.css'
import ChairmanImg from '../assets/Pallepogu Kiranbabu Chairman.jpeg'
import TreasurerImg from '../assets/Srungarapati Rakesh Treasurer.jpeg'
import ViceChairmanImg from '../assets/Konda Ravi Teja Vice Chairman.png'
import ExecutiveImg from '../assets/Konda Ravi Bharath Executive.png'
import Logo12A from '../assets/compliance_logos/logo_12a.png'
import Logo80G from '../assets/compliance_logos/logo_80g.png'
import LogoDarpan from '../assets/compliance_logos/logo_darpan.png'
import LogoTrustDeed from '../assets/compliance_logos/logo_trust_deed.png'
import LogoPan from '../assets/compliance_logos/pan_card_preview.png'

const timeline = [
    { year: 'Jan 2026', title: 'Foundation', desc: 'Kiran Charitable Trust was established in Guntur & Palnadu districts, Andhra Pradesh, with a mission to serve humanity.' },
    { year: 'Mar 2026', title: 'First Medical Camp', desc: 'Successfully organized our first free medical diagnostics camp serving 200+ patients in rural areas.' },
    { year: 'May 2026', title: 'Education Launch', desc: 'Initiated our scholarship program supporting underprivileged kids with school stationery and tuition fees.' },
    { year: 'Jun 2026', title: '80G & 12A Status', desc: 'Achieved legal tax exemption registrations, ensuring trust, transparency and donor confidence.' },
    { year: 'Jul 2026', title: 'Disaster Support', desc: 'Distributed critical relief packages and immediate food assistance during seasonal flooding.' },
    { year: 'Ongoing', title: 'Community Growth', desc: 'Expanding outreach with new volunteering chapters and ongoing localized medical drives.' },
]

const objectives = [
    { icon: <FaGraduationCap />, title: 'Education', desc: 'Providing quality education and scholarships to underprivileged children and youth.', color: 'var(--primary)' },
    { icon: <FaStethoscope />, title: 'Health', desc: 'Organizing free medical camps and health awareness programs in underserved communities.', color: '#E74C3C' },
    { icon: <FaFemale />, title: 'Women Empowerment', desc: 'Enabling women through skill training, self-help groups and entrepreneurship support.', color: '#9B59B6' },
    { icon: <FaUsers />, title: 'Children Welfare', desc: 'Protecting children from child labor and ensuring access to nutrition and education.', color: 'var(--primary-light)' },
    { icon: <FaLeaf />, title: 'Environment', desc: 'Tree plantation drives, water conservation, and eco-awareness campaigns.', color: '#27AE60' },
    { icon: <FaHome />, title: 'Social Welfare', desc: 'Disaster relief, old age support, and housing assistance for the most vulnerable.', color: '#E67E22' },
]

const coreValues = [
    { icon: <FaHandshake />, title: 'Compassion', desc: 'We lead with empathy in everything we do.', color: 'var(--primary)' },
    { icon: <FaStar />, title: 'Transparency', desc: 'Full accountability in utilization of funds.', color: '#F59E0B' },
    { icon: <FaFistRaised />, title: 'Integrity', desc: 'Honest, ethical and principled conduct.', color: '#8B5CF6' },
    { icon: <FaGlobeAmericas />, title: 'Inclusivity', desc: 'Serving all regardless of caste, creed or religion.', color: '#3B82F6' },
]

export default function About() {
    return (
        <div className="about-page">
            {/* Banner */}
            <div className="page-banner">
                <div className="banner-circles" />
                <div className="container">
                    <h1>About Kiran Charitable Trust</h1>
                    <p className="breadcrumb">
                        <span>Home / </span>About Us
                    </p>
                </div>
            </div>

            {/* Founder Section */}
            <section className="section-padding" style={{ paddingBottom: 0 }}>
                <div className="container">
                    <div className="chairman-dedicated-block">
                        <div className="chairman-img-col">
                            <div className="chairman-img-card">
                                <img src={ChairmanImg} alt="Pallepogu Kiranbabu - Founder & Chairman" className="chairman-img-real" />
                                <div className="chairman-img-badge">
                                    <FaHeart />
                                </div>
                            </div>
                        </div>
                        <div className="chairman-content-col">
                            <span className="chairman-badge">Founder & Chairman</span>
                            <h2>Pallepogu Kiranbabu</h2>
                            <p className="chairman-quote">
                                "Our mission is to bridge the socioeconomic divides by enabling the youth and supporting regional families with direct healthcare, education services, and disaster response."
                            </p>
                            <div className="chairman-details">
                                <p>
                                    As the founding Chairman of Kiran Charitable Trust, Pallepogu Kiranbabu leads the conceptualization and field administration of all public welfare projects. He coordinates all board members, monitors structural accountability, and helps drive the trust's long term vision for regional rural upliftment in Amaravathi and neighboring community districts.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* History Section */}
            <section className="section-padding">
                <div className="container">
                    <div className="about-intro-grid">
                        <div>
                            <p className="tagline-label">Our History</p>
                            <h2 className="section-h2">A Journey of<br /><span className="gradient-text">Compassion & Service</span></h2>
                            <p style={{ color: 'var(--text-gray)', lineHeight: 1.8, marginBottom: 16 }}>
                                Kiran Charitable Trust was founded in 2026 by Pallepogu Kiranbabu (Chairman) and a group of passionately committed social workers
                                who believed that systematic change was possible through community-driven action. Starting with
                                energetic initial campaigns, the Trust is actively working to touch thousands of lives.
                            </p>
                            <p style={{ color: 'var(--text-gray)', lineHeight: 1.8, marginBottom: 16 }}>
                                Registered under the Indian Trusts Act, 1882, we operate with complete legal compliance
                                and financial transparency. Every donation is documented and utilized as per donor intent with
                                regular audit reports published.
                            </p>
                            <p style={{ color: 'var(--text-gray)', lineHeight: 1.8 }}>
                                Today, Kiran stands as a symbol of collective hope — bringing together volunteers,
                                generous donors, and partner organizations to create lasting positive change.
                            </p>
                        </div>
                        <div className="about-stats-box">
                            <div className="about-stat">
                                <span className="about-stat-num gradient-text">500+</span>
                                <span className="about-stat-lbl">Lives Impacted</span>
                            </div>
                            <div className="about-stat">
                                <span className="about-stat-num gradient-text">50+</span>
                                <span className="about-stat-lbl">Active Volunteers</span>
                            </div>
                            <div className="about-stat">
                                <span className="about-stat-num gradient-text">10+</span>
                                <span className="about-stat-lbl">Medical Camps</span>
                            </div>
                            <div className="about-stat">
                                <span className="about-stat-num gradient-text">2026</span>
                                <span className="about-stat-lbl">Established</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Vision & Mission */}
            <section className="vm-section section-padding">
                <div className="container">
                    <div className="vm-big-grid">
                        <div className="vm-big-card vision-card">
                            <h3>Our Vision</h3>
                            <p>
                                A society where every individual, regardless of socioeconomic background, has access
                                to education, healthcare, and opportunities for a dignified life. We envision a
                                compassionate, inclusive, and self-reliant community free from poverty and discrimination.
                            </p>
                        </div>
                        <div className="vm-big-card mission-card">
                            <h3>Our Mission</h3>
                            <p>
                                To serve the underserved through organized, transparent, and impactful programs in
                                education, healthcare, women empowerment, food distribution, and social welfare —
                                while nurturing a culture of volunteerism and collective responsibility.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Board of Trustees Section */}
            <section className="leadership-section section-padding">
                <div className="container">
                    <div className="section-title">
                        <p className="tagline">Our Leadership</p>
                        <h2>Board of Trustees</h2>
                        <p>The dedicated minds steering our mission forward with governance and transparency</p>
                        <div className="title-underline"><span /><span /><span /></div>
                    </div>
                    <div className="leadership-grid">
                        <div className="leader-card card">
                            <div className="leader-img-wrap">
                                <img src={ViceChairmanImg} alt="Konda Ravi Teja - Vice Chairman" className="leader-img" />
                            </div>
                            <h3>Konda Ravi Teja</h3>
                            <p className="leader-title">Vice Chairman</p>
                            <p className="leader-desc">
                                Steering structural development, coordinating board decisions, and managing public outreach programs of the trust.
                            </p>
                        </div>
                        <div className="leader-card card">
                            <div className="leader-img-wrap">
                                <img src={TreasurerImg} alt="Srungarapati Rakesh - Treasurer" className="leader-img" />
                            </div>
                            <h3>Srungarapati Rakesh</h3>
                            <p className="leader-title">Treasurer</p>
                            <p className="leader-desc">
                                Overseeing financial management, accountability, compliance, and complete transparency in the distribution of resources.
                            </p>
                        </div>
                        <div className="leader-card card">
                            <div className="leader-img-wrap">
                                <img src={ExecutiveImg} alt="Konda Ravi Bharath - Executive Member" className="leader-img" />
                            </div>
                            <h3>Konda Ravi Bharath</h3>
                            <p className="leader-title">Executive Member</p>
                            <p className="leader-desc">
                                Supervising field execution, volunteer operations, and direct community distribution work across regions.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Values */}
            <section className="section-padding" style={{ background: 'var(--bg-light)' }}>
                <div className="container">
                    <div className="section-title">
                        <p className="tagline">What We Stand For</p>
                        <h2>Our Core Values</h2>
                        <div className="title-underline"><span /><span /><span /></div>
                    </div>
                    <div className="values-grid">
                        {coreValues.map((v, i) => (
                            <div key={i} className="value-card card">
                                <div className="value-icon-wrap" style={{ background: v.color + '15', color: v.color }}>
                                    {v.icon}
                                </div>
                                <h3>{v.title}</h3>
                                <p>{v.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Legal Documents & Registrations */}
            <section className="section-padding" style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
                <div className="container">
                    <div className="section-title">
                        <p className="tagline">Compliance & Governance</p>
                        <h2>Trust Legal Documents & Approvals</h2>
                        <p>Complete regulatory transparency. View or download our verified registration and tax exemption certificates.</p>
                        <div className="title-underline"><span /><span /><span /></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginTop: '30px' }}>
                        {/* 12A Registration */}
                        <div className="card" style={{ padding: '24px 20px', borderRadius: '14px', border: '1.5px solid #e2e8f0', background: '#ffffff', textAlign: 'center', boxShadow: '0 4px 14px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                                    <img src={Logo12A} alt="Income Tax Department 12A" style={{ maxHeight: '66px', maxWidth: '130px', objectFit: 'contain' }} />
                                </div>
                                <h4 style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>12A Registration</h4>
                                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>Provisional Registration Order u/s 332 (URN: <strong>AAGTK5575QE20261</strong>)</p>
                            </div>
                            <a href="/documents/12A-332(8).pdf" target="_blank" rel="noreferrer" className="btn btn-outline" style={{ fontSize: '13px', padding: '8px 16px' }}>
                                View 12A PDF
                            </a>
                        </div>

                        {/* 80G Tax Exemption */}
                        <div className="card" style={{ padding: '24px 20px', borderRadius: '14px', border: '1.5px solid #e2e8f0', background: '#ffffff', textAlign: 'center', boxShadow: '0 4px 14px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                                    <img src={Logo80G} alt="Income Tax Department 80G" style={{ maxHeight: '66px', maxWidth: '130px', objectFit: 'contain' }} />
                                </div>
                                <h4 style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>80G Tax Exemption</h4>
                                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>Income Tax Exemption Approval u/s 354 (URN: <strong>AAGTK5575QF20261</strong>)</p>
                            </div>
                            <a href="/documents/80G-354(4).pdf" target="_blank" rel="noreferrer" className="btn btn-outline" style={{ fontSize: '13px', padding: '8px 16px' }}>
                                View 80G PDF
                            </a>
                        </div>

                        {/* NGO DARPAN Registration */}
                        <div className="card" style={{ padding: '24px 20px', borderRadius: '14px', border: '1.5px solid #e2e8f0', background: '#ffffff', textAlign: 'center', boxShadow: '0 4px 14px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                                    <img src={LogoDarpan} alt="NITI Aayog NGO DARPAN" style={{ maxHeight: '66px', maxWidth: '140px', objectFit: 'contain' }} />
                                </div>
                                <h4 style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>NGO DARPAN Registration</h4>
                                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>NITI Aayog, Govt. of India (Unique ID: <strong>AP/2026/1134813</strong>)</p>
                            </div>
                            <a href="/documents/ngo_darpan_certificate.pdf" target="_blank" rel="noreferrer" className="btn btn-outline" style={{ fontSize: '13px', padding: '8px 16px' }}>
                                View DARPAN PDF
                            </a>
                        </div>

                        {/* Trust Deed Certificate */}
                        <div className="card" style={{ padding: '24px 20px', borderRadius: '14px', border: '1.5px solid #e2e8f0', background: '#ffffff', textAlign: 'center', boxShadow: '0 4px 14px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                                    <img src={LogoTrustDeed} alt="Govt of Andhra Pradesh Emblem" style={{ maxHeight: '66px', maxWidth: '130px', objectFit: 'contain' }} />
                                </div>
                                <h4 style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>Trust Deed Certificate</h4>
                                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>Registered under The Indian Trusts Act, 1882 (Govt. of AP)</p>
                            </div>
                            <a href="/documents/trust_deed.pdf" target="_blank" rel="noreferrer" className="btn btn-outline" style={{ fontSize: '13px', padding: '8px 16px' }}>
                                View Trust Deed PDF
                            </a>
                        </div>

                        {/* Trust PAN Card */}
                        <div className="card" style={{ padding: '24px 20px', borderRadius: '14px', border: '1.5px solid #e2e8f0', background: '#ffffff', textAlign: 'center', boxShadow: '0 4px 14px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                                    <img src={LogoPan} alt="Income Tax Trust PAN Card" style={{ maxHeight: '56px', maxWidth: '115px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }} />
                                </div>
                                <h4 style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>Trust PAN Card</h4>
                                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>Permanent Account Number: <strong>AAGTK5575Q</strong></p>
                            </div>
                            <a href="/documents/Trust_Pan_Card.pdf" target="_blank" rel="noreferrer" className="btn btn-outline" style={{ fontSize: '13px', padding: '8px 16px' }}>
                                View PAN Card
                            </a>
                        </div>


                    </div>
                </div>
            </section>

            {/* Timeline */}
            <section className="timeline-section section-padding">
                <div className="container">
                    <div className="section-title">
                        <p className="tagline">Our Journey</p>
                        <h2>Milestones & Achievements</h2>
                        <div className="title-underline"><span /><span /><span /></div>
                    </div>
                    <div className="timeline">
                        {timeline.map((item, i) => (
                            <div key={i} className={`timeline-item ${i % 2 === 0 ? 'left' : 'right'}`}>
                                <div className="timeline-dot"><FaHeart /></div>
                                <div className="timeline-content">
                                    <span className="timeline-year">{item.year}</span>
                                    <h3>{item.title}</h3>
                                    <p>{item.desc}</p>
                                </div>
                            </div>
                        ))}
                        <div className="timeline-line" />
                    </div>
                </div>
            </section>

            {/* Objectives */}
            <section className="section-padding" style={{ background: 'var(--bg-light)' }}>
                <div className="container">
                    <div className="section-title">
                        <p className="tagline">What We Aim For</p>
                        <h2>Our Objectives</h2>
                        <p>Focused areas where we channel our efforts to create maximum impact</p>
                        <div className="title-underline"><span /><span /><span /></div>
                    </div>
                    <div className="obj-grid">
                        {objectives.map((obj, i) => (
                            <div key={i} className="obj-card" style={{ '--obj-color': obj.color }}>
                                <div className="obj-icon" style={{ background: obj.color + '15', color: obj.color }}>
                                    {obj.icon}
                                </div>
                                <h3>{obj.title}</h3>
                                <p>{obj.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="about-cta">
                <div className="container" style={{ textAlign: 'center' }}>
                    <h2 style={{ color: 'white', marginBottom: 12 }}>Join Our Mission</h2>
                    <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 32 }}>
                        Be part of a movement that is changing lives, one act of kindness at a time.
                    </p>
                    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/donate" className="btn btn-primary" style={{ background: 'white', color: 'var(--primary)' }}>
                            <FaHeart /> Donate Now
                        </Link>
                        <Link to="/portal/join" className="btn btn-secondary">
                            <FaUsers /> Join as Member
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    )
}
