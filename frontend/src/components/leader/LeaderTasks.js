import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { CheckSquare, Plus, Trash2, Calendar, Flag, CheckCircle, Clock, X, Save } from 'lucide-react';
import SkeletonLoader from '../common/SkeletonLoader.js';

export default function LeaderTasks() {
  const { t } = useTranslation();
  const { selectedConstituency } = useAuth();
  const { showToast } = useToast();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [saving, setSaving] = useState(false);

  const constituencyId = selectedConstituency?.id || 'c1111111-0000-0000-0000-000000000001';

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await api.getLeaderTasks(constituencyId, statusFilter);
      if (res.success) {
        setTasks(res.data);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [constituencyId, statusFilter]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      const res = await api.createLeaderTask({
        constituency_id: constituencyId,
        title,
        description,
        due_date: dueDate || null,
        priority
      });
      if (res.success) {
        showToast('Task created successfully', 'success');
        setShowModal(false);
        setTitle('');
        setDescription('');
        setDueDate('');
        await loadTasks();
      }
    } catch (err) {
      showToast(err.message || 'Failed to create task', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (task) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      const res = await api.updateLeaderTask(task.id, { status: nextStatus });
      if (res.success) {
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));
        showToast(`Task marked as ${nextStatus}`, 'info');
      }
    } catch (err) {
      showToast(err.message || 'Failed to update task', 'error');
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      const res = await api.deleteLeaderTask(id);
      if (res.success) {
        setTasks(prev => prev.filter(t => t.id !== id));
        showToast('Task removed', 'info');
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete task', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--secondary)' }}>{t('leader.tasks_tab')}</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Electoral roll verification tasks and field follow-ups
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <select
            className="form-control"
            style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="pending">{t('leader.status_pending')}</option>
            <option value="in_progress">{t('leader.status_in_progress')}</option>
            <option value="completed">{t('leader.status_completed')}</option>
          </select>

          <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            {t('leader.new_task')}
          </button>
        </div>
      </div>

      {loading ? (
        <SkeletonLoader rows={3} height="4rem" />
      ) : tasks.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <CheckSquare size={36} color="#94a3b8" style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>No follow-up tasks registered for this filter.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {tasks.map(task => {
            const isCompleted = task.status === 'completed';
            let priorityBadge = 'badge-secondary';
            if (task.priority === 'high') priorityBadge = 'badge-danger';
            else if (task.priority === 'medium') priorityBadge = 'badge-warning';

            return (
              <div
                key={task.id}
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  opacity: isCompleted ? 0.75 : 1
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(task)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      marginTop: '0.15rem',
                      color: isCompleted ? 'var(--success)' : 'var(--border)'
                    }}
                    title={isCompleted ? 'Mark Pending' : 'Mark Completed'}
                  >
                    <CheckCircle size={20} fill={isCompleted ? 'var(--success)' : 'transparent'} color={isCompleted ? '#fff' : '#94a3b8'} />
                  </button>

                  <div>
                    <h4 style={{
                      fontSize: '0.975rem',
                      color: 'var(--secondary)',
                      textDecoration: isCompleted ? 'line-through' : 'none'
                    }}>
                      {task.title}
                    </h4>
                    {task.description && (
                      <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        {task.description}
                      </p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                      <span className={`badge ${priorityBadge}`} style={{ fontSize: '0.7rem' }}>
                        <Flag size={10} /> {task.priority}
                      </span>

                      {task.due_date && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Calendar size={12} /> Due: {task.due_date}
                        </span>
                      )}

                      <span className={`badge ${isCompleted ? 'badge-success' : 'badge-primary'}`} style={{ fontSize: '0.7rem' }}>
                        {t(`leader.status_${task.status}`)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary btn-icon"
                  onClick={() => handleDeleteTask(task.id)}
                  style={{ color: 'var(--danger)', flexShrink: 0 }}
                  title="Delete Task"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Creation Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <form onSubmit={handleCreateTask}>
              <div className="modal-header">
                <h3 style={{ fontSize: '1.1rem' }}>{t('leader.new_task')}</h3>
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
                  <label className="form-label">{t('leader.task_title')}</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Verify Telugu names in Part 103"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('leader.task_desc')}</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Provide specific field instructions..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">{t('leader.due_date')}</label>
                    <input
                      type="date"
                      className="form-control"
                      value={dueDate}
                      onChange={e => setDueDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('leader.priority')}</label>
                    <select
                      className="form-control"
                      value={priority}
                      onChange={e => setPriority(e.target.value)}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                  <Save size={15} />
                  {saving ? 'Creating...' : t('leader.new_task')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
