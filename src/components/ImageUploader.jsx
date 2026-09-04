import { useState } from 'react';

export default function ImageUploader({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  const GAS_URL = 'https://script.google.com/macros/s/AKfycbzdSDspEy7zO2h_KxGuOCDQY9aEVCUmHCWBn7NIl30fls9t1_3GHA7noewNRxxBvGK40Q/exec';

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = (err) => reject(err);
    });
  };

  const processImage = async () => {
    if (!file) return;
    setIsProcessing(true);
    setStatusMsg('Analizando la rutina por columnas con IA...');

    try {
      const base64Data = await fileToBase64(file);

      const prompt = `Analiza detalladamente esta imagen con una grilla semanal de CrossFit.
Cada columna vertical corresponde a un día: LUNES, MARTES, MIERCOLES, JUEVES, VIERNES, SABADO.
Dentro de cada columna hay bloques de colores (CORE, OLY, FUERZA, WOD, SKILL, CONDITIONING, etc.).

Extrae los ejercicios respetando de forma estricta su columna (Día) y bloque correspondiente.

Genera EXCLUSIVAMENTE un arreglo JSON de arreglos con exactamente este esquema de 5 columnas:
["Día", "Bloque", "Ejercicio", "Detalle", "Porcentaje"]

Reglas de los campos:
1. "Día": uno de ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'].
2. "Bloque": nombre del bloque o sección (ej. CORE, OLY, FUERZA, WOD, SKILL). Si no tiene, usa 'GENERAL'.
3. "Ejercicio": nombre principal si tiene porcentaje para 1RM (ej. POWER CLEAN, BACK SQUAT, SNATCH, DEADLIFT). Si es texto descriptivo o WOD, pon 'N/A'.
4. "Detalle": texto completo de la línea o serie.
5. "Porcentaje": solo el número entero si incluye '@ X%' (ej. 75). Si no tiene, deja cadena vacía "".

Devuelve únicamente el array JSON plano, sin formato markdown y sin texto explicativo.`;

      // Se utiliza el modelo 2.5-flash y se pasa la clave por header y query param
const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-goog-api-key': GEMINI_API_KEY
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inline_data: {
                      mime_type: file.type || 'image/jpeg',
                      data: base64Data
                    }
                  }
                ]
              }
            ]
          })
        }
      );

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      const rawText = data.candidates[0].content.parts[0].text;
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const rows = JSON.parse(cleanJson);

      setStatusMsg('Guardando datos estructurados en Google Sheets...');

      const saveRes = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ rows: rows })
      });

      const saveResult = await saveRes.json();

      if (saveResult.status === 'success') {
        alert('¡Rutina parseada y guardada correctamente en Google Sheets!');
        if (onUploadSuccess) onUploadSuccess();
      } else {
        throw new Error(saveResult.message || 'Error guardando en Sheets');
      }

    } catch (err) {
      console.error(err);
      alert('Error en el procesamiento: ' + err.message);
    } finally {
      setIsProcessing(false);
      setStatusMsg('');
    }
  };

  return (
    <div className="uploader-card">
      <label className="file-input-label">
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleFileChange} 
          disabled={isProcessing} 
        />
        {file ? `Archivo: ${file.name}` : 'Seleccionar imagen de la rutina'}
      </label>

      {preview && (
        <div style={{ marginTop: '15px' }}>
          <img 
            src={preview} 
            alt="Vista previa" 
            style={{ maxWidth: '240px', borderRadius: '6px' }} 
          />
          <div style={{ marginTop: '10px' }}>
            {isProcessing ? (
              <p style={{ color: '#38bdf8' }}>{statusMsg}</p>
            ) : (
              <button 
                type="button" 
                onClick={processImage} 
                className="btn-primary"
              >
                Procesar y Guardar Rutina
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}