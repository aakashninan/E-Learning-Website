import React, { useState, useEffect, useCallback } from 'react';
import { FiUpload, FiCheckCircle, FiFileText, FiClock, FiAward, FiRefreshCw } from 'react-icons/fi';

const Assignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const userEmail = localStorage.getItem("userEmail") || "";

  /* ================================
     1. DATA SYNC LOGIC (RS5, RS9)
  ================================ */
  const fetchAssignments = useCallback(async () => {
    if (!userEmail) return;
    try {
      setLoading(true);
      // Ensure email is lowercased to match backend sanitization
      const res = await fetch(`http://127.0.0.1:5001/api/user/assignments/${userEmail.toLowerCase()}`);
      if (!res.ok) throw new Error("Failed to sync assignments");
      const data = await res.json();
      setAssignments(data);
    } catch (err) {
      console.error("Assignment Sync Error:", err);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  /* ================================
     2. UPLOAD HANDLER (RS5)
  ================================ */
  const handleUpload = async (e, courseId, assignmentId) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('courseId', courseId);
    // Send the MongoDB _id string to avoid the Cast to Number NaN error
    formData.append('assignmentId', assignmentId); 
    formData.append('studentEmail', userEmail.toLowerCase());

    try {
      const res = await fetch('http://127.0.0.1:5001/api/assignments/submit', {
        method: 'POST',
        body: formData 
      });

      if (res.ok) {
        alert("✅ Project Submitted Successfully!");
        // Triggers a re-fetch to update UI from "PENDING" to "SUBMITTED"
        fetchAssignments(); 
      } else {
        const errorData = await res.json();
        alert(`Upload failed: ${errorData.message || "Check your file size."}`);
      }
    } catch (err) {
      alert("Connectivity issue. Ensure the server is running on port 5001.");
    }
  };

  if (loading) return (
    <div className="text-center p-5 mt-5">
      <div className="spinner-border text-primary mb-3"></div>
      <p className="text-muted fw-bold">Synchronizing Project Hub...</p>
    </div>
  );

  return (
    <div className="container py-5" style={{fontFamily: "'Inter', sans-serif"}}>
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h1 className="fw-black text-dark m-0">Project Submissions</h1>
          <p className="text-muted">Submit your work and track your grades in real-time.</p>
        </div>
        <button className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm" onClick={fetchAssignments}>
          <FiRefreshCw className="me-2"/> Refresh Sync
        </button>
      </div>

      {assignments.length > 0 ? (
        <div className="row g-4">
          {assignments.map((asgn) => (
            // Use MongoDB _id for stable key mapping
            <div key={asgn._id} className="col-md-6">
              <div className="card border-0 shadow-sm rounded-4 p-4 hover-up" style={{transition: 'transform 0.3s', minHeight: '100%'}}>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <span className="badge bg-primary-subtle text-primary mb-2 px-3 rounded-pill fw-bold">Course {asgn.courseId}</span>
                    <h4 className="fw-bold m-0 text-dark">{asgn.title}</h4>
                  </div>
                  {/* Status badge toggles based on backend isSubmitted check */}
                  {asgn.isSubmitted ? (
                    <span className="badge bg-success text-white rounded-pill px-3 py-2">
                      <FiCheckCircle className="me-1"/> SUBMITTED
                    </span>
                  ) : (
                    <span className="badge bg-warning-subtle text-warning border border-warning rounded-pill px-3 py-2 fw-bold">
                      <FiClock className="me-1"/> PENDING
                    </span>
                  )}
                </div>

                <p className="text-muted small mb-4 bg-light p-3 rounded-3" style={{minHeight: '80px'}}>
                  {asgn.details || asgn.task}
                </p>

                <div className="d-flex justify-content-between align-items-center mt-auto pt-3 border-top">
                  <label className={`btn rounded-pill px-4 py-2 fw-bold ${asgn.isSubmitted ? 'btn-outline-secondary' : 'btn-primary shadow'}`} style={{cursor: 'pointer'}}>
                    <FiUpload className="me-2"/> {asgn.isSubmitted ? "Update Submission" : "Upload Work"}
                    {/* Passing asgn._id string to the handler */}
                    <input type="file" hidden onChange={(e) => handleUpload(e, asgn.courseId, asgn._id)} />
                  </label>

                  {asgn.grade !== null ? (
                    <div className="text-end">
                      <small className="text-muted d-block uppercase fw-bold" style={{fontSize: '10px'}}>Final Grade</small>
                      <div className="d-flex align-items-center text-success fw-black fs-4">
                        <FiAward className="me-1"/> {asgn.grade}%
                      </div>
                    </div>
                  ) : (
                    asgn.isSubmitted && <span className="text-muted small italic">Awaiting instructor review...</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-5 bg-white rounded-4 border shadow-sm">
          <FiFileText size={60} className="text-muted mb-4 opacity-25" />
          <h3 className="fw-bold text-dark">No Assignments Linked</h3>
          <p className="text-muted mx-auto" style={{maxWidth: '400px'}}>
            Enroll in courses to see your project tasks here.
          </p>
        </div>
      )}
    </div>
  );
};

export default Assignments;