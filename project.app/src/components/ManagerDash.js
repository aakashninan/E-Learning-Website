import React, { useState, useEffect } from 'react';
import { 
  FiGrid, FiUsers, FiBook, FiUserPlus, 
  FiCheckCircle, FiSearch, FiAlertCircle, FiLogOut 
} from 'react-icons/fi';

const ManagerDash = ({ onLogout }) => {
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedTeacherEmail, setSelectedTeacherEmail] = useState('');
  const [loading, setLoading] = useState(true);

  // Sync data from Backend
  const fetchData = async () => {
    try {
      const [courseRes, teacherRes] = await Promise.all([
        fetch('http://127.0.0.1:5001/api/courses'),
        fetch('http://127.0.0.1:5001/api/auth/teachers')
      ]);
      
      const courseData = await courseRes.json();
      const teacherData = await teacherRes.json();

      setCourses(courseData);
      setTeachers(teacherData);
    } catch (err) {
      console.error("Manager Sync Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssign = async () => {
    if (!selectedCourse || !selectedTeacherEmail) return;

    const teacher = teachers.find(t => t.email === selectedTeacherEmail);

    try {
      const res = await fetch('http://127.0.0.1:5001/api/admin/assign-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          email: teacher.email,
          adminName: `${teacher.firstName} ${teacher.lastName}`
        })
      });

      if (res.ok) {
        alert("Assignment successful!");
        setSelectedCourse(null);
        setSelectedTeacherEmail('');
        fetchData(); // Refresh UI
      }
    } catch (err) {
      alert("Error assigning course.");
    }
  };

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="p-5 text-center">Loading Manager Console...</div>;

  return (
    <div className="d-flex min-vh-100 bg-light">
      {/* SIDEBAR */}
      <aside className="bg-white border-end shadow-sm" style={{ width: '280px' }}>
        <div className="p-4 border-bottom bg-primary text-white">
          <h5 className="mb-0 fw-bold">MANAGER HUB</h5>
        </div>
        <div className="p-3">
          <button className="btn btn-primary w-100 text-start mb-2 py-2">
            <FiGrid className="me-2" /> Allocations
          </button>
          <button className="btn btn-light w-100 text-start mb-2 py-2">
            <FiUsers className="me-2" /> Faculty List
          </button>
          <button onClick={onLogout} className="btn btn-outline-danger w-100 mt-5 py-2">
            <FiLogOut className="me-2" /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-grow-1 p-4 overflow-auto">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold">Course Allocation</h2>
          <div className="input-group" style={{ width: '300px' }}>
            <span className="input-group-text bg-white border-end-0"><FiSearch /></span>
            <input 
              type="text" 
              className="form-control border-start-0" 
              placeholder="Search courses..." 
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="row g-4">
          <div className="col-lg-8">
            <div className="row g-3">
              {filteredCourses.map(course => (
                <div className="col-md-6" key={course.id}>
                  <div 
                    className={`card h-100 shadow-sm border-0 rounded-4 transition-all ${selectedCourse?.id === course.id ? 'border border-primary bg-primary-subtle' : ''}`}
                    onClick={() => setSelectedCourse(course)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="card-body">
                      <div className="d-flex justify-content-between mb-2">
                        <span className="badge bg-secondary-subtle text-secondary">{course.category}</span>
                        {course.instructor ? <FiCheckCircle className="text-success" /> : <FiAlertCircle className="text-warning" />}
                      </div>
                      <h6 className="fw-bold">{course.title}</h6>
                      <p className="small text-muted mb-0">
                        {course.instructor ? `Assigned: ${course.instructor}` : 'Unassigned'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 sticky-top" style={{ top: '20px' }}>
              <div className="card-body p-4 text-center">
                <FiUserPlus size={40} className="text-primary mb-3" />
                <h5 className="fw-bold mb-3">Assign Faculty</h5>
                
                <div className="mb-3 text-start">
                  <label className="small fw-bold text-muted">SELECTED COURSE</label>
                  <div className="p-2 bg-light rounded border small">
                    {selectedCourse ? selectedCourse.title : 'Select a course from left'}
                  </div>
                </div>

                <div className="mb-4 text-start">
                  <label className="small fw-bold text-muted">SELECT TEACHER</label>
                  <select 
                    className="form-select" 
                    value={selectedTeacherEmail}
                    onChange={(e) => setSelectedTeacherEmail(e.target.value)}
                  >
                    <option value="">Choose Teacher...</option>
                    {teachers.map(t => (
                      <option key={t.email} value={t.email}>{t.firstName} {t.lastName}</option>
                    ))}
                  </select>
                </div>

                <button 
                  className="btn btn-primary w-100 py-2 rounded-pill fw-bold"
                  onClick={handleAssign}
                  disabled={!selectedCourse || !selectedTeacherEmail}
                >
                  Confirm Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManagerDash;