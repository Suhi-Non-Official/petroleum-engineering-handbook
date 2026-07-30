import React, { useState } from 'react';
import { X, Wrench, RefreshCw, Calculator, ArrowRightLeft, BookMarked } from 'lucide-react';

export default function ToolsPanel({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('converter');

  // Unit Converter State
  const [category, setCategory] = useState('pressure');
  const [fromUnit, setFromUnit] = useState('psi');
  const [toUnit, setToUnit] = useState('bar');
  const [valInput, setValInput] = useState(1000);
  const [convertedResult, setConvertedResult] = useState(null);

  // Darcy Calculator State
  const [darcyParams, setDarcyParams] = useState({
    k_md: 150,
    h_ft: 40,
    p_diff_psi: 450,
    mu_cp: 1.2,
    b_vol: 1.15,
    r_w_ft: 0.33,
    r_e_ft: 660
  });
  const [darcyResult, setDarcyResult] = useState(null);

  // Hydrostatic Calculator State
  const [hydroParams, setHydroParams] = useState({ mud_weight_ppg: 10.5, tvd_ft: 12000 });
  const [hydroResult, setHydroResult] = useState(null);

  if (!isOpen) return null;

  const handleConvert = async () => {
    try {
      const res = await fetch('/api/tools/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: parseFloat(valInput),
          category,
          from_unit: fromUnit,
          to_unit: toUnit
        })
      });
      const data = await res.json();
      setConvertedResult(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCalcDarcy = async () => {
    try {
      const res = await fetch('/api/tools/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calc_type: 'darcy_liquid', params: darcyParams })
      });
      const data = await res.json();
      setDarcyResult(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCalcHydro = async () => {
    try {
      const res = await fetch('/api/tools/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calc_type: 'hydrostatic', params: hydroParams })
      });
      const data = await res.json();
      setHydroResult(data);
    } catch (e) {
      console.error(e);
    }
  };

  const unitOptions = {
    pressure: ['psi', 'bar', 'kPa', 'MPa', 'atm'],
    temperature: ['degF', 'degC', 'K'],
    length: ['ft', 'm', 'in', 'km'],
    volume: ['bbl', 'm3', 'ft3', 'gal'],
    flow_rate: ['bbl/d', 'm3/d', 'Mscf/d', 'MMscf/d'],
    viscosity: ['cp', 'mPa.s', 'Pa.s'],
    permeability: ['md', 'D'],
    density: ['lbm/gal', 'lbm/ft3', 'g/cm3', 'kg/m3']
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ width: '800px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
            <Wrench size={18} color="var(--accent-amber)" />
            <span>Petroleum Engineering Tools & Calculators</span>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="sidebar-tabs" style={{ marginBottom: '1.25rem' }}>
            <button
              className={`sidebar-tab ${activeTab === 'converter' ? 'active' : ''}`}
              onClick={() => setActiveTab('converter')}
            >
              <ArrowRightLeft size={16} />
              <span>Unit Converter</span>
            </button>
            <button
              className={`sidebar-tab ${activeTab === 'darcy' ? 'active' : ''}`}
              onClick={() => setActiveTab('darcy')}
            >
              <Calculator size={16} />
              <span>Darcy Radial Flow</span>
            </button>
            <button
              className={`sidebar-tab ${activeTab === 'hydro' ? 'active' : ''}`}
              onClick={() => setActiveTab('hydro')}
            >
              <Calculator size={16} />
              <span>Hydrostatic Pressure</span>
            </button>
          </div>

          {activeTab === 'converter' && (
            <div>
              <div className="calc-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    className="form-input"
                    value={category}
                    onChange={(e) => {
                      const cat = e.target.value;
                      setCategory(cat);
                      setFromUnit(unitOptions[cat][0]);
                      setToUnit(unitOptions[cat][1] || unitOptions[cat][0]);
                    }}
                  >
                    {Object.keys(unitOptions).map((c) => (
                      <option key={c} value={c}>
                        {c.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>From Unit</label>
                  <select className="form-input" value={fromUnit} onChange={(e) => setFromUnit(e.target.value)}>
                    {unitOptions[category]?.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>To Unit</label>
                  <select className="form-input" value={toUnit} onChange={(e) => setToUnit(e.target.value)}>
                    {unitOptions[category]?.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>Input Value</label>
                <input
                  type="number"
                  className="form-input"
                  value={valInput}
                  onChange={(e) => setValInput(e.target.value)}
                />
              </div>

              <button className="btn-accent" style={{ width: '100%', marginTop: '1rem' }} onClick={handleConvert}>
                Convert Units
              </button>

              {convertedResult && (
                <div style={{ marginTop: '1.25rem', background: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Converted Output:</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>
                    {convertedResult.value} {toUnit}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    {convertedResult.formula}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'darcy' && (
            <div>
              <div style={{ fontSize: '0.85rem', marginBottom: '1rem', color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
                Formula: q = (0.00708 * k * h * ΔP) / (μ * B * ln(re / rw))
              </div>

              <div className="calc-grid">
                <div className="form-group">
                  <label>Permeability k (md)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={darcyParams.k_md}
                    onChange={(e) => setDarcyParams({ ...darcyParams, k_md: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Thickness h (ft)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={darcyParams.h_ft}
                    onChange={(e) => setDarcyParams({ ...darcyParams, h_ft: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Pressure Differential ΔP (psi)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={darcyParams.p_diff_psi}
                    onChange={(e) => setDarcyParams({ ...darcyParams, p_diff_psi: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Viscosity μ (cp)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={darcyParams.mu_cp}
                    onChange={(e) => setDarcyParams({ ...darcyParams, mu_cp: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Formation Volume Factor B (rb/STB)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={darcyParams.b_vol}
                    onChange={(e) => setDarcyParams({ ...darcyParams, b_vol: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Drainage Radius re (ft)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={darcyParams.r_e_ft}
                    onChange={(e) => setDarcyParams({ ...darcyParams, r_e_ft: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <button className="btn-accent" style={{ width: '100%', marginTop: '1rem' }} onClick={handleCalcDarcy}>
                Calculate Flow Rate
              </button>

              {darcyResult && (
                <div style={{ marginTop: '1.25rem', background: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Calculated Flow Rate (q):</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>
                    {darcyResult.flow_rate_stbd} STB/D
                  </div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <strong>Calculation Steps:</strong>
                    {darcyResult.steps.map((st, i) => (
                      <div key={i}>{st}</div>
                    ))}
                  </div>
                  <div className="citation-box">
                    Source: {darcyResult.reference}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'hydro' && (
            <div>
              <div style={{ fontSize: '0.85rem', marginBottom: '1rem', color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
                Formula: P_hydro = 0.052 * Mud Weight (ppg) * TVD (ft)
              </div>

              <div className="calc-grid">
                <div className="form-group">
                  <label>Mud Weight (ppg)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={hydroParams.mud_weight_ppg}
                    onChange={(e) => setHydroParams({ ...hydroParams, mud_weight_ppg: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>True Vertical Depth TVD (ft)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={hydroParams.tvd_ft}
                    onChange={(e) => setHydroParams({ ...hydroParams, tvd_ft: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <button className="btn-accent" style={{ width: '100%', marginTop: '1rem' }} onClick={handleCalcHydro}>
                Calculate Hydrostatic Pressure
              </button>

              {hydroResult && (
                <div style={{ marginTop: '1.25rem', background: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Hydrostatic Bottomhole Pressure:</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>
                    {hydroResult.pressure_psi} psi
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Gradient: {hydroResult.gradient_psi_ft} psi/ft
                  </div>
                  <div className="citation-box">
                    Source: {hydroResult.reference}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
