import { useState, useEffect } from "react";
import "./styles/App.css";
import DaySelector from "./components/DaySelector";
import ImageUploader from "./components/ImageUploader";
import RoutineView from "./components/RoutineView";
import logoTripleD from "./public/logotripled.png";
export default function App() {
  const [selectedDay, setSelectedDay] = useState("LUN");
  const [rutinaSemanal, setRutinaSemanal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarCarga, setMostrarCarga] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);

  const daysOfWeek = ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB"];
  const mappingDias = {
    LUN: "LUNES",
    MAR: "MARTES",
    MIE: "MIERCOLES",
    JUE: "JUEVES",
    VIE: "VIERNES",
    SAB: "SABADO",
  };

  const GAS_URL =
    "https://script.google.com/macros/s/AKfycbzdSDspEy7zO2h_KxGuOCDQY9aEVCUmHCWBn7NIl30fls9t1_3GHA7noewNRxxBvGK40Q/exec";

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () =>
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "accepted") {
        setInstallPrompt(null);
      }
    } else {
      alert(
        "Acceso directo:\n\n• En iPhone: presione 'Compartir' y seleccione 'Agregar a pantalla de inicio'.\n• En Android: abra el menú de opciones de Chrome y toque 'Instalar app'.",
      );
    }
  };

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
      console.error("Error cargando rutina:", err);
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

  const diaCompleto = mappingDias[selectedDay] || "LUNES";
  const ejerciciosDelDia = rutinaSemanal.filter(
    (item) => item.Día && String(item.Día).toUpperCase() === diaCompleto,
  );

  return (
    <div className="app-container">
      <header className="header">
        <div className="brand-wrapper">
          <img src={logoTripleD} alt="Triple D Logo" className="brand-logo" />
          <span className="brand-title">PLANI TRIPLE D</span>
        </div>

        <div className="header-controls">
          <button
            type="button"
            onClick={handleInstallClick}
            className="btn-secondary"
          >
            Instalar
          </button>
          <button
            type="button"
            onClick={() => setMostrarCarga(!mostrarCarga)}
            className="btn-secondary"
          >
            {mostrarCarga ? "Cerrar" : "Cargar"}
          </button>
        </div>
      </header>

      <main>
        {mostrarCarga && <ImageUploader onUploadSuccess={handleSuccess} />}

        <DaySelector
          days={daysOfWeek}
          currentDay={selectedDay}
          onSelectDay={setSelectedDay}
        />

        {loading ? (
          <div className="status-feedback">Sincronizando planificación...</div>
        ) : (
          <RoutineView day={diaCompleto} exercises={ejerciciosDelDia} />
        )}
      </main>
    </div>
  );
}
