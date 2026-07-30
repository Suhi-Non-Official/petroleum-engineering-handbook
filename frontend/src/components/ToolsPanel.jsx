import React, { useState, useEffect } from 'react';
import { X, Wrench, Calculator, ArrowRightLeft } from 'lucide-react';

const UNITS_MAP = {
  pressure: { psi: 1.0, bar: 14.5038, kPa: 0.145038, MPa: 145.038, atm: 14.6959 },
  length: { ft: 1.0, m: 3.28084, in: 0.0833333, km: 3280.84 },
  volume: { bbl: 1.0, m3: 6.28981, ft3: 0.178108, gal: 0.0238095 },
  flow_rate: { 'bbl/d': 1.0, 'm3/d': 6.28981, 'Mscf/d': 0.178108, 'MMscf/d': 178.108 },
  viscosity: { cp: 1.0, 'mPa.s': 1.0, 'Pa.s': 1000.0 },
  permeability: { md: 1.0, D: 1000.0 },
  density: { 'lbm/gal': 1.0, 'lbm/ft3': 0.133681, 'g/cm3': 8.3454, 'kg/m3': 0.0083454 }
};

export default function ToolsPanel({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('converter');

  // Unit Converter State
  const [category, setCategory] = useState('pressure');
  const [fromUnit, setFromUnit] = useState('psi');
  const [toUnit, setToUnit] = useState('bar');
  const [valInput, setValInput] = useState(1000);

  // Darcy Calculator State
  const [k_md, setKmd] = useState(150);
  const [h_ft, setHft] = useState(40);
  const [p_diff_psi, setPdiff] = useState(450);
  const [mu_cp, setMucp] = useState(1.2);
  const [b_vol, setBvol] = useState(1.15);
  const [r_e_ft, setRe] = useState(660);
  const [r_w_ft, setRw] = useState(0.33);

  // Hydrostatic Calculator State
  const [mud_weight_ppg, setMudWeight] = useState(10.5);
  const [tvd_ft, setTvd] = useState(12000);

  if (!isOpen) return null;

  // 1. Calculate Unit Conversion
  const val = parseFloat(valInput) || 0;
  let convertedVal = 0;
  let convertFormula = '';

  if (category === 'temperature') {
    if (fromUnit === 'degF' && toUnit === 'degC') convertedVal = (val - 32) * (5 / 9);
    else if (fromUnit === 'degC' && toUnit === 'degF') convertedVal = val * (9 / 5) + 32;
    else if (fromUnit === 'degF' && toUnit === 'K') convertedVal = (val - 32) * (5 / 9) + 273.15;
    else if (fromUnit === 'K' && toUnit === 'degF') convertedVal = (val - 273.15) * (9 / 5) + 32;
    else if (fromUnit === 'degC' && toUnit === 'K') convertedVal = val + 273.15;
    else if (fromUnit === 'K' && toUnit === 'degC') convertedVal = val - 273.15;
    else convertedVal = val;
    convertFormula = `Temperature conversion from ${fromUnit} to ${toUnit}`;
  } else {
    const cat = UNITS_MAP[category] || UNITS_MAP.pressure;
    const fFactor = cat[fromUnit] || 1.0;
    const tFactor = cat[toUnit] || 1.0;
    convertedVal = (val * fFactor) / tFactor;
    convertFormula = `${val} ${fromUnit} * (${fFactor} / ${tFactor}) = ${Math.round(convertedVal * 10000) / 10000} ${toUnit}`;
  }

  // 2. Calculate Darcy Radial Flow Rate
  const rw = parseFloat(r_w_ft) > 0 ? parseFloat(r_w_ft) : 0.33;
  const re = parseFloat(r_e_ft) > rw ? parseFloat(r_e_ft) : 660;
  const ln_ratio = Math.log(re / rw);
  const darcyNumerator = 0.00708 * (parseFloat(k_md) || 0) * (parseFloat(h_ft) || 0) * (parseFloat(p_diff_psi) || 0);
  const darcyDenominator = (parseFloat(mu_cp) || 1) * (parseFloat(b_vol) || 1) * ln_ratio;
  const darcyQ = darcyDenominator > 0 ? darcyNumerator / darcyDenominator : 0;

  // 3. Calculate Hydrostatic Pressure
  const mw = parseFloat(mud_weight_ppg) || 0;
  const tvd = parseFloat(tvd_ft) || 0;
  const hydroGradient = 0.052 * mw;
  const hydroPressure = hydroGradient * tvd;

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

              {/* Converted Result Output Box */}
              <div style={{ marginTop: '1.25rem', background: '#090d16', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--accent-amber)' }}>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>CALCULATED RESULT:</div>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f59e0b', fontFamily: 'var(--font-mono)', margin: '0.25rem 0' }}>
                  {Math.round(convertedVal * 10000) / 10000} {toUnit}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                  {convertFormula}
                </div>
              </div>
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
                    value={k_md}
                    onChange={(e) => setKmd(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Thickness h (ft)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={h_ft}
                    onChange={(e) => setHft(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Pressure Differential ΔP (psi)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={p_diff_psi}
                    onChange={(e) => setPdiff(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Viscosity μ (cp)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={mu_cp}
                    onChange={(e) => setMucp(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Formation Volume Factor B (rb/STB)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={b_vol}
                    onChange={(e) => setBvol(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Drainage Radius re (ft)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={r_e_ft}
                    onChange={(e) => setRe(e.target.value)}
                  />
                </div>
              </div>

              {/* Darcy Output Box */}
              <div style={{ marginTop: '1.25rem', background: '#090d16', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--accent-amber)' }}>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>CALCULATED RADIAL FLOW RATE (q):</div>
                <div style={{ fontSize: '2.2rem', fontWeight: '700', color: '#f59e0b', fontFamily: 'var(--font-mono)', margin: '0.25rem 0' }}>
                  {Math.round(darcyQ * 100) / 100} STB/D
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#cbd5e1' }}>
                  <strong>Calculation Steps:</strong>
                  <div>1. Compute ln(re/rw) = ln({re}/{rw}) = {Math.round(ln_ratio * 10000) / 10000}</div>
                  <div>2. Numerator = 0.00708 * {k_md} * {h_ft} * {p_diff_psi} = {Math.round(darcyNumerator * 100) / 100}</div>
                  <div>3. Denominator = {mu_cp} * {b_vol} * {Math.round(ln_ratio * 10000) / 10000} = {Math.round(darcyDenominator * 100) / 100}</div>
                  <div>4. Result q = {Math.round(darcyQ * 100) / 100} STB/D</div>
                </div>
                <div className="citation-box">
                  Source: Petroleum Engineering Handbook Vol 1 & Vol 5
                </div>
              </div>
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
                    value={mud_weight_ppg}
                    onChange={(e) => setMudWeight(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>True Vertical Depth TVD (ft)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={tvd_ft}
                    onChange={(e) => setTvd(e.target.value)}
                  />
                </div>
              </div>

              {/* Hydrostatic Output Box */}
              <div style={{ marginTop: '1.25rem', background: '#090d16', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--accent-amber)' }}>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>HYDROSTATIC BOTTOMHOLE PRESSURE:</div>
                <div style={{ fontSize: '2.2rem', fontWeight: '700', color: '#f59e0b', fontFamily: 'var(--font-mono)', margin: '0.25rem 0' }}>
                  {Math.round(hydroPressure * 100) / 100} psi
                </div>
                <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.25rem' }}>
                  Pressure Gradient: {Math.round(hydroGradient * 10000) / 10000} psi/ft
                </div>
                <div className="citation-box">
                  Source: Petroleum Engineering Handbook Vol 2 (Drilling Engineering Ch. 1)
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
