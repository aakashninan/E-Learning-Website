import React from 'react';

function AboutContent() {
  return (
    <div className="container mt-5">
      <div className="p-5 rounded-3 text-dark bg-white border border-light shadow-sm">
        <h2 className="text-primary mb-4">About Our Platform</h2>
        <p className="lead">
          E-Learn is dedicated to providing minimalist, distraction-free access to high-quality educational content.
        </p>
        <p>
          We believe in simple design and powerful, focused learning tools. Our mission is to make online education accessible and enjoyable for every student.
        </p>
        <p className="text-muted small mt-4">
          Version 1.0.0 - Focused on essential components only.
        </p>
      </div>
    </div>
  );
}

export default AboutContent;