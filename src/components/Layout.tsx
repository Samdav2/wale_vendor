'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUI } from '../context/UIContext';
import { api } from '../utils/api';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { title, showToast } = useUI();
  const pathname = usePathname();
  const router = useRouter();

  // Dropdown states
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('vrindavan_session');
    sessionStorage.removeItem('vrindavan_session');
    showToast('Logged out successfully', 'info');
    setShowProfileMenu(false);
    setTimeout(() => {
      router.push('/login');
    }, 1000);
  };

  // Global Auth & Role Guard
  const [userRole, setUserRole] = useState<string>('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  React.useEffect(() => {
    setIsAuthorized(false); // Reset on path change
    if (pathname === '/login') {
      setIsAuthorized(true);
      return;
    }

    const token = localStorage.getItem('token');
    const sessionStr = localStorage.getItem('vrindavan_session') || sessionStorage.getItem('vrindavan_session');

    if (!token || !sessionStr) {
      setIsLoggedIn(false);
      if (pathname === '/') {
        setIsAuthorized(true);
        return;
      }
      router.replace('/login');
      return;
    }

    try {
      const session = JSON.parse(sessionStr);
      const role = session?.user?.role;
      setUserRole(role);
      setIsLoggedIn(true);

      // Both Admins and Vendors can access all pages in the dashboard
      // CRUD restrictions are handled at the component/API level
      setIsAuthorized(true);
    } catch (err) {
      setIsLoggedIn(false);
      if (pathname === '/') {
        setIsAuthorized(true);
        return;
      }
      router.replace('/login');
    }
  }, [pathname, router, showToast]);

  React.useEffect(() => {
    if (!isAuthorized) return;
    const fetchNotifs = async () => {
      try {
        const [guests, bookings] = await Promise.all([
          api.getGuests().catch(() => []),
          api.getBookings().catch(() => [])
        ]);
        
        let notifs: any[] = [];
        guests.forEach((g: any) => {
          if (g._id) {
            const time = new Date(parseInt(g._id.substring(0, 8), 16) * 1000);
            notifs.push({
              id: g._id,
              message: g.status === 'Checked-In' ? `Guest ${g.name} checked in` : `New guest ${g.name} registered`,
              time,
              type: 'guest'
            });
          }
        });
        bookings.forEach((b: any) => {
          if (b._id) {
            const time = new Date(parseInt(b._id.substring(0, 8), 16) * 1000);
            const roomName = b.room?.roomNumber || b.roomNumber || 'Unknown';
            const guestName = b.guest?.name || b.guestName || 'Unknown';
            notifs.push({
              id: b._id,
              message: `New booking for room ${roomName} by ${guestName}`,
              time,
              type: 'booking'
            });
          }
        });
        notifs.sort((a, b) => b.time.getTime() - a.time.getTime());
        setNotifications(notifs.slice(0, 10));
        setUnreadCount(notifs.length); // simplistic unread count
      } catch (err) {
        console.error('Failed to load notifications', err);
      }
    };
    fetchNotifs();
  }, [isAuthorized]);

  const getRelativeTime = (date: Date) => {
    const diff = date.getTime() - new Date().getTime();
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const days = Math.round(diff / (1000 * 60 * 60 * 24));
    if (days === 0) {
      const hours = Math.round(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const mins = Math.round(diff / (1000 * 60));
        return rtf.format(mins, 'minute');
      }
      return rtf.format(hours, 'hour');
    }
    return rtf.format(days, 'day');
  };

  // Auto-show modal after 3 seconds if not logged in and on the landing page
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    // We only want this to trigger if we have explicitly determined they are not logged in
    // and they are on the root path
    if (pathname === '/' && !isLoggedIn && isAuthorized) {
      timer = setTimeout(() => {
        // Double check they haven't logged in during those 3 seconds
        const token = localStorage.getItem('token');
        if (!token) {
          setShowLoginModal(true);
        }
      }, 3000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [pathname, isLoggedIn, isAuthorized]);

  const handleModalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPass) {
      showToast('Email and password required', 'error');
      return;
    }
    setIsLoggingIn(true);
    try {
      const res = await api.adminLogin({ email: loginEmail, password: loginPass });
      const session = { user: { fullName: res.user.name, email: res.user.email, role: res.user.role }, loggedInAt: Date.now(), remember: true };
      localStorage.setItem('vrindavan_session', JSON.stringify(session));
      localStorage.setItem('token', res.token);
      showToast(`Welcome ${res.user.name}!`, 'success');
      setShowLoginModal(false);
      setIsLoggedIn(true);
      window.location.reload();
    } catch (err: any) {
      showToast(err.message || 'Invalid credentials', 'error');
    }
    setIsLoggingIn(false);
  };

  const navItems = [
    { href: '/bookings', label: 'Home', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )},
    { href: '/guests', label: 'Guest', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )},
    { href: '/rooms', label: 'Room', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    )},
    { href: '/calendar', label: 'Calendar', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )},
    { href: '/food', label: 'Food', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
    { href: '/', label: 'Dashboard', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
      </svg>
    )}
  ];

  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      
      {/* Sidebar for Desktop (min-width: 1024px) */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-slate-100 flex-shrink-0 border-r border-slate-800">
        <div className="flex items-center gap-3 p-6 border-b border-slate-800">
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 shadow-md bg-white border border-slate-700">
            <img src="/logo.png" alt="Ghungroo Wale" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight">Ghungroo Wale</h1>
            <span className="text-xs text-slate-400">Management Panel</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm group ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/10'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className={`transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-amber-500'}`}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}

          <div className="pt-6 border-t border-slate-800 space-y-1">
            <span className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Management</span>
            <Link href="/staff" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition-colors">
              👥 Staff List
            </Link>
            <Link href="/support" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition-colors">
              💬 Live Support
            </Link>
          </div>

          <div className="pt-6 border-t border-slate-800 space-y-1">
            <span className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Settings</span>
            <Link href="/settings/contact" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition-colors">
              📞 Contacts Settings
            </Link>
            <Link href="/settings/rules" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition-colors">
              📜 Rules & Policies
            </Link>
            <Link href="/settings/images" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition-colors">
              🖼️ Media Gallery
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800">
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white rounded-xl transition-all duration-200 font-medium text-sm"
            >
              Logout
            </button>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl transition-all duration-200 font-bold text-sm shadow-sm"
            >
              Login / Sign Up
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Sticky Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Logo / Menu Toggle */}
            <div className="lg:hidden w-8 h-8 rounded-full overflow-hidden flex-shrink-0 shadow-sm border border-slate-200">
              <img src="/logo.png" alt="Ghungroo Wale" className="w-full h-full object-cover" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight whitespace-nowrap truncate">{title}</h2>
          </div>

          <div className="flex items-center gap-3 relative">
            
            {!isLoggedIn ? (
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-xl text-sm transition-colors cursor-pointer shadow-sm"
              >
                Login / Sign Up
              </button>
            ) : (
              <>
                {/* Quick Add Button */}
                <button
                  onClick={() => {
                    setShowAddMenu(!showAddMenu);
                    setShowProfileMenu(false);
                    setShowNotifMenu(false);
                  }}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-lg transition-colors cursor-pointer"
                  aria-label="Add Menu"
                >
                  +
                </button>

                {/* Notifications Button */}
                <button
                  onClick={() => {
                    setShowNotifMenu(!showNotifMenu);
                    setShowAddMenu(false);
                    setShowProfileMenu(false);
                  }}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer relative"
                  aria-label="Notifications"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white"></span>
                  )}
                </button>

                {/* Profile Avatar Button */}
                <button
                  onClick={() => {
                    setShowProfileMenu(!showProfileMenu);
                    setShowAddMenu(false);
                    setShowNotifMenu(false);
                  }}
                  className="w-9 h-9 rounded-full border border-slate-200 overflow-hidden cursor-pointer bg-slate-100 flex-shrink-0"
                  aria-label="Profile Menu"
                >
                  <img
                    src="https://ghungroowale.com/logo.png"
                    alt="profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2232%22 height=%2232%22%3E%3Ccircle cx=%2216%22 cy=%2216%22 r=%2216%22 fill=%22%23eef2ff%22/%3E%3Ctext x=%229%22 y=%2222%22 fill=%22%233b4b6e%22 font-size=%2214%22%3EP%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </button>

                {/* Quick Add Dropdown Menu */}
                {showAddMenu && (
                  <div className="absolute right-12 top-11 w-56 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-slide-up">
                    <span className="px-4 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider block">Add New</span>
                    <Link href="/rooms/new" onClick={() => setShowAddMenu(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      🚪 New Room
                    </Link>
                    <Link href="/staff/new" onClick={() => setShowAddMenu(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      👤 New Staff Member
                    </Link>
                    <Link href="/food/new" onClick={() => setShowAddMenu(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      🍳 New Food Item
                    </Link>
                    <Link href="/nearby/new" onClick={() => setShowAddMenu(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      📍 New Nearby Place
                    </Link>
                    <div className="border-t border-slate-100 my-1"></div>
                    <Link href="/settings/amenities" onClick={() => setShowAddMenu(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      ✨ Manage Amenities
                    </Link>
                  </div>
                )}

                {/* Notifications Dropdown Menu */}
                {showNotifMenu && (
                  <div className="absolute right-6 top-11 w-80 rounded-2xl bg-white border border-slate-200 shadow-xl p-3 z-50 animate-slide-up space-y-2">
                    <div className="flex justify-between items-center px-1 pb-2 border-b border-slate-100">
                      <span className="text-sm font-bold text-slate-800">Notifications</span>
                      <button onClick={() => setUnreadCount(0)} className="text-xs text-amber-600 font-semibold cursor-pointer">Mark all read</button>
                    </div>
                    <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-2 text-xs">
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <div key={notif.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
                            <p className="text-slate-800 font-medium">{notif.message}</p>
                            <span className="text-[10px] text-slate-400 block mt-1 capitalize">{getRelativeTime(notif.time)}</span>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-slate-500">No new notifications</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Profile Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 top-11 w-48 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-slide-up">
                    <Link href="/profile" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      👤 Edit Profile
                    </Link>
                    <Link href="/support" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      💬 Contact Support
                    </Link>
                    <div className="border-t border-slate-100 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                    >
                      🚪 Logout
                    </button>
                  </div>
                )}
              </>
            )}

          </div>
        </header>

        {/* Scrollable Content Pane */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 custom-scrollbar bg-slate-50 relative">
          {isAuthorized ? (
            <div className="max-w-6xl mx-auto pb-16 lg:pb-0">
              {children}
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 backdrop-blur-sm z-50">
              <div className="flex flex-col items-center gap-3">
                <i className="fas fa-circle-notch fa-spin text-3xl text-amber-500"></i>
                <p className="text-slate-500 font-medium">Verifying access...</p>
              </div>
            </div>
          )}
        </main>

        {/* Mobile Navigation Sticky Footer (hidden on Desktop lg) */}
        <footer className="lg:hidden sticky bottom-0 z-30 flex items-center justify-around h-16 bg-white border-t border-slate-200 px-2 shadow-lg flex-shrink-0">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 text-[10px] font-medium transition-all ${
                  isActive ? 'text-amber-500 font-bold scale-105' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className={isActive ? 'text-amber-500' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </footer>

      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowLoginModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="font-bold text-xl text-slate-800">Welcome Back</h3>
              <button onClick={() => setShowLoginModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleModalLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="Enter your email" 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <input 
                    type="password" 
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    placeholder="Enter your password" 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isLoggingIn}
                  className={`w-full py-2.5 rounded-xl font-bold text-slate-900 transition-all ${isLoggingIn ? 'bg-amber-300' : 'bg-amber-500 hover:bg-amber-600'} shadow-sm`}
                >
                  {isLoggingIn ? 'Logging in...' : 'Login'}
                </button>
              </form>
              <div className="mt-6 text-center text-sm text-slate-500">
                Don't have an account?{' '}
                <Link href="/login" className="text-amber-600 font-semibold hover:underline" onClick={() => setShowLoginModal(false)}>
                  Sign up here
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
