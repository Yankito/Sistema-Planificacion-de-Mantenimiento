import { type PlanResult, type PlanningOT } from "../types.js";
import { getMonday, formatearFecha } from "../utils/dateHelpers.js";

/**
 * Agrupa un array de objetos por el valor de una clave dada.
 * Retorna un objeto donde cada clave es un valor distinto y el valor es el array de elementos correspondientes.
 */
const groupBy = <T extends Record<string, any>>(xs: T[], key: keyof T): Record<string, T[]> => {
    return xs.reduce(function (rv, x) {
        const val = String(x[key]);
        (rv[val] = rv[val] || []).push(x);
        return rv;
    }, {} as Record<string, T[]>);
};

/**
 * Distribuye las OTs de manera equilibrada entre los días hábiles (Lun-Vie) de cada semana,
 * usando un algoritmo de Peak Shaving para evitar sobrecargas diarias.
 *
 * El proceso por cada planta y semana:
 *   A. Asignación inicial: cada OT va al día de la semana de su fecha ideal.
 *   B. Peak Shaving: si un día supera el techo (total/5), se mueven OTs al día más cercano
 *      que aún tenga capacidad disponible.
 *   C. Generación de resultados: a cada OT se le asigna la fecha del día final de su bucket.
 *
 * @param ordenesParaDistribuir - OTs con su fecha ideal y semana calculadas
 * @returns Array de PlanResult con las feches sugeridas balanceadas
 */
export const distribuirCargaEquilibrada = (ordenesParaDistribuir: PlanningOT[]): PlanResult[] => {
    const resultados: PlanResult[] = [];

    // Agrupar por planta para distribuir en forma independiente por zona
    const ordenesPorPlanta = groupBy(ordenesParaDistribuir, 'planta');

    Object.keys(ordenesPorPlanta).forEach(plantaKey => {
        const ordenesDeLaPlanta = ordenesPorPlanta[plantaKey];

        // Agrupar por semana para aplicar Peak Shaving semana a semana
        const ordenesPorSemana = groupBy(ordenesDeLaPlanta, 'semana');

        Object.keys(ordenesPorSemana).forEach(weekKey => {
            const ordenesDeLaSemana = ordenesPorSemana[weekKey];
            const fechaReferencia = ordenesDeLaSemana[0].fechaIdeal;
            const lunesSemana = getMonday(fechaReferencia);

            // Buckets representa los 5 días hábiles: [Lun, Mar, Mie, Jue, Vie]
            const buckets: PlanningOT[][] = [[], [], [], [], []];

            // A. Asignación inicial según el día de la semana de la fecha ideal
            ordenesDeLaSemana.forEach((ot) => {
                let diaIdx = ot.fechaIdeal.getDay() - 1; // getDay(): 0=Dom, 1=Lun...
                if (diaIdx < 0) diaIdx = 0; // Domingo -> Lunes
                if (diaIdx > 4) diaIdx = 4; // Sábado -> Viernes
                buckets[diaIdx].push(ot);
            });

            // B. Peak Shaving: redistribuir hacia el día hábil más cercano con capacidad
            const totalOTs = ordenesDeLaSemana.length;
            const techo = Math.ceil(totalOTs / 5); // Máximo permitido por día

            for (let origen = 0; origen < 5; origen++) {
                while (buckets[origen].length > techo) {
                    const otMover = buckets[origen].pop();
                    let mejorDestino = -1;
                    let menorDistancia = Infinity;

                    // Buscar el día destino disponible más cercano al origen
                    for (let destino = 0; destino < 5; destino++) {
                        if (destino === origen) continue;
                        if (buckets[destino].length < techo) {
                            const distancia = Math.abs(destino - origen);
                            if (distancia < menorDistancia) {
                                menorDistancia = distancia;
                                mejorDestino = destino;
                            }
                        }
                    }

                    if (mejorDestino !== -1) {
                        buckets[mejorDestino].push(otMover);
                    } else {
                        // No hay destino disponible: mantener en el día actual y detener
                        buckets[origen].push(otMover);
                        break;
                    }
                }
            }

            // C. Asignar la fecha final a cada OT según el bucket donde quedó
            buckets.forEach((listaOts, i) => {
                const fechaDia = new Date(lunesSemana);
                fechaDia.setDate(lunesSemana.getDate() + i); // i=0: Lunes, i=4: Viernes
                const fechaStr = formatearFecha(fechaDia);

                listaOts.forEach((ot) => {
                    const { fechaIdeal, ...rest } = ot;
                    resultados.push({ ...rest, fechaSugerida: fechaStr });
                });
            });
        });
    });

    return resultados;
};