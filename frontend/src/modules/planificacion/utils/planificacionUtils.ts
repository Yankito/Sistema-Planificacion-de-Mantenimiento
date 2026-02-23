export type PlantaPF = "PF1" | "PF2" | "PF3" | "PF4" | "PF5" | "PF6" | "CDT" | "SADEMA" | "CI" | "OTROS";
export type RolPF = 'M' | 'E' | 'SADEMA' | 'SUPERVISOR' | 'CALDERA' | 'SE';

export const PLANTAS_CI: string[] = ["PF3", "PF4", "PF5", "PF6", "CDT"];
export const ROLES_NO_VALIDAN_TURNO: string[] = ["SUPERVISOR", "SE"];

/**
 * Lógica de compatibilidad de plantas:
 * Los tecnicos de "CI" pueden trabajar en cualquier planta de la lista PLANTAS_CI.
 */
export const esPlantaCompatible = (plantaTecnico: string, plantaOT: string, rol?: string): boolean => {
  const emp = (plantaTecnico || "").toUpperCase().trim();
  const ot = (plantaOT || "").toUpperCase().trim();
  const r = String(rol || "").trim().toUpperCase();

  // Los técnicos de "CI" son compatibles con cualquier planta en PLANTAS_CI
  const esCICompatible = emp === "CI" && PLANTAS_CI.includes(ot);

  if (emp === ot || esCICompatible || ot === "OTROS") return true;

  // Supervisores y Servicio Externo son globales para cualquier planta
  if (r === 'SUPERVISOR' || r === 'SE') return true;

  return false;
};

export const rolesCoinciden = (rolRequerido: string, rolTecnico: string): boolean => {
  const req = String(rolRequerido || "").trim().toUpperCase();
  const emp = String(rolTecnico || "").trim().toUpperCase();
  return req === emp;
};

export const necesitaValidacionTurno = (rol: string): boolean => {
  const r = String(rol || "").trim().toUpperCase();
  return !ROLES_NO_VALIDAN_TURNO.includes(r);
};

export const CONFIG_ROLES: Record<string, { label: string, color: string, text: string }> = {
  'M': { label: 'Mecánico', color: 'bg-blue-600', text: 'text-blue-600' },
  'E': { label: 'Eléctrico', color: 'bg-yellow-600', text: 'text-yellow-500' },
  'SADEMA': { label: 'Sadema', color: 'bg-emerald-600', text: 'text-emerald-500' },
  'SUPERVISOR': { label: 'Supervisor', color: 'bg-purple-600', text: 'text-purple-500' },
  'CALDERA': { label: 'Caldera', color: 'bg-pink-600', text: 'text-pink-500' },
  'SE': { label: 'Servicio Externo', color: 'bg-slate-600', text: 'text-slate-500' },
};