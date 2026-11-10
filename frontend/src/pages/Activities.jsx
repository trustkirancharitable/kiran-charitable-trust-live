import { FaHeart, FaGraduationCap, FaStethoscope, FaUtensils, FaFemale, FaHandsHelping, FaTint, FaPaw, FaUserFriends, FaArrowRight, FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import './Activities.css'

const activitiesList = [
    {
        icon: <FaGraduationCap />,
        color: 'var(--primary)',
        title: 'Education Support',
        tag: 'Education',
        date: 'Ongoing — 2024',
        location: 'Guntur & Palnadu, Andhra Pradesh',
        desc: 'We believe education is the most powerful tool for change. Our education program provides scholarships, school supplies, books, uniforms, and tuition support to underprivileged children from Class 1 to Graduation. We have supported over 1000 students so far.',
        highlights: ['Scholarships for 100+ students annually', 'Free stationery & school kits', 'Evening coaching classes', 'Computer literacy programs'],
    },
    {
        icon: <FaStethoscope />,
        color: '#E74C3C',
        title: 'Free Medical Camps',
        tag: 'Healthcare',
        date: 'Every Quarter',
        location: 'Rural & Urban Areas',
        desc: 'Our free medical camps bring qualified doctors, medicines, and diagnostic equipment directly to communities that cannot afford healthcare. We have conducted 120+ camps serving thousands with specialized care.',
        highlights: ['Free OPD with specialist doctors', 'Free medicines & diagnostics', 'Eye check-up & spectacles', 'Dental camps & awareness'],
    },
    {
        icon: <FaUtensils />,
        color: '#27AE60',
        title: 'Food Distribution',
        tag: 'Food Security',
        date: 'Weekly',
        location: 'Guntur, Palnadu & Rural Areas',
        desc: 'No one should sleep hungry. Our weekly food distribution program provides nutritious meals and dry ration packets to homeless individuals, daily wage workers, and disaster-affected families.',
        highlights: ['500+ meals distributed weekly', 'Monthly ration kits for 200 families', 'School mid-day meal support', 'Festival special distribution'],
    },
    {
        icon: <FaFemale />,
        color: '#9B59B6',
        title: 'Women Empowerment',
        tag: 'Women',
        date: 'Monthly Programs',
        location: 'Guntur, Palnadu & Towns',
        desc: 'We run skill development workshops, self-help groups, and awareness campaigns to empower women financially, socially, and mentally. We help them become self-reliant entrepreneurs.',
        highlights: ['Stitching & tailoring classes', 'Self-help group formation', 'Legal rights awareness', 'Micro-finance assistance'],
    },
    {
        icon: <FaHandsHelping />,
        color: '#E67E22',
        title: 'Disaster Relief',
        tag: 'Relief',
        date: 'As Required',
        location: 'Andhra Pradesh',
        desc: 'In times of floods, droughts, or pandemics, Kiran Trust mobilizes rapidly to provide emergency relief including dry rations, medicines, clothes, and temporary shelter support.',
        highlights: ['Emergency food & water kits', 'Medical aid deployment', 'Rehabilitation support', 'Psychological first aid'],
    },
    {
        icon: <FaTint />,
        color: '#C0392B',
        title: 'Blood Donation Camp',
        tag: 'Healthcare',
        date: 'Bi-Annually',
        location: 'Guntur & Palnadu',
        desc: 'We organize large-scale blood donation drives in partnership with hospitals, promoting voluntary blood donation to ensure adequate blood supply for emergencies and surgeries.',
        highlights: ['150+ units collected per camp', 'Hospital partnerships', 'Donor health screening', 'Blood group awareness'],
    },
    {
        icon: <FaPaw />,
        color: '#16A085',
        title: 'Animal Welfare',
        tag: 'Animals',
        date: 'Weekly',
        location: 'Guntur & Palnadu Districts',
        desc: 'Our team rescues and rehabilitates injured and stray animals, providing veterinary care, food, and shelter. We also run awareness campaigns about responsible pet ownership and animal rights.',
        highlights: ['Street animal feeding daily', 'Veterinary care & rescue', 'Adoption drives', 'Anti-cruelty awareness'],
    },
    {
        icon: <FaUserFriends />,
        color: '#D97706',
        title: 'Old Age Support',
        tag: 'Senior Citizens',
        date: 'Monthly',
        location: 'Guntur & Palnadu',
        desc: 'We visit old age homes and families with senior citizens bringing companionship, gifts, and medical support. We also help connect isolated elders with family and community.',
        highlights: ['Monthly old age home visits', 'Free medicines for seniors', 'Emotional support sessions', 'Festive celebrations'],
    },
]

export default function Activities() {
    return (
        <div className="activities-page">
            <div className="page-banner">
                <div className="banner-circles" />
                <div className="container">
                    <h1>Our Activities</h1>
                    <p className="breadcrumb"><span>Home / </span>Our Activities</p>
                </div>
            </div>

            <section className="section-padding">
                <div className="container">
                    <div className="section-title">
                        <p className="tagline">What We Do</p>
                        <h2>Programs & Initiatives</h2>
                        <p>Comprehensive programs addressing the most critical needs of our society</p>
                        <div className="title-underline"><span /><span /><span /></div>
                    </div>

                    <div className="activities-full-list">
                        {activitiesList.map((act, i) => (
                            <div key={i} className={`activity-item ${i % 2 === 1 ? 'reverse' : ''}`}>
                                <div className="activity-item-visual" style={{ background: act.color + '10', borderColor: act.color + '30' }}>
                                    <div className="act-icon-large" style={{ background: act.color + '15', color: act.color }}>
                                        {act.icon}
                                    </div>
                                    <div className="act-meta">
                                        <span className="act-tag" style={{ background: act.color + '20', color: act.color }}>
                                            {act.tag}
                                        </span>
                                        <div className="act-meta-row">
                                            <FaCalendarAlt style={{ color: act.color }} />
                                            <span>{act.date}</span>
                                        </div>
                                        <div className="act-meta-row">
                                            <FaMapMarkerAlt style={{ color: act.color }} />
                                            <span>{act.location}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="activity-item-content">
                                    <h2 style={{ color: 'var(--text-dark)', marginBottom: 12 }}>{act.title}</h2>
                                    <p style={{ color: 'var(--text-gray)', lineHeight: 1.8, marginBottom: 20 }}>{act.desc}</p>
                                    <ul className="act-highlights">
                                        {act.highlights.map((h, j) => (
                                            <li key={j} style={{ '--hl-color': act.color }}>
                                                <span className="hl-dot" style={{ background: act.color }} />
                                                {h}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ textAlign: 'center', marginTop: 60 }}>
                        <p style={{ color: 'var(--text-gray)', fontSize: 17, marginBottom: 24 }}>
                            Want to get involved in any of these activities?
                        </p>
                        <Link to="/login?tab=register" className="btn btn-primary">
                            <FaHeart /> Join as a Member <FaArrowRight />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    )
}
