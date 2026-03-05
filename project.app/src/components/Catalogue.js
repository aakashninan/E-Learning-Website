import React, { useState, useEffect, useMemo } from "react";
import {
  Clock,
  BarChart,
  Users,
  ArrowLeft,
  CheckCircle,
  Zap,
  Star,
  X,
  Lock,
  Play,
  Flame,
} from "lucide-react";

const Catalogue = ({ searchQuery, setActiveView }) => {
  const [courses, setCourses] = useState([]);
  const [activeTab, setActiveTab] = useState("All");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const categories = ["All", "Tech", "Business", "Science", "Humanities"];

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // Updated URL to handle empty search queries gracefully
        const url = searchQuery 
          ? `http://127.0.0.1:5001/api/courses?search=${searchQuery}`
          : `http://127.0.0.1:5001/api/courses`;
          
        const res = await fetch(url);
        const data = await res.json();
        setCourses(data);
      } catch (err) {
        console.error("Failed to load courses");
      }
    };
    fetchCourses();
  }, [searchQuery]);

  const filteredCourses = useMemo(() => {
    return activeTab === "All"
      ? courses
      : courses.filter((c) => c.category === activeTab);
  }, [courses, activeTab]);

  const handleFinalPay = async () => {
    const email = localStorage.getItem("userEmail");
    setIsProcessing(true);
    try {
      const response = await fetch(
        "http://127.0.0.1:5001/api/user/enroll",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // FIXED: Sending courseId as a Number to match backend expectations
          body: JSON.stringify({ 
            email, 
            courseId: Number(selectedCourse.id) 
          }),
        }
      );

      if (response.ok) {
        setPaymentStep(3);
        setTimeout(() => {
          setShowPaymentModal(false);
          setActiveView("dashboard");
        }, 2000);
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Enrollment failed");
        setIsProcessing(false);
      }
    } catch (err) {
      console.error("Payment Error:", err);
      setIsProcessing(false);
    }
  };

  /* ================= PAYMENT MODAL COMPONENT ================= */
  const renderPaymentModal = () => {
    if (!showPaymentModal) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-box">
          <button className="close" onClick={() => setShowPaymentModal(false)}>
            <X size={18}/>
          </button>

          {paymentStep === 1 && (
            <div className="text-center">
              <h3 className="fw-bold">Checkout</h3>
              <p className="text-muted">{selectedCourse?.title}</p>
              <h2 className="text-primary fw-black">Free / Enrollment</h2>
              <button className="btn-primary mt-3" onClick={() => setPaymentStep(2)}>
                Continue to Payment
              </button>
            </div>
          )}

          {paymentStep === 2 && (
            <>
              <h3><Lock size={18}/> Secure Payment</h3>
              <p className="small text-muted mb-3">Test Mode: Enter any details</p>
              <input className="form-control mb-2" placeholder="Card Number (16 Digits)"/>
              <div className="row g-2">
                <div className="col-6">
                  <input className="form-control" placeholder="MM/YY"/>
                </div>
                <div className="col-6">
                  <input className="form-control" placeholder="CVC"/>
                </div>
              </div>
              <button
                className="btn-primary mt-4"
                onClick={handleFinalPay}
                disabled={isProcessing}
              >
                {isProcessing ? "Authorizing..." : "Confirm & Pay"}
              </button>
            </>
          )}

          {paymentStep === 3 && (
            <div className="text-center py-4">
              <CheckCircle size={60} color="#10b981" className="animate-bounce"/>
              <h3 className="mt-3 fw-bold">Successfully Enrolled!</h3>
              <p className="text-muted">Redirecting to your dashboard...</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ================= DETAIL PAGE ================= */
  if (selectedCourse && !showPaymentModal) {
    return (
      <div className="container py-5 fade-in">
        <button className="back-btn mb-4" onClick={() => setSelectedCourse(null)}>
          <ArrowLeft size={18} /> Back to Catalogue
        </button>

        <div className="row g-5">
          <div className="col-lg-7">
            <div className="video-card shadow-lg">
              {/* FIXED: Using imageUrl to match backend schema */}
              <img src={selectedCourse.imageUrl} alt={selectedCourse.title} />
              <div className="play-overlay">
                <div className="play-btn-circle">
                  <Play size={40} fill="white" />
                </div>
              </div>
            </div>

            <h1 className="mt-4 fw-black">{selectedCourse.title}</h1>
            <div className="d-flex gap-3 mb-4">
               <span className="badge bg-primary-subtle text-primary">{selectedCourse.category}</span>
               <span className="text-muted small">By {selectedCourse.instructor}</span>
            </div>
            <p className="text-secondary leading-relaxed">
              Explore the depths of {selectedCourse.title}. This course is designed to take you from 
              beginner to expert with hands-on projects and professional guidance.
            </p>
          </div>

          <div className="col-lg-5">
            <div className="checkout-card border-0 shadow-lg">
              <h2 className="price text-primary fw-black mb-4">Premium Access</h2>

              <div className="feature-list mb-4">
                <div className="d-flex align-items-center gap-2 mb-2"><Users size={16} className="text-primary"/> 12k Students Enrolled</div>
                <div className="d-flex align-items-center gap-2 mb-2"><Star size={16} className="text-warning"/> 4.9 Course Rating</div>
                <div className="d-flex align-items-center gap-2 mb-2"><BarChart size={16} className="text-success"/> Expert Level Content</div>
                <div className="d-flex align-items-center gap-2 mb-2"><Clock size={16} className="text-danger"/> Lifetime Access</div>
              </div>

              <button className="btn-primary shadow-lg" onClick={() => setShowPaymentModal(true)}>
                <Zap size={18} /> Enroll Now
              </button>
            </div>
          </div>
        </div>
        {renderPaymentModal()}
      </div>
    );
  }

  /* ================= MAIN CATALOGUE ================= */
  return (
    <div className="catalogue">
      <div className="hero">
        <span className="trending-badge mb-3">
          <Flame size={14}/> Trending Courses
        </span>
        <h1 className="fw-black">
          Elite <span>Academy</span>
        </h1>
        <p className="text-muted">Master your craft with our industry-leading curriculum.</p>

        <div className="tabs mt-4">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`tab-btn ${activeTab === cat ? "active" : ""}`}
              onClick={() => setActiveTab(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="container pb-5">
        <div className="row g-4">
          {filteredCourses.map((course) => (
            <div key={course.id} className="col-md-6 col-lg-4 col-xl-3">
              <div className="course-card border-0" onClick={() => setSelectedCourse(course)}>
                <div className="card-img-container">
                  {/* FIXED: Using imageUrl to match backend schema */}
                  <img src={course.imageUrl} alt={course.title} className="card-img-top"/>
                  <span className="price-pill">Premium</span>
                  <div className="category-overlay">{course.category}</div>
                </div>

                <div className="card-body p-4">
                  <h6 className="fw-bold mb-2 text-dark">{course.title}</h6>
                  <div className="meta d-flex justify-content-between align-items-center">
                    <span className="text-muted small">{course.instructor}</span>
                    <span className="level-badge">Advanced</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {renderPaymentModal()}

      <style>{`
        .catalogue { background: #fcfcfd; min-height: 100vh; }
        .fw-black { font-weight: 900; letter-spacing: -1px; }
        .hero { text-align: center; padding: 120px 0 60px; }
        .hero h1 { font-size: 3.5rem; }
        .hero h1 span { background: linear-gradient(135deg,#6366f1,#8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        
        .trending-badge { display: inline-flex; items: center; gap: 8px; background: #eff6ff; color: #3b82f6; padding: 8px 20px; border-radius: 100px; font-weight: 700; font-size: 0.8rem; }
        
        .tab-btn { border: 1px solid #e2e8f0; background: white; padding: 10px 24px; border-radius: 100px; margin: 0 5px; font-weight: 600; transition: 0.3s; color: #64748b; }
        .tab-btn.active { background: #111827; color: white; border-color: #111827; }

        .course-card { background: white; border-radius: 24px; overflow: hidden; cursor: pointer; transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
        .course-card:hover { transform: translateY(-12px); box-shadow: 0 30px 60px rgba(99,102,241,0.15); }
        
        .card-img-container { position: relative; height: 200px; overflow: hidden; }
        .card-img-container img { width: 100%; height: 100%; object-fit: cover; transition: 0.6s ease; }
        .course-card:hover .card-img-container img { transform: scale(1.1); }
        
        .price-pill { position: absolute; top: 15px; right: 15px; background: rgba(17, 24, 39, 0.8); backdrop-filter: blur(8px); color: white; padding: 6px 14px; border-radius: 100px; font-size: 0.75rem; font-weight: 700; }
        .category-overlay { position: absolute; bottom: 15px; left: 15px; background: white; color: #6366f1; padding: 4px 12px; border-radius: 8px; font-weight: 800; font-size: 0.65rem; text-transform: uppercase; }

        .level-badge { background: #f1f5f9; padding: 4px 10px; border-radius: 8px; font-weight: 700; font-size: 0.7rem; color: #475569; }

        .checkout-card { background: white; padding: 40px; border-radius: 32px; border: 1px solid #f1f5f9; }
        .btn-primary { width: 100%; padding: 16px; border: none; border-radius: 16px; background: linear-gradient(135deg,#6366f1,#8b5cf6); color: white; font-weight: 700; transition: 0.3s; }
        .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(99,102,241,0.4); }

        .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-box { background: white; padding: 40px; border-radius: 32px; width: 420px; position: relative; animation: slideUp 0.4s ease; }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        .video-card { position: relative; border-radius: 32px; overflow: hidden; }
        .video-card img { width: 100%; height: 420px; object-fit: cover; }
        .play-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.3); }
        .play-btn-circle { width: 80px; height: 80px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 30px rgba(255,255,255,0.4); }
        
        .back-btn { border: 1px solid #e2e8f0; background: white; padding: 10px 20px; border-radius: 100px; font-weight: 600; color: #64748b; transition: 0.3s; }
        .back-btn:hover { background: #f8fafc; color: #111827; }

        .animate-bounce { animation: bounce 2s infinite; }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
      `}</style>
    </div>
  );
};

export default Catalogue;