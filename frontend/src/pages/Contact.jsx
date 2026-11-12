import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import {
    FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaTag,
    FaWhatsapp, FaClock, FaPaperPlane, FaCheckCircle
} from 'react-icons/fa'
import axios from 'axios'
import { API_BASE_URL } from '../config'
import './Contact.css'

export default function Contact() {
    const [submitted, setSubmitted] = useState(false)
    const { register, handleSubmit, formState: { errors }, reset } = useForm()

    const onSubmit = async (data) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/contact`, data);
            if (response.data && response.data.success) {
                setSubmitted(true)
                reset()
                toast.success(response.data.message || 'Message sent! We will reply within 24 hours.', { position: 'top-center' })
            } else {
                toast.error(response.data.message || 'Error occurred while saving your message.')
            }
        } catch (error) {
            console.error('Contact Form Submit Error:', error);
            const msg = error.response?.data?.message || 'Server connection error. Please try again.';
            toast.error(msg);
        }
    }

    return (
        <div className="contact-page">
                        <div className="page-banner">
                <div className="banner-circles" />
                <div className="container">
                    <h1>Contact Us</h1>
                    <p className="breadcrumb"><span>Home / </span>Contact</p>
                </div>
            </div>

            <section className="section-padding">
                <div className="container">
                    {/* Contact Cards */}
                    <div className="contact-cards-grid">
                        {[
                            {
                                icon: <FaPhone />, color: 'var(--primary)',
                                title: 'Phone',
                                lines: ['+91 77024 68889'],
                            },
                            {
                                icon: <FaWhatsapp />, color: '#25D366',
                                title: 'WhatsApp',
                                lines: ['+91 77024 68889'],
                                link: 'https://wa.me/917702468889',
                            },
                            {
                                icon: <FaEnvelope />, color: '#3498DB',
                                title: 'Email',
                                lines: ['contact@kirancharitabletrust.org'],
                            },
                            {
                                icon: <FaMapMarkerAlt />, color: '#9B59B6',
                                title: 'Address',
                                lines: ['Mandepudi, Nemalikallu, Amaravathi', 'Palnaadu, Guntur - 522018'],
                            },
                            {
                                icon: <FaClock />, color: '#E67E22',
                                title: 'Office Hours',
                                lines: ['Mon – Sat: 9:00 AM – 6:00 PM', 'Sunday: Closed'],
                            },
                        ].map((card, i) => (
                            <div key={i} className="contact-info-card" style={{ '--cc': card.color }}>
                                <div className="contact-info-icon" style={{ background: card.color + '15', color: card.color }}>
                                    {card.icon}
                                </div>
                                <h3>{card.title}</h3>
                                {card.lines.map((l, j) => (
                                    card.link
                                        ? <a key={j} href={card.link} target="_blank" rel="noreferrer" className="contact-info-line link">{l}</a>
                                        : <p key={j} className="contact-info-line">{l}</p>
                                ))}
                                <div className="contact-card-bar" style={{ background: card.color }} />
                            </div>
                        ))}
                    </div>

                    <div className="contact-main-grid">
                        {/* Form */}
                        <div className="contact-form-card">
                            <div className="contact-form-header">
                                <FaPaperPlane />
                                <h3>Send Us a Message</h3>
                                <p>We'll reply within 24 hours</p>
                            </div>
                            {submitted ? (
                                <div className="contact-success">
                                    <FaCheckCircle />
                                    <h3>Message Sent!</h3>
                                    <p>Thank you for reaching out. Our team will get back to you shortly.</p>
                                    <button className="btn btn-primary" onClick={() => setSubmitted(false)} style={{ marginTop: 16 }}>
                                        Send Another Message
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit(onSubmit)} className="contact-form">
                                    <div className="form-row-2">
                                        <div className="form-group">
                                            <label htmlFor="con-name"><FaUser /> Full Name *</label>
                                            <input
                                                id="con-name"
                                                type="text"
                                                placeholder="Your name"
                                                className={errors.name ? 'input-error' : ''}
                                                {...register('name', { required: 'Name is required' })}
                                            />
                                            {errors.name && <span className="error-msg">{errors.name.message}</span>}
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="con-phone"><FaPhone /> Phone Number</label>
                                            <input
                                                id="con-phone"
                                                type="tel"
                                                placeholder="+91 XXXXX XXXXX"
                                                {...register('phone')}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="con-email"><FaEnvelope /> Email Address *</label>
                                        <input
                                            id="con-email"
                                            type="email"
                                            placeholder="your@email.com"
                                            className={errors.email ? 'input-error' : ''}
                                            {...register('email', { required: 'Email is required' })}
                                        />
                                        {errors.email && <span className="error-msg">{errors.email.message}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="con-subject"><FaTag /> Subject *</label>
                                        <input
                                            id="con-subject"
                                            type="text"
                                            placeholder="What is this regarding?"
                                            className={errors.subject ? 'input-error' : ''}
                                            {...register('subject', { required: 'Subject is required' })}
                                        />
                                        {errors.subject && <span className="error-msg">{errors.subject.message}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="con-message">Message *</label>
                                        <textarea
                                            id="con-message"
                                            rows={5}
                                            placeholder="Write your message here..."
                                            className={errors.message ? 'input-error' : ''}
                                            {...register('message', { required: 'Message is required' })}
                                        />
                                        {errors.message && <span className="error-msg">{errors.message.message}</span>}
                                    </div>
                                    <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '16px' }}>
                                        <FaPaperPlane /> Send Message
                                    </button>
                                </form>
                            )}
                        </div>

                        {/* Map Embed */}
                        <div className="contact-map-col">
                            <div className="map-iframe-container" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow)', height: '360px', border: '1px solid var(--border)', marginBottom: 20 }}>
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3826.2052813698438!2d80.32896507514447!3d16.465139984272632!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMTbCsDI3JzU0LjUiTiA4MMKwMTknNTMuNSJF!5e0!3m2!1sen!2sin!4v1794430932626!5m2!1sen!2sin"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen=""
                                    loading="lazy"
                                    referrerPolicy="strict-origin-when-cross-origin"
                                ></iframe>
                            </div>
                            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                <a
                                    href="https://maps.app.goo.gl/m5hJfTRrYUkhGss97"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-primary"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <FaMapMarkerAlt /> Open in Google Maps
                                </a>
                            </div>
                            <div className="whatsapp-cta">
                                <FaWhatsapp className="wa-icon" />
                                <div>
                                    <h4>Chat on WhatsApp</h4>
                                    <p>Quick responses via WhatsApp</p>
                                </div>
                                <a
                                    href="https://wa.me/917702468889?text=Hello%20Kiran%20Charitable%20Trust"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn"
                                    style={{ background: '#25D366', color: 'white', borderRadius: '50px', padding: '12px 24px' }}
                                >
                                    Chat Now
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
