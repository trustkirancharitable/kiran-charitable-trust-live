import { Link } from 'react-router-dom'
import { FaHome, FaHeart, FaUsers, FaPhone } from 'react-icons/fa'
import './NotFound.css'

export default function NotFound() {
    return (
        <div className="notfound-page">
            <div className="notfound-content">
                <div className="notfound-number">404</div>
                <div className="notfound-icon"><FaHeart /></div>
                <h1>Page Not Found</h1>
                <p>
                    Oops! The page you are looking for doesn't exist or has been moved.
                    But don't worry — there's plenty of good work to explore on our site.
                </p>
                <div className="notfound-links">
                    <Link to="/" className="btn btn-primary"><FaHome /> Go to Home</Link>
                    <Link to="/donate" className="btn btn-outline"><FaHeart /> Make a Donation</Link>
                    <Link to="/portal/members" className="btn btn-outline"><FaUsers /> Trust Members</Link>
                    <Link to="/contact" className="btn btn-outline"><FaPhone /> Contact Us</Link>
                </div>
            </div>
        </div>
    )
}
