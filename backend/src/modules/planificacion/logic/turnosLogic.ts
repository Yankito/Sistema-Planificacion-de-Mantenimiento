export const buscarNocheComun = (fechaProyectada: Date, listaTurnos: string[][]): Date | null => {
  const diaTarget = fechaProyectada.getDate(); 
  const diasEnMes = new Date(fechaProyectada.getFullYear(), fechaProyectada.getMonth() + 1, 0).getDate();
  
  const todosTienenNoche = (diaIndex: number) => {
     if (diaIndex < 0 || diaIndex >= listaTurnos[0].length) return false;
     return listaTurnos.every(turnosDelTecnico => 
        turnosDelTecnico[diaIndex]?.trim().toUpperCase() === 'N'
     );
  };

  // 1. Buscar +/- 7 días
  for (let offset = 0; offset <= 7; offset++) {
      const checkOffsets = offset === 0 ? [0] : [offset, -offset];
      for (const k of checkOffsets) {
          const diaCandidato = diaTarget + k;
          if (diaCandidato >= 1 && diaCandidato <= diasEnMes) {
              if (todosTienenNoche(diaCandidato - 1)) {
                  const nuevaFecha = new Date(fechaProyectada);
                  nuevaFecha.setDate(diaCandidato);
                  return nuevaFecha;
              }
          }
      }
  }

  // 2. Sábado más cercano (si no hay bloqueos)
  const CODIGOS_BLOQUEANTES = ['L', 'V', 'LIC', 'LM', 'LP'];
  const alguienBloqueado = (diaIndex: number) => {
      if (diaIndex < 0 || diaIndex >= listaTurnos[0].length) return true;
      return listaTurnos.some(turnosDelTecnico => {
          const turno = turnosDelTecnico[diaIndex]?.trim().toUpperCase() || "";
          return CODIGOS_BLOQUEANTES.some(bloqueo => turno.startsWith(bloqueo));
      });
  };

  let mejorSabado: number | null = null;
  let menorDistancia = Infinity;

  for (let d = 1; d <= diasEnMes; d++) {
      const fechaTemp = new Date(fechaProyectada.getFullYear(), fechaProyectada.getMonth(), d);
      if (fechaTemp.getDay() === 6) { // Sábado
          if (!alguienBloqueado(d - 1)) {
              const distancia = Math.abs(d - diaTarget);
              if (distancia < menorDistancia) {
                  menorDistancia = distancia;
                  mejorSabado = d;
              }
          }
      }
  }

  if (mejorSabado !== null) {
      const fechaSabado = new Date(fechaProyectada);
      fechaSabado.setDate(mejorSabado);
      return fechaSabado;
  }

  return null; 
};