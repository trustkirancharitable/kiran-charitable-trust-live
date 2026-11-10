import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import { AuthProvider } from './context/AuthContext'
import AuthModal from './components/AuthModal'
import Header from './components/Header'
import HeaderOnly from './pages/HeaderOnly'
import Footer from './components/Footer'
import WhatsAppFloat from './components/WhatsAppFloat'
import Home from './pages/Home'
import About from './pages/About'
import FounderDesk from './pages/FounderDesk'
import Activities from './pages/Activities'
import Gallery from './pages/Gallery'
import Volunteers from './pages/Volunteers'
import TrustMemberRegister from './pages/TrustMemberRegister'
import TrustMembership from './pages/TrustMembership'
import PortalLayout from './pages/portal/PortalLayout'
import PortalHome from './pages/portal/PortalHome'
import PortalJoin from './pages/portal/PortalJoin'
import PortalMembers from './pages/portal/PortalMembers'
import PortalDonors from './pages/portal/PortalDonors'
import PortalStats from './pages/portal/PortalStats'
import PortalMonthlyDonor from './pages/portal/PortalMonthlyDonor'
import PortalLogin from './pages/portal/PortalLogin'
import PortalSignup from './pages/portal/PortalSignup'
import PortalForgotPassword from './pages/portal/PortalForgotPassword'
import PortalProfile from './pages/portal/PortalProfile'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import Donate from './pages/Donate'
import TrustMembers from './pages/TrustMembers'
import DonorsLeaderboard from './pages/DonorsLeaderboard'
import Contact from './pages/Contact'
import MainLogin from './pages/MainLogin'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsConditions from './pages/TermsConditions'
import NotFound from './pages/NotFound'
import ScrollToTop from './components/ScrollToTop'
import SEOManager from './components/SEOManager'
import CauseEducation from './pages/CauseEducation'
import CauseHealthcare from './pages/CauseHealthcare'
import CauseFoodDistribution from './pages/CauseFoodDistribution'
import CauseWomenEmpowerment from './pages/CauseWomenEmpowerment'
import CauseSeniorCitizens from './pages/CauseSeniorCitizens'
import CauseDisasterRelief from './pages/CauseDisasterRelief'
import CauseBloodDonation from './pages/CauseBloodDonation'
import CauseAnimalWelfare from './pages/CauseAnimalWelfare'

// Layout wrapper for main site pages (with Header/Footer)
function MainLayout({ children }) {
  return (
    <>
      <Header />
      <AuthModal />
      <main>{children}</main>
      <Footer />
      <WhatsAppFloat />
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <SEOManager />
        <Routes>
          {/* ── Standalone Enterprise Administration Portal (Separate Layout) ── */}
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/*" element={<Admin />} />

          {/* ── Standalone Trust Member & Donor Portal (Completely Separate Layout) ── */}
          <Route path="/portal" element={<PortalLayout />}>
            <Route index element={<PortalProfile />} />
            <Route path="overview" element={<PortalHome />} />
            <Route path="join" element={<PortalJoin />} />
            <Route path="become-a-member" element={<PortalJoin />} />
            <Route path="members" element={<PortalMembers />} />
            <Route path="trust-members" element={<PortalMembers />} />
            <Route path="donors" element={<PortalDonors />} />
            <Route path="top-donors" element={<PortalDonors />} />
            <Route path="stats" element={<PortalStats />} />
            <Route path="impact" element={<PortalStats />} />
            <Route path="dashboard" element={<PortalProfile />} />
            <Route path="profile" element={<PortalProfile />} />
            <Route path="monthly-donor" element={<PortalMonthlyDonor />} />
            <Route path="subscribe" element={<PortalMonthlyDonor />} />
            <Route path="login" element={<PortalLogin />} />
            <Route path="signin" element={<PortalLogin />} />
            <Route path="signup" element={<PortalSignup />} />
            <Route path="register" element={<PortalSignup />} />
            <Route path="forgot-password" element={<PortalForgotPassword />} />
          </Route>
          <Route path="/portal/*" element={<Navigate to="/portal/profile" replace />} />

          {/* ── Main Website System: 100% Unified (Same Header, Same Footer, Same Website) ── */}
          <Route path="/*" element={
            <MainLayout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/founder-desk" element={<FounderDesk />} />
                <Route path="/activities" element={<Activities />} />
                <Route path="/gallery" element={<Gallery />} />

                {/* Volunteer Registration & Careers (Public Website) */}
                <Route path="/volunteers" element={<Volunteers />} />
                <Route path="/register/volunteer" element={<Volunteers />} />
                <Route path="/careers" element={<Volunteers />} />

                {/* Public Trust Members & Public Membership Pages */}
                <Route path="/trust-members" element={<TrustMembers />} />
                <Route path="/members" element={<TrustMembers />} />
                <Route path="/trust-membership" element={<TrustMembership />} />
                <Route path="/register/trust-member" element={<TrustMemberRegister />} />
                <Route path="/monthly-donor" element={<TrustMembership />} />
                <Route path="/subscribe" element={<TrustMembership />} />

                {/* Official Main Website Login & Registration (Full Header & Footer) */}
                <Route path="/login" element={<MainLogin />} />
                <Route path="/signin" element={<MainLogin />} />
                <Route path="/register" element={<MainLogin />} />
                <Route path="/join" element={<MainLogin />} />

                {/* User Dashboard & Profile redirects into Member Portal */}
                <Route path="/dashboard" element={<Navigate to="/portal/profile" replace />} />
                <Route path="/profile" element={<Navigate to="/portal/profile" replace />} />
                <Route path="/account" element={<Navigate to="/portal/profile" replace />} />

                {/* Public Donations & Public Leaderboard */}
                <Route path="/donate" element={<Donate />} />
                <Route path="/support" element={<Donate />} />
                <Route path="/donors" element={<DonorsLeaderboard />} />
                <Route path="/donors-leaderboard" element={<DonorsLeaderboard />} />
                <Route path="/leaderboard" element={<DonorsLeaderboard />} />
                <Route path="/top-donors" element={<DonorsLeaderboard />} />
                <Route path="/contact" element={<Contact />} />

                {/* Legal & Compliance Policies (Google OAuth & Public Verification) */}
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms-conditions" element={<TermsConditions />} />
                <Route path="/terms-of-service" element={<TermsConditions />} />
                <Route path="/terms" element={<TermsConditions />} />

                {/* Cause pages */}
                <Route path="/causes/education" element={<CauseEducation />} />
                <Route path="/causes/healthcare" element={<CauseHealthcare />} />
                <Route path="/causes/food-distribution" element={<CauseFoodDistribution />} />
                <Route path="/causes/women-empowerment" element={<CauseWomenEmpowerment />} />
                <Route path="/causes/senior-citizens" element={<CauseSeniorCitizens />} />
                <Route path="/causes/disaster-relief" element={<CauseDisasterRelief />} />
                <Route path="/causes/blood-donation" element={<CauseBloodDonation />} />
                <Route path="/causes/animal-welfare" element={<CauseAnimalWelfare />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </MainLayout>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
