import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem('kct_user');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    });

    const [token, setToken] = useState(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            const urlToken = params.get('auth_token') || params.get('token');
            if (urlToken) {
                localStorage.setItem('kct_token', urlToken);
                return urlToken;
            }
        } catch (e) {}
        return localStorage.getItem('kct_token') || null;
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authModalTab, setAuthModalTab] = useState('login'); // 'login' | 'signup' | 'otp' | 'forgot'

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            localStorage.setItem('kct_token', token);
            if (!user) {
                refreshUser();
            }
        } else {
            delete axios.defaults.headers.common['Authorization'];
            localStorage.removeItem('kct_token');
        }
    }, [token]);

    useEffect(() => {
        if (user) {
            localStorage.setItem('kct_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('kct_user');
        }
    }, [user]);

    const openAuthModal = (tab = 'login') => {
        setAuthModalTab(tab);
        setIsAuthModalOpen(true);
    };

    const closeAuthModal = () => {
        setIsAuthModalOpen(false);
    };

    // 1. Password Login
    const loginWithPassword = async ({ email, password }) => {
        setIsLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
            if (res.data?.success && res.data.token) {
                setToken(res.data.token);
                setUser(res.data.user);
                closeAuthModal();
            }
            return res.data;
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || 'Login failed. Please check your credentials.'
            };
        } finally {
            setIsLoading(false);
        }
    };

    // 2. User Registration (Sign Up)
    const registerUser = async ({ name, email, phone, password, address }) => {
        setIsLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/auth/register`, {
                name,
                email,
                phone,
                password,
                address
            });
            if (res.data?.success && res.data.token) {
                setToken(res.data.token);
                setUser(res.data.user);
                closeAuthModal();
            }
            return res.data;
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || 'Registration failed. Please try again.'
            };
        } finally {
            setIsLoading(false);
        }
    };

    // 3. Forgot Password Request
    const forgotPassword = async (email) => {
        setIsLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });
            return res.data;
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || 'Failed to request password reset.'
            };
        } finally {
            setIsLoading(false);
        }
    };

    // 4. Reset Password with OTP
    const resetPassword = async ({ email, otp, newPassword }) => {
        setIsLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
                email,
                otp,
                newPassword
            });
            return res.data;
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || 'Failed to reset password.'
            };
        } finally {
            setIsLoading(false);
        }
    };

    // 5. Send Email OTP
    const sendOtp = async (email) => {
        setIsLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/auth/send-otp`, { email });
            return res.data;
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || 'Failed to send OTP.'
            };
        } finally {
            setIsLoading(false);
        }
    };

    // 6. Verify Email OTP
    const verifyOtp = async ({ email, otp, name, phone, role }) => {
        setIsLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/auth/verify-otp`, {
                email,
                otp,
                name,
                phone,
                role
            });
            if (res.data?.success && res.data.token) {
                setToken(res.data.token);
                setUser(res.data.user);
                closeAuthModal();
            }
            return res.data;
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || 'Verification failed.'
            };
        } finally {
            setIsLoading(false);
        }
    };

    // 7. Google OAuth Login
    const loginWithGoogle = async (googlePayload) => {
        setIsLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/auth/google`, googlePayload);
            if (res.data?.success && res.data.token) {
                setToken(res.data.token);
                setUser(res.data.user);
                closeAuthModal();
            }
            return res.data;
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || 'Google sign-in failed.'
            };
        } finally {
            setIsLoading(false);
        }
    };

    // 8. Update Profile Actions
    const updateProfile = async ({ name, phone, address, avatar }) => {
        setIsLoading(true);
        try {
            const res = await axios.put(`${API_BASE_URL}/auth/profile`, {
                name,
                phone,
                address,
                avatar
            });
            if (res.data?.success && res.data.user) {
                setUser(prev => ({ ...prev, ...res.data.user }));
            }
            return res.data;
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || 'Failed to update profile.'
            };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = (openLoginAfter = false) => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('kct_user');
        localStorage.removeItem('kct_token');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
        if (openLoginAfter) {
            setAuthModalTab('login');
            setIsAuthModalOpen(true);
        }
    };

    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            response => response,
            error => {
                const isTrashLogout = error.response?.status === 403 && (error.response?.data?.isLoggedOut || error.response?.data?.isDeleted);
                const isUnauthorized = error.response?.status === 401 && token && !error.config?.url?.includes('/auth/login');

                // If account was moved to trash or unauthorized, terminate active session immediately
                if (isTrashLogout || isUnauthorized) {
                    setUser(null);
                    setToken(null);
                    localStorage.removeItem('kct_user');
                    localStorage.removeItem('kct_token');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    delete axios.defaults.headers.common['Authorization'];

                    if (window.location.pathname.startsWith('/portal') && !window.location.pathname.includes('/portal/login')) {
                        window.location.href = '/portal/login?reason=' + (isTrashLogout ? 'account_trashed' : 'session_expired');
                    } else if (!window.location.pathname.startsWith('/admin')) {
                        setAuthModalTab('login');
                        setIsAuthModalOpen(true);
                    }
                }
                return Promise.reject(error);
            }
        );
        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, [token]);

    const refreshUser = async () => {
        if (!token) return;
        try {
            const res = await axios.get(`${API_BASE_URL}/auth/me`);
            if (res.data?.success && res.data.user) {
                setUser(prev => ({ ...prev, ...res.data.user }));
            }
        } catch (e) {
            console.warn('Refresh user notice:', e.message);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isAuthenticated: !!user,
            isAdmin: user?.role === 'admin',
            isLoading,
            isAuthModalOpen,
            authModalTab,
            openAuthModal,
            closeAuthModal,
            setAuthModalTab,
            loginWithPassword,
            registerUser,
            forgotPassword,
            resetPassword,
            sendOtp,
            verifyOtp,
            loginWithGoogle,
            updateProfile,
            logout,
            refreshUser,
            setUser
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
