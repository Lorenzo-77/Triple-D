import { useState, useEffect } from 'react';

export default function RoutineView({ day, exercises }) {
  const [rms, setRms] = useState(() => {
    try {
      const saved = localStorage.getItem('tripleD_rms');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('tripleD_rms', JSON.stringify(rms));
    } catch (e) {
      console.error(e);
    }
  }, [rms]);

  const handleRmChange = (exerciseName, value) => {
    setRms(prev => ({ ...prev, [exerciseName]: value }));
  };

  const clearRms = () => {
    setRms({});
    localStorage.removeItem('tripleD_rms');
  };

  // Cálculo de pesos soportando 1 o 2 porcentajes
  const calculateWeight = (exerciseName, percent) => {
    const rmVal = parseFloat(rms[exerciseName]);
    if (!rmVal || !percent) return null;

    const matches = String(percent).match(/\d+(\.\d+)?/g);
    if (!matches) return null;

    // Redondeo opcional a 1 decimal
    const calc = (pct) => ((rmVal * parseFloat(pct)) / 100).toFixed(1);

    if (matches.length >= 2) {
      return `${calc(matches[0])} - ${calc(matches[1])}`;
    }

    return calc(matches[0]);
  };

  // Identificar ejercicios únicos que requieran RM
  const calculables = exercises.filter(
    item => item.Porcentaje && item.Ejercicio && item.Ejercicio !== 'N/A'
  );
  const ejerciciosUnicos = [...new Set(calculables.map(item => item.Ejercicio))];

  // Agrupamiento por bloque
  const bloques = exercises.reduce((acc, curr) => {
    const bloque = curr.Bloque || 'GENERAL';
    if (!acc[bloque]) acc[bloque] = [];
    acc[bloque].push(curr);
    return acc;
  }, {});

  const getBlockType = (bloque) => {
    const b = String(bloque).toUpperCase();
    if (b.includes('CORE')) return 'core';
    if (b.includes('OLY')) return 'oly';
    if (b.includes('FUERZA')) return 'fuerza';
    if (b.includes('WOD')) return 'wod';
    if (b.includes('SKILL') || b.includes('ESTRUCTURA')) return 'skill';
    if (b.includes('CONDITIONING') || b.includes('RUNNING') || b.includes('ROWING')) return 'conditioning';
    return '';
  };

  return (
    <div className="routine-view">
      {ejerciciosUnicos.length > 0 && (
        <section className="rm-container" aria-label="Calculadora de 1RM">
          <div className="rm-header-row">
            <span className="rm-header-title">Cálculo 1RM</span>
            {Object.keys(rms).length > 0 && (
              <button 
                type="button" 
                onClick={clearRms} 
                className="btn-clear"
              >
                Resetear
              </button>
            )}
          </div>

          <div className="rm-grid">
            {ejerciciosUnicos.map((ejercicio, idx) => (
              <div key={idx} className="rm-input-box">
                <label htmlFor={`rm-${idx}`} title={ejercicio}>
                  {ejercicio}
                </label>
                <div className="rm-input-field">
                  <input 
                    id={`rm-${idx}`}
                    type="number" 
                    inputMode="decimal"
                    step="any"
                    placeholder="0" 
                    value={rms[ejercicio] || ''}
                    onChange={(e) => handleRmChange(ejercicio, e.target.value)} 
                  />
                  <span className="rm-unit">kg</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="blocks-list">
        {exercises.length === 0 ? (
          <div className="empty-routine-view">
            Sin sesiones registradas para este día
          </div>
        ) : (
          Object.keys(bloques).map((bloque, bIdx) => (
            <article key={bIdx} className="block-card">
              <header className="block-card-header">
                <div className="block-title-group">
                  <span className={`block-bullet ${getBlockType(bloque)}`}></span>
                  <h2 className="block-title">{bloque}</h2>
                </div>
                <span className="block-items-count">
                  {bloques[bloque].length}
                </span>
              </header>

              <div className="block-card-body">
                {bloques[bloque].map((item, itemIdx) => {
                  const pesoCalculado = calculateWeight(item.Ejercicio, item.Porcentaje);
                  return (
                    <div key={itemIdx} className="workout-row">
                      <div className="workout-info">
                        <span className="workout-text">{item.Detalle}</span>
                        {item.Porcentaje && (
                          <span className="workout-percent">@{item.Porcentaje}%</span>
                        )}
                      </div>

                      {pesoCalculado && (
                        <div className="calculated-badge">
                          <span className="calculated-value">{pesoCalculado}</span>
                          <span className="calculated-unit">KG</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}