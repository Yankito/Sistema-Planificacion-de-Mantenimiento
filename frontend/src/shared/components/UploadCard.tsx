import { UploadCloud, CheckCircle2, Download, type LucideIcon } from "lucide-react";
import { useState, useRef } from "react";

import { descargarPlantilla } from "../../shared/services/SeguimientoService";
import type { FileType } from "./FileUploader";


type UploadEvent = React.ChangeEvent<HTMLInputElement> | { target: { files: FileList | null } };

interface UploadCardProps {
  label: string;
  sublabel: string;
  type: FileType;
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
  isUploaded: boolean;
  isLoading: boolean;
  isHighlighted: boolean;
  onUpload: (e: UploadEvent, tipo: FileType) => void;
}


export const UploadCard = ({
  label, sublabel, type, icon: Icon,
  colorClass, bgClass, isUploaded, isLoading, isHighlighted, onUpload
}: UploadCardProps) => {

  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isLoading) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isLoading) return;
    const file = e.dataTransfer.files[0];
    if (file) {
      // Mock para mantener compatibilidad
      const fileList = { 0: file, length: 1, item: (index: number) => index === 0 ? file : null } as unknown as FileList;
      const fakeEvent = { target: { files: fileList } };
      onUpload(fakeEvent, type);
    }
  };

  const handleClick = () => {
    if (!isLoading) inputRef.current?.click();
  };

  const handleDownloadClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await descargarPlantilla(type);
    } catch (err) {
      console.error("Error al bajar plantilla", err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e, type);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
      className={`
        relative overflow-hidden rounded-2xl p-4 border-2 transition-all duration-500 cursor-pointer group h-full flex flex-col justify-between
        ${isLoading ? 'opacity-50 cursor-wait' : ''}
        
        ${isUploaded
          ? `bg-white border-${bgClass.split('-')[1]}-500 shadow-md`
          : isHighlighted
            ? `border-${bgClass.split('-')[1]}-500 bg-${bgClass.split('-')[1]}-50 scale-105 shadow-xl ring-4 ring-${bgClass.split('-')[1]}-200 ring-offset-2 z-10`
            : isDragging
              ? `border-${bgClass.split('-')[1]}-500 bg-${bgClass.split('-')[1]}-50`
              : 'border-dashed border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
        }
      `}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`
          p-3 rounded-xl transition-all duration-300
          ${isUploaded ? `${bgClass} text-white` : `bg-slate-50 ${colorClass} group-hover:bg-white group-hover:shadow-sm`}
        `}>
          {isUploaded ? <CheckCircle2 size={24} /> : <Icon size={24} />}
        </div>

        <div className="flex flex-col items-end gap-1">
          {isUploaded ? (
            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full bg-green-100 text-green-700`}>
              Listo
            </span>
          ) : (
            <button
              onClick={handleDownloadClick}
              title="Descargar Plantilla Excel"
              className="p-1.5 rounded-lg text-slate-300 hover:text-pf-red hover:bg-red-50 transition-colors z-20"
            >
              <Download size={16} />
            </button>
          )}
        </div>
      </div>

      <div>
        <h3 className={`font-black text-sm uppercase tracking-tight mb-1 ${isUploaded ? 'text-slate-800' : 'text-slate-600'}`}>
          {label}
        </h3>
        <p className={`text-[10px] font-medium transition-colors ${isHighlighted ? 'text-slate-600 font-bold' : 'text-slate-400'}`}>
          {isUploaded ? 'Archivo procesado correctamente' : sublabel}
        </p>
      </div>

      <input type="file" ref={inputRef} className="hidden" accept=".xlsx, .xls" onChange={handleInputChange} disabled={isLoading} />

      {isDragging && (
        <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-10">
          <UploadCloud className={`${colorClass} animate-bounce`} size={32} />
        </div>
      )}
    </div>
  );
};
