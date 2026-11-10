import { FaQuoteLeft, FaHeart, FaUsers, FaPlay } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import FounderImg from '../assets/Pallepogu Kiranbabu Chairman.jpeg'
import './FounderDesk.css'

const youtubeVideos = [
    {
        id: 'TqhNILVX8IE',
        url: 'https://www.youtube.com/embed/TqhNILVX8IE',
        title: 'Kiran Charitable Trust - Our Journey'
    },
    {
        id: 'gP6p7_Sd3MU',
        url: 'https://www.youtube.com/embed/gP6p7_Sd3MU',
        title: 'Making a Difference in Communities'
    },
    {
        id: '6Oix9n4vEUk',
        url: 'https://www.youtube.com/embed/6Oix9n4vEUk',
        title: 'Our Impact Stories'
    },
]

export default function FounderDesk() {
    return (
        <div className="founder-page">
            <div className="page-banner">
                <div className="banner-circles" />
                <div className="container">
                    <h1>Founder's Desk</h1>
                    <p className="breadcrumb"><span>Home / </span>Founder Desk</p>
                </div>
            </div>

            <section className="founder-section section-padding">
                <div className="container">
                    <div className="founder-grid">
                        {/* Founder Image */}
                        <div className="founder-image-col">
                            <div className="founder-img-wrapper">
                                <div className="founder-photo-container">
                                    <img src={FounderImg} alt="Pallepogu Kiranbabu - Founder & Chairman" className="founder-photo" />
                                    <div className="founder-img-badge">
                                        <FaHeart />
                                    </div>
                                </div>
                            </div>
                            <div className="founder-info-card">
                                <h3>Pallepogu Kiranbabu</h3>
                                <p className="founder-designation">Founder & Chairman</p>
                                <p className="founder-tagline">Kiran Charitable Trust</p>
                                <div className="founder-credentials">
                                    <span>Active Social Reformer</span>
                                    <span>•</span>
                                    <span>Est. 2026</span>
                                </div>
                            </div>
                        </div>

                        {/* Founder Message */}
                        <div className="founder-message-col">
                            <div className="founder-quote-icon"><FaQuoteLeft /></div>
                            <p className="founder-label">A Message From</p>
                            <h2>The Founder's Desk</h2>

                            <div className="founder-message-text">
                                <p>
                                    Dear Friends and Well-Wishers,
                                </p>
                                <p>
                                    When I started Kiran Charitable Trust in 2026, it was not just an organization — it was
                                    a dream. A dream of a society where no child goes to bed hungry, where no family is denied
                                    basic healthcare, and where women are empowered to lead dignified, independent lives.
                                </p>
                                <p>
                                    Since our establishment, that dream has been nurtured by generous donors,
                                    passionate volunteers, and incredible partners who believed in our cause. Together, we
                                    have touched over 500+ lives in our initial drives — and this is only the beginning.
                                </p>
                                <p>
                                    Every rupee you donate, every hour a volunteer gives, and every kind word from our
                                    beneficiaries fuels our mission. I am deeply humbled by the trust you place in us and
                                    committed to ensuring every contribution creates meaningful, lasting change.
                                </p>
                                <p>
                                    Our work is guided by three principles: <strong>compassion, transparency, and impact</strong>.
                                    We believe in showing you exactly how your generosity transforms lives — through stories,
                                    data, and direct engagement with our community.
                                </p>
                                <p>
                                    As we move forward, I invite you to join us — as a donor, a volunteer, or simply a
                                    supporter. Together, we can make India a more equitable, compassionate society for all.
                                </p>
                                <p style={{ marginTop: 24 }}>
                                    With warmth and gratitude,
                                </p>
                            </div>

                            {/* Signature */}
                            <div className="founder-signature">
                                <div className="signature-text">Pallepogu Kiranbabu</div>
                                <p className="signature-role">Founder & Chairman, Kiran Charitable Trust</p>
                            </div>
                        </div>
                    </div>

                    {/* Quote Section */}
                    <div className="founder-quote-section">
                        <FaQuoteLeft className="big-quote" />
                        <blockquote>
                            "The measure of a life is not in how much we earn, but in how much we give —
                            not in the possessions we accumulate, but in the hearts we heal."
                        </blockquote>
                        <cite>— Pallepogu Kiranbabu</cite>
                    </div>

                    {/* YouTube Videos Section */}
                    <div className="founder-videos-section">
                        <div className="section-title">
                            <p className="tagline"><FaPlay style={{ fontSize: 12, marginRight: 6 }} /> Watch Our Story</p>
                            <h2>Videos From Our Journey</h2>
                            <div className="title-underline"><span /><span /><span /></div>
                        </div>
                        <div className="videos-grid">
                            {youtubeVideos.map((video, i) => (
                                <div key={i} className="video-card">
                                    <div className="video-iframe-wrap">
                                        <iframe
                                            src={video.url}
                                            title={video.title}
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                            referrerPolicy="strict-origin-when-cross-origin"
                                            allowFullScreen
                                        />
                                    </div>
                                    <div className="video-card-info">
                                        <h4>{video.title}</h4>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="founder-stats-row">
                        {[
                            { num: '500+', label: 'Lives Touched' },
                            { num: '2026', label: 'Year Launched' },
                            { num: '50+', label: 'Volunteers Joined' },
                            { num: '12+', label: 'Programs Conducted' },
                        ].map((s, i) => (
                            <div key={i} className="founder-stat">
                                <span className="founder-stat-num gradient-text">{s.num}</span>
                                <span className="founder-stat-lbl">{s.label}</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ textAlign: 'center', marginTop: 50 }}>
                        <Link to="/donate" className="btn btn-primary" style={{ marginRight: 16 }}>
                            <FaHeart /> Support the Mission
                        </Link>
                        <Link to="/login?tab=register" className="btn btn-outline">
                            <FaUsers /> Join as a Member
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    )
}
