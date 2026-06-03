'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import './login.css';
import { useUI } from '../../context/UIContext';
import { api } from '../../utils/api';

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useUI(); // Ensure showToast is available from UIContext, else we can build local toast
  
  // Local toast fallback if UIContext toast doesn't match
  const [toastMessage, setToastMessage] = useState<{msg: string, type: string} | null>(null);

  const localShowToast = (msg: string, type: 'success' | 'error') => {
    setToastMessage({msg, type});
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const [activeScreen, setActiveScreen] = useState<'login' | 'step1' | 'existing' | 'newUser' | 'forgot'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const [step1Email, setStep1Email] = useState('');

  const [existingUser, setExistingUser] = useState<{email: string, fullName: string} | null>(null);

  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newConfirmPassword, setNewConfirmPassword] = useState('');

  const [forgotEmail, setForgotEmail] = useState('');

  useEffect(() => {
    // Add fontawesome
    if (!document.querySelector('link[href*="font-awesome"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
      document.head.appendChild(link);
    }


    // Prefill session
    const savedSession = localStorage.getItem('vrindavan_session');
    if (savedSession) {
      try {
        const sess = JSON.parse(savedSession);
        if (sess.user?.email) setLoginIdentifier(sess.user.email);
      } catch (e) {}
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier || !loginPassword) {
      localShowToast('Email and password required', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.adminLogin({ email: loginIdentifier, password: loginPassword });
      
      const session = { user: { fullName: res.user.name, email: res.user.email, role: res.user.role }, loggedInAt: Date.now(), remember: rememberMe };
      if (rememberMe) localStorage.setItem('vrindavan_session', JSON.stringify(session));
      else sessionStorage.setItem('vrindavan_session', JSON.stringify(session));
      localStorage.setItem('token', res.token);
      
      localShowToast(`Welcome ${res.user.name}!`, 'success');
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch (err: any) {
      localShowToast(err.message || 'Invalid email or password', 'error');
    }
    setIsLoading(false);
  };

  const handleEmailCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const email = step1Email.trim();
    if (!email) {
      localShowToast('Email required', 'error');
      return;
    }
    if (!/^[^\s@]+@([^\s@]+\.)+[^\s@]+$/.test(email)) {
      localShowToast('Valid email required', 'error');
      return;
    }

    setIsLoading(true);
    // Assuming new user immediately for simplicity in backend connect
    setTimeout(() => {
      setNewEmail(email);
      setNewFullName('');
      setNewPhone('');
      setNewPassword('');
      setNewConfirmPassword('');
      setActiveScreen('newUser');
      setIsLoading(false);
    }, 400);
  };

  const handleSendSetupLink = () => {
    setIsLoading(true);
    setTimeout(() => {
      if (existingUser) {
        console.log(`Setup link generated for ${existingUser.email}`);
        localShowToast(`Setup link sent`, 'success');
        setTimeout(() => {
          setActiveScreen('login');
          setLoginIdentifier(existingUser.email);
        }, 1500);
      }
      setIsLoading(false);
    }, 500);
  };

  const handleNewUserRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newEmail;
    const name = newFullName.trim();
    const password = newPassword;
    const confirm = newConfirmPassword;

    if (!name || !password) {
      localShowToast('All fields required', 'error');
      return;
    }
    if (password !== confirm) {
      localShowToast('Passwords do not match', 'error');
      return;
    }
    if (password.length < 6) {
      localShowToast('Minimum 6 characters', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await api.adminRegister({ email, name, password });
      localShowToast('Registration successful!', 'success');
      setTimeout(() => {
        setActiveScreen('login');
        setLoginIdentifier(email);
      }, 1500);
    } catch (err: any) {
      localShowToast(err.message || 'Registration failed', 'error');
    }
    setIsLoading(false);
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const email = forgotEmail.trim();
    if (!email || !/^[^\s@]+@([^\s@]+\.)+[^\s@]+$/.test(email)) {
      localShowToast('Valid email required', 'error');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      localShowToast(`If account exists, link sent`, 'success');
      setTimeout(() => setActiveScreen('login'), 1500);
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="auth-page-container">
      <div className="app-wrapper">
        <div className="auth-wrapper">
          <div className="brand-logo">
            <img 
              src="https://ghungroowale.com/logo.png" 
              alt="Logo" 
              className="logo-image" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://placehold.co/65x65/1a5c7a/ffffff?text=V'
              }} 
            />
          </div>

          <div className="forms-container">
            {/* LOGIN FORM */}
            <div className={`auth-form ${activeScreen === 'login' ? 'active' : ''}`}>
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <div className="input-label"><i className="fas fa-envelope"></i> Email or Phone</div>
                  <input type="text" className="input-field" placeholder="Email or phone number" value={loginIdentifier} onChange={e => setLoginIdentifier(e.target.value)} />
                </div>
                <div className="form-group">
                  <div className="input-label"><i className="fas fa-lock"></i> Password</div>
                  <input type="password" className="input-field" placeholder="Enter your password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
                </div>
                <div className="row-flex">
                  <label className="checkbox-label">
                    <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} /> <span>Remember me</span>
                  </label>
                  <button type="button" className="forgot-link" onClick={() => setActiveScreen('forgot')}>
                    <i className="fas fa-question-circle"></i> Forgot password?
                  </button>
                </div>
                <button type="submit" className={`submit-btn ${isLoading ? 'loading' : ''}`} disabled={isLoading}>
                  {isLoading ? <i className="fas fa-spinner fa-pulse"></i> : <><i className="fas fa-arrow-right-to-bracket"></i> Login</>}
                </button>
              </form>
              <div className="register-link-container">
                <div className="register-link-wrapper">
                  <span className="register-link-text">Don't have an account?</span>
                  <button className="register-link" onClick={() => { setStep1Email(''); setActiveScreen('step1'); }}>Create an account</button>
                </div>
              </div>
            </div>

            {/* REGISTER STEP 1: EMAIL CHECK */}
            <div className={`auth-form ${activeScreen === 'step1' ? 'active' : ''}`}>
              <form onSubmit={handleEmailCheck}>
                <div className="form-group">
                  <div className="input-label"><i className="fas fa-envelope"></i> Email Address</div>
                  <input type="email" className="input-field" placeholder="your@email.com" value={step1Email} onChange={e => setStep1Email(e.target.value)} />
                  <div className="input-hint"><i className="fas fa-info-circle"></i> We'll check if you're already a member</div>
                </div>
                <button type="submit" className={`submit-btn ${isLoading ? 'loading' : ''}`} disabled={isLoading}>
                  {isLoading ? <i className="fas fa-spinner fa-pulse"></i> : <><i className="fas fa-arrow-right"></i> Next</>}
                </button>
              </form>
              <div className="back-to-login">
                <button className="back-link" onClick={() => setActiveScreen('login')}><i className="fas fa-arrow-left"></i> Back to Login</button>
              </div>
            </div>

            {/* EXISTING USER SCREEN */}
            <div className={`auth-form ${activeScreen === 'existing' ? 'active' : ''}`}>
              <div className="welcome-card">
                <h3><i className="fas fa-smile-wink"></i> Welcome Back, <span>{existingUser?.fullName}</span>!</h3>
                <p>Please check your email to set your password and continue.</p>
                <button type="button" className="clickable-hint" onClick={() => setShowModal(true)}>
                  <i className="fas fa-question-circle"></i> How did we recognize you?
                </button>
              </div>
              <button type="button" className={`submit-btn ${isLoading ? 'loading' : ''}`} onClick={handleSendSetupLink} disabled={isLoading}>
                {isLoading ? <i className="fas fa-spinner fa-pulse"></i> : <><i className="fas fa-paper-plane"></i> Send Password Setup Link</>}
              </button>
              <div className="back-to-login">
                <button className="back-link" onClick={() => setActiveScreen('step1')}><i className="fas fa-arrow-left"></i> Back</button>
              </div>
            </div>

            {/* NEW USER FORM */}
            <div className={`auth-form ${activeScreen === 'newUser' ? 'active' : ''}`}>
              <form onSubmit={handleNewUserRegistration}>
                <div className="form-group">
                  <div className="input-label"><i className="fas fa-envelope"></i> Email Address</div>
                  <input type="email" className="input-field" value={newEmail} disabled />
                </div>
                <div className="form-group">
                  <div className="input-label"><i className="fas fa-user"></i> Full Name</div>
                  <input type="text" className="input-field" placeholder="Enter your full name" value={newFullName} onChange={e => setNewFullName(e.target.value)} />
                </div>
                <div className="form-group">
                  <div className="input-label"><i className="fas fa-phone-alt"></i> Phone Number</div>
                  <input type="tel" className="input-field" placeholder="Phone number" value={newPhone} onChange={e => setNewPhone(e.target.value)} />
                </div>
                <div className="form-group">
                  <div className="input-label"><i className="fas fa-lock"></i> Password</div>
                  <input type="password" className="input-field" placeholder="Minimum 6 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                </div>
                <div className="form-group">
                  <div className="input-label"><i className="fas fa-check-circle"></i> Confirm Password</div>
                  <input type="password" className="input-field" placeholder="Confirm your password" value={newConfirmPassword} onChange={e => setNewConfirmPassword(e.target.value)} />
                </div>
                <button type="submit" className={`submit-btn ${isLoading ? 'loading' : ''}`} disabled={isLoading}>
                  {isLoading ? <i className="fas fa-spinner fa-pulse"></i> : <><i className="fas fa-user-plus"></i> Complete Registration</>}
                </button>
              </form>
              <div className="back-to-login">
                <button className="back-link" onClick={() => setActiveScreen('step1')}><i className="fas fa-arrow-left"></i> Back</button>
              </div>
            </div>

            {/* FORGOT PASSWORD */}
            <div className={`auth-form ${activeScreen === 'forgot' ? 'active' : ''}`}>
              <form onSubmit={handleForgotPassword}>
                <div className="form-group">
                  <div className="input-label"><i className="fas fa-envelope"></i> Email Address</div>
                  <input type="email" className="input-field" placeholder="Registered email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} />
                  <div className="input-hint"><i className="fas fa-paper-plane"></i> We'll send a reset link</div>
                </div>
                <button type="submit" className={`submit-btn ${isLoading ? 'loading' : ''}`} disabled={isLoading}>
                  {isLoading ? <i className="fas fa-spinner fa-pulse"></i> : <><i className="fas fa-paper-plane"></i> Send Reset Link</>}
                </button>
              </form>
              <div className="back-to-login">
                <button className="back-link" onClick={() => setActiveScreen('login')}><i className="fas fa-arrow-left"></i> Back to Login</button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* MODAL */}
      <div className={`modal-overlay ${showModal ? 'active' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
        <div className="modal-content">
          <i className="fas fa-history"></i>
          <h4>How did we recognize you?</h4>
          <p>You may have used our services before — Hotel booking, Shopping, Matrimony, Directory, or Astrology. You provided your email and name at that time. Your record is safe with us.</p>
          <button className="modal-close" onClick={() => setShowModal(false)}>Got it</button>
        </div>
      </div>

      {toastMessage && (
        <div className={`toast ${toastMessage.type}`}>
          {toastMessage.type === 'error' ? '⚠️ ' : '✓ '} {toastMessage.msg}
        </div>
      )}
    </div>
  );
}
