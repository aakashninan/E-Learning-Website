import React, { useState } from 'react';
import { 
  FiHome, FiUsers, FiSettings, FiActivity, 
  FiPieChart, FiArrowUpRight, FiArrowDownRight, FiLogOut 
} from 'react-icons/fi';

// Component name changed to AdminD
const AdminD = ({ setActiveView }) => {
  const [activeTab, setActiveTab] = useState('Overview');

  const stats = [
    { label: 'Total Students', value: '1,284', change: '+12%', increasing: true },
    { label: 'Course Revenue', value: '$12,450', change: '+8%', increasing: true },
    { label: 'Active Quizzes', value: '42', change: '-3%', increasing: false },
    { label: 'Completion Rate', value: '88%', change: '+5%', increasing: true },
  ];

  return (
    <div className="d-flex min-vh-100 bg-light text-dark">
      {/* Sidebar */}
      <aside className="bg-white border-end d-none d-md-flex flex-column" style={{ width: '280px' }}>
        <div className="p-4 border-bottom">
          <h2 className="h4 fw-bold text-primary mb-0">ADMIN.EDU</h2>
        </div>
        <nav className="flex-grow-1 p-3">
          {['Overview', 'Students', 'Courses', 'Settings'].map((item) => (
            <button
              key={item}
              onClick={() => setActiveTab(item)}
              className={`btn w-100 text-start d-flex align-items-center mb-2 px-3 py-2 border-0 ${
                activeTab === item ? 'bg-primary text-white shadow-sm' : 'text-secondary bg-transparent'
              }`}
            >
              <span className="me-3">{item === 'Overview' ? <FiHome /> : <FiActivity />}</span>
              <span className="fw-semibold">{item}</span>
            </button>
          ))}
        </nav>
        <div className="p-3 border-top">
          <button onClick={() => setActiveView('home')} className="btn btn-outline-danger w-100">
            <FiLogOut className="me-2" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow-1 p-4">
        <header className="mb-4">
          <h1 className="h2 fw-bold">{activeTab}</h1>
        </header>
        <div className="row g-4">
          {stats.map((stat, idx) => (
            <div key={idx} className="col-md-3">
              <div className="card border-0 shadow-sm p-3">
                <p className="text-secondary small mb-1">{stat.label}</p>
                <h3 className="fw-bold">{stat.value}</h3>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

// Updated export name
export default AdminD;