import React from 'react';

function Header({ activeView, setActiveView, isLoggedIn, handleLogout, searchQuery, setSearchQuery }) {
  
  // Logic to handle real-time searching and auto-navigation
  const handleSearchChange = (e) => {
    const value = e.target.value;
    
    // Update the global state in App.js
    setSearchQuery(value);
    
    // Auto-navigate to Catalogue when user starts typing
    // This allows the search bar to act as the entry point to your 200 courses
    if (value.length > 0 && activeView !== 'catalogue' && activeView !== 'course') {
      setActiveView('catalogue');
    }
  };

  return (
    <nav className="navbar navbar-expand-lg premium-nav shadow-sm">
      <div className="container">
        {/* Brand/Logo */}
        <button 
          className="navbar-brand fw-black text-white btn btn-link text-decoration-none" 
          onClick={() => setActiveView('home')}
          style={{ letterSpacing: '-1px', fontSize: '1.5rem' }}
        >
          EduPortal<span style={{ color: '#6366f1' }}>.</span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto ms-4">
            <li className="nav-item">
              <button 
                className={`nav-link-premium ${activeView === 'home' ? 'active' : ''}`} 
                onClick={() => setActiveView('home')}
              >
                Home
              </button>
            </li>
            
            {/* Catalogue button removed as requested */}

            {isLoggedIn && (
              <>
                <li className="nav-item">
                  <button 
                    className={`nav-link-premium ${activeView === 'dashboard' ? 'active' : ''}`} 
                    onClick={() => setActiveView('dashboard')}
                  >
                    Dashboard
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link-premium ${activeView === 'assignments' ? 'active' : ''}`} 
                    onClick={() => setActiveView('assignments')}
                  >
                    Assignments
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link-premium ${activeView === 'quizzes' ? 'active' : ''}`} 
                    onClick={() => setActiveView('quizzes')}
                  >
                    Quizzes
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link-premium ${activeView === 'certificates' ? 'active' : ''}`} 
                    onClick={() => setActiveView('certificates')}
                  >
                    Certificates
                  </button>
                </li>
              </>
            )}
          </ul>

          {/* Main Search Bar - Controlled by App.js state */}
          <div className="d-flex mx-auto col-lg-4">
            <input
              className="form-control-nav"
              type="search"
              placeholder="Search 200+ courses..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>

          <ul className="navbar-nav ms-auto align-items-center">
            {!isLoggedIn ? (
              <li className="nav-item">
                <button className="btn-login-premium" onClick={() => setActiveView('login')}>Login/Register</button>
              </li>
            ) : (
              <>
                <li className="nav-item me-3">
                  <button 
                    className={`profile-circle ${activeView === 'profile' ? 'active' : ''}`} 
                    onClick={() => setActiveView('profile')}
                  >
                    👤
                  </button>
                </li>
                <li className="nav-item">
                  <button className="btn-logout-premium" onClick={handleLogout}>Logout</button>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>

      <style>{`
        .premium-nav {
          background: #0f172a; 
          padding: 18px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .fw-black { font-weight: 800; }

        .nav-link-premium {
          background: none; border: none; color: #94a3b8;
          font-weight: 700; font-size: 0.85rem;
          padding: 8px 16px; margin: 0 4px;
          transition: all 0.3s ease; border-radius: 10px;
        }

        .nav-link-premium:hover { color: white; background: rgba(255, 255, 255, 0.05); }
        .nav-link-premium.active { color: white; background: #6366f1; }

        .form-control-nav {
          background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px; padding: 10px 24px; color: white;
          font-size: 0.85rem; width: 100%; transition: all 0.3s;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .form-control-nav:focus {
          background: rgba(255, 255, 255, 0.1); outline: none;
          border-color: #6366f1; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2);
          color: white;
        }

        .btn-login-premium {
          background: white; color: #0f172a; border: none;
          padding: 8px 24px; border-radius: 12px;
          font-weight: 800; font-size: 0.85rem; transition: all 0.3s;
        }

        .btn-logout-premium {
          background: rgba(239, 68, 68, 0.1); color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
          padding: 8px 20px; border-radius: 12px;
          font-weight: 700; font-size: 0.85rem; transition: all 0.3s;
        }

        .btn-logout-premium:hover { background: #ef4444; color: white; }

        .profile-circle {
          width: 40px; height: 40px; border-radius: 50%;
          background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);
          display: flex; align-items: center; justify-content: center;
          color: white; transition: all 0.3s;
        }

        .profile-circle:hover, .profile-circle.active {
          border-color: #6366f1; background: rgba(99, 102, 241, 0.1);
        }
      `}</style>
    </nav>
  );
}

export default Header;