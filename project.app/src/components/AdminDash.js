import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiArrowLeft, FiPlus, FiTrash2, FiLayers, FiSearch, FiMessageSquare, FiSend, FiCheckCircle, FiFileText, FiBookOpen, FiAward, FiExternalLink, FiEdit3, FiDownloadCloud
} from 'react-icons/fi';

const AdminDash = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('My Courses');
  const [managedCourse, setManagedCourse] = useState(null);
  
  // Data States
  const [myCourses, setMyCourses] = useState([]);
  const [libraryCourses, setLibraryCourses] = useState([]);
  const [roster, setRoster] = useState([]); 
  const [searchQuery, setSearchQuery] = useState('');
  const [comments, setComments] = useState([]);
  const [replyText, setReplyText] = useState({});

  // Curriculum States
  const [isCreating, setIsCreating] = useState(false);
  const [newCourse, setNewCourse] = useState({ 
    title: '', 
    category: '', 
    description: '',
    modules: ['', ''],
    quizzes: Array(10).fill(null).map(() => ({ 
      question: '', 
      options: ['', '', '', ''], 
      correct: 0 
    })),
    assignments: [{ title: '', task: '' }]
  });

  const adminEmail = localStorage.getItem("userEmail");
  const adminName = localStorage.getItem("userName") || "Instructor";

  /* ================================
     1. DATA FETCHING & SYNC
  ================================ */
  const fetchData = useCallback(async () => {
    if (!adminEmail) return;
    try {
      const [myRes, libRes] = await Promise.all([
        fetch(`http://127.0.0.1:5001/api/admin/courses/${adminEmail.toLowerCase()}`),
        fetch(`http://127.0.0.1:5001/api/courses`)
      ]);
      if (myRes.ok) setMyCourses(await myRes.json());
      if (libRes.ok) setLibraryCourses(await libRes.json());
    } catch (e) { console.error("Sync error:", e); }
  }, [adminEmail]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  const refreshCourseDetails = useCallback(async () => {
    if (!managedCourse) return;
    try {
      const [rosterRes, commentRes] = await Promise.all([
        fetch(`http://127.0.0.1:5001/api/admin/course-stats/${managedCourse.id}`),
        fetch(`http://127.0.0.1:5001/api/comments/${managedCourse.id}/all`)
      ]);
      
      if (rosterRes.ok) {
        const data = await rosterRes.json();
        const sanitizedRoster = data.map(s => {
          let raw = s.quizData?.score ?? s.quizScore ?? null;
          let percentage = (raw !== null && raw <= 10) ? raw * 10 : (raw || 0);
          return { ...s, displayScore: percentage, studentAssignments: s.assignments || [] };
        });
        setRoster(sanitizedRoster);
      }

      if (commentRes.ok) {
        const commData = await commentRes.json();
        setComments(commData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      }
    } catch (err) { console.error("Data Sync failed", err); }
  }, [managedCourse]);

  useEffect(() => {
    if (managedCourse) {
      refreshCourseDetails();
      const interval = setInterval(refreshCourseDetails, 8000);
      return () => clearInterval(interval);
    }
  }, [managedCourse, refreshCourseDetails]);

  /* ================================
     2. HANDLERS
  ================================ */

  // DELETE LOGIC: Synced with Backend DELETE endpoint
  const handleDeleteCourse = async (e, courseId) => {
    e.stopPropagation();
    if (!window.confirm("Permanently delete this course and all student submissions? This cannot be undone.")) return;

    try {
      const res = await fetch(`http://127.0.0.1:5001/api/admin/delete-course/${courseId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        alert("Course purged from database.");
        fetchData();
      } else {
        alert("Removal failed.");
      }
    } catch (err) { console.error("Delete sync failed"); }
  };

  const handleTakeUpCourse = async (e, course) => {
    e.stopPropagation();
    if (!window.confirm(`Confirm taking over "${course.title}" as instructor?`)) return;

    try {
      const res = await fetch(`http://127.0.0.1:5001/api/admin/claim-course`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id,
          newInstructorEmail: adminEmail.toLowerCase(),
          newInstructorName: adminName
        })
      });

      if (res.ok) {
        alert("Course successfully added to your dashboard!");
        setActiveTab('My Courses');
        fetchData();
      } else {
        alert("Failed to claim course.");
      }
    } catch (err) {
      console.error("Network error claiming course:", err);
    }
  };

  const handleGradeStudent = async (studentEmail, assignmentId) => {
    const grade = prompt("Enter numeric grade for this assignment (0-100):");
    if (grade === null || grade === "" || isNaN(grade)) return;

    try {
      const res = await fetch('http://127.0.0.1:5001/api/admin/grade-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentEmail: studentEmail.toLowerCase(),
          courseId: managedCourse.id,
          assignmentId: assignmentId,
          grade: Number(grade)
        })
      });

      if (res.ok) {
        alert("Grade recorded successfully.");
        refreshCourseDetails();
      }
    } catch (err) { alert("Grading sync failed."); }
  };

  const handlePostReply = async (commentId) => {
    const text = replyText[commentId];
    if (!text?.trim()) return;
    try {
      const res = await fetch(`http://127.0.0.1:5001/api/comments/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, text, adminName, adminEmail })
      });
      if (res.ok) {
        setReplyText(prev => ({ ...prev, [commentId]: '' }));
        refreshCourseDetails(); 
      }
    } catch (err) { console.error("Reply failed"); }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    const formattedLessons = newCourse.modules.map((m, i) => ({
        id: i + 1,
        title: m,
        videoId: "dQw4w9WgXcQ", 
    }));

    // PAYLOAD FIX: Explicitly naming the assessment title so students can find it
    const payload = {
      title: newCourse.title,
      category: newCourse.category,
      description: newCourse.description,
      instructorEmail: adminEmail,
      instructorName: adminName,
      lessons: formattedLessons,
      // Ensure quizzes have required metadata
      quizzes: newCourse.quizzes, 
      assignments: newCourse.assignments.filter(a => a.title.trim() !== "")
    };

    try {
      const res = await fetch('http://127.0.0.1:5001/api/admin/create-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert("Curriculum Deployed!");
        setIsCreating(false);
        fetchData();
      }
    } catch (err) { alert("Deployment issue."); }
  };

  const handleIssueCertificate = async (student) => {
    if (student.displayScore < 70) {
      return alert(`Ineligible: Student score (${student.displayScore}%) is below the 70% threshold.`);
    }

    try {
      const res = await fetch(`http://127.0.0.1:5001/api/admin/issue-certificate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          courseId: managedCourse.id, 
          courseTitle: managedCourse.title,
          studentEmail: student.email.toLowerCase(), 
          studentName: `${student.firstName} ${student.lastName}`,
          issuedBy: adminName 
        })
      });

      if (res.ok) {
        alert(`✅ Certificate successfully issued to ${student.firstName}!`);
      }
    } catch (err) { console.error("Certificate Issue Error"); }
  };

  const updateQuizField = (qIdx, field, value) => {
    setNewCourse(prev => {
      const updatedQuizzes = [...prev.quizzes];
      updatedQuizzes[qIdx] = { ...updatedQuizzes[qIdx], [field]: value };
      return { ...prev, quizzes: updatedQuizzes };
    });
  };

  const updateQuizOption = (qIdx, oIdx, value) => {
    setNewCourse(prev => {
      const updatedQuizzes = [...prev.quizzes];
      const updatedOptions = [...updatedQuizzes[qIdx].options];
      updatedOptions[oIdx] = value;
      updatedQuizzes[qIdx] = { ...updatedQuizzes[qIdx], options: updatedOptions };
      return { ...prev, quizzes: updatedQuizzes };
    });
  };

  const displayedCourses = activeTab === 'My Courses' 
    ? myCourses 
    : libraryCourses.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="d-flex min-vh-100 bg-light" style={{fontFamily: "'Inter', sans-serif"}}>
      <aside className="bg-dark text-white p-4 shadow" style={{ width: '280px', position: 'fixed', height: '100vh', zIndex: 100 }}>
        <div className="fw-black fs-4 text-info mb-5" style={{fontWeight: 900}}>RAJAGIRI HUB</div>
        <nav>
          {['My Courses', 'Library'].map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setManagedCourse(null); }} 
              className={`btn w-100 text-start mb-2 py-3 border-0 rounded-3 fw-bold ${activeTab === tab ? 'bg-info text-dark shadow-sm' : 'btn-outline-light text-white-50'}`}>
              {tab === 'Library' ? <FiBookOpen className="me-2"/> : <FiLayers className="me-2"/>} {tab}
            </button>
          ))}
        </nav>
        <button onClick={onLogout} className="btn btn-outline-danger w-100 rounded-pill mt-auto fw-bold">Sign Out</button>
      </aside>

      <main className="flex-grow-1 p-5" style={{ marginLeft: '280px' }}>
        {managedCourse ? (
          <div>
            <button className="btn btn-sm btn-link text-decoration-none p-0 mb-4 text-secondary fw-bold" onClick={() => setManagedCourse(null)}>
              <FiArrowLeft className="me-1"/> Back to Dashboard
            </button>
            <h1 className="fw-black text-dark mb-5" style={{fontWeight: 900}}>{managedCourse.title}</h1>
            
            <div className="row g-4">
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                        <h5 className="fw-bold mb-4">Student Assessment Tracking</h5>
                        <div className="table-responsive">
                          <table className="table align-middle">
                              <thead className="bg-light">
                                  <tr className="small text-muted text-uppercase">
                                      <th>Student</th><th>Submissions/Files</th><th>Quiz Score</th><th>Actions</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {roster.map(s => (
                                      <tr key={s.email}>
                                          <td><div className="fw-bold">{s.firstName} {s.lastName}</div><div className="small text-muted">{s.email}</div></td>
                                          <td>
                                              {s.studentAssignments && s.studentAssignments.length > 0 ? s.studentAssignments.map(a => (
                                                  <div key={a.id} className="mb-2 p-2 border rounded-3 bg-light" style={{minWidth: '220px'}}>
                                                      <div className="small fw-bold text-truncate">{a.title}</div>
                                                      <div className="d-flex gap-2 mt-1">
                                                          {a.fileUrl ? (
                                                              <>
                                                                  <a href={a.fileUrl} target="_blank" rel="noreferrer" className="btn btn-xs btn-outline-primary px-2 py-1 rounded-pill" style={{fontSize: '10px'}}>
                                                                      <FiExternalLink size={10}/> View File
                                                                  </a>
                                                                  <button onClick={() => handleGradeStudent(s.email, a.id)} className="btn btn-xs btn-success px-2 py-1 rounded-pill" style={{fontSize: '10px'}}>
                                                                      <FiEdit3 size={10}/> {a.grade !== null ? `Graded: ${a.grade}` : "Grade Now"}
                                                                  </button>
                                                              </>
                                                          ) : <span className="smaller text-muted italic">No submission yet</span>}
                                                      </div>
                                                  </div>
                                              )) : <span className="text-muted small">No assignments assigned</span>}
                                          </td>
                                          <td><span className={`fw-bold ${s.displayScore >= 70 ? 'text-success' : 'text-danger'}`}>{s.displayScore}%</span></td>
                                          <td>
                                              {s.displayScore >= 70 ? (
                                                  <button className="btn btn-sm btn-info rounded-pill px-3 fw-bold shadow-sm" onClick={() => handleIssueCertificate(s)}>
                                                      <FiAward className="me-1"/> Issue Cert
                                                  </button>
                                              ) : <span className="badge bg-light text-muted border rounded-pill">Ineligible</span>}
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                        </div>
                    </div>
                </div>

                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white" style={{maxHeight: '600px', overflowY: 'auto'}}>
                        <h5 className="fw-bold mb-4"><FiMessageSquare className="me-2 text-info"/>Course Discussions</h5>
                        {comments.map(c => (
                            <div key={c._id} className="mb-4 pb-2 border-bottom">
                                <div className="fw-bold small text-primary">{c.name}</div>
                                <p className="small text-dark mb-2 bg-light p-2 rounded">{c.text}</p>
                                {c.replies?.map((r, i) => (
                                    <div key={i} className="ms-3 bg-info-subtle p-2 rounded-3 mb-1 small border-start border-info border-3">
                                        <strong>You:</strong> {r.text}
                                    </div>
                                ))}
                                <div className="input-group input-group-sm mt-2">
                                    <input type="text" className="form-control" placeholder="Reply..." 
                                        value={replyText[c._id] || ''}
                                        onChange={(e) => setReplyText({...replyText, [c._id]: e.target.value})} />
                                    <button className="btn btn-info" onClick={() => handlePostReply(c._id)}><FiSend/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-5">
               <h1 className="fw-black text-dark m-0" style={{fontWeight: 900}}>{activeTab}</h1>
               <div className="input-group w-25 border rounded-pill overflow-hidden bg-white">
                 <span className="input-group-text bg-white border-0"><FiSearch/></span>
                 <input type="text" className="form-control border-0" placeholder="Search courses..." onChange={(e) => setSearchQuery(e.target.value)} />
               </div>
            </div>
            <div className="row g-4">
              {activeTab === 'My Courses' && (
                <div className="col-md-4" onClick={() => setIsCreating(true)} style={{cursor: 'pointer'}}>
                  <div className="card h-100 border-2 border-dashed border-info p-5 rounded-4 d-flex align-items-center justify-content-center text-info shadow-hover">
                    <FiPlus size={40}/><h5 className="fw-bold">New Curriculum</h5>
                  </div>
                </div>
              )}
              
              {displayedCourses.map(c => (
                <div key={c.id || c._id} className="col-md-4 position-relative">
                  <div className="card h-100 border-0 shadow-sm p-4 rounded-4 bg-white hover-up" 
                    onClick={() => activeTab === 'My Courses' && setManagedCourse(c)} 
                    style={{cursor: activeTab === 'My Courses' ? 'pointer' : 'default'}}>
                    
                    {/* PERMANENT DELETE OPTION */}
                    <button className="btn btn-sm btn-light text-danger position-absolute top-0 end-0 m-3 rounded-circle shadow-sm"
                            onClick={(e) => handleDeleteCourse(e, c.id)}>
                      <FiTrash2 />
                    </button>

                    <div className="badge bg-info-subtle text-info mb-2 align-self-start rounded-pill px-3">{c.category}</div>
                    <h4 className="fw-bold m-0">{c.title}</h4>
                    <p className="text-muted small mt-2">{c.instructor}</p>

                    {activeTab === 'Library' && c.instructorEmail !== adminEmail && (
                        <button 
                            className="btn btn-sm btn-info w-100 mt-3 rounded-pill fw-bold"
                            onClick={(e) => handleTakeUpCourse(e, c)}>
                            <FiDownloadCloud className="me-2"/> Take Up Course
                        </button>
                    )}

                    {activeTab === 'Library' && c.instructorEmail === adminEmail && (
                        <span className="badge bg-success-subtle text-success small mt-3 rounded-pill d-block">Already Enrolled as Admin</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isCreating && (
          <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 2000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
            <div className="card border-0 shadow-lg rounded-4 p-5 w-75 overflow-auto" style={{maxHeight: '90vh'}}>
              <h3 className="fw-black mb-4" style={{fontWeight: 900}}>Architect New Curriculum</h3>
              <form onSubmit={handleCreateCourse}>
                <div className="row g-3 mb-4">
                    <div className="col-md-6"><input className="form-control p-3 bg-light border-0" placeholder="Course Title" required value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} /></div>
                    <div className="col-md-6"><input className="form-control p-3 bg-light border-0" placeholder="Category" required value={newCourse.category} onChange={e => setNewCourse({...newCourse, category: e.target.value})} /></div>
                </div>
                
                <h6 className="fw-bold text-primary mb-3">Study Modules</h6>
                <div className="row g-2 mb-4">
                  {newCourse.modules.map((m, idx) => (
                    <div className="col-md-6" key={idx}>
                      <input type="text" className="form-control bg-light border-0" placeholder={`Module ${idx + 1} Title`} value={m} 
                        onChange={(e) => {
                          const copy = [...newCourse.modules]; copy[idx] = e.target.value; setNewCourse({...newCourse, modules: copy});
                        }} />
                    </div>
                  ))}
                  <div className="col-12"><button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setNewCourse({...newCourse, modules: [...newCourse.modules, '']})}>+ Add Module</button></div>
                </div>

                <h6 className="fw-bold text-warning mb-3">Project Assignments</h6>
                {newCourse.assignments.map((a, i) => (
                  <div key={i} className="mb-3 p-3 bg-light rounded-3 position-relative">
                    <input className="form-control mb-2 border-0 shadow-sm" placeholder="Assignment Title" value={a.title} onChange={e => {
                      const copy = [...newCourse.assignments]; copy[i].title = e.target.value; setNewCourse({...newCourse, assignments: copy});
                    }} />
                    <textarea className="form-control border-0 shadow-sm" placeholder="Task details..." value={a.task} onChange={e => {
                      const copy = [...newCourse.assignments]; copy[i].task = e.target.value; setNewCourse({...newCourse, assignments: copy});
                    }} />
                  </div>
                ))}
                <button type="button" className="btn btn-sm btn-outline-warning mb-4 rounded-pill" onClick={() => setNewCourse({...newCourse, assignments: [...newCourse.assignments, {title:'', task:''}]})}>+ Add Assignment</button>
                
                <h6 className="fw-bold mb-3 text-info"><FiCheckCircle className="me-2"/>Final Assessment (10 Questions)</h6>
                <div className="bg-white border rounded-4 overflow-hidden shadow-sm mb-4">
                  {newCourse.quizzes.map((q, idx) => (
                    <div className="p-4 border-bottom bg-gray-50" key={idx}>
                      <input type="text" className="form-control mb-3 border-0 shadow-sm fw-bold" placeholder={`Quiz Question ${idx + 1}`} required value={q.question} onChange={(e) => updateQuizField(idx, 'question', e.target.value)} />
                      <div className="row g-2">
                        {q.options.map((opt, oIdx) => (
                          <div className="col-6" key={oIdx}>
                            <div className="input-group input-group-sm">
                              <span className="input-group-text bg-white border-0">
                                <input type="radio" name={`ans-${idx}`} checked={q.correct === oIdx} onChange={() => updateQuizField(idx, 'correct', oIdx)} />
                              </span>
                              <input type="text" className="form-control border-0 bg-light" placeholder={`Option ${oIdx + 1}`} required value={opt} 
                                     onChange={(e) => updateQuizOption(idx, oIdx, e.target.value)} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary flex-grow-1 py-3 rounded-pill fw-bold shadow">Deploy Course</button>
                    <button type="button" className="btn btn-light px-4 rounded-pill" onClick={() => setIsCreating(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <style>{`
        .hover-up:hover { transform: translateY(-8px); transition: 0.3s ease; }
        .shadow-hover:hover { box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
        .btn-xs { padding: 0.25rem 0.5rem; font-size: 0.75rem; }
        .italic { font-style: italic; }
        .bg-gray-50 { background-color: #f9fafb; }
      `}</style>
    </div>
  );
};

export default AdminDash;