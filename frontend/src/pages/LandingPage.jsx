import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Activity, 
  Brain, 
  Heart, 
  ShieldCheck, 
  Sparkles,
  CheckCircle2,
  Menu,
  X,
  Calendar,
  ChevronRight
} from 'lucide-react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-pink-500/30">
      
      {/* ─── NAVBAR ───────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-[#222]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold font-['Lora'] tracking-tight">
              Ova<span className="text-pink-500">Sense</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">How it works</a>
            <a href="#testimonials" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Stories</a>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link 
              to="/login" 
              className="px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Link 
              to="/register" 
              className="px-5 py-2.5 bg-white text-black text-sm font-bold rounded-full hover:bg-gray-100 transition-all transform hover:scale-105"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button 
            className="md:hidden text-gray-300"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0a0a0a] border-b border-[#222] px-6 py-8 space-y-4 animate-in slide-in-from-top-4">
            <Link to="/login" className="block w-full py-3 text-center text-gray-300 border border-[#333] rounded-xl font-medium">Log in</Link>
            <Link to="/register" className="block w-full py-3 text-center bg-pink-600 text-white rounded-xl font-bold">Sign up free</Link>
          </div>
        )}
      </nav>

      {/* ─── HERO SECTION ─────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-pink-600/20 rounded-full blur-[120px] -z-10 opacity-50 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-pink-500/10 border border-pink-500/20 rounded-full text-xs font-semibold text-pink-400 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Sparkles className="w-3 h-3" />
            <span>New: AI-Powered Symptom Analysis</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold font-['Lora'] leading-tight mb-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            Understand your body,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
              not just your cycle.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
            OvaSense uses advanced AI to decode your hormonal health, predict patterns, and provide personalized insights for PCOS and menstrual wellness.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
            <Link 
              to="/register" 
              className="w-full sm:w-auto px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-gray-100 transition-all flex items-center justify-center gap-2 hover:gap-3"
            >
              Start Free Analysis <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              to="/login" 
              className="w-full sm:w-auto px-8 py-4 bg-[#1a1a1a] text-white border border-[#333] rounded-full font-bold text-lg hover:bg-[#222] transition-all"
            >
              View Demo
            </Link>
          </div>
        </div>
      </section>

      {/* ─── THE PROBLEM ──────────────────────────────────────────────── */}
      <section className="py-20 md:py-32 bg-[#0d0d0d] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0d0d0d] to-[#0a0a0a] opacity-50" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full text-xs font-semibold text-red-400 mb-6">
              The Silent Epidemic
            </div>
            <h2 className="text-3xl md:text-5xl font-bold font-['Lora'] mb-6">
              PCOS affects <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-red-500">1 in 10 women</span> globally
            </h2>
            <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto">
              Yet most discover it only after irreversible damage begins. In India, up to 20% of women show PCOS symptoms—many undiagnosed for years.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { label: "Infertility Risk", icon: "💔" },
              { label: "Diabetes Risk", icon: "🩸" },
              { label: "Mental Health Impact", icon: "🧠" },
              { label: "Hormonal Damage", icon: "⚠️" }
            ].map((item, i) => (
              <div key={i} className="bg-[#111] border border-red-500/20 rounded-xl p-6 text-center hover:border-red-500/40 transition-colors">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="text-white font-semibold">{item.label}</h3>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
            <p className="text-xl md:text-2xl font-bold text-white mb-2">
              The Real Question:
            </p>
            <p className="text-lg md:text-xl text-gray-300">
              How can we detect PCOS <span className="text-pink-400 font-semibold">early</span>, before damage occurs?
            </p>
          </div>
        </div>
      </section>

      {/* ─── CURRENT SOLUTIONS ARE BROKEN ────────────────────────────── */}
      <section className="py-20 md:py-32 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold font-['Lora'] mb-6">
              Why existing apps fall short
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Period trackers only track dates. Generic symptom checkers give yes/no answers. Neither provides the insight you need.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {/* Period Trackers */}
            <div className="bg-[#111] border border-[#222] rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gray-500/10 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Period Trackers</h3>
              </div>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-start gap-2">
                  <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>Only track dates and predict ovulation</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>Give generic wellness tips</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>Don't detect PCOS or health risks</span>
                </li>
              </ul>
            </div>

            {/* ML Symptom Checkers */}
            <div className="bg-[#111] border border-[#222] rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gray-500/10 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-white">AI Symptom Checkers</h3>
              </div>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-start gap-2">
                  <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>Only say "PCOS: Yes or No"</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>Don't identify which of 4 PCOS types</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>No personalized treatment guidance</span>
                </li>
              </ul>
            </div>
          </div>

          {/* The 4 PCOS Types */}
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-pink-500/20 rounded-2xl p-8 md:p-12">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center">
              PCOS has <span className="text-pink-500">4 distinct types</span>
            </h3>
            <p className="text-gray-400 text-center mb-8 max-w-2xl mx-auto">
              Each requires different treatment and diet. Without identifying the type, care becomes ineffective.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: "Insulin-Resistant", color: "from-blue-500 to-cyan-500" },
                { name: "Lean PCOS", color: "from-green-500 to-emerald-500" },
                { name: "Adrenal PCOS", color: "from-orange-500 to-red-500" },
                { name: "Inflammatory", color: "from-purple-500 to-pink-500" }
              ].map((type, i) => (
                <div key={i} className="bg-[#111] border border-[#222] rounded-xl p-4 text-center hover:border-pink-500/30 transition-colors">
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-lg bg-gradient-to-br ${type.color} opacity-20`} />
                  <p className="text-white font-semibold text-sm">{type.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── OUR SOLUTION ─────────────────────────────────────────────── */}
      <section className="py-20 md:py-32 bg-[#0d0d0d] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-1.5 bg-pink-500/10 border border-pink-500/20 rounded-full text-xs font-semibold text-pink-400 mb-6">
              The OvaSense Difference
            </div>
            <h2 className="text-3xl md:text-5xl font-bold font-['Lora'] mb-6">
              The first <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">explainable AI</span> for PCOS
            </h2>
            <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto">
              We don't just say "PCOS." We tell you which type, why, and what to do next—with personalized diet plans and risk predictions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[
              {
                icon: <ShieldCheck className="w-6 h-6 text-green-400" />,
                title: "Clinical Rotterdam Criteria",
                desc: "Built on the global medical standard for PCOS diagnosis"
              },
              {
                icon: <Brain className="w-6 h-6 text-purple-400" />,
                title: "Phenotype Detection",
                desc: "Identifies which of 4 PCOS types you have for targeted care"
              },
              {
                icon: <Activity className="w-6 h-6 text-pink-400" />,
                title: "Predictive Healthcare",
                desc: "Detects risk before lab tests, enabling early intervention"
              }
            ].map((item, i) => (
              <div key={i} className="bg-[#111] border border-[#222] rounded-2xl p-6 hover:border-pink-500/30 transition-colors">
                <div className="w-12 h-12 bg-[#1a1a1a] rounded-xl flex items-center justify-center mb-4 border border-[#222]">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* How It Works */}
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-[#222] rounded-2xl p-8 md:p-12">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center">How OvaSense Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { step: "1", title: "Answer Questions", desc: "Share your symptoms and health data" },
                { step: "2", title: "AI Analysis", desc: "We apply Rotterdam criteria intelligently" },
                { step: "3", title: "Get Your Type", desc: "Discover your specific PCOS phenotype" },
                { step: "4", title: "Personalized Plan", desc: "Receive diet, lifestyle & risk insights" }
              ].map((item, i) => (
                <div key={i} className="relative">
                  <div className="bg-[#111] border border-pink-500/20 rounded-xl p-6 text-center h-full">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                      {item.step}
                    </div>
                    <h4 className="text-white font-semibold mb-2">{item.title}</h4>
                    <p className="text-gray-400 text-sm">{item.desc}</p>
                  </div>
                  {i < 3 && (
                    <ChevronRight className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 text-pink-500/30" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── APP PREVIEW ──────────────────────────────────────────────────── */}
      <section className="pb-32 px-6">
        <div className="max-w-6xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
          <div className="relative bg-[#0f0f0f] border border-[#222] rounded-2xl overflow-hidden shadow-2xl">
             <div className="flex items-center gap-2 px-4 py-3 border-b border-[#222] bg-[#111]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                </div>
                <div className="mx-auto text-xs font-mono text-gray-500">ovasense.ai/dashboard</div>
             </div>
             {/* Dashboard Preview Content */}
             <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                {/* Main Analysis Card */}
                <div className="md:col-span-2 bg-[#161616] rounded-xl border border-[#222] p-6 space-y-6">
                   {/* Header */}
                   <div className="flex items-center justify-between">
                      <div>
                         <h3 className="text-white font-bold text-lg mb-1">Latest Analysis</h3>
                         <p className="text-gray-500 text-sm">Insulin-Resistant PCOS</p>
                      </div>
                      <div className="px-3 py-1.5 bg-pink-500/10 border border-pink-500/20 rounded-lg">
                         <span className="text-pink-400 font-semibold text-sm">87% Match</span>
                      </div>
                   </div>

                   {/* Cycle Chart */}
                   <div className="relative">
                      <div className="flex items-end justify-between h-32 gap-2">
                         {[
                            { height: 40, label: 'Jan', active: false },
                            { height: 65, label: 'Feb', active: false },
                            { height: 45, label: 'Mar', active: false },
                            { height: 80, label: 'Apr', active: true },
                            { height: 55, label: 'May', active: false },
                            { height: 70, label: 'Jun', active: false },
                            { height: 48, label: 'Jul', active: false }
                         ].map((bar, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2">
                               <div 
                                  className={`w-full rounded-t transition-all ${
                                     bar.active 
                                       ? 'bg-gradient-to-t from-pink-500 to-purple-500' 
                                       : 'bg-pink-500/20'
                                  }`}
                                  style={{ height: `${bar.height}%` }}
                               />
                               <span className="text-[10px] text-gray-600">{bar.label}</span>
                            </div>
                         ))}
                      </div>
                      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pink-500/20 to-transparent" />
                   </div>

                   {/* Quick Stats */}
                   <div className="grid grid-cols-3 gap-3">
                      <div className="bg-[#111] rounded-lg p-3 border border-[#222]">
                         <div className="text-2xl font-bold text-white mb-1">28</div>
                         <div className="text-xs text-gray-500">Avg Cycle</div>
                      </div>
                      <div className="bg-[#111] rounded-lg p-3 border border-[#222]">
                         <div className="text-2xl font-bold text-green-400 mb-1">92%</div>
                         <div className="text-xs text-gray-500">Accuracy</div>
                      </div>
                      <div className="bg-[#111] rounded-lg p-3 border border-[#222]">
                         <div className="text-2xl font-bold text-purple-400 mb-1">12</div>
                         <div className="text-xs text-gray-500">Logs</div>
                      </div>
                   </div>
                </div>

                {/* Sidebar Cards */}
                <div className="space-y-4">
                   {/* AI Insight Card */}
                   <div className="bg-[#161616] rounded-xl border border-[#222] p-5">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center mb-4 border border-purple-500/20">
                         <Brain className="w-6 h-6 text-purple-400" />
                      </div>
                      <h4 className="text-white font-semibold mb-2 text-sm">AI Insight</h4>
                      <p className="text-gray-400 text-xs leading-relaxed mb-3">
                         Your cycle is regular. Consider reducing sugar intake.
                      </p>
                      <div className="flex items-center gap-2 text-pink-400 text-xs font-medium">
                         <span>View Details</span>
                         <ArrowRight className="w-3 h-3" />
                      </div>
                   </div>

                   {/* Next Period Card */}
                   <div className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-xl border border-pink-500/20 p-5">
                      <div className="flex items-center gap-2 mb-3">
                         <Calendar className="w-4 h-4 text-pink-400" />
                         <span className="text-xs text-gray-400">Next Period</span>
                      </div>
                      <div className="text-2xl font-bold text-white mb-1">Feb 24</div>
                      <div className="text-xs text-gray-500">in 7 days</div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 bg-[#0d0d0d]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold font-['Lora'] mb-4">More than just a period tracker</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Holistic health monitoring designed for the complexities of female physiology.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Brain className="w-6 h-6 text-pink-400" />}
              title="AI Symptom Analysis"
              desc="Our Baymax engine analyzes 50+ biomarkers to predict PCOS phenotypes and hormonal imbalances."
            />
             <FeatureCard 
              icon={<Activity className="w-6 h-6 text-purple-400" />}
              title="Metabolic Insights"
              desc="Track insulin resistance, BMI trends, and metabolic risks with clinical-grade accuracy."
            />
             <FeatureCard 
              icon={<Heart className="w-6 h-6 text-red-400" />}
              title="Personalized Care"
              desc="Get daily nutrition plans, workout adjustments, and supplement recommendations tailored to your cycle."
            />
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#222] rounded-3xl p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-pink-600/10 rounded-full blur-[100px] pointer-events-none"></div>
          
          <h2 className="text-4xl md:text-5xl font-bold font-['Lora'] mb-6 relative z-10">Start your journey today.</h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto relative z-10">
            Join thousands of women taking control of their hormonal health with OvaSense.
          </p>
          
          <Link 
            to="/register" 
            className="inline-block px-10 py-4 bg-white text-black rounded-full font-bold text-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all relative z-10"
          >
            Create Free Account
          </Link>
          
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-500">
             <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> No credit card required</span>
             <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> HIPPA Compliant</span>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#222] py-12 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-500" />
            <span className="text-xl font-bold font-['Lora'] text-white">OvaSense</span>
           </div>
           
           <div className="flex gap-8 text-sm text-gray-400">
             <a href="#" className="hover:text-white transition-colors">Privacy</a>
             <a href="#" className="hover:text-white transition-colors">Terms</a>
             <a href="#" className="hover:text-white transition-colors">Contact</a>
           </div>
           
           <div className="text-sm text-gray-600">
             © 2026 OvaSense AI. All rights reserved.
           </div>
        </div>
      </footer>

    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="p-8 bg-[#111] border border-[#222] rounded-2xl hover:border-pink-500/30 transition-colors group">
      <div className="w-12 h-12 bg-[#1a1a1a] rounded-xl flex items-center justify-center mb-6 border border-[#222] group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{desc}</p>
    </div>
  );
}
