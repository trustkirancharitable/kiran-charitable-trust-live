import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import {
    FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaBriefcase,
    FaCalendarAlt, FaHeart, FaUsers, FaStar, FaCertificate,
    FaNetworkWired, FaGraduationCap, FaCheckCircle, FaFileAlt,
    FaHandshake, FaUserTie
} from 'react-icons/fa'
import axios from 'axios'
import { API_BASE_URL } from '../config'
import './Volunteers.css'

const benefits = [
    { icon: <FaCertificate />, title: 'Incredible Experience', desc: 'Receive official recognition, and learn real leadership skills while working inside rural communities.', color: 'var(--primary)' },
    { icon: <FaHeart />, title: 'Direct Human Impact', desc: 'Touch real human lives in Guntur & Palnadu - see the immediate joy of child support and elder care.', color: 'var(--primary-dark)' },
    { icon: <FaNetworkWired />, title: 'Genuine Community', desc: 'Connect with 250+ passionate local citizens, medical experts, and social developers.', color: 'var(--primary-light)' },
    { icon: <FaGraduationCap />, title: 'Skill Development', desc: 'Gain true exposure to social action development, project management, and field health campaigns.', color: '#2563EB' },
]

const careersList = [
    {
        title: "Field Social Officer",
        type: "Full-Time (Paid Position)",
        location: "Guntur & Palnadu Office (On-site)",
        description: "Join our active support team facilitating daily grocery supply distribution, coordinating local medical diagnostics, and conducting rural school visits. Ideal for MSW/BSW graduates who love field action.",
    },
    {
        title: "Logistics & Store Coordinator",
        type: "Part-Time / Weekend (Paid Position)",
        location: "Guntur & Palnadu Hub (On-site)",
        description: "Manages safe storage, logging, and packaging of in-kind donations (e.g. food kits, notebooks, clothes) and ensures smooth handover to distribution teams.",
    },
    {
        title: "Social Media Storyteller Intern",
        type: "6-Months Internship (Stipend provided)",
        location: "Remote / Hybrid (Guntur & Palnadu)",
        description: "Document our daily achievements, photograph our charity camps, and write genuine, transparent stories of change. If you have a phone camera and love graphic stories, apply!",
    }
]

export default function Volunteers() {
    const [actionType, setActionType] = useState('volunteer') // 'volunteer' or 'career'
    const [submitted, setSubmitted] = useState(false)
    const { register, handleSubmit, formState: { errors }, reset } = useForm()

    const onSubmit = async (data) => {
        try {
            const payload = {
                volunteerType: actionType,
                ...data
            };
            const response = await axios.post(`${API_BASE_URL}/volunteers`, payload);
            if (response.data && response.data.success) {
                setSubmitted(true)
                reset()
                toast.success(response.data.message || 'Application received successfully!', {
                    position: 'top-center',
                    autoClose: 5000,
                })
            } else {
                toast.error(response.data.message || 'Error occurred while saving application.')
            }
        } catch (error) {
            console.error('Volunteer/Career Submit Error:', error);
            const msg = error.response?.data?.message || 'Server connection error. Please try again.';
            toast.error(msg);
        }
    }

    return (
        <div className="volunteers-page">
                        <div className="page-banner">
                <div className="banner-circles" />
                <div className="container">
                    <h1>Careers & Volunteering</h1>
                    <p className="breadcrumb"><span>Home / </span>Careers</p>
                </div>
            </div>

            {/* Benefits */}
            <section className="section-padding" style={{ background: 'var(--bg-light)' }}>
                <div className="container">
                    <div className="section-title">
                        <p className="tagline">Join Our Community</p>
                        <h2>Why Join Kiran Trust?</h2>
                        <p>Whether you volunteer your time on weekends or take up a professional career, you are making Guntur & Palnadu a better place!</p>
                        <div className="title-underline"><span /><span /><span /></div>
                    </div>
                    <div className="benefits-grid">
                        {benefits.map((b, i) => (
                            <div key={i} className="benefit-card card">
                                <div className="benefit-icon" style={{ background: b.color + '15', color: b.color }}>
                                    {b.icon}
                                </div>
                                <h3>{b.title}</h3>
                                <p>{b.desc}</p>
                                <div className="benefit-bottom-bar" style={{ background: b.color }} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Registration/Careers Section */}
            <section className="section-padding">
                <div className="container">
                    <div className="vol-form-grid">
                        {/* Info Panel / Careers list */}
                        <div className="vol-info-panel" style={{ height: 'fit-content' }}>
                            {actionType === 'volunteer' ? (
                                <>
                                    <h2>Why Volunteer With Us?</h2>
                                    <div className="vol-info-points">
                                        {[
                                            'Work directly with certified, transparent local builders',
                                            'Flexible time commitment — 2 hours a week makes a difference',
                                            'On-ground social experience in dry-ration camps',
                                            'Volunteer certificates and letter of recommendation',
                                            'Direct guidance under active social reformers',
                                            'Join a vibrant family of 250+ local changemakers',
                                        ].map((point, i) => (
                                            <div key={i} className="vol-info-point">
                                                <FaCheckCircle className="check-icon" />
                                                <span>{point}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="vol-info-stats">
                                        <div className="vol-info-stat">
                                            <span className="gradient-text">50+</span>
                                            <span>Active Volunteers</span>
                                        </div>
                                        <div className="vol-info-stat">
                                            <span className="gradient-text">2026</span>
                                            <span>Year Founded</span>
                                        </div>
                                    </div>
                                    <div className="vol-testimonial" style={{ marginTop: '20px' }}>
                                        <div style={{ display: 'flex', gap: '3px', marginBottom: '8px' }}>
                                            <FaStar style={{ color: '#FFD700' }} />
                                            <FaStar style={{ color: '#FFD700' }} />
                                            <FaStar style={{ color: '#FFD700' }} />
                                            <FaStar style={{ color: '#FFD700' }} />
                                            <FaStar style={{ color: '#FFD700' }} />
                                        </div>
                                        <p>"The joy of handing over books to children at Patamata school with Kiran team is pure happiness."</p>
                                        <span>— Priya Sharma, Volunteer since 2026</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h2>Active Job & Internship Openings</h2>
                                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginBottom: '20px' }}>
                                        We are a passionate team of local social builders. Apply below if you fit the positions:
                                    </p>
                                    <div className="careers-openings-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {careersList.map((job, idx) => (
                                            <div key={idx} style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '16px', borderRadius: '8px', borderLeft: '3px solid var(--accent)' }}>
                                                <h4 style={{ color: 'white', fontSize: '16px', marginBottom: '4px' }}>{job.title}</h4>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--accent)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>
                                                    <span>{job.type}</span>
                                                    <span>{job.location}</span>
                                                </div>
                                                <p style={{ fontSize: '12.5px', color: 'rgba(255, 255, 255, 0.85)', lineHeight: '1.5' }}>{job.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Form */}
                        <div className="vol-form-card">
                            <div className="vol-form-header">
                                <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-light)' }}>
                                    <button
                                        type="button"
                                        onClick={() => { setActionType('volunteer'); setSubmitted(false); }}
                                        style={{
                                            flex: 1,
                                            padding: '16px',
                                            fontSize: '14px',
                                            fontWeight: '700',
                                            border: 'none',
                                            background: actionType === 'volunteer' ? '#ffffff' : 'var(--bg-light)',
                                            color: actionType === 'volunteer' ? 'var(--primary)' : 'var(--text-gray)',
                                            borderBottom: actionType === 'volunteer' ? '3px solid var(--primary)' : 'none',
                                            cursor: 'pointer',
                                            fontFamily: 'Outfit, sans-serif'
                                        }}
                                    >
                                        Become a Volunteer
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setActionType('career'); setSubmitted(false); }}
                                        style={{
                                            flex: 1,
                                            padding: '16px',
                                            fontSize: '14px',
                                            fontWeight: '700',
                                            border: 'none',
                                            background: actionType === 'career' ? '#ffffff' : 'var(--bg-light)',
                                            color: actionType === 'career' ? 'var(--primary)' : 'var(--text-gray)',
                                            borderBottom: actionType === 'career' ? '3px solid var(--primary)' : 'none',
                                            cursor: 'pointer',
                                            fontFamily: 'Outfit, sans-serif'
                                        }}
                                    >
                                        Apply for Careers
                                    </button>
                                </div>
                                <div style={{ padding: '24px 28px', textAlign: 'center', background: 'var(--primary)', color: 'white' }}>
                                    <h3 style={{ fontSize: '22px', color: 'white', fontWeight: '800', marginBottom: '4px' }}>
                                        {actionType === 'volunteer' ? 'Volunteer Registration Form' : 'Job Application Form'}
                                    </h3>
                                    <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)' }}>
                                        {actionType === 'volunteer' ? 'Get started and be a ray of hope today' : 'Submit your profiling data below'}
                                    </p>
                                </div>
                            </div>

                            {submitted ? (
                                <div className="vol-success">
                                    <FaCheckCircle />
                                    <h3>{actionType === 'volunteer' ? 'Volunteer Registration Received!' : 'Application Successfully Submitted!'}</h3>
                                    <p>Thank you for connecting with us. Our coordinator team will reach out to you within 48 hours.</p>
                                    <button className="btn btn-primary" onClick={() => setSubmitted(false)} style={{ marginTop: 20 }}>
                                        Submit Another
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit(onSubmit)} className="vol-form" style={{ padding: '24px 28px 28px' }}>
                                    {actionType === 'career' && (
                                        <div className="form-group">
                                            <label htmlFor="career-position"><FaBriefcase /> Target Career Position *</label>
                                            <select
                                                id="career-position"
                                                className={errors.careerPosition ? 'input-error' : ''}
                                                {...register('careerPosition', { required: 'Please select target opening' })}
                                            >
                                                <option value="">Select target role</option>
                                                {careersList.map((job, idx) => (
                                                    <option key={idx} value={job.title}>{job.title}</option>
                                                ))}
                                                <option value="other-spec">Other / Unspecified Open Application / Internship Option</option>
                                            </select>
                                            {errors.careerPosition && <span className="error-msg">{errors.careerPosition.message}</span>}
                                        </div>
                                    )}

                                    <div className="form-row-2">
                                        <div className="form-group">
                                            <label htmlFor="vol-name"><FaUser /> Full Name *</label>
                                            <input
                                                id="vol-name"
                                                type="text"
                                                placeholder="Your full name"
                                                className={errors.name ? 'input-error' : ''}
                                                {...register('name', { required: 'Name is required' })}
                                            />
                                            {errors.name && <span className="error-msg">{errors.name.message}</span>}
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="vol-email"><FaEnvelope /> Email Address *</label>
                                            <input
                                                id="vol-email"
                                                type="email"
                                                placeholder="your@email.com"
                                                className={errors.email ? 'input-error' : ''}
                                                {...register('email', {
                                                    required: 'Email is required',
                                                    pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' }
                                                })}
                                            />
                                            {errors.email && <span className="error-msg">{errors.email.message}</span>}
                                        </div>
                                    </div>

                                    <div className="form-row-2">
                                        <div className="form-group">
                                            <label htmlFor="vol-phone"><FaPhone /> Phone Number (WhatsApp) *</label>
                                            <input
                                                id="vol-phone"
                                                type="tel"
                                                placeholder="+91 XXXXX XXXXX"
                                                className={errors.phone ? 'input-error' : ''}
                                                {...register('phone', { required: 'Phone is required' })}
                                            />
                                            {errors.phone && <span className="error-msg">{errors.phone.message}</span>}
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="vol-occupation"><FaBriefcase /> Current Profile / Occupation</label>
                                            <input
                                                id="vol-occupation"
                                                type="text"
                                                placeholder="e.g. Student, Consultant, Retired Specialist"
                                                {...register('occupation')}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="vol-address"><FaMapMarkerAlt /> City / Address Location</label>
                                        <input
                                            id="vol-address"
                                            type="text"
                                            placeholder="Your resident city (e.g. Guntur, Narasaraopet, Palnadu)"
                                            {...register('address')}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="vol-skills"><FaStar /> Key Skills / Experiences</label>
                                        <input
                                            id="vol-skills"
                                            type="text"
                                            placeholder="e.g., Teaching, Field Operations, Social Media, Health, Logistics"
                                            {...register('skills')}
                                        />
                                    </div>

                                    {actionType === 'volunteer' ? (
                                        <div className="form-group">
                                            <label htmlFor="vol-availability"><FaCalendarAlt /> Time Availability</label>
                                            <select id="vol-availability" {...register('availability')}>
                                                <option value="">Select your availability</option>
                                                <option value="weekends">Weekends (Saturday/Sunday)</option>
                                                <option value="weekdays">Weekdays (Mon-Fri)</option>
                                                <option value="flexible">Flexible / Dynamic Hours</option>
                                                <option value="remote">Remote / Digital Work</option>
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="form-group">
                                            <label htmlFor="career-resume"><FaFileAlt /> Paste Resume / CV text or LinkedIn Link *</label>
                                            <textarea
                                                id="career-resume"
                                                placeholder="Paste your brief summary, qualifications, previous internships, or link here..."
                                                rows={3}
                                                className={errors.resumeText ? 'input-error' : ''}
                                                {...register('resumeText', { required: 'Resume details or link is required' })}
                                            />
                                            {errors.resumeText && <span className="error-msg">{errors.resumeText.message}</span>}
                                        </div>
                                    )}

                                    <div className="form-group">
                                        <label htmlFor="vol-why"><FaHeart /> Tell us a bit about yourself & why you want to join us? *</label>
                                        <textarea
                                            id="vol-why"
                                            placeholder="Share what motivates you to work for the local community of Guntur and Palnadu districts..."
                                            rows={4}
                                            className={errors.why ? 'input-error' : ''}
                                            {...register('why', { required: 'Please share your motivation' })}
                                        />
                                        {errors.why && <span className="error-msg">{errors.why.message}</span>}
                                    </div>

                                    <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '16px' }}>
                                        {actionType === 'volunteer' ? (
                                            <>
                                                <FaUsers /> Register as a Volunteer
                                            </>
                                        ) : (
                                            <>
                                                <FaUserTie /> Submit Application
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
