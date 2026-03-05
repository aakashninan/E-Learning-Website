import React, { useState, useEffect } from 'react';
import {
  ChevronRight, ChevronLeft, ArrowLeft, Clock, Trophy,
  CheckCircle2, BarChart3, Lock, Info, XCircle, Target
} from 'lucide-react';

const Quizzes = ({ searchTerm = "" }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const [loading, setLoading] = useState(true);
  const [userAnswers, setUserAnswers] = useState({});
  const [finalScore, setFinalScore] = useState(0);
  const [serverPassed, setServerPassed] = useState(false);

  // ---------------- FETCH QUIZZES ----------------
  const fetchUserQuizzes = async () => {
    const email = localStorage.getItem('userEmail');
    if (!email) return;
    try {
      const response = await fetch(`http://127.0.0.1:5001/api/user/quizzes/${email}`);
      const data = await response.json();
      setQuizzes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserQuizzes();
  }, []);

  // ---------------- TIMER LOGIC ----------------
  useEffect(() => {
    let timer;
    if (selectedQuiz && !showResult && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && selectedQuiz && !showResult) {
      handleFinalize();
    }
    return () => clearInterval(timer);
  }, [selectedQuiz, showResult, timeLeft]);

  const handleOptionSelect = (optionIndex) => {
    setUserAnswers(prev => ({ ...prev, [currentQuestion]: optionIndex }));
  };

  // ---------------- SUBMIT & STORE MARKS ----------------
  const handleFinalize = async () => {
    const email = localStorage.getItem('userEmail');
    if (!selectedQuiz || !email) return;

    let score = 0;
    selectedQuiz.questions.forEach((q, index) => {
      const selected = userAnswers[index];
      if (selected === undefined) return;

      const correctIdx = typeof q.correct === 'number' 
        ? q.correct 
        : q.correct.toUpperCase().charCodeAt(0) - 65;

      if (selected === correctIdx) score++;
    });

    const passThreshold = Math.ceil(selectedQuiz.questions.length / 2);
    const passed = score >= passThreshold;

    try {
      const response = await fetch('http://127.0.0.1:5001/api/user/quizzes/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase(),
          courseId: Number(selectedQuiz.courseId),
          score: score,
          passed: passed
        })
      });

      if (response.ok) {
        setFinalScore(score);
        setServerPassed(passed);
        setShowResult(true);
      } else {
        const errorData = await response.json();
        alert(`Server failed: ${errorData.message || "Could not save marks"}`);
      }
    } catch (err) {
      console.error("Submission error:", err);
      alert("Network error: Could not connect to server.");
    }
  };

  const resetQuizState = () => {
    setSelectedQuiz(null);
    setCurrentQuestion(0);
    setShowResult(false);
    setUserAnswers({});
    setTimeLeft(600);
    setFinalScore(0);
    setServerPassed(false);
    fetchUserQuizzes();
  };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="spinner-border text-primary" role="status"></div>
    </div>
  );

  // ================= QUIZ ARENA VIEW =================
  if (selectedQuiz) {
    const currentQ = selectedQuiz.questions[currentQuestion];
    const isLastQuestion = currentQuestion + 1 === selectedQuiz.questions.length;
    const percentage = Math.round((finalScore / selectedQuiz.questions.length) * 100);

    return (
      <div className="quiz-arena min-vh-100 bg-light" style={{ '--accent': selectedQuiz.color || '#6366f1' }}>
        <nav className="p-4 d-flex justify-content-between align-items-center bg-white border-bottom sticky-top shadow-sm">
          <button onClick={resetQuizState} className="btn btn-outline-secondary btn-sm rounded-pill fw-bold">
            <ArrowLeft size={16} className="me-1" /> Abort
          </button>
          <div className="bg-dark text-white px-4 py-2 rounded-pill fw-bold d-flex align-items-center shadow">
            <Clock size={18} className="me-2 text-warning" />
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
          <div className="fw-bold text-dark d-none d-md-block">{selectedQuiz.title}</div>
        </nav>

        <div className="container py-5">
          <div className="row justify-content-center">
            <main className="col-lg-8 bg-white p-5 rounded-4 shadow-sm border">
              {showResult ? (
                <div className="text-center fade-in">
                  {serverPassed ? <Trophy size={80} className="text-warning mb-3" /> : <XCircle size={80} className="text-danger mb-3" />}
                  <h1 className="fw-bold display-6">{serverPassed ? "Quest Passed!" : "Assessment Failed"}</h1>
                  
                  <div className="d-flex justify-content-center gap-4 my-5">
                    <div className="p-4 border rounded-4 bg-light flex-fill shadow-sm">
                      <BarChart3 className="text-primary mb-2" />
                      <h3 className="mb-0">{percentage}%</h3>
                      <small className="text-muted">Accuracy</small>
                    </div>
                    <div className="p-4 border rounded-4 bg-light flex-fill shadow-sm">
                      <CheckCircle2 className="text-success mb-2" />
                      <h3 className="mb-0">{finalScore}/{selectedQuiz.questions.length}</h3>
                      <small className="text-muted">Correct</small>
                    </div>
                  </div>
                  <button onClick={resetQuizState} className="btn btn-dark rounded-pill px-5 py-3 fw-bold shadow-sm">Return to Hub</button>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <span className="badge bg-primary-subtle text-primary mb-2 px-3 py-2 rounded-pill">Question {currentQuestion + 1} of {selectedQuiz.questions.length}</span>
                    <h3 className="fw-bold mt-2">{currentQ.q}</h3>
                  </div>
                  <div className="row g-3">
                    {currentQ.options.map((opt, i) => (
                      <div key={i} className="col-md-6">
                        <div 
                          className={`option-card p-4 rounded-4 border-2 h-100 ${userAnswers[currentQuestion] === i ? 'selected-opt shadow-sm' : ''}`}
                          onClick={() => handleOptionSelect(i)}
                        >
                          <span className="opt-index me-3">{String.fromCharCode(65 + i)}</span>
                          <span className="fw-medium">{opt}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="d-flex justify-content-between mt-5 pt-4 border-top">
                    <button disabled={currentQuestion === 0} onClick={() => setCurrentQuestion(prev => prev - 1)} className="btn btn-link text-muted text-decoration-none fw-bold">
                      <ChevronLeft size={18} /> Previous
                    </button>
                    {isLastQuestion ? (
                      <button onClick={handleFinalize} className="btn btn-success rounded-pill px-5 fw-bold shadow">
                        Finalize Assessment <CheckCircle2 className="ms-2" size={18} />
                      </button>
                    ) : (
                      <button 
                        onClick={() => setCurrentQuestion(prev => prev + 1)} 
                        className="btn btn-primary rounded-pill px-5 fw-bold shadow"
                        disabled={userAnswers[currentQuestion] === undefined}
                      >
                        Next <ChevronRight className="ms-1" size={18} />
                      </button>
                    )}
                  </div>
                </>
              )}
            </main>
          </div>
        </div>

        <style>{`
          .option-card { border: 2px solid #f1f5f9; cursor: pointer; transition: all 0.2s ease; background: #fff; }
          .option-card:hover { border-color: #6366f1; background: #f8fafc; }
          .selected-opt { border-color: #6366f1 !important; background: #eef2ff !important; }
          .opt-index { font-weight: 800; color: #6366f1; background: #f1f5f9; width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; }
          .selected-opt .opt-index { background: #6366f1; color: white; }
          .fade-in { animation: fadeIn 0.4s ease-in; }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
      </div>
    );
  }

  // ================= HUB VIEW (RETAKE LOGIC) =================
  return (
    <div className="container py-5">
      <h1 className="fw-bold mb-5">Knowledge Quests</h1>
      <div className="row g-4">
        {quizzes.filter(q => q.title.toLowerCase().includes(searchTerm.toLowerCase())).map(quiz => (
          <div key={quiz._id} className="col-md-4">
            <div className={`card h-100 border-0 shadow-sm p-4 rounded-4 transition-all hover-shadow ${quiz.isPassedByMe ? 'bg-success-subtle' : ''}`}>
              <div className="d-flex justify-content-between mb-3">
                <span className="badge bg-white text-dark shadow-sm rounded-pill px-3 py-1">{quiz.courseTitle}</span>
                {quiz.isPassedByMe && <CheckCircle2 className="text-success" size={20} />}
              </div>
              <h4 className="fw-bold mb-3">{quiz.title}</h4>
              
              {!quiz.isPassedByMe && quiz.myBestScore > 0 && (
                <p className="text-danger small fw-bold mb-2">Previous Best: {quiz.myBestScore}/10 (Failed)</p>
              )}

              <div className="mt-auto d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center text-muted small">
                  <Target size={16} className="me-1" /> {quiz.questions?.length} Qs
                </div>
                <button 
                  className={`btn btn-sm rounded-pill px-4 fw-bold ${quiz.isPassedByMe ? 'btn-success disabled opacity-75' : 'btn-dark'}`}
                  onClick={() => !quiz.isPassedByMe && setSelectedQuiz(quiz)}
                >
                  {quiz.isPassedByMe ? 'Mastered' : (quiz.myBestScore > 0 ? 'Retake' : 'Start Quest')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Quizzes;