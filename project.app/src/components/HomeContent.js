import React from 'react';

const styles = {
    homeContainer: {
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        backgroundColor: '#fcfcfd',
        color: '#1e293b',
    },
    heroSection: {
        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        padding: '120px 20px',
        textAlign: 'center',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
    },
    heroBadge: {
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '8px 20px',
        borderRadius: '50px',
        fontSize: '0.8rem',
        fontWeight: '700',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        display: 'inline-block',
        marginBottom: '20px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
    },
    heroH1: {
        fontSize: '4rem',
        fontWeight: '800',
        letterSpacing: '-2px',
        maxWidth: '800px',
        margin: '0 auto 20px auto',
        lineHeight: '1.1',
    },
    heroSubtitle: {
        fontSize: '1.25rem',
        opacity: '0.9',
        maxWidth: '600px',
        margin: '0 auto 40px auto',
        fontWeight: '400',
    },
    ctaButton: {
        backgroundColor: 'white',
        color: '#6366f1',
        border: 'none',
        padding: '18px 40px',
        fontSize: '1rem',
        fontWeight: '800',
        cursor: 'pointer',
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease',
    },
    featuresGrid: {
        maxWidth: '1200px',
        margin: '-60px auto 80px auto',
        padding: '0 20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        position: 'relative',
        zIndex: '10',
    },
    featureCard: {
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '28px',
        border: '1px solid #f1f5f9',
        boxShadow: '0 10px 30px rgba(0,0,0,0.02)',
        transition: 'transform 0.3s ease',
    },
    iconWrap: {
        width: '60px',
        height: '60px',
        borderRadius: '18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.5rem',
        marginBottom: '24px',
    },
    testimonialSection: {
        padding: '100px 20px',
        textAlign: 'center',
        backgroundColor: 'white',
        borderTop: '1px solid #f1f5f9',
    },
    testimonialQuote: {
        fontSize: '2rem',
        fontWeight: '700',
        color: '#0f172a',
        maxWidth: '900px',
        margin: '0 auto 30px auto',
        lineHeight: '1.4',
        letterSpacing: '-1px',
    },
    homeFooter: {
        backgroundColor: '#0f172a',
        color: '#94a3b8',
        padding: '60px 20px',
        textAlign: 'center',
    }
};

function Home({ setActiveView }) {
  return (
    <div style={styles.homeContainer} className="fade-in">
      
      {/* HERO SECTION */}
      <div style={styles.heroSection}>
        <div style={styles.heroBadge}>✨ The Future of Learning</div>
        <h1 style={styles.heroH1}>Intelligence is the <br/> New Currency.</h1>
        <p style={styles.heroSubtitle}>
          Access world-class curriculum, interact with expert mentors, and accelerate your career path today.
        </p>
        <button 
            style={styles.ctaButton} 
            onMouseOver={(e) => e.target.style.transform = 'translateY(-5px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            onClick={() => setActiveView('dashboard')}
        >
          Explore Courses →
        </button>
      </div>

      {/* FEATURES SECTION */}
      <div style={styles.featuresGrid}>
        <div style={styles.featureCard} className="hover-lift">
          <div style={{...styles.iconWrap, background: '#eef2ff', color: '#6366f1'}}>🎓</div>
          <h3 style={{fontWeight: 800}}>Expert Mentors</h3>
          <p style={{color: '#64748b', lineHeight: '1.6'}}>Learn directly from industry giants with real-world case studies.</p>
        </div>

        <div style={styles.featureCard} className="hover-lift">
          <div style={{...styles.iconWrap, background: '#ecfdf5', color: '#10b981'}}>⚡</div>
          <h3 style={{fontWeight: 800}}>Agile Learning</h3>
          <p style={{color: '#64748b', lineHeight: '1.6'}}>Short, high-impact modules designed for the modern schedule.</p>
        </div>

        <div style={styles.featureCard} className="hover-lift">
          <div style={{...styles.iconWrap, background: '#fffbeb', color: '#f59e0b'}}>🏆</div>
          <h3 style={{fontWeight: 800}}>Global Credentials</h3>
          <p style={{color: '#64748b', lineHeight: '1.6'}}>Earn verifiable certificates recognized by top global tech firms.</p>
        </div>
      </div>

      {/* TESTIMONIAL */}
      <div style={styles.testimonialSection}>
        <p style={{textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.75rem', fontWeight: 800, color: '#6366f1', marginBottom: '20px'}}>Student Spotlight</p>
        <blockquote style={styles.testimonialQuote}>
          "This platform didn't just teach me code; it taught me how to think like an engineer. I landed my role at Google within 3 months."
        </blockquote>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px'}}>
            <div style={{width: '45px', height: '45px', borderRadius: '50%', background: '#ddd'}}></div>
            <div style={{textAlign: 'left'}}>
                <p style={{margin: 0, fontWeight: 800, fontSize: '1rem'}}>Gautham Surendran</p>
                <p style={{margin: 0, color: '#64748b', fontSize: '0.85rem'}}>Senior Developer, Netflix</p>
            </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={styles.homeFooter}>
        <div style={{marginBottom: '30px'}}>
            <h4 style={{color: 'white', fontWeight: 800}}>EduPortal.</h4>
            <p style={{maxWidth: '400px', margin: '10px auto'}}>The world's leading micro-learning platform for technology and humanities.</p>
        </div>
        <div style={{borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '30px', fontSize: '0.8rem'}}>
            <p>&copy; {new Date().getFullYear()} E-Skill Academy. Designed for excellence.</p>
        </div>
      </div>

      <style>{`
        .fade-in { animation: fadeIn 0.8s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .hover-lift:hover { transform: translateY(-10px); box-shadow: 0 30px 60px rgba(0,0,0,0.05); }
      `}</style>
    </div>
  );
}

export default Home;