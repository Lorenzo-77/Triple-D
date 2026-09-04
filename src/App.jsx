import { useState, useEffect } from 'react';
import './styles/App.css';
import DaySelector from './components/DaySelector';
import ImageUploader from './components/ImageUploader';
import RoutineView from './components/RoutineView';

export default function App() {
  const [selectedDay, setSelectedDay] = useState('LUNES');
  const [rutinaSemanal, setRutinaSemanal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarCarga, setMostrarCarga] = useState(false);

  const daysOfWeek = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
  const mappingDias = {
    'LUN': 'LUNES',
    'MAR': 'MARTES',
    'MIE': 'MIERCOLES',
    'JUE': 'JUEVES',
    'VIE': 'VIERNES',
    'SAB': 'SABADO'
  };

  const GAS_URL = 'https://script.google.com/macros/s/AKfycbzdSDspEy7zO2h_KxGuOCDQY9aEVCUmHCWBn7NIl30fls9t1_3GHA7noewNRxxBvGK40Q/exec';

  const cargarDatosDesdeSheets = async () => {
    setLoading(true);
    try {
      const res = await fetch(GAS_URL);
      const data = await res.json();
      setRutinaSemanal(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length === 0) {
        setMostrarCarga(true);
      }
    } catch (err) {
      console.error('Error cargando rutina:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatosDesdeSheets();
  }, []);

  const handleSuccess = () => {
    setMostrarCarga(false);
    cargarDatosDesdeSheets();
  };

  const diaCompleto = mappingDias[selectedDay] || 'LUNES';
  const ejerciciosDelDia = rutinaSemanal.filter(
    (item) => item.Día && item.Día.toString().toUpperCase() === diaCompleto
  );

  return (
    <div className="app-container">
      <header className="header">
        <h1>PLANI TRIPLE D</h1>
        <button 
          onClick={() => setMostrarCarga(!mostrarCarga)} 
          className="btn-toggle-upload"
        >
          {mostrarCarga ? 'Cerrar' : 'Cargar Plani'}
        </button>
      </header>

      <main>
        {mostrarCarga && (
          <ImageUploader onUploadSuccess={handleSuccess} />
        )}

        <DaySelector 
          days={daysOfWeek} 
          currentDay={selectedDay} 
          onSelectDay={setSelectedDay} 
        />

        {loading ? (
          <p style={{ textAlign: 'center', margin: '40px 0', color: '#64748b' }}>Cargando planificación...</p>
        ) : (
          <RoutineView day={diaCompleto} exercises={ejerciciosDelDia} />
        )}
      </main>
    </div>
  );
}