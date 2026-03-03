import { CheckCircle2, AlertCircle, Calendar } from "lucide-react";
import type { AtrasoRow } from "../types";
import type { TecnicoEstado } from "../../../shared/types/index";

/**
 * Propiedades del componente OTCard.
 */
interface OTCardProps {
  /** Objeto con la información principal de la Orden de Trabajo (OT) y su estado. */
  item: AtrasoRow;
  /** Indica si la OT debe destacarse como "nueva" de forma imperativa (sobrescribe item.isNew si se usa). */
  isNew?: boolean;
  /** Callback opcional que se acciona al hacer clic sobre un técnico asociado a la OT. */
  onSelectTech?: (name: string) => void;
  /** Nombre del técnico seleccionado en el contexto superior (ej: SeguimientoModal) para resaltar su entrada. */
  selectedTech?: string | null;
}

/**
 * Componente visual que representa una tarjeta de Orden de Trabajo (OT).
 * Muestra información clave como número de orden, número de activo, clasificación,
 * técnicos intervinientes y los estados de RMD (Retiro de Materiales) / RSE (Retiros de Servicio/Standby).
 *
 * @param {OTCardProps} props - Propiedades del componente.
 */
export const OTCard = ({ item, isNew, onSelectTech, selectedTech }: OTCardProps) => {
  // Una OT se conisdera "Nueva" si se inyectó explícitamente vía prop isNew o si su estado original lo indica
  const esNueva = isNew || item.isNew;
  return (
    <div className={`bg-white p-3 rounded-xl border shadow-sm transition-all ${esNueva ? 'border-l-4 border-pf-red-600 shadow-pf-red-100' : 'border-pf-neutral-200'}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-pf-neutral-900 select-text">{item.nroOrden}</span>

          {esNueva && (
            <span className="bg-pf-red-600 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black animate-pulse shadow-sm">
              NUEVA
            </span>
          )}
        </div>

        {item.fecha && (
          <div className="flex items-center gap-1 text-pf-neutral-500">
            <Calendar size={10} />
            <span className="text-[9px] font-bold">{item.fecha}</span>
          </div>
        )}
      </div>

      <div className="mb-2">
        <span className="text-sm font-black text-pf-neutral-900 select-text">{item.nroActivo}</span>
      </div>


      <div className="mb-2">
        <span className={`text-[9px] px-2 py-0.5 rounded-md font-black bg-white border ${item.clasificacion === 'FINALIZADA' ? 'bg-pf-success-100 text-pf-success-700 border-pf-success-200' :
          item.clasificacion === 'PROGRAMADOR' ? 'bg-pf-blue-100 text-pf-blue-700 border-pf-blue-200' :
            item.clasificacion === 'TECNICO / SERVICIO' ? 'bg-pf-blue-50 text-pf-blue-600 border-pf-blue-200' :
              'bg-pf-warning-100 text-pf-warning-700 border-pf-warning-200'
          }`}>
          {item.clasificacion}
        </span>
      </div>

      <p className="text-[10px] text-pf-neutral-500 uppercase font-bold line-clamp-2 mb-3 leading-relaxed tracking-tight">{item.descripcion}</p>

      <div className="bg-pf-neutral-50 border border-pf-neutral-100 rounded-lg p-2 mb-3 space-y-1 shadow-inner">
        {item.detallesTecnicos?.map((t: TecnicoEstado, i: number) => (
          <div
            key={i}
            onClick={() => onSelectTech && onSelectTech(t.tecnico.nombre)}
            className={`flex items-center justify-between p-1 rounded transition-colors ${!selectedTech ? 'hover:bg-pf-red-50 cursor-pointer group' : ''}`}
          >
            <span className={`text-[10px] font-bold ${selectedTech === t.tecnico.nombre ? 'text-pf-red-600' : 'text-pf-neutral-600 group-hover:text-pf-red-600'}`}>
              {t.tecnico.nombre}
            </span>
            {t.opFinalizada ? <CheckCircle2 size={14} className="text-pf-success-500" /> : <AlertCircle size={14} className="text-pf-red-500" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* RMD (Retiro de Materiales): 
            Una asunción de negocio es que valores nulos, vacíos, '0' o 'SI' indican que NO HAY PENDIENTES,
            por lo tanto muestran un estado verde (Success). Solo otros valores explícitos marcan error (Red). */}
        <div className={`p-1.5 rounded-lg border flex flex-col items-center shadow-sm ${item.rmd === 'SI' || item.rmd === '' || item.rmd === '0' || item.rmd === null ? 'bg-pf-success-50 text-pf-success-700 border-pf-success-100' : 'bg-pf-red-50 text-pf-red-700 border-pf-red-100'}`}>
          <span className="text-[7px] font-black uppercase opacity-60">RMD</span>
          <span className="text-[10px] font-black">{item.rmd}</span>
        </div>

        {/* RSE (Retiro de Servicios Externos o Solicitud de Repuestos):
            Misma regla de negocio que el RMD. */}
        <div className={`p-1.5 rounded-lg border flex flex-col items-center shadow-sm ${item.rse === 'SI' || item.rse === '' || item.rse === '0' || item.rse === null ? 'bg-pf-success-50 text-pf-success-700 border-pf-success-100' : 'bg-pf-red-50 text-pf-red-700 border-pf-red-100'}`}>
          <span className="text-[7px] font-black uppercase opacity-60">RSE</span>
          <span className="text-[10px] font-black">{item.rse}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-pf-neutral-100 text-[9px] font-black text-pf-neutral-800 uppercase tracking-widest">
        <span>{item.periodo}</span>
        <span>{item.planta}</span>
      </div>
    </div>
  );
};