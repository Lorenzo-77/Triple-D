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

  const clearSelection = () => {
    setFile(null);
    setPreview(null);
    setStatusMsg('');
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
    setStatusMsg('Analizando pizarra semanal...');

    try {
      const base64Data = await fileToBase64(file);

      const prompt = `Analiza detalladamente esta planilla semanal de CrossFit.
Cada columna vertical corresponde a un día: LUNES, MARTES, MIERCOLES, JUEVES, VIERNES, SABADO.
Dentro de cada columna hay bloques de colores (CORE, OLY, FUERZA, WOD, ESTRUCTURA, CONDITIONING, etc.).

Extrae cada línea respetando de forma estricta su Día y Bloque.

Genera EXCLUSIVAMENTE un arreglo JSON de arreglos con exactamente este formato de 5 columnas:
["Día", "Bloque", "Ejercicio", "Detalle", "Porcentaje"]

Reglas estrictas de extracción:
1. "Día": uno de ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO']. (Jueves si está vacío se omite).
2. "Bloque": nombre del bloque tal como aparece (ej. CORE, OLY, FUERZA, ESTRUCTURA, WOD, RUNNING CONDITIONING, ROWING ONDITIONING, CONDITIONING).
3. "Ejercicio": 
   - Debe ser el nombre base del levantamiento si la línea lleva porcentaje o es una serie de ese ejercicio. Normaliza a nombres estándar:
     * Si dice "3 HIGH HANG SNATCH", "2 HANG SNATCH" o "2 SNATCH" -> "SNATCH".
     * Si dice "2 POWER CLEANS + 1 JERKS", "1 CLEAN AND JERK" -> "CLEAN AND JERK".
     * Si el bloque es FUERZA y el título es "BACK SQUAT", todas las series debajo llevan "BACK SQUAT".
     * Lo mismo para "BENCH PRESS", "FRONT SQUAT", "DEADLIFT".
   - Si no lleva porcentaje para 1RM (WODs, carreras, descansos, notas con asterisco, etc.), pon "N/A".
4. "Detalle": el texto original completo de la línea.
5. "Porcentaje": 
   - Si tiene dos porcentajes o rango (ej: "@ 60%-65%", "@ 70%-75%", "@ 80%-85%", "@ 75%-80%"), extrae el rango en formato "60-65", "70-75", etc.
   - Si tiene un solo porcentaje (ej: "@ 70%", "@ 80%"), extrae solo el número (ej: "70", "80").
   - Si no tiene porcentaje o es un peso fijo (ej: "@ 50kg"), deja cadena vacía "".

Devuelve únicamente el array JSON plano sin formato markdown.`;

      const modelsToTry = [
        'gemini-3.6-flash',
        'gemini-2.5-flash',
        'gemini-1.5-flash'
      ];

      let rawText = null;

      for (const model of modelsToTry) {
        try {
          setStatusMsg(`Procesando con ${model}...`);
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      { text: prompt },
                      {
                        inline_data: {
                          mime_type: file.type || 'image/png',
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

          if (response.ok && data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            rawText = data.candidates[0].content.parts[0].text;
            break;
          }

          console.warn(`Fallo con ${model}:`, data.error?.message || 'Respuesta inválida');
        } catch (err) {
          console.warn(`Error de red con ${model}:`, err);
        }
      }

      if (!rawText) {
        throw new Error('Los servidores de IA están saturados temporalmente. Espera 1 minuto y vuelve a intentar.');
      }

      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const rows = JSON.parse(cleanJson);

      setStatusMsg('Guardando en Google Sheets...');

      const saveRes = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ rows })
      });

      const saveResult = await saveRes.json();
      if (saveResult.status === 'success') {
        alert('Planificación procesada y guardada correctamente.');
        if (onUploadSuccess) onUploadSuccess();
      } else {
        throw new Error(saveResult.message || 'Error al persistir');
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
    <div className="upload-panel">
      {!preview ? (
        <label className="upload-dropzone">
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            disabled={isProcessing} 
          />
          <span className="upload-prompt-text">Seleccionar imagen de pizarra</span>
          <span className="upload-help-text">JPG o PNG de la planificación semanal</span>
        </label>
      ) : (
        <div className="preview-box">
          <img src={preview} alt="Vista previa" className="preview-thumbnail" />
          <div className="preview-actions">
            {isProcessing ? (
              <div className="loader-box">
                <span className="loader-spinner"></span>
                <span className="loader-label">{statusMsg}</span>
              </div>
            ) : (
              <>
                <button type="button" onClick={clearSelection} className="btn-secondary">
                  Cancelar
                </button>
                <button type="button" onClick={processImage} className="btn-primary">
                  Procesar Planificación
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}