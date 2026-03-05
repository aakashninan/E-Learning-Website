import React, { useState, useEffect, useMemo } from "react";
import { Lock, CheckCircle, ArrowLeft, PlayCircle, Send } from "lucide-react";

const Course = ({ courseId, setActiveView }) => {
  const [courseData, setCourseData] = useState(null);
  const [curriculum, setCurriculum] = useState([]);
  const [activeLessonId, setActiveLessonId] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  const userEmail = localStorage.getItem("userEmail") || "";

  /* ================= FETCH COURSE & RESUME PROGRESS ================= */
  useEffect(() => {
    const initCourse = async () => {
      if (!courseId || !userEmail) return;
      
      try {
        setLoading(true);
        const courseRes = await fetch(`http://127.0.0.1:5001/api/courses/${courseId}`);
        if (!courseRes.ok) throw new Error("Course not found");
        const data = await courseRes.json();

        const progressRes = await fetch(`http://127.0.0.1:5001/api/user/courses/${userEmail.toLowerCase()}`);
        const progressData = await progressRes.json();
        
        const enrollment = progressData.courses?.find(c => Number(c.id) === Number(courseId));
        const savedPercent = enrollment?.progress || 0;

        const completedCount = Math.floor((savedPercent / 100) * (data.lessons?.length || 0));

        const mappedLessons = (data.lessons || []).map((lesson, index) => {
          let status = "locked";
          if (index < completedCount) status = "completed";
          else if (index === completedCount) status = "active";
          return { ...lesson, status };
        });

        setCourseData(data);
        setCurriculum(mappedLessons);
        
        const firstActive = mappedLessons.find(l => l.status === "active") || mappedLessons[0];
        setActiveLessonId(firstActive?.id);
      } catch (err) {
        console.error("Course load failed:", err);
      } finally {
        setLoading(false);
      }
    };

    initCourse();
  }, [courseId, userEmail]);

  /* ================= FETCH PREVIOUS COMMENTS (FIXED) ================= */
  useEffect(() => {
    if (!activeLessonId || !courseId) return;
    
    const fetchComments = async () => {
      try {
        // Fetch all course comments and filter locally for persistence
        const res = await fetch(`http://127.0.0.1:5001/api/comments/${courseId}/all`);
        const data = await res.json();
        
        // Ensure comments are filtered by the specific lesson the student is viewing
        const filtered = Array.isArray(data) 
          ? data.filter(c => Number(c.lessonId) === Number(activeLessonId))
          : [];

        setComments(filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } catch (err) { 
        console.error("Discussion load error:", err); 
        setComments([]);
      }
    };
    fetchComments();
  }, [activeLessonId, courseId]);

  /* ================= COMPUTED STATE ================= */
  const currentLesson = useMemo(() => 
    curriculum.find((l) => Number(l.id) === Number(activeLessonId)), 
    [curriculum, activeLessonId]
  );

  const progress = useMemo(() => {
    if (!curriculum.length) return 0;
    const completed = curriculum.filter((l) => l.status === "completed").length;
    return Math.round((completed / curriculum.length) * 100);
  }, [curriculum]);

  /* ================= ACTIONS ================= */
  const handleComplete = async () => {
    const currentIndex = curriculum.findIndex((l) => Number(l.id) === Number(activeLessonId));
    
    const nextCurriculum = curriculum.map((lesson, index) => {
      if (Number(lesson.id) === Number(activeLessonId)) return { ...lesson, status: "completed" };
      if (index === currentIndex + 1) return { ...lesson, status: "active" };
      return lesson;
    });
    setCurriculum(nextCurriculum);

    const completedCount = nextCurriculum.filter(l => l.status === "completed").length;
    const newProgressPercent = Math.round((completedCount / curriculum.length) * 100);

    try {
      await fetch('http://127.0.0.1:5001/api/admin/grade-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentEmail: userEmail.toLowerCase(),
          courseId: Number(courseId),
          assignmentId: 0,
          grade: newProgressPercent 
        })
      });
      
      if (currentIndex < curriculum.length - 1) {
        setActiveLessonId(curriculum[currentIndex + 1].id);
      }
    } catch (err) {
      console.error("Sync failed:", err);
    }
  };

  const handleAddComment = async (e) => {
    if (e) e.preventDefault();
    if (!newComment.trim()) return;

    const author = localStorage.getItem("userName") || "Scholar";
    const tempId = Date.now().toString();
    const tempComment = { 
        _id: tempId, 
        name: author, 
        text: newComment, 
        createdAt: new Date().toISOString(),
        replies: []
    };

    setComments(prev => [tempComment, ...prev]);
    const commentBody = newComment;
    setNewComment("");

    try {
      const res = await fetch("http://127.0.0.1:5001/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            courseId: Number(courseId), 
            lessonId: Number(activeLessonId), 
            email: userEmail.toLowerCase(), 
            name: author, 
            text: commentBody 
        }),
      });
      const saved = await res.json();
      setComments(prev => prev.map(c => c._id === tempId ? saved : c));
    } catch (err) {
      setComments(prev => prev.filter(c => c._id !== tempId));
      alert("Discussion sync failed.");
    }
  };

  if (loading) return (
    <div className="vh-100 d-flex flex-column align-items-center justify-content-center bg-white">
        <div className="spinner-border text-primary mb-3" role="status"></div>
        <h5 className="fw-bold text-dark">Syncing Knowledge Base...</h5>
    </div>
  );

  return (
    <div className="player-ui">
      <header className="player-top shadow-sm">
        <button className="btn btn-outline-dark btn-sm rounded-pill px-3 fw-bold" onClick={() => setActiveView("dashboard")}>
          <ArrowLeft size={16} className="me-1" /> Back
        </button>
        <div className="ms-4 flex-grow-1">
          <h5 className="m-0 fw-black text-dark">{courseData?.title}</h5>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="fw-black text-primary small uppercase">{progress}% Mastered</div>
          <div className="progress" style={{ width: 140, height: 10, borderRadius: 20 }}>
            <div className="progress-bar bg-primary" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </header>

      <div className="player-grid">
        <section className="video-section">
          <div className="video-holder shadow-lg">
            <iframe 
                key={activeLessonId} 
                src={`https://www.youtube.com/embed/${currentLesson?.videoId}?rel=0&autoplay=1`} 
                allow="autoplay; encrypted-media"
                allowFullScreen 
            />
          </div>

          <div className="lesson-details d-flex justify-content-between align-items-center mt-4">
            <h2 className="fw-black text-slate-900">{currentLesson?.title}</h2>
            <button 
                className={`btn rounded-pill px-5 py-3 fw-black ${currentLesson?.status === "completed" ? 'btn-success' : 'btn-primary'}`} 
                onClick={handleComplete} 
                disabled={currentLesson?.status === "completed"}
            >
              {currentLesson?.status === "completed" ? "Module Completed" : "Mark as Mastered"} 
              <CheckCircle size={20} className="ms-2" />
            </button>
          </div>

          <hr className="my-5" />

          <div className="comments-section bg-white shadow-sm border">
            <h5 className="fw-black mb-4">Discussion Board</h5>
            <form className="comment-input" onSubmit={handleAddComment}>
              <input type="text" placeholder="Share your insight..." value={newComment} onChange={(e) => setNewComment(e.target.value)} />
              <button type="submit"><Send size={18} /></button>
            </form>

            <div className="comments-list">
              {comments.map((c) => (
                <div key={c._id} className="comment-card border shadow-sm">
                  <div className="comment-header d-flex justify-content-between mb-2">
                    <strong className="text-primary small">@{c.name}</strong>
                    <span className="text-muted smaller">{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="m-0 text-dark">{c.text}</p>
                  
                  {/* RENDERING ADMIN REPLIES */}
                  {c.replies?.map((r, i) => (
                    <div key={i} className="mt-2 ms-3 p-2 bg-light border-start border-info border-3 rounded small">
                      <strong className="text-info">Instructor:</strong> {r.text}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="syllabus-sidebar bg-white border-start">
          <h6 className="fw-black text-uppercase small text-muted mb-4">Curriculum</h6>
          {curriculum.map((lesson, idx) => (
            <div
              key={lesson.id}
              className={`lesson-tile mb-2 ${lesson.status} ${Number(activeLessonId) === Number(lesson.id) ? "active" : ""}`}
              onClick={() => lesson.status !== "locked" && setActiveLessonId(lesson.id)}
            >
              <div className="status-icon">
                {lesson.status === "locked" ? <Lock size={14} /> : 
                 lesson.status === "completed" ? <CheckCircle size={18} className="text-success" /> : 
                 <PlayCircle size={18} className="text-primary" />}
              </div>
              <div className="ms-3">
                  <div className="smaller text-muted fw-bold">Module {idx + 1}</div>
                  <div className="fw-bold text-dark">{lesson.title}</div>
              </div>
            </div>
          ))}
        </aside>
      </div>

      <style>{`
        .player-ui { height: 100vh; display: flex; flex-direction: column; background: #f8fafc; }
        .player-top { display: flex; align-items: center; padding: 15px 40px; background: white; border-bottom: 1px solid #f1f5f9; }
        .player-grid { flex: 1; display: grid; grid-template-columns: 1fr 420px; overflow: hidden; }
        .video-section { padding: 40px; overflow-y: auto; }
        .video-holder { width: 100%; aspect-ratio: 16/9; background: #000; border-radius: 20px; overflow: hidden; }
        .video-holder iframe { width: 100%; height: 100%; border: none; }
        .comments-section { padding: 30px; border-radius: 24px; }
        .comment-input { display: flex; gap: 12px; margin-bottom: 30px; }
        .comment-input input { flex: 1; padding: 14px 20px; border-radius: 15px; border: 2px solid #f1f5f9; background: #f8fafc; outline: none; }
        .comment-card { background: #fff; padding: 20px; border-radius: 18px; margin-bottom: 15px; }
        .syllabus-sidebar { padding: 30px; overflow-y: auto; }
        .lesson-tile { padding: 18px; border-radius: 16px; cursor: pointer; display: flex; align-items: center; transition: 0.2s; }
        .lesson-tile.active { background: #f0f9ff; border: 1px solid #e0f2fe; }
        .lesson-tile.locked { opacity: 0.4; cursor: not-allowed; }
        .fw-black { font-weight: 900; }
        .smaller { font-size: 0.65rem; }
      `}</style>
    </div>
  );
};

export default Course;