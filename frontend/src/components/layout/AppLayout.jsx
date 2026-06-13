import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileSidebar from './MobileSidebar';
import Navbar from './Navbar';
import { useAuth } from '../../context/AuthContext';

const AppLayout = () => {
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const containerStyles = {
    minHeight: '100vh',
    height: '100%',
    background: 'var(--bg-page)',
    color: 'var(--text-primary)',
    display: 'flex',
  };

  const mainStyles = {
    flex: 1,
    minHeight: '100vh',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    // Add left margin only on desktop
    marginLeft: isMobile ? '0' : '232px',
    transition: 'margin-left 0.3s ease',
    overflow: 'hidden',
  };

  const contentStyles = {
    flex: 1,
    padding: isMobile ? '80px 16px 16px 16px' : '24px',
    overflowY: 'auto',
    overflowX: 'hidden',
    minHeight: 0,
  };

  const innerStyles = {
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%',
  };

  // Responsive styles using CSS breakpoint variables
  const responsiveStyles = `
    /* Desktop sidebar (lg: 1024px and above) */
    @media (min-width: 1024px) {
      .desktop-sidebar {
        display: flex !important;
      }
      .mobile-menu-btn {
        display: none !important;
      }
    }

    /* Mobile/tablet (below lg: 1024px) */
    @media (max-width: 1023px) {
      .desktop-sidebar {
        display: none !important;
      }
      .mobile-menu-btn {
        display: flex !important;
      }
      .main-content {
        margin-left: 0 !important;
      }
    }

    /* Tablet adjustments (md: 768px to lg-1: 1023px) */
    @media (min-width: 768px) and (max-width: 1023px) {
      .content-padding {
        padding: 20px !important;
      }
    }

    /* Mobile adjustments (below md: 768px) */
    @media (max-width: 767px) {
      .content-padding {
        padding: 16px !important;
      }
      .navbar-padding {
        padding: 0 16px !important;
      }
    }

    /* Small mobile (below sm: 640px) */
    @media (max-width: 639px) {
      .content-padding {
        padding: 12px !important;
      }
    }

    /* Scrollbar styling */
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: var(--text-muted);
      border-radius: 3px;
      opacity: 0.3;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: var(--text-secondary);
      opacity: 0.5;
    }
  `;

  return (
    <>
      <style>{responsiveStyles}</style>
      <div style={containerStyles}>
        {/* Desktop Sidebar - completely hidden on mobile */}
        {!isMobile && (
          <div className="desktop-sidebar">
            <Sidebar />
          </div>
        )}

        {/* Mobile Sidebar - only rendered on mobile */}
        {isMobile && (
          <MobileSidebar
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          />
        )}

        <div style={mainStyles} className="main-content">
          <Navbar 
  user={user} 
  isMobile={isMobile}
  onMenuClick={() => setIsMobileMenuOpen(true)}
  isMenuOpen={isMobileMenuOpen}
/>

          <main style={contentStyles} className="content-padding custom-scrollbar">
            <div style={innerStyles}>
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default AppLayout;
