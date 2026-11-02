import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { FileText, Plus, Trash2, Edit3, User, Clock, X, Save } from 'lucide-react';
import SkeletonLoader from '../common/SkeletonLoader.js';

export default function LeaderNotes() {
  const { t } = useTranslation();
  const { selectedConstituency } = useAuth();
  const { showToast } = useToast();

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const constituencyId = selectedConstituency?.id || 'c1111111-0000-0000-0000-000000000001';

  const loadNotes = async () => {
    setLoading(true);
    try {
      const res = await api.getLeaderNotes(constituencyId);
      if (res.success) {
        setNotes(res.data);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load notes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [constituencyId]);

  const openAddModal = () => {
    setEditingNote(null);
    setTitle('');
    setContent('');
    setShowModal(true);
  };

  const openEditModal = (note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSaving(true);
    try {
      if (editingNote) {
        const res = await api.updateLeaderNote(editingNote.id, { title, content });
        if (res.success) {
          showToast('Note updated successfully', 'success');
        }
      } else {
        const res = await api.createLeaderNote({
          constituency_id: constituencyId,
          title,
          content
        });
        if (res.success) {
          showToast('Note created successfully', 'success');
        }
      }
      setShowModal(false);
      await loadNotes();
    } catch (err) {
      showToast(err.message || 'Failed to save note', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      const res = await api.deleteLeaderNote(id);
      if (res.success) {
        showToast('Note deleted', 'info');
        setNotes(prev => prev.filter(n => n.id !== id));
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete note', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--secondary)' }}>{t('leader.notes_tab')}</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Your encrypted administrative notes for this constituency
          </p>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={openAddModal}>
          <Plus size={16} />
          {t('leader.new_note')}
        </button>
      </div>

      {loading ? (
        <SkeletonLoader rows={3} height="4.5rem" />
      ) : notes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <FileText size={36} color="#94a3b8" style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>No notes created yet for this constituency.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {notes.map(note => (
            <div key={note.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h4 style={{ fontSize: '1rem', color: 'var(--secondary)', fontWeight: 700 }}>
                  {note.title}
                </h4>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-icon"
                    onClick={() => openEditModal(note)}
                    style={{ width: '1.75rem', height: '1.75rem' }}
                    title="Edit Note"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-icon"
                    onClick={() => handleDelete(note.id)}
                    style={{ width: '1.75rem', height: '1.75rem', color: 'var(--danger)' }}
                    title="Delete Note"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <p style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.6, flex: 1, whiteSpace: 'pre-wrap' }}>
                {note.content}
              </p>

              {note.voter && (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.4rem 0.6rem',
                  background: 'var(--primary-light)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  <User size={13} />
                  <span>Linked Voter: <strong>{note.voter.name_en}</strong> (Part {note.voter.part_number} #{note.voter.serial_number})</span>
                </div>
              )}

              <div style={{
                marginTop: '0.85rem',
                paddingTop: '0.5rem',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.75rem',
                color: 'var(--text-muted)'
              }}>
                <Clock size={12} />
                <span>{new Date(note.updated_at || note.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Note Editor Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <form onSubmit={handleSave}>
              <div className="modal-header">
                <h3 style={{ fontSize: '1.1rem' }}>
                  {editingNote ? 'Edit Note' : t('leader.new_note')}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">{t('leader.note_title')}</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Ward 2 List Verification"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('leader.note_content')}</label>
                  <textarea
                    className="form-control"
                    rows={5}
                    placeholder="Enter observation, task note or follow-up details..."
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                  <Save size={15} />
                  {saving ? 'Saving...' : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
