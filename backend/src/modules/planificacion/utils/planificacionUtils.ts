/** Plantas que integran el Complejo Industrial (CI) */
export const PLANTAS_CI = ["PF3", "PF4", "PF5", "PF6", "CDT"];

/** Roles que no requieren validación de turno nocturno ni sábado */
export const ROLES_NO_VALIDAN_TURNO = ["SUPERVISOR", "SE"]; // SE = Servicio Externo

/**
 * Determina si la planta de un técnico es compatible con la planta de la OT a ejecutar.
 * Reglas:
 *   - Técnicos con planta 'CI' son compatibles con cualquier planta del Complejo Industrial.
 *   - Técnicos SUPERVISOR o SE son compatibles con cualquier planta (globales).
 *   - Las OTs de planta 'OTROS' aceptan técnicos de cualquier planta.
 */
export const esPlantaCompatible = (plantaTecnico: string, plantaOT: string, rol?: string) => {
  const emp = (plantaTecnico || "").toUpperCase().trim();
  const ot = (plantaOT || "").toUpperCase().trim();
  const r = String(rol || "").trim().toUpperCase();

  const esCICompatible = emp === "CI" && PLANTAS_CI.includes(ot);

  if (emp === ot || esCICompatible || ot === "OTROS") return true;

  if (r === 'SUPERVISOR' || r === 'SE') return true;

  return false;
};

/**
 * Compara dos roles de forma estricta (case-insensitive).
 * Se usa para verificar si el rol del técnico coincide exactamente con el requerido por la OT.
 */
export const rolesCoinciden = (rolRequerido: string, rolTecnico: string) => {
  const req = String(rolRequerido || "").trim().toUpperCase();
  const emp = String(rolTecnico || "").trim().toUpperCase();
  return req === emp;
};

/**
 * Indica si un rol necesita validación de turno nocturno o sábado.
 * Los roles excluidos (SUPERVISOR, SE) no operan en turnos nocturnos, por lo que
 * no se les aplica la restricción de coincidencia de turno 'N'.
 */
export const necesitaValidacionTurno = (rol: string) => {
  const r = String(rol || "").trim().toUpperCase();
  return !ROLES_NO_VALIDAN_TURNO.includes(r);
};

/**
 * Configuración visual de roles para el frontend.
 * Mapea el código de rol a su etiqueta, color de fondo y color de texto.
 */
export const CONFIG_ROLES: Record<string, { label: string, color: string, text: string }> = {
  'M': { label: 'Mecánico', color: 'bg-blue-600', text: 'text-blue-600' },
  'E': { label: 'Eléctrico', color: 'bg-yellow-600', text: 'text-yellow-500' },
  'SADEMA': { label: 'Sadema', color: 'bg-emerald-600', text: 'text-emerald-500' },
  'SUPERVISOR': { label: 'Supervisor', color: 'bg-purple-600', text: 'text-purple-500' },
  'CALDERA': { label: 'Caldera', color: 'bg-pink-600', text: 'text-pink-500' },
  'SE': { label: 'Servicio Externo', color: 'bg-slate-600', text: 'text-slate-500' },
};