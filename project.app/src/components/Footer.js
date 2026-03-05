import React from 'react';

function Footer() {
  return (
    <footer className="bg-light border-top mt-5 p-3 text-center text-muted">
      <div className="container">
        <p className="mb-0">
          &copy; {new Date().getFullYear()} E-Learn Platform(@aakashninan). All rights reserved.
        </p>
        <p className="small">
          Designed with React and Bootstrap for a minimal aesthetic.
        </p>
      </div>
    </footer>
  );
}

export default Footer;