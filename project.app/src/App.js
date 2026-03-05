import React, { useState, useEffect } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Component Imports
import Header from './components/Header';
import Footer from './components/Footer';
import LoginRegisterForm from './components/LoginRegisterForm';
import HomeContent from './components/HomeContent';
import DashboardContent from './components/DashboardContent'; 
import AdminDash from './components/AdminDash.js'; // Ensure this matches the file name exactly
import ManagerDash from './components/ManagerDash'; 
import Course from './components/Course'; 
import Assignments from './components/Assignments'; 
import Quizzes from './components/Quizzes'; 
import Certificates from './components/Certificates';
import Catalogue from './components/Catalogue';
import ProfileContent from './components/ProfileContent';

function App() {
  const [activeView, setActiveView] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null); 
  const [selectedCourseId, setSelectedCourseId] = useState(null); 
  const [searchQuery, setSearchQuery] = useState(''); 
  const [authMessage, setAuthMessage] = useState('');
  const [userName, setUserName] = useState(''); 

  // --- PERSISTENCE LOGIC: Fixes session restoration and "undefined" names ---
  useEffect(() => {
    const savedRole = localStorage.getItem('userRole');
    const savedEmail = localStorage.getItem('userEmail');
    const savedName = localStorage.getItem('userName');

    if (savedRole && savedEmail) {
      setUserRole(savedRole);
      // Restore name or fallback to avoid "undefined"
      setUserName(savedName || 'Scholar');
      setIsLoggedIn(true); 
      
      // Auto-route to the dashboard based on role
      if (savedRole === 'admin') setActiveView('admin');
      else if (savedRole === 'manager') setActiveView('manager');
      else setActiveView('dashboard');
    }
  }, []);

  const handleSetActiveView = (view, courseId = null) => {
    setAuthMessage('');
    // Clear search when switching major sections
    if (['home', 'dashboard', 'catalogue'].includes(view)) {
        setSearchQuery('');
    }
    if (courseId) setSelectedCourseId(courseId);
    setActiveView(view);
  };

  const handleLogin = (role) => {
    // Sync state with updated localStorage immediately after login
    const updatedName = localStorage.getItem('userName');
    
    setIsLoggedIn(true);
    setUserRole(role); 
    setUserName(updatedName || 'Scholar');
    setAuthMessage('');
    
    // Explicit redirection
    if (role === 'admin') setActiveView('admin');
    else if (role === 'manager') setActiveView('manager');
    else setActiveView('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    setUserName('');
    setSearchQuery('');
    localStorage.clear();
    setActiveView('home'); 
  };

  const renderMainContent = () => {
    const privateViews = ['dashboard', 'course', 'admin', 'manager', 'assignments', 'quizzes', 'certificates', 'profile'];
    
    if (privateViews.includes(activeView) && !isLoggedIn) {
      return <HomeContent isLoggedIn={false} setActiveView={handleSetActiveView} />;
    }

    switch (activeView) {
      case 'home': return <HomeContent isLoggedIn={isLoggedIn} setActiveView={handleSetActiveView} />;
      case 'dashboard': return <DashboardContent setActiveView={handleSetActiveView} userName={userName} searchTerm={searchQuery} />;
      case 'catalogue': return <Catalogue searchQuery={searchQuery} setActiveView={handleSetActiveView} />;
      case 'assignments': return <Assignments setActiveView={handleSetActiveView} searchTerm={searchQuery} />;
      case 'quizzes': return <Quizzes setActiveView={handleSetActiveView} searchTerm={searchQuery} />;
      case 'certificates': return <Certificates setActiveView={handleSetActiveView} />;
      case 'profile': return <ProfileContent setActiveView={handleSetActiveView} />;
      case 'course': return <Course courseId={selectedCourseId} setActiveView={handleSetActiveView} />;
      case 'admin': return <AdminDash setActiveView={handleSetActiveView} onLogout={handleLogout} />;
      case 'manager': return <ManagerDash onLogout={handleLogout} />;
      case 'login':
      case 'register':
        return (
          <div className="container mt-5 py-5 fade-in">
            <div className="row justify-content-center">
              <div className="col-lg-5 p-5 rounded-4 bg-white shadow-lg border-0">
                <LoginRegisterForm formType={activeView} handleLogin={handleLogin} />
              </div>
            </div>
          </div>
        );
      default: return <HomeContent isLoggedIn={false} setActiveView={handleSetActiveView} />;
    }
  };

  const isFullScreen = activeView === 'admin' || activeView === 'course' || activeView === 'manager';

  return (
    <div className="App bg-light min-vh-100 d-flex flex-column">
      {!isFullScreen && (
        <Header 
          activeView={activeView} 
          setActiveView={handleSetActiveView} 
          isLoggedIn={isLoggedIn} 
          handleLogout={handleLogout}
          searchQuery={searchQuery} // Missing link re-added
          setSearchQuery={setSearchQuery} // Missing link re-added
          userRole={userRole}
        />
      )}
      <main className="flex-grow-1">{renderMainContent()}</main>
      {!isFullScreen && <Footer />}
    </div>
  );
}

export default App;