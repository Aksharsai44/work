import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, BookOpen, Code, Terminal, Trophy, Users, 
  Zap, BarChart3, Award, Shield, Monitor, Layers, 
  CheckCircle2, Star, ChevronRight, Sparkles, Play,
  GraduationCap, Brain, Cpu, Globe
} from 'lucide-react';
import { Minda2Logo } from './Minda2Logo';

interface LandingViewProps {
  onLoginClick: () => void;
}

const LandingView: React.FC<LandingViewProps> = ({ onLoginClick }) => {
  const [scrollY, setScrollY] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { value: "500+", label: "Students Trained" },
    { value: "50+", label: "Workshops Delivered" },
    { value: "95%", label: "Satisfaction Rate" },
    { value: "20+", label: "College Partners" },
  ];

  const features = [
    {
      icon: Monitor,
      title: "Live Coding IDE",
      description: "Write, compile, and test code directly in your browser with our integrated development environment. Supports Python, JavaScript, and more.",
      color: "sky",
    },
    {
      icon: Brain,
      title: "AI-Powered Learning",
      description: "Explore Agentic AI, LLM architectures, prompt engineering, and autonomous systems through curated, hands-on learning modules.",
      color: "violet",
    },
    {
      icon: Trophy,
      title: "Live Quizzes & Leaderboard",
      description: "Compete in real-time quizzes, earn points, climb the leaderboard, and track your progress against your peers.",
      color: "amber",
    },
    {
      icon: Award,
      title: "Certification & Reports",
      description: "Earn verifiable completion certificates and access detailed performance analytics to showcase your skills.",
      color: "emerald",
    },
  ];

  const howItWorks = [
    { step: "01", title: "Admin Creates a Batch", description: "The workshop or bootcamp organizer sets up a new batch with dates, college details, and learning content." },
    { step: "02", title: "Students Get Enrolled", description: "Students are added manually, via CSV upload, or through a self-registration link with a unique batch code." },
    { step: "03", title: "Interactive Learning Begins", description: "Participants access live sessions, coding challenges, quizzes, assignments, and curated resources in real time." },
    { step: "04", title: "Track, Certify & Graduate", description: "Admins monitor analytics. Students earn points, climb leaderboards, and receive digital certificates on completion." },
  ];

  const colorMap: Record<string, { bg: string; text: string; border: string; glow: string }> = {
    sky: { bg: "bg-sky-50", text: "text-sky-600", border: "border-sky-200", glow: "shadow-sky-500/10" },
    violet: { bg: "bg-violet-50", text: "text-violet-600", border: "border-violet-200", glow: "shadow-violet-500/10" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200", glow: "shadow-amber-500/10" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", glow: "shadow-emerald-500/10" },
  };

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-sky-500 selection:text-white flex flex-col overflow-x-hidden">
      
      {/* ============ NAVBAR ============ */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${scrollY > 50 ? 'bg-white/95 backdrop-blur-xl shadow-lg shadow-slate-200/40 border-b border-slate-100' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Minda2Logo size="lg" showTagline={true} />
          </div>
          <nav className="hidden md:flex items-center gap-3 lg:gap-5">
            <a
              href="#features"
              className="px-5 py-2.5 rounded-2xl text-base lg:text-lg font-black text-slate-700 hover:text-sky-600 hover:bg-sky-50/80 border border-slate-200/60 hover:border-sky-200 shadow-2xs hover:shadow-xs transition-all duration-200"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="px-5 py-2.5 rounded-2xl text-base lg:text-lg font-black text-slate-700 hover:text-sky-600 hover:bg-sky-50/80 border border-slate-200/60 hover:border-sky-200 shadow-2xs hover:shadow-xs transition-all duration-200"
            >
              How It Works
            </a>
            <a
              href="#about"
              className="px-5 py-2.5 rounded-2xl text-base lg:text-lg font-black text-slate-700 hover:text-sky-600 hover:bg-sky-50/80 border border-slate-200/60 hover:border-sky-200 shadow-2xs hover:shadow-xs transition-all duration-200"
            >
              About
            </a>
          </nav>
          <button
            onClick={onLoginClick}
            className="px-7 py-3 rounded-2xl text-base font-black bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white shadow-lg shadow-sky-500/25 hover:shadow-xl hover:shadow-sky-500/30 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          >
            Login →
          </button>
        </div>
      </header>

      {/* ============ HERO SECTION ============ */}
      <section className="relative pt-10 pb-16 md:pt-16 md:pb-24 overflow-hidden">
        {/* Rich Futuristic Background Design */}
        <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
          {/* Multi-layer glowing aurora orbs */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[850px] h-[550px] bg-gradient-to-tr from-sky-400/25 via-indigo-500/20 to-purple-500/25 rounded-full blur-[100px]"></div>
          <div className="absolute top-1/4 -right-20 w-96 h-96 bg-gradient-to-br from-fuchsia-400/15 via-rose-300/10 to-transparent rounded-full blur-[90px] animate-pulse" style={{animationDuration: '5s'}}></div>
          <div className="absolute top-1/3 -left-20 w-96 h-96 bg-gradient-to-br from-cyan-400/15 via-emerald-300/10 to-transparent rounded-full blur-[90px] animate-pulse" style={{animationDuration: '7s'}}></div>
          
          {/* Cybernetic Tech Grid with radial mask */}
          <div 
            className="absolute inset-0 opacity-[0.45] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,#000_60%,transparent_100%)]" 
            style={{
              backgroundImage: 'linear-gradient(to right, rgba(148, 163, 184, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.15) 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}
          ></div>

          {/* Subtle Ambient Tech Crosshairs & Shapes */}
          <div className="absolute top-20 left-[15%] text-sky-400/40 text-xl font-mono select-none">+</div>
          <div className="absolute top-40 right-[18%] text-indigo-400/40 text-xl font-mono select-none">+</div>
          <div className="absolute bottom-28 left-[22%] text-violet-400/40 text-xl font-mono select-none">+</div>
          <div className="absolute bottom-36 right-[15%] text-emerald-400/40 text-xl font-mono select-none">+</div>

          {/* Decorative Glowing Rings */}
          <div className="absolute -top-10 left-[10%] w-32 h-32 rounded-full border border-sky-300/20 animate-spin" style={{ animationDuration: '30s' }}></div>
          <div className="absolute top-1/2 right-[8%] w-48 h-48 rounded-full border border-indigo-300/20 border-dashed animate-spin" style={{ animationDuration: '45s' }}></div>
        </div>

        {/* Floating Glassmorphic Badges (Left & Right Wings) */}
        <div className="hidden xl:flex absolute left-8 top-1/3 -translate-y-1/2 p-3.5 bg-white/85 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-2xl shadow-slate-300/40 items-center gap-3 animate-bounce z-10" style={{ animationDuration: '6s' }}>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/25">
            <Code className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black text-slate-900">In-Browser Live IDE</div>
            <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Python • JS • C++ Compiler
            </div>
          </div>
        </div>

        <div className="hidden xl:flex absolute right-8 top-1/3 -translate-y-1/2 p-3.5 bg-white/85 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-2xl shadow-slate-300/40 items-center gap-3 animate-bounce z-10" style={{ animationDuration: '7s', animationDelay: '1s' }}>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-violet-500/25">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black text-slate-900">Real-Time Arena & Q&A</div>
            <div className="text-[10px] text-violet-600 font-bold flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></span>
              Speed Telemetry & Podium
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-sky-200 text-sky-700 text-[11px] font-black uppercase tracking-wider mb-5 shadow-sm shadow-sky-500/10">
              <Sparkles className="w-3.5 h-3.5 text-sky-500 animate-pulse" />
              Workshop & Bootcamp Management Platform
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12] mb-5">
              Empower Learning,{" "}
              <span className="relative inline-block">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500">
                  Amplify Impact
                </span>
                <svg className="absolute -bottom-1.5 left-0 w-full" viewBox="0 0 300 12" fill="none">
                  <path d="M2 8C50 3 100 2 150 5C200 8 250 4 298 6" stroke="url(#grad)" strokeWidth="3" strokeLinecap="round"/>
                  <defs><linearGradient id="grad" x1="0" y1="0" x2="300" y2="0"><stop offset="0%" stopColor="#0ea5e9"/><stop offset="100%" stopColor="#8b5cf6"/></linearGradient></defs>
                </svg>
              </span>
            </h1>
            
            <p className="text-sm sm:text-base md:text-lg text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed mb-8">
              The all-in-one platform for organizing workshops and bootcamps. Create batches, enroll students, deliver interactive content, conduct live assessments, and issue certificates — all from one place.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3.5 mb-12 sm:mb-16">
              <button 
                onClick={onLoginClick}
                className="group px-6 py-3 rounded-2xl text-sm sm:text-base font-black bg-slate-900 text-white shadow-xl shadow-slate-900/25 hover:bg-slate-800 hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2.5 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <a 
                href="#features"
                className="px-6 py-3 rounded-2xl text-sm sm:text-base font-black text-slate-700 bg-white/80 backdrop-blur-sm border border-slate-200 hover:border-slate-300 hover:bg-white shadow-2xs hover:shadow-xs transition-all duration-200 flex items-center gap-2"
              >
                Explore Features
              </a>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-2xl shadow-slate-200/30 p-2">
              <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100">
                {stats.map((stat, i) => (
                  <div key={i} className="text-center py-5 px-4">
                    <div className="text-2xl md:text-3xl font-black text-slate-900">{stat.value}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FEATURES SECTION ============ */}
      <section id="features" className="py-24 md:py-32 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-black uppercase tracking-wider mb-6">
              <Layers className="w-3.5 h-3.5" />
              Platform Features
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
              Everything You Need to <br className="hidden md:block" />Deliver World-Class Training
            </h2>
            <p className="text-slate-500 font-medium">
              From course creation to certification, Mind2i handles every aspect of your workshop or bootcamp.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, i) => {
              const colors = colorMap[feature.color];
              const Icon = feature.icon;
              return (
                <div 
                  key={i}
                  className={`group relative bg-white p-8 md:p-10 rounded-3xl border border-slate-200/60 shadow-xl ${colors.glow} hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-default`}
                >
                  <div className={`w-14 h-14 ${colors.bg} rounded-2xl flex items-center justify-center ${colors.text} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-500 leading-relaxed font-medium">{feature.description}</p>
                </div>
              );
            })}
          </div>

          {/* Extra feature pills */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            {[
              "Batch Management", "CSV Student Upload", "QR Code Registration", 
              "LearnHub Content", "Assignment Engine", "Live Q&A Sessions",
              "Resource Library", "Real-time Analytics", "Custom Branding"
            ].map((pill, i) => (
              <span key={i} className="px-4 py-2 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-600 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default">
                <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5 text-emerald-500" />
                {pill}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how-it-works" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black uppercase tracking-wider mb-6">
              <Zap className="w-3.5 h-3.5" />
              Simple Workflow
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
              How Mind2i Works
            </h2>
            <p className="text-slate-500 font-medium">
              Get your workshop or bootcamp up and running in four simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item, i) => (
              <div key={i} className="relative group">
                <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full">
                  <div className="text-5xl font-black text-slate-100 group-hover:text-sky-100 transition-colors mb-4">{item.step}</div>
                  <h3 className="text-lg font-black text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">{item.description}</p>
                </div>
                {i < howItWorks.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <ChevronRight className="w-6 h-6 text-slate-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ ABOUT / WHO IS IT FOR ============ */}
      <section id="about" className="py-24 md:py-32 bg-gradient-to-b from-slate-900 to-slate-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px'}}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-sky-300 text-xs font-black uppercase tracking-wider mb-6">
              <Globe className="w-3.5 h-3.5" />
              Who Is This For?
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
              Built for Trainers, <br className="hidden md:block" />Loved by Students
            </h2>
            <p className="text-slate-400 font-medium">
              Whether you are a tech trainer, a college department, or an EdTech company — Mind2i gives you a complete, white-labeled platform to run professional workshops.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="w-12 h-12 bg-sky-500/20 rounded-2xl flex items-center justify-center text-sky-400 mb-5">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black mb-2">College Departments</h3>
              <p className="text-sm text-slate-400 leading-relaxed">Organize faculty-led workshops with batch management, attendance tracking, and automated certification.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="w-12 h-12 bg-violet-500/20 rounded-2xl flex items-center justify-center text-violet-400 mb-5">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black mb-2">Tech Trainers</h3>
              <p className="text-sm text-slate-400 leading-relaxed">Deliver hands-on bootcamps with live coding, real-time quizzes, and structured learning paths for participants.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 mb-5">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black mb-2">EdTech Companies</h3>
              <p className="text-sm text-slate-400 leading-relaxed">White-label the platform. Scale training across multiple colleges with centralized analytics and reporting.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CTA SECTION ============ */}
      <section className="py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 text-center">
          <div className="bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 rounded-[2rem] p-12 md:p-16 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
                Ready to Transform Your Training?
              </h2>
              <p className="text-white/80 font-medium max-w-xl mx-auto mb-10 text-lg">
                Log in to start creating batches, enrolling students, and delivering impactful workshops.
              </p>
              <button 
                onClick={onLoginClick}
                className="group px-10 py-4 rounded-2xl text-base font-black bg-white text-slate-900 shadow-2xl hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-3 mx-auto"
              >
                Login to Dashboard
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* ============ FOOTER ============ */}
      <footer className="bg-slate-50 border-t border-slate-200/80 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Minda2Logo size="md" showTagline={false} />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Workshop & Bootcamp Hub</span>
            </div>
            <p className="text-sm text-slate-400 font-medium">
              &copy; {new Date().getFullYear()} Mind2i. All rights reserved. Built with ❤️ for educators.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingView;
