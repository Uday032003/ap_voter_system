import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.js';
import { 
  Users, 
  Search, 
  MapPin, 
  ShieldCheck, 
  UploadCloud, 
  UserCheck, 
  ArrowRight, 
  CheckCircle2,
  Globe2,
  Lock,
  ChevronRight,
  ChevronDown,
  Building2,
  Vote,
  Sparkles,
  UserPlus
} from 'lucide-react';

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const isTelugu = i18n.language === 'te';

  // Toggle FAQ accordion item
  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  // If already authenticated, redirect to role home
  const handleRoleRedirect = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role === 'super_admin') navigate('/admin/dashboard');
    else if (user.role === 'leader') navigate('/leader/dashboard');
    else navigate('/commoner/voters');
  };

  const faqs = [
    {
      q: isTelugu 
        ? 'సాధారణ పౌరులు ఓటరు జాబితాను శోధించడానికి అడ్మిన్ అనుమతి అవసరమా?' 
        : 'Do citizens require admin approval to search the voter roll?',
      a: isTelugu
        ? 'అవసరం లేదు! పౌరుడిగా నమోదు చేసుకున్న వెంటనే మీ జిల్లా, అసెంబ్లీ నియోజకవర్గం మరియు ఎంపీటీసీ గ్రామాన్ని ఎంచుకుని నేరుగా ఓటరు రికార్డులను పరిశీలించవచ్చు.'
        : 'No! Citizens can register and immediately select their District, Assembly Constituency, and MPTC village to look up voter details without awaiting administrator approval.'
    },
    {
      q: isTelugu
        ? 'తెలుగు మరియు ఇంగ్లీష్ రెండు భాషలలోనూ పేర్లను శోధించవచ్చా?'
        : 'Can I search in both Telugu and English script?',
      a: isTelugu
        ? 'అవును. వ్యవస్థలో ద్విభాషా శోధన సదుపాయం ఉంది. ఓటరు పేరు, బంధువు పేరు, డోర్ నంబర్ లేదా ఎపిక్ (EPIC) కార్డు సంఖ్య ద్వారా తెలుగు లేదా ఆంగ్లంలో శోధించవచ్చు.'
        : 'Yes. The system features a native bilingual search engine allowing lookups by voter name, relative name, house number, serial number, and EPIC in both Telugu and English script.'
    },
    {
      q: isTelugu
        ? 'నియోజకవర్గ లీడర్ హోదా ఎలా లభిస్తుంది?'
        : 'How do leaders gain access to manage a constituency?',
      a: isTelugu
        ? 'లీడర్లు రిజిస్ట్రేషన్ ద్వారా తమ కావలసిన నియోజకవర్గాన్ని ఎంచుకుని అభ్యర్థన సమర్పిస్తారు. రాష్ట్ర సూపర్ అడ్మిన్ పరిశీలించి ఆమోదించిన తర్వాతే లీడర్ డాష్‌బోర్డ్ క్రియాశీలకం అవుతుంది.'
        : 'Leaders register and select their target constituency to submit an access request. Once reviewed and verified by the State Super Admin, the administrative roll workspace is activated.'
    }
  ];

  return (
    <div className="landing-page">
      {/* 1. Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero-content">
          {/* Government Official Emblem Badge */}
          <div className="landing-hero-badge">
            <span className="pulse-dot"></span>
            <span>
              {isTelugu 
                ? 'ఆంధ్రప్రదేశ్ ప్రభుత్వం • అధికారిక ఓటరు డైరెక్టరీ' 
                : 'Government of Andhra Pradesh • Official Electoral Directory'}
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="landing-hero-title">
            {isTelugu
              ? 'ఆంధ్రప్రదేశ్ ఓటరు డైరెక్టరీ & నియోజకవర్గ నిర్వహణ వ్యవస్థ'
              : 'Andhra Pradesh Voter Directory & Constituency Management'}
          </h1>

          {/* Subtitle */}
          <p className="landing-hero-subtitle">
            {isTelugu
              ? 'ఆంధ్రప్రదేశ్ రాష్ట్రం అంతటా ఓటరు రికార్డులు మరియు ఎం.పి.టి.సి నియోజకవర్గ వివరాలను సురక్షితంగా మరియు పారదర్శకంగా పరిశీలించే నిష్పాక్షిక అధికారిక వ్యవస్థ.'
              : 'A secure, non-partisan electoral roll directory and administrative constituency-management portal engineered specifically for Andhra Pradesh.'}
          </p>

          {/* Action Buttons */}
          <div className="landing-hero-actions">
            {user ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '0.75rem' }}>
                <div className="landing-user-hero-box">
                  <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>
                    {user.role?.replace('_', ' ')}
                  </span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user.full_name_en}</span>
                </div>
                <button
                  type="button"
                  className="landing-btn-primary"
                  onClick={handleRoleRedirect}
                >
                  <span>{isTelugu ? 'నా డాష్‌బోర్డ్‌కి వెళ్లండి' : 'Go to My Dashboard'}</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="landing-btn-primary">
                  <UserCheck size={19} />
                  <span>{isTelugu ? 'లాగిన్ అవ్వండి (Sign In)' : 'Sign In to Portal'}</span>
                </Link>

                <Link to="/register" className="landing-btn-secondary">
                  <UserPlus size={19} />
                  <span>{isTelugu ? 'పౌరుల నమోదు (Register)' : 'Citizen Registration'}</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 2. Statewide Impact Metrics Counter */}
      <section className="landing-stats-grid" aria-label="Key State Statistics">
        {/* Metric 1 */}
        <div className="landing-stat-card">
          <div className="landing-stat-icon-box" style={{ background: '#ecfdf5', color: '#047857' }}>
            <Building2 size={22} />
          </div>
          <div>
            <div className="landing-stat-num">175</div>
            <div className="landing-stat-label">
              {isTelugu ? 'శాసనసభ నియోజకవర్గాలు' : 'Assembly Segments'}
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="landing-stat-card">
          <div className="landing-stat-icon-box" style={{ background: '#ede9fe', color: '#7c3aed' }}>
            <MapPin size={22} />
          </div>
          <div>
            <div className="landing-stat-num">26</div>
            <div className="landing-stat-label">
              {isTelugu ? 'ఆంధ్రప్రదేశ్ జిల్లాలు' : 'Districts Across AP'}
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="landing-stat-card">
          <div className="landing-stat-icon-box" style={{ background: '#fef3c7', color: '#d97706' }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="landing-stat-num">100%</div>
            <div className="landing-stat-label">
              {isTelugu ? 'అధికారిక ఓటరు జాబితా' : 'Verified AP Roll'}
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="landing-stat-card">
          <div className="landing-stat-icon-box" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <Globe2 size={22} />
          </div>
          <div>
            <div className="landing-stat-num">తెలుగు / EN</div>
            <div className="landing-stat-label">
              {isTelugu ? 'పూర్తి ద్విభాషా వేదిక' : 'Bilingual Support'}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Fast Access Pathways for Users */}
      <section className="landing-pathways-section">
        <div className="landing-section-header">
          <span className="landing-section-badge">
            {isTelugu ? 'త్వరిత ప్రవేశ మార్గాలు' : 'Quick Access Paths'}
          </span>
          <h2 className="landing-section-title">
            {isTelugu ? 'మీ సేవను నేరుగా ఎంచుకోండి' : 'Choose Your Service Workflow'}
          </h2>
          <p className="landing-section-desc">
            {isTelugu
              ? 'పౌరులు, స్థానిక నాయకులు మరియు నిర్వాహకుల కోసం సులభమైన ప్రత్యేక మార్గాలు.'
              : 'Direct portals tailored for common citizens, constituency leaders, and state administrators.'}
          </p>
        </div>

        <div className="landing-pathways-grid">
          {/* Pathway 1: Citizen */}
          <Link to={user ? (user.role === 'commoner' ? '/commoner/voters' : '/login') : '/register'} className="landing-pathway-card">
            <div className="landing-pathway-top">
              <div className="landing-pathway-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                <Search size={24} />
              </div>
              <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                {isTelugu ? 'పౌరులు' : 'Public'}
              </span>
            </div>
            <h3 className="landing-pathway-title">
              {isTelugu ? 'పౌర ఓటరు పరిశీలన' : 'Citizen Voter Search'}
            </h3>
            <p className="landing-pathway-desc">
              {isTelugu
                ? 'ఎలాంటి అడ్మిన్ ఆమోదం లేకుండా మీ జిల్లా, అసెంబ్లీ, ఎంపీటీసీని ఎంచుకుని మీ ఓటరు వివరాలను మరియు కుటుంబ రికార్డులను వెంటనే శోధించండి.'
                : 'Instantly select your District and MPTC village to look up your voting booth and voter roll records without awaiting permissions.'}
            </p>
            <div className="landing-pathway-action">
              <span>{isTelugu ? 'డైరెక్టరీ తెరవండి' : 'Access Directory'}</span>
              <ChevronRight size={16} />
            </div>
          </Link>

          {/* Pathway 2: Leader */}
          <Link to={user ? (user.role === 'leader' ? '/leader/dashboard' : '/login') : '/login'} className="landing-pathway-card">
            <div className="landing-pathway-top">
              <div className="landing-pathway-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                <Vote size={24} />
              </div>
              <span className="badge badge-accent" style={{ fontSize: '0.75rem' }}>
                {isTelugu ? 'లీడర్' : 'Leader'}
              </span>
            </div>
            <h3 className="landing-pathway-title">
              {isTelugu ? 'నియోజకవర్గ నాయకుల పోర్టల్' : 'Constituency Leader Portal'}
            </h3>
            <p className="landing-pathway-desc">
              {isTelugu
                ? 'సూపర్ అడ్మిన్ ద్వారా అధికారం పొందిన నియోజకవర్గ ఓటరు జాబితాను పరిశీలించి, సమన్వయ జాబితాలోకి ఓటర్లను సురక్షితంగా నిర్వహించండి.'
                : 'Access designated constituency rolls, review official voting records, and track administrative voters in non-partisan rosters.'}
            </p>
            <div className="landing-pathway-action" style={{ color: '#d97706' }}>
              <span>{isTelugu ? 'లీడర్ లాగిన్' : 'Leader Sign In'}</span>
              <ChevronRight size={16} />
            </div>
          </Link>

          {/* Pathway 3: Super Admin */}
          <Link to={user ? (user.role === 'super_admin' ? '/admin/dashboard' : '/login') : '/login'} className="landing-pathway-card">
            <div className="landing-pathway-top">
              <div className="landing-pathway-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
                <ShieldCheck size={24} />
              </div>
              <span className="badge badge-danger" style={{ fontSize: '0.75rem' }}>
                {isTelugu ? 'అడ్మిన్' : 'Admin'}
              </span>
            </div>
            <h3 className="landing-pathway-title">
              {isTelugu ? 'రాష్ట్ర సూపర్ అడ్మిన్ కన్సోల్' : 'Super Admin Console'}
            </h3>
            <p className="landing-pathway-desc">
              {isTelugu
                ? 'ఆంధ్రప్రదేశ్ రాష్ట్ర సమగ్ర నియోజకవర్గ నిర్మాణం, ఓటరు జాబితా CSVల దిగుమతి, మరియు లీడర్ అభ్యర్థనల ధృవీకరణ నిర్వహించండి.'
                : 'State-wide administrative control, electoral-roll CSV batch ingestion, constituency geography management, and access authorization.'}
            </p>
            <div className="landing-pathway-action" style={{ color: '#dc2626' }}>
              <span>{isTelugu ? 'అడ్మిన్ లాగిన్' : 'Admin Sign In'}</span>
              <ChevronRight size={16} />
            </div>
          </Link>
        </div>
      </section>

      {/* 4. Core System Capabilities Section */}
      <section style={{ marginBottom: '3.25rem' }}>
        <div className="landing-section-header">
          <span className="landing-section-badge">
            {isTelugu ? 'ప్రధాన ఫీచర్లు' : 'Capabilities'}
          </span>
          <h2 className="landing-section-title">
            {isTelugu ? 'కీలక ఫీచర్లు & సౌకర్యాలు' : 'Core System Capabilities'}
          </h2>
          <p className="landing-section-desc">
            {isTelugu
              ? 'పరిపాలన మరియు పౌర పారదర్శకత కోసం రూపొందించబడిన ఆధునిక సాంకేతికత.'
              : 'Engineered for administrative precision, roll accuracy, and citizen transparency.'}
          </p>
        </div>

        <div className="landing-features-grid">
          {/* Card 1: Bilingual Voter Search */}
          <div className="landing-feature-card">
            <div className="landing-feature-icon-wrapper" style={{ background: '#e0f2fe', color: '#0284c7' }}>
              <Search size={22} />
            </div>
            <h3 className="landing-feature-title">
              {isTelugu ? 'ద్విభాషా ఓటరు శోధన' : 'Bilingual Voter Search'}
            </h3>
            <p className="landing-feature-desc">
              {isTelugu
                ? 'తెలుగు మరియు ఇంగ్లీష్ రెండు భాషలలో ఓటరు పేరు, బంధువు పేరు, డోర్ నంబర్ మరియు ఓటరు గుర్తింపు కార్డు (EPIC) ద్వారా సులభంగా శోధించండి.'
                : 'Instantly query official roll records by voter name, relative name, house number, serial number, and EPIC in both Telugu and English script.'}
            </p>
          </div>

          {/* Card 2: Constituency Management */}
          <div className="landing-feature-card">
            <div className="landing-feature-icon-wrapper" style={{ background: '#ede9fe', color: '#7c3aed' }}>
              <MapPin size={22} />
            </div>
            <h3 className="landing-feature-title">
              {isTelugu ? 'నియోజకవర్గ క్రమబద్ధీకరణ' : 'Constituency Management'}
            </h3>
            <p className="landing-feature-desc">
              {isTelugu
                ? 'ఆంధ్రప్రదేశ్ రాష్ట్రం → జిల్లా → అసెంబ్లీ నియోజకవర్గం → ఎం.పి.టి.సి గ్రామ నియోజకవర్గం క్రమానుగత ఎంపిక విధానం.'
                : 'State (AP) → District → Assembly Constituency → MPTC Village Constituency structured hierarchy with cascading dropdown selection.'}
            </p>
          </div>

          {/* Card 3: Secure Role Access */}
          <div className="landing-feature-card">
            <div className="landing-feature-icon-wrapper" style={{ background: '#fef3c7', color: '#d97706' }}>
              <ShieldCheck size={22} />
            </div>
            <h3 className="landing-feature-title">
              {isTelugu ? 'భద్రత & అధికారాల రక్షణ' : 'Secure Role-Based Access'}
            </h3>
            <p className="landing-feature-desc">
              {isTelugu
                ? 'సూపర్ అడ్మిన్ ఆమోదం పొందిన తర్వాతే స్థానిక నియోజకవర్గ నాయకులకు బాధ్యతాయుతమైన డేటా నిర్వహణ అవకాశం లభిస్తుంది.'
                : 'Strict permission enforcement, cryptographically secured sessions, and mandatory Super Admin authorization for constituency leaders.'}
            </p>
          </div>

          {/* Card 4: CSV Electoral Roll Import */}
          <div className="landing-feature-card">
            <div className="landing-feature-icon-wrapper" style={{ background: '#dcfce7', color: '#16a34a' }}>
              <UploadCloud size={22} />
            </div>
            <h3 className="landing-feature-title">
              {isTelugu ? 'నేరుగా CSV డేటా దిగుమతి' : 'Automated CSV Import'}
            </h3>
            <p className="landing-feature-desc">
              {isTelugu
                ? 'ఓటరు జాబితా CSVను నేరుగా ధృవీకరించి, డూప్లికేట్లను నివారించి సులభంగా వేలాది రికార్డులను నిమిషాల్లో భద్రపరచండి.'
                : 'High-speed automated import pipeline with instant column validation, duplicate detection, and batch persistence without bottlenecks.'}
            </p>
          </div>
        </div>
      </section>

      {/* 5. User Roles Detailed Breakdown */}
      <section className="landing-roles-section">
        <div className="landing-section-header">
          <span className="landing-section-badge">
            {isTelugu ? 'అధికార పరిధులు' : 'User Roles'}
          </span>
          <h2 className="landing-section-title">
            {isTelugu ? 'మూడు ప్రత్యేక పాత్రలు (User Roles)' : 'Three Distinct User Roles'}
          </h2>
          <p className="landing-section-desc">
            {isTelugu
              ? 'ప్రతి పాత్రకు స్పష్టమైన అధికారాలు, భద్రతా సరిహద్దులు కేటాయించబడ్డాయి.'
              : 'Each role possesses clearly defined responsibilities and strictly enforced access boundaries.'}
          </p>
        </div>

        <div className="landing-roles-grid">
          {/* Role 1: Super Admin */}
          <div className="landing-role-card role-admin">
            <div className="landing-role-header">
              <span className="badge badge-danger">
                {isTelugu ? 'సూపర్ అడ్మిన్' : 'Super Admin'}
              </span>
            </div>
            <h3 className="landing-role-title">
              {isTelugu ? 'రాష్ట్ర ప్రధాన నిర్వాహకుడు' : 'State Administrator'}
            </h3>
            <ul className="landing-role-checklist">
              <li className="landing-role-item">
                <CheckCircle2 size={16} color="#dc2626" />
                <span>{isTelugu ? 'జిల్లాల, అసెంబ్లీల, ఎంపీటీసీల క్రమ నిర్వహణ.' : 'Manages district and constituency hierarchy.'}</span>
              </li>
              <li className="landing-role-item">
                <CheckCircle2 size={16} color="#dc2626" />
                <span>{isTelugu ? 'ఓటరు జాబితా CSVల ధృవీకరణ మరియు దిగుమతి.' : 'Imports official electoral-roll CSV files.'}</span>
              </li>
              <li className="landing-role-item">
                <CheckCircle2 size={16} color="#dc2626" />
                <span>{isTelugu ? 'నాయకుల అనుమతి అభ్యర్థనల ఆమోదం / తిరస్కరణ.' : 'Approves and revokes Leader access requests.'}</span>
              </li>
              <li className="landing-role-item">
                <CheckCircle2 size={16} color="#dc2626" />
                <span>{isTelugu ? 'అధికారిక ఓటరు రికార్డులను సవరించే అధికారం.' : 'Authorized to edit master voter details.'}</span>
              </li>
            </ul>
          </div>

          {/* Role 2: Leader */}
          <div className="landing-role-card role-leader">
            <div className="landing-role-header">
              <span className="badge badge-accent">
                {isTelugu ? 'నియోజకవర్గ లీడర్' : 'Constituency Leader'}
              </span>
            </div>
            <h3 className="landing-role-title">
              {isTelugu ? 'పరిపాలనా సమన్వయకర్త' : 'Administrative In-Charge'}
            </h3>
            <ul className="landing-role-checklist">
              <li className="landing-role-item">
                <CheckCircle2 size={16} color="#d97706" />
                <span>{isTelugu ? 'ఆమోదం పొందిన నియోజకవర్గ పరిధిని వీక్షించడం.' : 'Accesses authorized constituency roll.'}</span>
              </li>
              <li className="landing-role-item">
                <CheckCircle2 size={16} color="#d97706" />
                <span>{isTelugu ? 'సమన్వయ జాబితాలోకి ఓటర్లను చేర్చడం (Tick).' : 'Adds voters to administrative follow-up list.'}</span>
              </li>
              <li className="landing-role-item">
                <CheckCircle2 size={16} color="#d97706" />
                <span>{isTelugu ? 'చేర్చబడిన ఓటర్ల సంఖ్య మరియు జాబితా నిర్వహణ.' : 'Manages private roster with live statistics.'}</span>
              </li>
              <li className="landing-role-item">
                <CheckCircle2 size={16} color="#d97706" />
                <span>{isTelugu ? 'ఎటువంటి రాజకీయ ప్రాధాన్యతలు జోడించబడవు.' : 'Strictly non-partisan administrative tracking.'}</span>
              </li>
            </ul>
          </div>

          {/* Role 3: Commoner */}
          <div className="landing-role-card role-commoner">
            <div className="landing-role-header">
              <span className="badge badge-primary">
                {isTelugu ? 'సాధారణ పౌరుడు' : 'Common Citizen'}
              </span>
            </div>
            <h3 className="landing-role-title">
              {isTelugu ? 'పౌర ఓటరు డైరెక్టరీ' : 'Public Roll Access'}
            </h3>
            <ul className="landing-role-checklist">
              <li className="landing-role-item">
                <CheckCircle2 size={16} color="#0284c7" />
                <span>{isTelugu ? 'తన జిల్లా, అసెంబ్లీ, ఎంపీటీసీని నేరుగా ఎంచుకోవడం.' : 'Selects district and MPTC village directly.'}</span>
              </li>
              <li className="landing-role-item">
                <CheckCircle2 size={16} color="#0284c7" />
                <span>{isTelugu ? 'ఎలాంటి అడ్మిన్ ఆమోదం లేకుండా ఓటరు పరిశీలన.' : 'Instant directory search without approval needed.'}</span>
              </li>
              <li className="landing-role-item">
                <CheckCircle2 size={16} color="#0284c7" />
                <span>{isTelugu ? 'ఎంపికను భద్రపరచడం మరియు ఎప్పుడైనా మార్చుకోవడం.' : 'Saved selection auto-loads on future visits.'}</span>
              </li>
              <li className="landing-role-item">
                <CheckCircle2 size={16} color="#0284c7" />
                <span>{isTelugu ? 'ఇతరుల వ్యక్తిగత వివరాలు గోప్యంగా ఉంటాయి.' : 'Private notes & restricted actions stay hidden.'}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 6. Trust & Non-Partisan Privacy Guarantee */}
      <section className="landing-trust-strip" aria-label="Security and Privacy">
        <div className="landing-trust-item">
          <ShieldCheck size={20} color="#16a34a" />
          <span>{isTelugu ? '100% నిష్పాక్షికమైనది & సురక్షితమైనది' : '100% Non-Partisan & Secure'}</span>
        </div>
        <div className="landing-trust-item">
          <Lock size={19} color="#16a34a" />
          <span>{isTelugu ? 'ఎలక్టోరల్ డేటా గోప్యతా రక్షణ' : 'Electoral Data Privacy Protection'}</span>
        </div>
        <div className="landing-trust-item">
          <CheckCircle2 size={19} color="#16a34a" />
          <span>{isTelugu ? 'అధికారిక రికార్డుల ధృవీకరణ' : 'Official Electoral Roll Integrity'}</span>
        </div>
      </section>

      {/* 7. Frequently Asked Questions (FAQ) Accordion on Mobile */}
      <section className="landing-faq-section">
        <div className="landing-section-header">
          <span className="landing-section-badge">FAQ</span>
          <h2 className="landing-section-title">
            {isTelugu ? 'తరచుగా అడిగే ప్రశ్నలు' : 'Frequently Asked Questions'}
          </h2>
          <p className="landing-section-desc">
            {isTelugu
              ? 'ఓటరు డైరెక్టరీ వినియోగం గురించి పౌరుల సందేహాలు మరియు సమాధానాలు.'
              : 'Quick answers regarding electoral roll access, registration, and privacy.'}
          </p>
        </div>

        <div className="landing-faq-list">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className={`landing-faq-item ${isOpen ? 'open' : ''}`}>
                <button
                  type="button"
                  className="landing-faq-question"
                  onClick={() => toggleFaq(idx)}
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={18}
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      flexShrink: 0
                    }}
                  />
                </button>
                {isOpen && (
                  <div className="landing-faq-answer">
                    <p style={{ margin: 0 }}>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. Bottom Call to Action Banner */}
      <section className="landing-cta-banner">
        <h3 className="landing-cta-title">
          {isTelugu ? 'ఓటరు డైరెక్టరీని ఉపయోగించడానికి సిద్ధంగా ఉన్నారా?' : 'Ready to Access the Electoral Roll Directory?'}
        </h3>
        <p className="landing-cta-desc">
          {isTelugu
            ? 'మీ ఖాతాతో లాగిన్ అవ్వండి లేదా పౌరుడిగా కొత్తగా నమోదు చేసుకుని మీ నియోజకవర్గ వివరాలను చూడండి.'
            : 'Sign in to access your designated workflow or register to search your local constituency roll.'}
        </p>

        <div className="landing-cta-actions">
          {user ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleRoleRedirect}
              style={{ minHeight: '48px', padding: '0.75rem 1.75rem', fontWeight: 700 }}
            >
              <span>{isTelugu ? 'నా డాష్‌బోర్డ్‌కి వెళ్లండి' : 'Go to My Dashboard'}</span>
              <ArrowRight size={17} />
            </button>
          ) : (
            <>
              <Link to="/login" className="btn btn-primary" style={{ minHeight: '48px', padding: '0.75rem 1.75rem', fontWeight: 700 }}>
                <UserCheck size={17} />
                <span>{isTelugu ? 'సైన్ ఇన్ (Sign In)' : 'Sign In Now'}</span>
              </Link>
              <Link to="/register" className="btn btn-secondary" style={{ minHeight: '48px', padding: '0.75rem 1.75rem', fontWeight: 600 }}>
                <UserPlus size={17} />
                <span>{isTelugu ? 'కొత్త ఖాతా (Register)' : 'Citizen Registration'}</span>
              </Link>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
