import React from 'react';
import { useToast } from '../../context/ToastContext.js';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(toast => {
        let Icon = Info;
        let color = 'var(--info)';
        if (toast.type === 'success') {
          Icon = CheckCircle2;
          color = 'var(--success)';
        } else if (toast.type === 'error') {
          Icon = AlertCircle;
          color = 'var(--danger)';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          color = 'var(--warning)';
        }

        return (
          <div key={toast.id} className="toast" style={{ borderLeft: `4px solid ${color}` }}>
            <Icon size={20} color={color} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500 }}>
              {toast.message}
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)'
              }}
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
