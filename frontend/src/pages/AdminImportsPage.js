import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api.js';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  RefreshCw, 
  Download,
  AlertCircle,
  FileCheck2,
  Layers,
  ArrowRight
} from 'lucide-react';
import { ImportHistorySkeleton } from '../components/common/SkeletonLoader.js';

const PDF_EXTRACTION_PROMPT = `You are an expert electoral data conversion assistant. Your task is to process pairs of official Andhra Pradesh Electoral Roll PDFs (English PDF and Telugu PDF for each polling station Part) and generate a single, validated, ready-to-import bilingual CSV file.

=== INPUT DATA ===
1. English Electoral Roll PDF(s)
2. Telugu Electoral Roll PDF(s)
(Each part has matching Part Numbers, e.g., Part 82 English and Part 82 Telugu).

=== REQUIRED CSV COLUMNS (EXACT ORDER) ===
serial_number,voter_id,name_en,name_te,relative_type,relative_name_en,relative_name_te,house_number,age,gender,part_number,section_name_en,section_name_te

=== EXTRACTION & MERGING INSTRUCTIONS ===
1. BILINGUAL RECORD MATCHING:
   - Match electors between English and Telugu rolls primarily by Part Number and Voter ID (EPIC number, e.g., YAY0858217, LTX1118983).
   - Verify that serial_number matches identically across both rolls.
   - Do NOT cross-pair records from different serial numbers or different parts.

2. CLEAN VALUE EXTRACTION (NO LABEL CONTAMINATION):
   - Never include field labels in extracted values.
   - Strip label prefixes like "Name:", "పేరు:", "Elector's Name:" from name_en and name_te.
   - Strip label prefixes like "Father's Name:", "Husband's Name:", "Mother's Name:", "Other's Name:", "తండ్రి పేరు:", "భర్త పేరు:" from relative_name_en and relative_name_te.
   - Cleanly separate the voter's name from the relative's name into their respective columns.
   - Populate relative_type with: "Father", "Husband", "Mother", or "Other".

3. SECTION BREAKS & EMPTY GRID SLOTS:
   - AP voter rolls use a 30-voter grid (3 columns x 10 rows per page).
   - When a Section ends mid-page, any remaining slots on that page remain BLANK. The next Section ALWAYS starts on the next page.
   - Do NOT generate phantom rows, synthetic names, or serial numbers for empty grid slots. Only extract actual elector cards.

4. SCRIPT & FIELD INTEGRITY:
   - English columns (name_en, relative_name_en, section_name_en) must contain English text.
   - Telugu columns (name_te, relative_name_te, section_name_te) must contain genuine Telugu Unicode script. Do NOT transliterate or invent translations.
   - Preserve leading zeros in house_number (e.g., '01-102', '02/14'), serial_number, voter_id, and part_number.
   - Gender must be standardized to: "Male", "Female", or "Other" (or "M", "F", "O"). Age must be an integer.

5. ENCODING & EXPORT SPECIFICATION:
   - Encode the CSV strictly with UTF-8 BOM ('utf-8-sig') so Telugu characters display natively in Microsoft Excel without Mojibake.
   - Apply standard CSV quoting for any values containing commas or whitespace.

6. AUDIT & VERIFICATION REPORT:
   - Check the official summary table on the final page of each Part PDF for the official elector count (Men, Women, Total).
   - Generate two downloadable files:
     1. 'bilingual_voters.csv': The consolidated voter directory records.
     2. 'extraction_report.csv': A verification table with part_number, expected_electors, extracted_electors, status, and discrepancies.`;

export default function AdminImportsPage() {
  const { t, i18n } = useTranslation();

  // Hierarchy dropdowns
  const [districts, setDistricts] = useState([]);
  const [assemblies, setAssemblies] = useState([]);
  const [mptcs, setMptcs] = useState([]);

  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedAssemblyId, setSelectedAssemblyId] = useState('');
  const [selectedMptcId, setSelectedMptcId] = useState('');

  // File upload & validation
  const [file, setFile] = useState(null);
  const [validating, setValidating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [validationSummary, setValidationSummary] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState(null);

  // Import history
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Copy prompt state
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const isTelugu = i18n.language === 'te';

  useEffect(() => {
    async function init() {
      try {
        const dRes = await api.getDistricts();
        if (dRes.success) setDistricts(dRes.data || []);
        loadHistory();
      } catch (err) {
        setError(err.message || 'Failed to initialize import console.');
      }
    }
    init();
  }, []);

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.getImportHistory();
      if (res.success) setHistory(res.data || []);
    } catch (e) {
      // non critical
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (!selectedDistrictId) {
      setAssemblies([]);
      setSelectedAssemblyId('');
      setMptcs([]);
      setSelectedMptcId('');
      return;
    }
    async function fetchAssemblies() {
      const res = await api.getAssemblies(selectedDistrictId);
      if (res.success) {
        setAssemblies(res.data || []);
        setSelectedAssemblyId('');
        setMptcs([]);
        setSelectedMptcId('');
      }
    }
    fetchAssemblies();
  }, [selectedDistrictId]);

  useEffect(() => {
    if (!selectedAssemblyId) {
      setMptcs([]);
      setSelectedMptcId('');
      return;
    }
    async function fetchMptcs() {
      const res = await api.getMptcs(selectedAssemblyId);
      if (res.success) {
        setMptcs(res.data || []);
        setSelectedMptcId('');
      }
    }
    fetchMptcs();
  }, [selectedAssemblyId]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setValidationSummary(null);
      setImportResult(null);
      setError(null);
    }
  };

  const handleValidate = async (e) => {
    e.preventDefault();
    if (!file || !selectedMptcId) {
      setError('Please select district, assembly, MPTC village, and choose a CSV file.');
      return;
    }

    try {
      setValidating(true);
      setError(null);
      const res = await api.validateImportCsv(file, selectedMptcId);
      if (res.success) {
        setValidationSummary(res.data);
      }
    } catch (err) {
      setError(err.message || 'Validation failed. Check CSV columns and format.');
    } finally {
      setValidating(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!validationSummary) return;

    try {
      setConfirming(true);
      setError(null);

      const payload = {
        mptc_village_constituency_id: validationSummary.constituencyId,
        fileName: validationSummary.fileName,
        validRows: validationSummary.validRows,
        duplicates: validationSummary.duplicates,
        invalidRows: validationSummary.invalidRows
      };

      const res = await api.confirmImport(payload);
      if (res.success) {
        setImportResult(res.data);
        setValidationSummary(null);
        setFile(null);
        loadHistory();
      }
    } catch (err) {
      setError(err.message || 'Import confirmation failed.');
    } finally {
      setConfirming(false);
    }
  };

  const copyPromptToClipboard = () => {
    navigator.clipboard.writeText(PDF_EXTRACTION_PROMPT);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 3000);
  };

  const downloadSampleCsv = () => {
    const csvHeader = 'serial_number,voter_id,name_en,name_te,relative_type,relative_name_en,relative_name_te,house_number,age,gender,part_number\n';
    const sampleRow1 = '1,AP012345001,Gunturu Venkata Rao,గుంటూరి వెంకటరావు,Father,Subba Rao,సుబ్బారావు,1-102,48,M,1\n';
    const sampleRow2 = '2,AP012345002,Gunturu Lakshmi Devi,గుంటూరి లక్ష్మీదేవి,Husband,Venkata Rao,వెంకటరావు,1-102,43,F,1\n';
    const sampleRow3 = '3,AP012345003,Kondapalli Siva Kumar,కొండపల్లి శివకుమార్,Father,Appa Rao,అప్పారావు,1-104/A,35,M,1\n';
    const blob = new Blob([csvHeader + sampleRow1 + sampleRow2 + sampleRow3], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'ap_voter_roll_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="admin-imports-page" style={{ paddingBottom: '3.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <span className="badge badge-primary page-badge">SUPER ADMIN TOOL</span>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Andhra Pradesh Roll Management</span>
        </div>
        <h1 className="page-title">
          {isTelugu ? 'ఓటరు జాబితా CSV దిగుమతి కన్సోల్' : 'Electoral Roll CSV Import Console'}
        </h1>
        <p className="page-subtitle">
          {isTelugu
            ? 'అధికారిక ఓటరు జాబితాను నియోజకవర్గానికి కేటాయించి, ధృవీకరించి, నకళ్ళను నివారించి సురక్షితంగా భద్రపరచండి.'
            : 'Directly upload, validate, and commit electoral rolls. Zero manual bottleneck queues.'}
        </p>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {importResult && (
        <div className="card" style={{
          padding: '1.5rem',
          borderRadius: '14px',
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <CheckCircle2 size={24} color="#16a34a" />
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#14532d', fontWeight: 700 }}>
              {isTelugu ? 'ఓటరు జాబితా విజయవంతంగా దిగుమతి చేయబడింది!' : 'Electoral Roll Successfully Committed!'}
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.92rem', color: '#166534' }}>
            <div><strong>{isTelugu ? 'చేర్చబడిన రికార్డులు:' : 'Inserted Records:'}</strong> {importResult.insertedCount}</div>
            <div><strong>{isTelugu ? 'నకళ్ళు (స్కిప్ చేయబడినవి):' : 'Duplicate Skipped:'}</strong> {importResult.skippedCount}</div>
            <div><strong>{isTelugu ? 'లోపాలు (విఫలమైనవి):' : 'Invalid Rows:'}</strong> {importResult.failedCount}</div>
            <div><strong>{isTelugu ? 'మొత్తం వరసలు:' : 'Total Rows Processed:'}</strong> {importResult.totalRows}</div>
          </div>
        </div>
      )}

      {/* Main Workflow Grid: Selection & Upload vs Validation Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {/* Upload Form Card */}
        <div className="card" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UploadCloud size={20} color="#4f46e5" />
            <span>1. {isTelugu ? 'నియోజకవర్గం & CSV ఎంపిక' : 'Select Target & CSV'}</span>
          </h3>

          <form onSubmit={handleValidate}>
            {/* District */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                {isTelugu ? 'జిల్లా (District) *' : 'District *'}
              </label>
              <select
                className="form-control"
                value={selectedDistrictId}
                onChange={(e) => setSelectedDistrictId(e.target.value)}
                required
              >
                <option value="">-- {isTelugu ? 'జిల్లాను ఎంచుకోండి' : 'Select District'} --</option>
                {districts.map(d => (
                  <option key={d.id} value={d.id}>
                    {isTelugu && d.name_te ? `${d.name_te} (${d.name_en})` : d.name_en}
                  </option>
                ))}
              </select>
            </div>

            {/* Assembly */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                {isTelugu ? 'అసెంబ్లీ నియోజకవర్గం (Assembly) *' : 'Assembly Constituency *'}
              </label>
              <select
                className="form-control"
                value={selectedAssemblyId}
                onChange={(e) => setSelectedAssemblyId(e.target.value)}
                disabled={!selectedDistrictId || assemblies.length === 0}
                required
              >
                <option value="">-- {isTelugu ? 'అసెంబ్లీని ఎంచుకోండి' : 'Select Assembly'} --</option>
                {assemblies.map(a => (
                  <option key={a.id} value={a.id}>
                    {isTelugu && a.name_te ? `${a.name_te} (${a.name_en})` : a.name_en}
                  </option>
                ))}
              </select>
            </div>

            {/* MPTC Village */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                {isTelugu ? 'ఎం.పి.టి.సి గ్రామ నియోజకవర్గం (MPTC) *' : 'MPTC Village Constituency *'}
              </label>
              <select
                className="form-control"
                value={selectedMptcId}
                onChange={(e) => setSelectedMptcId(e.target.value)}
                disabled={!selectedAssemblyId || mptcs.length === 0}
                required
              >
                <option value="">-- {isTelugu ? 'ఎం.పి.టి.సి గ్రామాన్ని ఎంచుకోండి' : 'Select MPTC Village'} --</option>
                {mptcs.map(m => (
                  <option key={m.id} value={m.id}>
                    {isTelugu && m.name_te ? `${m.name_te} (${m.name_en})` : m.name_en}
                  </option>
                ))}
              </select>
            </div>

            {/* Progressive Disclosure: CSV File Upload displays ONLY after all dropdowns are selected */}
            {selectedDistrictId && selectedAssemblyId && selectedMptcId ? (
              <div style={{
                marginTop: '1.25rem',
                paddingTop: '1.25rem',
                borderTop: '1px dashed #cbd5e1',
                animation: 'fadeIn 0.25s ease'
              }}>
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                    {isTelugu ? 'ఓటరు జాబితా CSV ఫైల్ *' : 'Voter Roll CSV File *'}
                  </label>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    className="form-control"
                    onChange={handleFileChange}
                    required
                  />
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem' }}>
                    Format: UTF-8 CSV with serial_number, name_en, name_te, voter_id, house_number, part_number.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={downloadSampleCsv}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
                  >
                    <Download size={14} />
                    <span>{isTelugu ? 'నమూనా CSV డౌన్‌లోడ్' : 'CSV Template'}</span>
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!file || validating}
                    style={{ minWidth: '140px' }}
                  >
                    {validating ? 'Validating...' : (isTelugu ? 'ధృవీకరించండి →' : 'Validate File →')}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                background: '#f8fafc',
                border: '1px dashed #cbd5e1',
                borderRadius: '10px',
                textAlign: 'center',
                color: '#64748b',
                fontSize: '0.84rem'
              }}>
                <Layers size={20} color="#94a3b8" style={{ margin: '0 auto 0.4rem', display: 'block' }} />
                <span>
                  {isTelugu
                    ? 'CSV ఫైల్‌ను అప్‌లోడ్ చేయడానికి పైనున్న జిల్లా, అసెంబ్లీ మరియు ఎం.పి.టి.సి నియోజకవర్గాలను ఎంచుకోండి.'
                    : 'Select District, Assembly Constituency, and MPTC Village above to reveal the CSV upload.'}
                </span>
              </div>
            )}
          </form>
        </div>

        {/* Step 2: Validation Summary Card */}
        <div className="card" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileCheck2 size={20} color="#16a34a" />
            <span>2. {isTelugu ? 'ధృవీకరణ సారాంశం' : 'Validation Summary'}</span>
          </h3>

          {!validationSummary ? (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              color: '#94a3b8',
              padding: '2rem 1rem'
            }}>
              <FileText size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
              <p style={{ margin: 0, fontSize: '0.92rem' }}>
                {isTelugu
                  ? 'ఫైల్‌ను ఎంచుకుని "ధృవీకరించండి" బటన్‌పై క్లిక్ చేయండి.'
                  : 'Select constituency and click "Validate File" to inspect duplicate detection and row integrity before saving.'}
              </p>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  marginBottom: '1rem',
                  fontSize: '0.85rem'
                }}>
                  <div><strong>{isTelugu ? 'ఫైల్ పేరు:' : 'File:'}</strong> {validationSummary.fileName}</div>
                  <div><strong>{isTelugu ? 'కేటాయించిన నియోజకవర్గం:' : 'Target:'}</strong> {isTelugu && validationSummary.constituencyNameTe ? validationSummary.constituencyNameTe : validationSummary.constituencyNameEn}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{ padding: '0.75rem', borderRadius: '8px', background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#065f46', fontWeight: 600 }}>VALID TO INSERT</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#047857' }}>{validationSummary.validCount}</div>
                  </div>

                  <div style={{ padding: '0.75rem', borderRadius: '8px', background: '#fffbeb', border: '1px solid #fde68a' }}>
                    <div style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: 600 }}>DUPLICATES (SKIPPED)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#b45309' }}>{validationSummary.duplicateCount}</div>
                  </div>

                  <div style={{ padding: '0.75rem', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca' }}>
                    <div style={{ fontSize: '0.75rem', color: '#991b1b', fontWeight: 600 }}>INVALID ROWS</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626' }}>{validationSummary.invalidCount}</div>
                  </div>

                  <div style={{ padding: '0.75rem', borderRadius: '8px', background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>TOTAL ROWS</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>{validationSummary.totalRows}</div>
                  </div>
                </div>

                {validationSummary.duplicates.length > 0 && (
                  <div style={{ fontSize: '0.78rem', color: '#b45309', marginBottom: '0.5rem' }}>
                    ℹ {validationSummary.duplicateCount} duplicate records detected and will be safely preserved without duplicates.
                  </div>
                )}
              </div>

              <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleConfirmImport}
                  disabled={confirming || validationSummary.validCount === 0}
                  style={{ width: '100%', padding: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <CheckCircle2 size={18} />
                  <span>{confirming ? 'Saving Records to Supabase...' : (isTelugu ? 'దిగుమతి ధృవీకరించి భద్రపరచండి' : 'Confirm & Commit Import')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PDF to CSV Section */}
      <section className="card" style={{
        padding: '1.75rem',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.95), rgba(241, 245, 249, 0.95))',
        border: '1px solid #cbd5e1',
        marginBottom: '2.5rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#4f46e5', fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              <FileText size={15} />
              {isTelugu ? 'ఎలక్టోరల్ రోల్ సహాయకారి' : 'Conversion Assistant'}
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {isTelugu ? 'ద్విభాషా ఎలక్టోరల్ రోల్ PDF నుండి CSV మార్పిడి ప్రాంప్ట్' : 'Bilingual Electoral Roll PDF to CSV Extraction Prompt'}
            </h2>
            <p style={{ margin: '0.35rem 0 0', color: '#475569', fontSize: '0.9rem' }}>
              {isTelugu
                ? 'తెలుగు మరియు ఇంగ్లీష్ పిడిఎఫ్‌లను విలీనం చేసి సిస్టమ్‌లోకి నేరుగా దిగుమతి చేసుకునేందుకు ఈ ప్రామాణిక AI ప్రాంప్ట్‌ను కాపీ చేసి ఉపయోగించండి.'
                : 'Copy this battle-tested prompt into your AI or extraction tool along with both English & Telugu electoral-roll PDFs to generate a clean, ready-to-import bilingual CSV.'}
            </p>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={copyPromptToClipboard}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
          >
            {copiedPrompt ? <Check size={16} color="#16a34a" /> : <Copy size={16} />}
            <span>{copiedPrompt ? (isTelugu ? 'ప్రాంప్ట్ కాపీ అయింది!' : 'Copied Prompt!') : (isTelugu ? 'ప్రాంప్ట్ కాపీ చేయండి' : 'Copy Bilingual Prompt')}</span>
          </button>
        </div>

        <div style={{
          background: '#0f172a',
          color: '#e2e8f0',
          padding: '1.25rem',
          borderRadius: '10px',
          fontFamily: 'monospace',
          fontSize: '0.85rem',
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          maxHeight: '360px',
          overflowY: 'auto',
          border: '1px solid #334155'
        }}>
          {PDF_EXTRACTION_PROMPT}
        </div>
      </section>

      {/* Bilingual Imports Instructions Section */}
      <section className="card" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '2.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
          {isTelugu ? 'ద్విభాషా ఓటరు జాబితా దిగుమతి నిబంధనలు' : 'Bilingual Imports Standard & Record Matching'}
        </h3>
        <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
          {isTelugu
            ? 'ఇంగ్లీష్ మరియు తెలుగు పిడిఎఫ్‌లు ఒకే ఓటరు జాబితాను సూచించినప్పుడు, ఓటరు ఐడి (EPIC) మరియు పార్ట్ నంబర్ ద్వారా మాత్రమే రికార్డులను సమన్వయం చేయండి. ఒకే స్థానంలో ఉన్నారనే కారణంతో అనుసంధానించరాదు. తెలుగు మరియు ఇంగ్లీష్ పేర్లు డేటాబేస్‌లోని ప్రత్యేక కాలమ్స్‌లో భద్రపరచబడతాయి.'
            : 'When English and Telugu PDFs represent the same roll, records must be matched using reliable identifiers (voter ID, part number, and serial number). Store the two languages in separate database columns without inventing translations. Original source values are strictly preserved.'}
        </p>
      </section>

      {/* Import History Table */}
      <section className="card" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            {isTelugu ? 'గత దిగుమతుల చరిత్ర' : 'Electoral Roll Import History'}
          </h3>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={loadHistory}
            disabled={loadingHistory}
          >
            <RefreshCw size={14} className={loadingHistory ? 'spin' : ''} />
          </button>
        </div>

        {loadingHistory ? (
          <ImportHistorySkeleton rows={4} />
        ) : history.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
            No import history on record.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '0.65rem' }}>{isTelugu ? 'తేదీ & సమయం' : 'Timestamp'}</th>
                  <th style={{ padding: '0.65rem' }}>{isTelugu ? 'ఫైల్ పేరు' : 'File Name'}</th>
                  <th style={{ padding: '0.65rem' }}>{isTelugu ? 'నియోజకవర్గం' : 'Constituency'}</th>
                  <th style={{ padding: '0.65rem' }}>{isTelugu ? 'మొత్తం' : 'Total'}</th>
                  <th style={{ padding: '0.65rem' }}>{isTelugu ? 'చేర్చబడినవి' : 'Inserted'}</th>
                  <th style={{ padding: '0.65rem' }}>{isTelugu ? 'నకళ్ళు' : 'Skipped'}</th>
                  <th style={{ padding: '0.65rem' }}>{isTelugu ? 'స్థితి' : 'Status'}</th>
                </tr>
              </thead>
              <tbody>
                {history.map(row => (
                  <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.65rem', color: '#64748b' }}>
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.65rem', fontWeight: 600 }}>{row.file_name}</td>
                    <td style={{ padding: '0.65rem' }}>
                      {isTelugu && row.constituency_name_te ? row.constituency_name_te : (row.constituency_name_en || 'Atmakuru MPTC')}
                    </td>
                    <td style={{ padding: '0.65rem' }}>{row.total_rows}</td>
                    <td style={{ padding: '0.65rem', color: '#16a34a', fontWeight: 700 }}>+{row.inserted_count}</td>
                    <td style={{ padding: '0.65rem', color: '#64748b' }}>{row.skipped_count}</td>
                    <td style={{ padding: '0.65rem' }}>
                      <span className={`badge ${row.status === 'completed' ? 'badge-primary' : 'badge-danger'}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
