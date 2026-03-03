/**
 * Busca la primera fecha dentro de ±7 días de la fecha proyectada en la que
 * todos los técnicos tengan turno nocturno ('N') coincidente.
 * Si no hay noche común disponible en ese rango, busca el sábado más cercano
 * donde ningún técnico esté bloqueado (libre, vacaciones, licencia médica, etc.).
 *
 * @param fechaProyectada - Fecha base proyectada al mes siguiente
 * @param listaTurnos - Array de arrays de turnos (uno por técnico)
 * @returns La fecha encontrada, o null si no se pudo resolver
 */
export const buscarNocheComun = (fechaProyectada: Date, listaTurnos: string[][]): Date | null => {
    const diaTarget = fechaProyectada.getDate();
    const diasEnMes = new Date(fechaProyectada.getFullYear(), fechaProyectada.getMonth() + 1, 0).getDate();

    /**
     * Verifica si todos los técnicos tienen turno 'N' en el índice de día dado.
     * El índice de día en el array de turnos es base 0 (índice 0 = día 1 del mes).
     */
    const todosTienenNoche = (diaIndex: number) => {
        if (diaIndex < 0 || diaIndex >= listaTurnos[0].length) return false;
        return listaTurnos.every(turnosDelTecnico =>
            turnosDelTecnico[diaIndex]?.trim().toUpperCase() === 'N'
        );
    };

    // Fase 1: buscar dentro de un rango de ±7 días de la fecha proyectada
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

    // Fase 2: buscar el sábado más cercano donde nadie esté bloqueado
    // Turnos bloqueantes: libre, vacaciones, licencia médica/personal
    const CODIGOS_BLOQUEANTES = ['L', 'V', 'LIC', 'LM', 'LP'];

    /**
     * Verifica si al menos un técnico tiene un turno bloqueante en el índice de día dado.
     */
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
        if (fechaTemp.getDay() === 6) { // 6 = Sábado
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

    // No se encontró ninguna fecha viable
    return null;
};