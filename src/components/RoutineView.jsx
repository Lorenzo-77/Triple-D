import { useState } from 'react';

export default function RoutineView({ day, exercises }) {
  const [rms, setRms] = useState({});

  const handleRmChange = (exerciseName, value) => {
    setRms({ ...rms, [exerciseName]: parseFloat(value) || 0 });
  };

  const calculateWeight = (exerciseName, percent) => {
    const rm = rms[exerciseName];
    if (!rm || !percent) return null;
    return ((rm * percent) / 100).toFixed(1);
  };

  // Extraer ejercicios únicos con porcentaje
  const calculables = exercises.filter(item => item.Porcentaje && item.Ejercicio !== 'N/A');
  const ejerciciosUnicos = [...new Set(calculables.map(item => item.Ejercicio))];

  // Agrupar por bloque
  const bloques = exercises.reduce((acc, curr) => {
    const bloque = curr.Bloque || 'GENERAL';
    if (!acc[bloque]) acc[bloque] = [];
    acc[bloque].push(curr);
    return acc;
  }, {});

  const getBlockClass = (bloque) => {
    const b = bloque.toUpperCase();
    if (b.includes('CORE')) return 'core';
    if (b.includes('OLY')) return 'oly';
    if (b.includes('FUERZA')) return 'fuerza';
    if (b.includes('WOD')) return 'wod';
    if (b.includes('SKILL')) return 'skill';
    if (b.includes('CONDITIONING') || b.includes('RUNNING') || b.includes('ROWING')) return 'conditioning';
    return '';
  };

  return (
    <div className="routine-view">
      {ejerciciosUnicos.length > 0 && (
        <div className="rm-inputs-card">
          <div className="rm-header">
            <h3>Calculadora 1RM (KG)</h3>
          </div>
          <div className="inputs-grid">
            {ejerciciosUnicos.map((ejercicio, idx) => (
              <div key={idx} className="input-group">
                <label title={ejercicio}>{ejercicio}</label>
                <input 
                  type="number" 
                  inputMode="decimal"
                  placeholder="Ej: 100" 
                  onChange={(e) => handleRmChange(ejercicio, e.target.value)} 
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="blocks-grid">
        {exercises.length === 0 ? (
          <p style={{ textAlign: 'center', marginTop: '30px', color: '#64748b' }}>
            Descanso o sin entrenamiento programado para este día.
          </p>
        ) : (
          Object.keys(bloques).map((bloque, bIdx) => (
            <div key={bIdx} className="block-card">
              <div className={`block-header ${getBlockClass(bloque)}`}>
                {bloque}
              </div>
              <div className="block-content">
                {bloques[bloque].map((item, itemIdx) => {
                  const pesoCalculado = calculateWeight(item.Ejercicio, item.Porcentaje);
                  return (
                    <div key={itemIdx} className="exercise-row">
                      <span>{item.Detalle}</span>
                      {pesoCalculado && (
                        <span className="calculated-tag">
                          {pesoCalculado} kg
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}