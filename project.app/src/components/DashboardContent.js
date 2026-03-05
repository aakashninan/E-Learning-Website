import React, { useState, useEffect, useMemo } from 'react';

function DashboardContent({ setActiveView, searchTerm = "" }) {
    const [courses, setCourses] = useState([]);
    const [displayName, setDisplayName] = useState('Scholar');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastSynced, setLastSynced] = useState(new Date().toLocaleTimeString());

    useEffect(() => {
        const fetchUserCourses = async () => {
            const email = localStorage.getItem('userEmail');
            if (!email) {
                setError("Session expired. Please log in again.");
                setLoading(false);
                return;
            }
            try {
                // Fetch student data from MERN backend (Port 5001)
                const response = await fetch(`http://127.0.0.1:5001/api/user/courses/${email.toLowerCase()}`);
                if (!response.ok) throw new Error('Failed to synchronize course data');
                
                const data = await response.json();
                
                // Set name if available from DB profile
                if (data.firstName) {
                    setDisplayName(data.firstName);
                }
                
                // Target data.courses array returned from your server logic
                setCourses(Array.isArray(data.courses) ? data.courses : []);
                setLastSynced(new Date().toLocaleTimeString());
                setError(null);
            } catch (err) {
                console.error("Dashboard error:", err);
                setError("Unable to connect to the knowledge base. Please ensure your server is running.");
            } finally {
                setLoading(false);
            }
        };
        fetchUserCourses();
    }, []);

    // Filter courses based on search input with data safety fallbacks
    const filteredCourses = useMemo(() => {
        const query = searchTerm.toLowerCase().trim();
        if (!query) return courses;
        return courses.filter(course => 
            String(course.title || "").toLowerCase().includes(query) ||
            String(course.category || "").toLowerCase().includes(query)
        );
    }, [searchTerm, courses]);

    // Calculate aggregate progress for the mastery stats
    const averageProgress = useMemo(() => {
        if (courses.length === 0) return 0;
        const total = courses.reduce((acc, curr) => acc + (curr.progress || 0), 0);
        return Math.round(total / courses.length);
    }, [courses]);

    if (loading) return (
        <div className="loader-wrapper d-flex flex-column align-items-center justify-content-center vh-100">
            <div className="premium-loader"></div>
            <p className="mt-3 fw-bold text-primary animate-pulse">Syncing Knowledge Base...</p>
        </div>
    );

    if (error) return (
        <div className="container py-5 text-center">
            <div className="glass-alert mx-auto d-inline-flex align-items-center p-4 rounded-4 shadow-sm">
                <span className="alert-icon me-3">⚠️</span>
                <div className="text-start">
                    <h4 className="fw-bold m-0 text-dark">Connection Issue</h4>
                    <p className="m-0 opacity-75 small">{error}</p>
                    <button className="btn btn-sm btn-outline-warning mt-2 rounded-pill" onClick={() => window.location.reload()}>Retry Sync</button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="dashboard-premium fade-in">
            <div className="container py-5">
                {/* --- Dynamic Top Header --- */}
                <header className="row align-items-center mb-5 gy-4">
                    <div className="col-lg-6 text-center text-lg-start">
                        <p className="text-overline mb-1 text-primary fw-black tracking-widest uppercase small">
                            Overview • Synced at {lastSynced}
                        </p>
                        <h1 className="display-5 fw-black text-slate-900 m-0">
                            Welcome back, <span className="text-primary">{displayName}</span>
                        </h1>
                    </div>
                    
                    <div className="col-lg-6">
                        <div className="quick-stats-grid d-flex gap-3 justify-content-lg-end justify-content-center">
                            <div className="stat-pill shadow-sm border bg-white p-3 rounded-4 min-w-150">
                                <span className="stat-pill-label d-block small text-muted fw-bold">AVG. MASTERY</span>
                                <span className="stat-pill-value h3 fw-black text-primary m-0">{averageProgress}%</span>
                            </div>
                            <div className="stat-pill shadow-sm border bg-white p-3 rounded-4 min-w-150">
                                <span className="stat-pill-label d-block small text-muted fw-bold">COMPLETED</span>
                                <span className="stat-pill-value h3 fw-black text-success m-0">
                                    {courses.filter(c => (c.progress || 0) >= 100).length}
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* --- Content Header --- */}
                <div className="mb-4 d-flex align-items-center justify-content-between">
                    <h4 className="fw-bold m-0 text-slate-800 border-start border-4 border-primary ps-3">Your Curriculum</h4>
                    {searchTerm && (
                        <div className="active-filter-tag small">
                            Filtering: <span className="fw-black text-primary">"{searchTerm}"</span>
                        </div>
                    )}
                </div>

                {filteredCourses.length === 0 ? (
                    <div className="empty-state-card shadow-sm border bg-white p-5 text-center rounded-5">
                        <div className="empty-icon display-4 mb-3">📚</div>
                        <h3 className="fw-black text-slate-800">No Courses Found</h3>
                        <p className="text-slate-500">Try adjusting your search or explore the library for new topics.</p>
                        <button className="btn btn-primary rounded-pill px-4 fw-bold" onClick={() => setActiveView('catalogue')}>Explore Catalogue</button>
                    </div>
                ) : (
                    <div className="row g-4">
                        {filteredCourses.map((course) => (
                            <div key={course._id || course.id} className="col-12 col-md-6 col-xl-3">
                                <div 
                                    className="bento-course-card shadow-sm border bg-white rounded-5 overflow-hidden position-relative h-100" 
                                    style={{ '--theme': course.color || '#6366f1', cursor: 'pointer' }}
                                    onClick={() => {
                                        // Ensuring we pass the ID that Course.js expects (manual id or mongo _id)
                                        const targetId = course.id || course._id;
                                        setActiveView('course', targetId);
                                    }}
                                >
                                    <div className="card-visual position-relative" style={{ height: '160px' }}>
                                        <img 
                                            className="w-100 h-100 object-fit-cover transition-transform"
                                            src={course.imageUrl || 'https://images.unsplash.com/photo-1501504905953-f8c97f33e1f1?w=500'} 
                                            alt={course.title} 
                                        />
                                        <div className="category-tag position-absolute top-0 start-0 m-3 badge bg-white text-dark shadow-sm">
                                            {course.category || 'General'}
                                        </div>
                                    </div>
                                    
                                    <div className="card-content p-4">
                                        <h5 className="course-name fw-black text-slate-900 mb-1 text-truncate">{course.title}</h5>
                                        <p className="small fw-bold text-slate-400 mb-4">By Faculty</p>
                                        
                                        <div className="mastery-section">
                                            <div className="d-flex justify-content-between mb-2 small fw-black">
                                                <span className="text-uppercase tracking-tighter text-slate-500">Mastery</span>
                                                <span className="text-slate-900">{course.progress || 0}%</span>
                                            </div>
                                            <div className="premium-progress bg-light rounded-pill" style={{ height: '8px' }}>
                                                <div 
                                                    className="premium-progress-bar h-100 rounded-pill" 
                                                    style={{ 
                                                        width: `${course.progress || 0}%`, 
                                                        backgroundColor: course.color || '#6366f1',
                                                        transition: 'width 1s ease-out'
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card-hover-overlay position-absolute bottom-0 start-0 w-100 p-3 text-white text-center fw-bold transition-all" style={{ backgroundColor: course.color || '#6366f1', transform: 'translateY(100%)' }}>
                                        Open Module →
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                .dashboard-premium { background: #f8fafc; min-height: 100vh; font-family: 'Inter', sans-serif; }
                .fw-black { font-weight: 900; letter-spacing: -0.02em; }
                .text-slate-900 { color: #0f172a; }
                .text-slate-500 { color: #64748b; }
                .text-slate-400 { color: #94a3b8; }
                .min-w-150 { min-width: 160px; }

                .premium-loader { width: 45px; height: 45px; border: 5px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin 1s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }

                .bento-course-card { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
                .bento-course-card:hover { transform: translateY(-8px); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15) !important; }
                .bento-course-card:hover .card-hover-overlay { transform: translateY(0); }
                .bento-course-card:hover img { transform: scale(1.05); }
                
                .active-filter-tag { background: #eff6ff; color: #1e40af; padding: 8px 18px; border-radius: 100px; border: 1px solid #dbeafe; }
                
                .fade-in { animation: fadeIn 0.6s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                
                @media (max-width: 992px) { 
                    .quick-stats-grid { justify-content: flex-start !important; margin-top: 20px; } 
                    .display-5 { font-size: 2.2rem; }
                }
            `}</style>
        </div>
    );
}

export default DashboardContent;