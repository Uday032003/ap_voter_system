import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Download, CheckCircle2, AlertTriangle, AlertCircle, FileText, Check, Clock } from 'lucide-react';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import SkeletonLoader from '../common/SkeletonLoader.js';

export default function CsvImportWizard() {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [committing, setCommitting] = useState(false);
  const [importHistory, setImportHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.getImportHistory();
      if (res.success) {
        setImportHistory(res.data);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreviewData(null);
    }
  };

  const handleUploadAndPreview = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await api.previewImportCsv(file);
      if (res.success) {
        setPreviewData(res);
        showToast(`Validated: ${res.validCount} valid rows, ${res.errorCount} error rows`, 'info');
      }
    } catch (err) {
      showToast(err.message || 'Validation failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleCommit = async () => {
    if (!previewData || !previewData.stagingJobId) return;
    setCommitting(true);
    try {
      const res = await api.commitImport(previewData.stagingJobId);
      if (res.success) {
        showToast(res.message, 'success');
        setFile(null);
        setPreviewData(null);
        await loadHistory();
      }
    } catch (err) {
      showToast(err.message || 'Import commit failed', 'error');
    } finally {
      setCommitting(false);
    }
  };

  const handleDownloadTemplate = () => {
    window.open('/api/imports/template/voters', '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Upload Wizard Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--secondary)' }}>{t('admin.import_title')}</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('admin.import_desc')}</p>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleDownloadTemplate}>
            <Download size={15} />
            {t('admin.download_template')}
          </button>
        </div>

        <div style={{
          border: '2px dashed var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '2.5rem 1.5rem',
          textAlign: 'center',
          background: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <Upload size={36} color="var(--primary)" />
          <div>
            <label htmlFor="csv-upload" className="btn btn-primary" style={{ cursor: 'pointer' }}>
              {file ? file.name : t('admin.choose_file')}
            </label>
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Standard CSV format with Telugu & English names, Part number, and Serial number
            </p>
          </div>

          {file && !previewData && (
            <button
              type="button"
              className="btn btn-accent btn-sm"
              onClick={handleUploadAndPreview}
              disabled={uploading}
            >
              {uploading ? 'Validating Schema & Duplicates...' : t('admin.upload_and_preview')}
            </button>
          )}
        </div>

        {/* Validation & Preview Output */}
        {previewData && (
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Counts Summary Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div className="card" style={{ padding: '0.85rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('admin.total_rows')}</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{previewData.totalRows}</div>
              </div>
              <div className="card" style={{ padding: '0.85rem', textAlign: 'center', borderLeft: '4px solid var(--success)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>{t('admin.valid_rows')}</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>{previewData.validCount}</div>
              </div>
              <div className="card" style={{ padding: '0.85rem', textAlign: 'center', borderLeft: '4px solid var(--danger)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>{t('admin.error_rows')}</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger)' }}>{previewData.errorCount}</div>
              </div>
            </div>

            {/* Error Diagnostics Report (if any errors found) */}
            {previewData.errors && previewData.errors.length > 0 && (
              <div style={{
                background: 'var(--danger-light)',
                border: '1px solid #fca5a5',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                fontSize: '0.85rem'
              }}>
                <div style={{ fontWeight: 700, color: '#991b1b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <AlertTriangle size={16} /> Validation & Duplicate Errors Detected (Skipped from Commit):
                </div>
                <ul style={{ paddingLeft: '1.25rem', color: '#7f1d1d' }}>
                  {previewData.errors.map((err, i) => (
                    <li key={i} style={{ marginBottom: '0.25rem' }}>
                      Row {err.rowNumber}: <strong>{err.errorMessage}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Row Preview Table */}
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Status</th>
                    <th>English Name</th>
                    <th>Telugu Name</th>
                    <th>Part</th>
                    <th>Serial #</th>
                    <th>Validation Details</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.preview.map((row, i) => (
                    <tr key={i}>
                      <td>#{row.rowNumber}</td>
                      <td>
                        <span className={`badge ${row.status === 'VALID' ? 'badge-success' : 'badge-danger'}`}>
                          {row.status}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{row.name_en || '-'}</td>
                      <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{row.name_te || '-'}</td>
                      <td>Part {row.part_number}</td>
                      <td>#{row.serial_number}</td>
                      <td style={{ fontSize: '0.75rem', color: row.errors?.length ? 'var(--danger)' : 'var(--success)' }}>
                        {row.errors?.length ? row.errors.join('; ') : 'Passed All Checks'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Commit Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPreviewData(null)}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCommit}
                disabled={committing || previewData.validCount === 0}
              >
                <Check size={16} />
                {committing ? 'Importing Batch...' : `${t('admin.commit_import')} (${previewData.validCount} Records)`}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Import History Table */}
      <div className="card">
        <h4 style={{ fontSize: '1rem', color: 'var(--secondary)', marginBottom: '0.85rem' }}>
          Past Import History & Job Logs
        </h4>
        {loadingHistory ? (
          <SkeletonLoader rows={2} height="3rem" />
        ) : importHistory.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No past imports recorded.</p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Job ID</th>
                  <th>File Name</th>
                  <th>Total Rows</th>
                  <th>Success</th>
                  <th>Failed</th>
                  <th>Status</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {importHistory.map(job => (
                  <tr key={job.id}>
                    <td><code>{job.id}</code></td>
                    <td style={{ fontWeight: 600 }}>{job.file_name}</td>
                    <td>{job.total_rows}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 700 }}>{job.success_rows}</td>
                    <td style={{ color: job.failed_rows > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                      {job.failed_rows}
                    </td>
                    <td>
                      <span className={`badge ${job.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                        {job.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(job.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
