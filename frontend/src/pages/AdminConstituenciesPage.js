import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api.js';
import { 
  Layers, 
  MapPin, 
  Plus, 
  Edit2, 
  CheckCircle2, 
  X, 
  ChevronRight, 
  ChevronDown,
  RefreshCw,
  Building2
} from 'lucide-react';
import { HierarchySkeleton } from '../components/common/SkeletonLoader.js';

export default function AdminConstituenciesPage() {
  const { t, i18n } = useTranslation();
  const [hierarchy, setHierarchy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modals state
  const [modalType, setModalType] = useState(null); // 'add_district', 'edit_district', 'add_assembly', 'edit_assembly', 'add_mptc', 'edit_mptc'
  const [activeItem, setActiveItem] = useState(null);

  // Form inputs
  const [formDistrictId, setFormDistrictId] = useState('');
  const [formAssemblyId, setFormAssemblyId] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [formNameTe, setFormNameTe] = useState('');
  const [formElectors, setFormElectors] = useState(3000);
  const [submitting, setSubmitting] = useState(false);

  // Collapsible tree nodes
  const [expandedDistricts, setExpandedDistricts] = useState({});
  const [expandedAssemblies, setExpandedAssemblies] = useState({});

  const isTelugu = i18n.language === 'te';

  const fetchHierarchy = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getConstituencyHierarchy();
      if (res.success) {
        setHierarchy(res.data || []);
        // Expand first district by default
        if (res.data && res.data.length > 0) {
          setExpandedDistricts(prev => ({ ...prev, [res.data[0].id]: true }));
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load constituency hierarchy.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHierarchy();
  }, []);

  const toggleDistrict = (id) => {
    setExpandedDistricts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAssembly = (id) => {
    setExpandedAssemblies(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openAddDistrict = () => {
    setFormCode('');
    setFormNameEn('');
    setFormNameTe('');
    setModalType('add_district');
  };

  const openAddAssembly = (districtId) => {
    setFormDistrictId(districtId);
    setFormCode('');
    setFormNameEn('');
    setFormNameTe('');
    setModalType('add_assembly');
  };

  const openAddMptc = (assemblyId, districtId) => {
    setFormAssemblyId(assemblyId);
    setFormDistrictId(districtId);
    setFormCode('');
    setFormNameEn('');
    setFormNameTe('');
    setFormElectors(3000);
    setModalType('add_mptc');
  };

  const openEditDistrict = (district) => {
    setActiveItem(district);
    setFormCode(district.code);
    setFormNameEn(district.name_en);
    setFormNameTe(district.name_te || '');
    setModalType('edit_district');
  };

  const openEditAssembly = (assembly) => {
    setActiveItem(assembly);
    setFormCode(assembly.code);
    setFormNameEn(assembly.name_en);
    setFormNameTe(assembly.name_te || '');
    setModalType('edit_assembly');
  };

  const openEditMptc = (mptc) => {
    setActiveItem(mptc);
    setFormCode(mptc.code);
    setFormNameEn(mptc.name_en);
    setFormNameTe(mptc.name_te || '');
    setFormElectors(mptc.total_electors || 3000);
    setModalType('edit_mptc');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      if (modalType === 'add_district') {
        await api.createDistrict({ code: formCode, name_en: formNameEn, name_te: formNameTe });
        setSuccessMsg('District added successfully.');
      } else if (modalType === 'edit_district') {
        await api.updateDistrict(activeItem.id, { name_en: formNameEn, name_te: formNameTe });
        setSuccessMsg('District updated successfully.');
      } else if (modalType === 'add_assembly') {
        await api.createAssembly({ district_id: formDistrictId, code: formCode, name_en: formNameEn, name_te: formNameTe });
        setSuccessMsg('Assembly constituency added successfully.');
      } else if (modalType === 'edit_assembly') {
        await api.updateAssembly(activeItem.id, { name_en: formNameEn, name_te: formNameTe });
        setSuccessMsg('Assembly constituency updated successfully.');
      } else if (modalType === 'add_mptc') {
        await api.createMptc({ assembly_constituency_id: formAssemblyId, code: formCode, name_en: formNameEn, name_te: formNameTe, total_electors: Number(formElectors) });
        setSuccessMsg('MPTC village constituency added successfully.');
      } else if (modalType === 'edit_mptc') {
        await api.updateMptc(activeItem.id, { name_en: formNameEn, name_te: formNameTe, total_electors: Number(formElectors) });
        setSuccessMsg('MPTC village constituency updated successfully.');
      }

      setModalType(null);
      await fetchHierarchy();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-constituencies-page" style={{ paddingBottom: '3rem' }}>
      <div className="constituencies-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-primary">STATE: ANDHRA PRADESH (AP)</span>
          </div>
          <h1 className="constituencies-page-title">
            {isTelugu ? 'నియోజకవర్గాల అధికారిక నిర్వహణ' : 'Constituency Management'}
          </h1>
          <p className="constituencies-page-subtitle">
            {isTelugu
              ? 'ఆంధ్రప్రదేశ్ రాష్ట్ర పరిధిలో జిల్లాలు, అసెంబ్లీలు మరియు ఎం.పి.టి.సి గ్రామ నియోజకవర్గాల క్రమం.'
              : 'Configure official District → Assembly Constituency → MPTC Village Constituency hierarchy.'}
          </p>
        </div>

        <div className="constituencies-header-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchHierarchy}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>{isTelugu ? 'తాజాకరించు' : 'Refresh'}</span>
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={openAddDistrict}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
          >
            <Plus size={15} />
            <span>{isTelugu ? 'కొత్త జిల్లా చేర్చు' : 'Add District'}</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>
          {successMsg}
        </div>
      )}

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
          {error}
        </div>
      )}

      {/* Hierarchy Tree Card */}
      <div className="card constituencies-card">
        {loading ? (
          <HierarchySkeleton count={4} />
        ) : hierarchy.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
            <p style={{ margin: '0 0 1rem', fontSize: '0.95rem' }}>
              {isTelugu ? 'ఇంకా జిల్లాలు చేర్చలేదు.' : 'No districts configured yet.'}
            </p>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={openAddDistrict}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Plus size={14} />
              <span>{isTelugu ? 'మొదటి జిల్లా చేర్చు' : 'Add First District'}</span>
            </button>
          </div>
        ) : (
          <div className="hierarchy-tree">
            {hierarchy.map((district) => {
              const isDistExpanded = Boolean(expandedDistricts[district.id]);
              return (
                <div key={district.id} className="hierarchy-district-node">
                  {/* District Header */}
                  <div className="hierarchy-district-header" onClick={() => toggleDistrict(district.id)}>
                    <div className="hierarchy-district-info">
                      {isDistExpanded ? <ChevronDown size={18} style={{ flexShrink: 0 }} /> : <ChevronRight size={18} style={{ flexShrink: 0 }} />}
                      <div style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '6px',
                        background: '#334155',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <MapPin size={14} />
                      </div>
                      <span className="hierarchy-district-name" title={district.name_en}>
                        {isTelugu && district.name_te ? `${district.name_te} (${district.name_en})` : district.name_en}
                      </span>
                      <span className="badge badge-secondary" style={{ fontSize: '0.7rem', padding: '0.15rem 0.35rem', flexShrink: 0 }}>
                        {district.code}
                      </span>
                    </div>

                    <div className="hierarchy-district-actions" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => openEditDistrict(district)}
                        title="Edit District"
                        style={{ padding: '0.25rem 0.45rem' }}
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => openAddAssembly(district.id)}
                        style={{ fontSize: '0.76rem', padding: '0.25rem 0.55rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <Plus size={12} />
                        <span>{isTelugu ? 'అసెంబ్లీ' : 'Add Assembly'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Assemblies under District */}
                  {isDistExpanded && (
                    <div className="hierarchy-district-body">
                      {(!district.assemblyConstituencies || district.assemblyConstituencies.length === 0) ? (
                        <div className="hierarchy-empty-box">
                          <Building2 size={24} color="#94a3b8" />
                          <p className="hierarchy-empty-text">
                            {isTelugu ? 'ఈ జిల్లా కింద ఇంకా అసెంబ్లీ నియోజకవర్గాలు చేర్చలేదు.' : 'No assembly constituencies added under this district yet.'}
                          </p>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => openAddAssembly(district.id)}
                            style={{ fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                          >
                            <Plus size={12} />
                            <span>{isTelugu ? 'అసెంబ్లీ చేర్చు' : 'Add Assembly'}</span>
                          </button>
                        </div>
                      ) : (
                        district.assemblyConstituencies.map((assembly) => {
                          const isAssExpanded = Boolean(expandedAssemblies[assembly.id]);
                          return (
                            <div key={assembly.id} className="hierarchy-assembly-node">
                              {/* Assembly Header */}
                              <div className="hierarchy-assembly-header" onClick={() => toggleAssembly(assembly.id)}>
                                <div className="hierarchy-assembly-info">
                                  {isAssExpanded ? <ChevronDown size={15} color="#6366f1" style={{ flexShrink: 0 }} /> : <ChevronRight size={15} color="#6366f1" style={{ flexShrink: 0 }} />}
                                  <Building2 size={15} color="#4f46e5" style={{ flexShrink: 0 }} />
                                  <span className="hierarchy-assembly-name" title={assembly.name_en}>
                                    {isTelugu && assembly.name_te ? `${assembly.name_te} (${assembly.name_en})` : assembly.name_en}
                                  </span>
                                  <span style={{ fontSize: '0.72rem', color: '#64748b', flexShrink: 0 }}>({assembly.code})</span>
                                </div>

                                <div className="hierarchy-assembly-actions" onClick={e => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => openEditAssembly(assembly)}
                                    style={{ padding: '0.2rem 0.4rem' }}
                                    title="Edit Assembly"
                                  >
                                    <Edit2 size={11} />
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => openAddMptc(assembly.id, district.id)}
                                    style={{ fontSize: '0.74rem', padding: '0.2rem 0.45rem', color: '#4f46e5', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                  >
                                    <Plus size={11} />
                                    <span>{isTelugu ? 'ఎంపీటీసీ' : 'Add MPTC'}</span>
                                  </button>
                                </div>
                              </div>

                              {/* MPTC Village Constituencies under Assembly */}
                              {isAssExpanded && (
                                <div className="hierarchy-mptc-container">
                                  {(!assembly.mptcConstituencies || assembly.mptcConstituencies.length === 0) ? (
                                    <div className="hierarchy-empty-box">
                                      <CheckCircle2 size={22} color="#94a3b8" />
                                      <p className="hierarchy-empty-text">
                                        {isTelugu ? 'ఈ అసెంబ్లీలో ఎం.పి.టి.సి గ్రామాలు లేవు.' : 'No MPTC village constituencies configured yet.'}
                                      </p>
                                      <button
                                        type="button"
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => openAddMptc(assembly.id, district.id)}
                                        style={{ fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#4f46e5' }}
                                      >
                                        <Plus size={11} />
                                        <span>{isTelugu ? 'ఎంపీటీసీ చేర్చు' : 'Add MPTC'}</span>
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="hierarchy-mptc-grid">
                                      {assembly.mptcConstituencies.map((mptc) => (
                                        <div key={mptc.id} className="hierarchy-mptc-card">
                                          <div style={{ minWidth: 0, flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.84rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                              {isTelugu && mptc.name_te ? mptc.name_te : mptc.name_en}
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                              {mptc.code} • {mptc.total_electors || 0} {isTelugu ? 'ఓటర్లు' : 'electors'}
                                            </div>
                                          </div>
                                          <button
                                            type="button"
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => openEditMptc(mptc)}
                                            style={{ padding: '0.2rem 0.35rem', flexShrink: 0 }}
                                            title="Edit MPTC"
                                          >
                                            <Edit2 size={11} />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalType && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card" style={{
            maxWidth: '480px',
            width: '100%',
            padding: '1.5rem',
            borderRadius: '16px',
            background: '#ffffff',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
                {modalType.startsWith('add') ? 'Add New Entry' : 'Edit Entry'}
              </h3>
              <button
                type="button"
                onClick={() => setModalType(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Code / Identifier *
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="e.g. GTR, MGL, MPT-ATMK-04"
                  disabled={modalType.startsWith('edit')}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  English Name *
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={formNameEn}
                  onChange={(e) => setFormNameEn(e.target.value)}
                  placeholder="e.g. Guntur / Mangalagiri / Atmakuru MPTC - 04"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Telugu Name (తెలుగు పేరు)
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={formNameTe}
                  onChange={(e) => setFormNameTe(e.target.value)}
                  placeholder="ఉదా: గుంటూరు / మంగళగిరి / ఆత్మకూరు"
                />
              </div>

              {modalType.includes('mptc') && (
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                    Total Registered Electors (ఓటర్ల సంఖ్య)
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={formElectors}
                    onChange={(e) => setFormElectors(e.target.value)}
                    min="0"
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModalType(null)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ minWidth: '120px' }}
                >
                  {submitting ? 'Saving...' : 'Save Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
