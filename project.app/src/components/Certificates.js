import React, { useState, useEffect } from 'react';
import { FiAward, FiDownload, FiLock, FiCheckCircle } from 'react-icons/fi';
import { jsPDF } from "jspdf";

function Certificates() {
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const userEmail = localStorage.getItem('userEmail');

    useEffect(() => {
        const fetchMyCertificates = async () => {
            try {
                // Ensure the email is lowercased to match backend sync logic
                const response = await fetch(`http://localhost:5001/api/user/certificates/${userEmail.toLowerCase()}`);
                if (response.ok) {
                    const data = await response.json();
                    setCertificates(data);
                }
            } catch (error) {
                console.error("Fetch error:", error);
            } finally {
                setLoading(false);
            }
        };

        if (userEmail) fetchMyCertificates();
    }, [userEmail]);

    const handleDownload = (cert) => {
        const doc = new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: "a4"
        });

        // 1. Decorative Borders
        doc.setLineWidth(1.5);
        doc.setDrawColor(30, 41, 59); // Dark Slate
        doc.rect(10, 10, 277, 190); 
        doc.setLineWidth(0.5);
        doc.rect(12, 12, 273, 186);

        // 2. Header
        doc.setFont("helvetica", "bold");
        doc.setFontSize(35);
        doc.setTextColor(30, 41, 59);
        doc.text("CERTIFICATE OF COMPLETION", 148.5, 50, { align: "center" });

        // 3. Main Text
        doc.setFontSize(18);
        doc.setFont("helvetica", "normal");
        doc.text("This is to certify that", 148.5, 75, { align: "center" });

        doc.setFontSize(28);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(99, 102, 241); // Indigo Primary
        // studentName should be provided by the backend record
        doc.text((cert.studentName || "STUDENT NAME").toUpperCase(), 148.5, 95, { align: "center" });

        doc.setFontSize(18);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(30, 41, 59);
        doc.text("has successfully completed the curriculum for", 148.5, 115, { align: "center" });

        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.text(cert.courseTitle, 148.5, 135, { align: "center" });

        // 4. Footer & Verification
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text(`Issued on: ${new Date(cert.issuedAt).toLocaleDateString()}`, 40, 170);
        doc.text(`Certificate ID: ${cert._id}`, 40, 177);
        
        doc.setFont("helvetica", "bold");
        doc.text(`Authorized by: ${cert.issuedBy}`, 210, 170);
        doc.text("EduPortal Learning Systems", 210, 177);

        // 5. Generate File
        doc.save(`Certificate_${cert.courseTitle.replace(/\s+/g, '_')}.pdf`);
    };

    return (
        <div className="achievement-page fade-in py-5 min-vh-100 bg-light">
            <div className="container">
                <header className="mb-5">
                    <p className="text-overline mb-1">Recognition</p>
                    <h1 className="fw-black text-dark m-0">Certificates & Achievements</h1>
                </header>

                <div className="row g-4">
                    <div className="col-12 col-lg-8">
                        <div className="achievement-card p-4 h-100 shadow-sm border-0">
                            <h5 className="fw-bold mb-4 d-flex align-items-center">
                                <FiAward className="me-2 text-primary" /> Official Course Certificates
                            </h5>

                            {loading ? (
                                <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
                            ) : certificates.length > 0 ? (
                                certificates.map((cert) => (
                                    <div key={cert._id} className="cert-item d-flex align-items-center p-3 mb-3 border rounded-4 bg-white shadow-sm">
                                        <div className="cert-icon-box me-3">📜</div>
                                        <div className="flex-grow-1">
                                            <h6 className="fw-bold mb-0">{cert.courseTitle}</h6>
                                            <small className="text-muted">
                                                Issued by: {cert.issuedBy} • {new Date(cert.issuedAt).toLocaleDateString()}
                                            </small>
                                        </div>
                                        <button 
                                            className="btn btn-dark rounded-3 px-4 py-2 fw-bold"
                                            onClick={() => handleDownload(cert)}
                                        >
                                            <FiDownload className="me-2" /> Download
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-5 bg-light rounded-4 border-dashed border-2">
                                    <FiLock size={40} className="text-muted mb-3" />
                                    <h6 className="fw-bold text-muted">No Certificates Yet</h6>
                                    <p className="small text-muted px-4">
                                        Complete your assignments and quizzes. Once your work is graded and mastery is achieved, your certificate will appear here.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="col-12 col-lg-4">
                        <div className="achievement-card p-4 shadow-sm border-0">
                            <h5 className="fw-bold mb-4 text-dark">Milestone Badges</h5>
                            <div className="d-flex flex-wrap gap-3 justify-content-center">
                                <BadgeItem icon="🐍" name="Python" unlocked={certificates.some(c => c.courseTitle.toLowerCase().includes('python'))} />
                                <BadgeItem icon="⚛️" name="React" unlocked={certificates.some(c => c.courseTitle.toLowerCase().includes('react'))} />
                                <BadgeItem icon="🚀" name="Pioneer" unlocked={true} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .achievement-card { background: white; border-radius: 28px; }
                .text-overline { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; }
                .fw-black { font-weight: 900; letter-spacing: -1.5px; font-size: 2.5rem; }
                .cert-icon-box { width: 50px; height: 50px; background: #f8fafc; display: flex; align-items: center; justify-content: center; border-radius: 12px; font-size: 1.5rem; }
                .cert-item { transition: all 0.2s ease; }
                .cert-item:hover { transform: translateY(-2px); border-color: #6366f1 !important; box-shadow: 0 10px 20px rgba(0,0,0,0.05) !important; }
                .badge-locked { filter: grayscale(1); opacity: 0.3; }
                .badge-glow-icon {
                    width: 65px; height: 65px; background: white; border-radius: 20px;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 1.6rem; border: 1px solid #f1f5f9;
                    box-shadow: 0 10px 20px -5px rgba(0,0,0,0.03);
                    position: relative;
                }
                .unlocked-check { position: absolute; top: -5px; right: -5px; color: #10b981; background: white; border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
            `}</style>
        </div>
    );
}

const BadgeItem = ({ icon, name, unlocked }) => (
    <div className={`badge-item-wrap text-center ${!unlocked ? 'badge-locked' : ''}`}>
        <div className="badge-glow-icon">
            {icon}
            {unlocked && <FiCheckCircle className="unlocked-check" />}
        </div>
        <p className="badge-label fw-bold mt-2 mb-0" style={{fontSize: '0.6rem', color: '#475569'}}>{name}</p>
    </div>
);

export default Certificates;