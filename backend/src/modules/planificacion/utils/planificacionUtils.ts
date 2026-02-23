export const PLANTAS_CI = ["PF3", "PF4", "PF5", "PF6", "CDT"];
export const ROLES_NO_VALIDAN_TURNO = ["SUPERVISOR", "SE"]; // SE = Servicio Externo

// Valida si la planta del tecnico sirve para la OT
export const esPlantaCompatible = (plantaTecnico: string, plantaOT: string, rol?: string) => {
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

// Valida si el rol coincide
export const rolesCoinciden = (rolRequerido: string, rolTecnico: string) => {
  const req = String(rolRequerido || "").trim().toUpperCase();
  const emp = String(rolTecnico || "").trim().toUpperCase();

  // Comparación estricta para roles especiales
  return req === emp;
};

// Verifica si necesita turno noche (o chequeo de sábado)
export const necesitaValidacionTurno = (rol: string) => {
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