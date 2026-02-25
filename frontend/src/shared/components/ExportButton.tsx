import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { toPng } from "html-to-image";

interface ExportButtonProps {
  elementId: string;
  fileName: string;
  plantaSeleccionada: string;
  rangoTexto: string;
  semana: string;
  reportTitle: string;
}

export const ExportButton = ({
  elementId,
  fileName,
  plantaSeleccionada,
  rangoTexto,
  semana,
  reportTitle
}: ExportButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    const node = document.getElementById(elementId);
    if (!node) {
      toast.error("No se encontró el contenido para exportar.");
      return;
    }

    if (isExporting) return;
    setIsExporting(true);

    try {
      // 1. Clonar el nodo para no afectar la vista actual del usuario
      const clone = node.cloneNode(true) as HTMLElement;

      // Aplicar estilos al clon para la captura
      Object.assign(clone.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "1280px",
        zIndex: "-9999",
        backgroundColor: "#f8fafc",
        height: "auto",
        overflow: "visible",
      });

      // Asegurar que elementos con scroll se vean completos en la imagen
      const allElements = clone.querySelectorAll('*');
      allElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (htmlEl.classList.toString().includes('h-[')) htmlEl.style.height = 'auto';
        if (htmlEl.style.overflowY === 'auto' || htmlEl.classList.contains('custom-scrollbar')) {
          htmlEl.style.overflow = 'visible';
          htmlEl.style.height = 'auto';
        }
      });

      // 2. Inyectar estilos específicos para el reporte de PF Alimentos
      const styleReset = document.createElement("style");
      styleReset.innerHTML = `
        * { transition: none !important; animation: none !important; opacity: 1 !important; }
        .h-\\[500px\\] { height: auto !important; min-height: 500px !important; }
      `;
      clone.appendChild(styleReset);

      // 3. Crear cabecera corporativa para la imagen
      const headerReport = document.createElement('div');
      headerReport.style.cssText = `
        background: white; 
        padding: 40px; 
        margin-bottom: 20px; 
        border-bottom: 4px solid #ef4444; 
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        font-family: sans-serif;
      `;

      const semanaDisplay = semana === "TODAS" ? "ANUAL" : `SEMANA ${semana}`;

      headerReport.innerHTML = `
        <div>
          <h1 style="font-size: 28px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase;">${reportTitle}</h1>
          <div style="display: flex; gap: 30px; margin-top: 15px;">
            <div>
              <span style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: bold; display: block;">Período</span>
              <span style="font-size: 15px; color: #ef4444; font-weight: 900;">${semanaDisplay}</span>
              <span style="font-size: 13px; color: #64748b; margin-left: 8px;">(${rangoTexto})</span>
            </div>
            <div>
              <span style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: bold; display: block;">Planta</span>
              <span style="font-size: 15px; color: #0f172a; font-weight: bold;">${plantaSeleccionada}</span>
            </div>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 22px; font-weight: 900; color: #0f172a;">PF ALIMENTOS</div>
          <p style="font-size: 11px; color: #94a3b8; margin: 0;">Generado: ${new Date().toLocaleDateString('es-CL')} ${new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>  
      `;
      clone.prepend(headerReport);

      document.body.appendChild(clone);
      // Pequeña espera para que fuentes e imágenes del clon se procesen
      await new Promise((resolve) => setTimeout(resolve, 800));
      const finalHeight = clone.scrollHeight;

      // 4. Generar la imagen PNG
      const dataUrl = await toPng(clone, {
        quality: 1.0,
        pixelRatio: 2, // Calidad retina
        backgroundColor: '#f8fafc',
        width: 1280,
        height: finalHeight + 40,
      });

      document.body.removeChild(clone);

      // 5. MÉTODO WEB: Descarga automática del archivo
      const link = document.createElement('a');
      link.download = `${fileName}_Reporte_PF.png`;
      link.href = dataUrl;
      link.click();

    } catch (err) {
      console.error("Error exportando:", err);
      toast.error("Error al generar la imagen del reporte.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all shadow-lg active:scale-95 border border-slate-800 
        ${isExporting
          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
          : 'bg-slate-900 text-white hover:bg-black hover:shadow-pf-red/20'}`}
    >
      {isExporting ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          <span>Generando Imagen...</span>
        </>
      ) : (
        <>
          <Download size={16} />
          <span>Exportar Imagen</span>
        </>
      )}
    </button>
  );
};