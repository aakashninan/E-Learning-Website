import React, { useState, useEffect } from 'react';
import { Mail, Shield, Calendar, Edit3, Key, Award, Book, Star, Save, X } from 'lucide-react';

function ProfileContent({ setActiveView }) {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    bio: "",
    studentId: "STU-10294",
    joined: "January 2024"
  });

  const [stats, setStats] = useState({
    activeCourses: 0,
    masteryAverage: 0,
    badges: 0
  });

  const [showPassModal, setShowPassModal] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", new: "" });

  // FETCH PROFILE DATA
  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    if (email) {
      fetch(`http://127.0.0.1:5001/api/user/profile/${email}`)
        .then(res => res.json())
        .then(data => {
          setProfile(prev => ({
            ...prev,
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            email: data.email || email,
            bio: data.bio || ""
          }));

          const enrolledCount = data.enrolledCourses?.length || 0;
          const passedQuizzes = data.completedQuizzes?.filter(q => q.passed).length || 0;
          const totalScore = data.completedQuizzes?.reduce((acc, curr) => acc + curr.score, 0) || 0;
          const avg = data.completedQuizzes?.length > 0 
            ? Math.round((totalScore / (data.completedQuizzes.length * 10)) * 100) 
            : 0;

          setStats({
            activeCourses: enrolledCount,
            masteryAverage: avg,
            badges: passedQuizzes
          });
        })
        .catch(err => console.error("Profile fetch error:", err));
    }
  }, []);

  // SYNC UPDATES TO DATABASE
  const handleUpdateProfile = async () => {
    const oldEmail = localStorage.getItem('userEmail');
    try {
      const response = await fetch('http://127.0.0.1:5001/api/user/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          oldEmail: oldEmail.toLowerCase(), 
          updates: {
            firstName: profile.firstName,
            lastName: profile.lastName,
            email: profile.email.toLowerCase(),
            bio: profile.bio
          }
        })
      });

      if (response.ok) {
        localStorage.setItem('userEmail', profile.email.toLowerCase());
        localStorage.setItem('userName', profile.firstName);
        setIsEditing(false);
        alert("Database synchronized successfully.");
      } else {
        const err = await response.json();
        alert(err.message || "Update failed.");
      }
    } catch (err) {
      alert("Failed to reach server.");
    }
  };

  const handleChangePassword = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5001/api/user/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile.email, ...passwords })
      });

      if (response.ok) {
        setShowPassModal(false);
        setPasswords({ current: "", new: "" });
        alert("Security credentials updated.");
      } else {
        alert("Current password incorrect.");
      }
    } catch (err) {
      alert("Error updating security settings.");
    }
  };

  return (
    <div className="dashboard-light-premium fade-in min-vh-100">
      <div className="container py-5">
        <header className="mb-5">
          <p className="text-overline mb-1">Student Account</p>
          <h1 className="fw-black m-0 text-dark">My Profile</h1>
        </header>

        <div className="row g-4">
          <div className="col-lg-8">
            <div className="bento-card p-0 overflow-hidden">
              <div className="profile-cover-gradient"></div>
              <div className="p-5 position-relative">
                <div className="d-md-flex align-items-end gap-4 mt-n5">
                  <div className="profile-avatar-wrap">
                    <span className="avatar-icon">👤</span>
                  </div>
                  <div className="flex-grow-1 mt-3 mt-md-0">
                    {isEditing ? (
                      <div className="d-flex gap-2 mb-1">
                        <input className="form-control fw-bold" value={profile.firstName} onChange={(e) => setProfile({...profile, firstName: e.target.value})} />
                        <input className="form-control fw-bold" value={profile.lastName} onChange={(e) => setProfile({...profile, lastName: e.target.value})} />
                      </div>
                    ) : (
                      <h2 className="fw-black text-dark mb-1">{profile.firstName} {profile.lastName}</h2>
                    )}
                    <p className="text-primary fw-bold mb-0">Academic Scholar</p>
                  </div>
                  <div className="d-flex gap-2 mt-3 mt-md-0">
                    {isEditing ? (
                      <>
                        <button className="btn-action-premium" onClick={handleUpdateProfile} style={{background: '#10b981'}}><Save size={16} /> Save</button>
                        <button className="btn-outline-premium" onClick={() => setIsEditing(false)}><X size={16} /></button>
                      </>
                    ) : (
                      <button className="btn-action-premium" onClick={() => setIsEditing(true)}><Edit3 size={16} /> Edit</button>
                    )}
                    <button className="btn-outline-premium" onClick={() => setShowPassModal(true)}><Key size={16} /></button>
                  </div>
                </div>

                <hr className="my-5 opacity-5" />

                <div className="row g-4">
                  <div className="col-md-6">
                    <h5 className="section-label mb-4">Account Details</h5>
                    <div className="info-item mb-4">
                      <div className="info-icon"><Mail size={18} /></div>
                      <div>
                        <small className="stat-label-mini">EMAIL ADDRESS</small>
                        {isEditing ? (
                          <input className="form-control form-control-sm mt-1" value={profile.email} onChange={(e) => setProfile({...profile, email: e.target.value})} />
                        ) : (
                          <p className="m-0 fw-bold text-dark">{profile.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="info-item mb-4">
                      <div className="info-icon"><Shield size={18} /></div>
                      <div>
                        <small className="stat-label-mini">STUDENT ID</small>
                        <p className="m-0 fw-bold text-dark">{profile.studentId}</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 border-start-md ps-md-5">
                    <h5 className="section-label mb-4">Biography</h5>
                    {isEditing ? (
                      <textarea className="form-control" rows="4" value={profile.bio} onChange={(e) => setProfile({...profile, bio: e.target.value})} />
                    ) : (
                      <p className="text-secondary mb-0">{profile.bio || "No biography provided yet."}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="d-flex flex-column gap-4">
              <div className="stats-capsule-vertical p-4 shadow">
                <div className="stat-item-premium mb-4">
                  <div className="stat-icon-wrap" style={{ '--glow': '#6366f1' }}><Book size={20} /></div>
                  <div className="ms-3">
                    <h3 className="m-0 fw-black text-white">{stats.activeCourses}</h3>
                    <p className="stat-label-premium">Active Courses</p>
                  </div>
                </div>
                <div className="stat-item-premium mb-4">
                  <div className="stat-icon-wrap" style={{ '--glow': '#10b981' }}><Star size={20} /></div>
                  <div className="ms-3">
                    <h3 className="m-0 fw-black text-white">{stats.masteryAverage}%</h3>
                    <p className="stat-label-premium">Mastery Average</p>
                  </div>
                </div>
                <div className="stat-item-premium">
                  <div className="stat-icon-wrap" style={{ '--glow': '#f59e0b' }}><Award size={20} /></div>
                  <div className="ms-3">
                    <h3 className="m-0 fw-black text-white">{stats.badges}</h3>
                    <p className="stat-label-premium">Badges Earned</p>
                  </div>
                </div>
              </div>

              <div className="bento-card p-4 bg-dark">
                <h5 className="fw-black text-white mb-3">Quick Navigation</h5>
                <button className="btn-nav-premium w-100" onClick={() => setActiveView('certificates')}>View Certificates</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPassModal && (
        <div className="modal-backdrop-premium" style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(15, 23, 42, 0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex: 1000}}>
           <div className="bento-card p-5" style={{maxWidth: '450px', width: '90%'}}>
              <h3 className="fw-black mb-1">Security</h3>
              <p className="text-secondary small mb-4">Update your password</p>
              <label className="stat-label-mini mb-1">CURRENT PASSWORD</label>
              <input type="password" placeholder="••••••••" className="form-control mb-3" onChange={(e) => setPasswords({...passwords, current: e.target.value})} />
              <label className="stat-label-mini mb-1">NEW PASSWORD</label>
              <input type="password" placeholder="••••••••" className="form-control mb-4" onChange={(e) => setPasswords({...passwords, new: e.target.value})} />
              <div className="d-flex gap-2">
                <button className="btn-action-premium w-100 justify-content-center" onClick={handleChangePassword}>Update</button>
                <button className="btn-outline-premium" onClick={() => setShowPassModal(false)}>Cancel</button>
              </div>
           </div>
        </div>
      )}

      <style>{`
        .dashboard-light-premium { background: #fcfcfd; }
        .fw-black { font-weight: 800; letter-spacing: -1.5px; }
        .text-overline { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #6366f1; }
        .bento-card { background: white; border-radius: 32px; border: 1px solid #f1f5f9; }
        .profile-cover-gradient { height: 120px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); }
        .profile-avatar-wrap { width: 120px; height: 120px; background: white; border-radius: 35px; display: flex; align-items: center; justify-content: center; margin-top: -60px; border: 6px solid #fcfcfd; font-size: 3rem; position: relative; z-index: 2; }
        .section-label { font-size: 0.85rem; font-weight: 800; text-transform: uppercase; color: #6366f1; }
        .stat-label-mini { font-size: 0.6rem; font-weight: 800; color: #94a3b8; }
        .info-item { display: flex; align-items: center; gap: 15px; }
        .info-icon { width: 40px; height: 40px; background: #f8fafc; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #6366f1; }
        .btn-action-premium { background: #6366f1; color: white; border: none; padding: 10px 24px; border-radius: 14px; font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; gap: 8px; }
        .btn-outline-premium { background: white; border: 1px solid #e2e8f0; color: #64748b; padding: 10px; border-radius: 14px; }
        .stats-capsule-vertical { background: #0f172a; border-radius: 32px; }
        .stat-icon-wrap { width: 45px; height: 45px; background: rgba(255,255,255,0.05); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: white; }
        .stat-label-premium { font-size: 0.65rem; text-transform: uppercase; font-weight: 700; color: #94a3b8; margin: 0; }
        .btn-nav-premium { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 12px; border-radius: 14px; text-align: left; font-size: 0.85rem; font-weight: 600; }
        .fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

export default ProfileContent;