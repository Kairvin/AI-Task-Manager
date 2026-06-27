import { Link } from 'react-router-dom';
import { 
  ArrowRight, PlayCircle, BarChart3, Calendar, Lightbulb, 
  Bell, Target, Bot, AlertTriangle, Quote, Building2,
  Briefcase, Landmark, Building
} from 'lucide-react';
import './Landing.css';

const FEATURES = [
  { icon: BarChart3, title: 'Intelligent Task Prioritization', desc: 'Focus on what truly matters, always.' },
  { icon: Calendar, title: 'AI-Powered Scheduling', desc: 'Your calendar, optimized by intelligence.' },
  { icon: Lightbulb, title: 'Personalized Recommendations', desc: 'Insights tailored to your unique workflow.' },
  { icon: Bell, title: 'Context-Aware Reminders', desc: 'The right nudge at exactly the right time.' },
  { icon: Target, title: 'Goal and Habit Tracking', desc: 'Build lasting success, one day at a time.' },
  { icon: Bot, title: 'Autonomous Task Planning', desc: 'Let the AI handle the logistics so you can focus on the work.' },
];

export default function Landing() {
  return (
    <div className="landing-page-wrapper">
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <Link to="/" className="landing-nav-logo">
            DeadlineHero
          </Link>
          <div className="landing-nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#pricing" className="nav-link">Pricing</a>
            <Link to="/signup" className="btn-black-pill">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="landing-hero-bg">
        <section className="landing-hero">
          <div className="landing-hero-left animate-slide-up">
            <div className="landing-badge">
              THE LAST-MINUTE LIFE SAVER
            </div>
            <h1 className="landing-headline">
              Stop Missing Deadlines.<br />
              <span>Start Taking Action.</span>
            </h1>
            <p className="landing-hero-text">
              DeadlineHero is the AI-powered productivity companion that proactively plans, prioritizes, and executes tasks before you even feel the pressure. Move beyond traditional reminders.
            </p>
            <div className="landing-hero-buttons">
              <Link to="/signup" className="btn-black-pill">
                Try for Free
              </Link>
              <button className="btn-grey-pill">
                <PlayCircle size={16} />
                Watch Demo
              </button>
            </div>
          </div>

          <div className="landing-hero-right animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="schedule-card">
              <div className="schedule-header">
                <div>
                  <h3 className="schedule-title">Proactive Schedule</h3>
                  <p className="schedule-subtitle">AI Optimized for today</p>
                </div>
                <Lightbulb size={20} color="var(--landing-primary)" />
              </div>

              {/* High Priority Item */}
              <div className="schedule-item error">
                <div className="item-dot error" />
                <div className="item-content">
                  <p className="item-title">Finalize Q3 Report</p>
                  <p className="item-desc">Due in 2 hours • High Priority</p>
                </div>
                <span className="item-badge">NOW</span>
              </div>

              {/* On Track Item */}
              <div className="schedule-item success">
                <div className="item-dot success" />
                <div className="item-content">
                  <p className="item-title">Review Pitch Deck</p>
                  <p className="item-desc">Scheduled for 2:00 PM</p>
                </div>
              </div>

              {/* AI Suggestion */}
              <div className="schedule-item info">
                <Lightbulb size={12} className="item-icon" />
                <div className="item-content">
                  <p className="item-title info-title">AI Suggestion</p>
                  <p className="item-desc">Break down "Client Onboarding" into 3 sub-tasks to ensure on-time delivery.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Problem Section */}
      <section className="landing-problem">
        <div className="landing-problem-inner">
          <AlertTriangle size={32} style={{ color: 'var(--landing-error)', marginBottom: 20 }} />
          <h2>Why traditional reminders fail.</h2>
          <p>
            Students, professionals, and entrepreneurs frequently miss deadlines. Existing productivity tools often rely on passive reminders that are easy to ignore and do little to help users actually complete their tasks. It's time for a system that acts, rather than just notifies.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <div className="landing-features-bg">
        <section className="landing-features" id="features">
          <div className="landing-features-header">
            <h2>Intelligent Action, Automated.</h2>
            <p>Everything you need to stay ahead of the curve.</p>
          </div>
          <div className="landing-features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="landing-feature-card animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="landing-feature-icon">
                  <f.icon size={20} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Bottom Section (Testimonial & CTA) */}
      <div className="landing-bottom-bg">
        <section className="landing-social-proof">
          <p className="trusted-label">
            Trusted by high-achievers worldwide
          </p>
          
          <div className="trusted-logos">
            <Building2 size={24} />
            <Briefcase size={24} />
            <Landmark size={24} />
            <Building size={24} />
          </div>

          <div className="testimonial-card">
            <div className="testimonial-quote-icon">
              <Quote size={16} />
            </div>
            <p className="testimonial-text">
              "Since using DeadlineHero, I haven't missed a single client deliverable. It doesn't just remind me; it actually reschedules my low-priority tasks to ensure I hit the critical deadlines. It's like having a proactive Chief of Staff."
            </p>
            <div className="testimonial-author">
              <div className="testimonial-avatar">
                <img src={`https://ui-avatars.com/api/?name=Sarah+Jenkins&background=0D8ABC&color=fff`} style={{ borderRadius: '50%', width: '100%', height: '100%' }} alt="SJ" />
              </div>
              <div style={{ textAlign: 'left' }}>
                <p className="testimonial-name">Sarah Jenkins</p>
                <p className="testimonial-role">Busy Entrepreneur</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="landing-cta">
          <h2>Ready to reclaim your time?</h2>
          <p>Join thousands of professionals who are taking action and crushing their deadlines with intelligent AI assistance.</p>
          <Link to="/signup" className="btn-blue-pill">
            Get Started Now <ArrowRight size={16} />
          </Link>
        </section>
      </div>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div>
            <p className="footer-brand">DeadlineHero</p>
            <p className="footer-copy">© 2024 DeadlineHero AI. All rights reserved.</p>
          </div>
          <div className="landing-footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Twitter</a>
            <a href="#">LinkedIn</a>
            <a href="#">Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
