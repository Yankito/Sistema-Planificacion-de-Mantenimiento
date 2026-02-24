import { type PlanResult, type PlanningOT } from "../types.js";
import { getMonday, formatearFecha } from "../utils/dateHelpers.js";

const groupBy = <T extends Record<string, any>>(xs: T[], key: keyof T): Record<string, T[]> => {
    return xs.reduce(function (rv, x) {
        const val = String(x[key]);
        (rv[val] = rv[val] || []).push(x);
        return rv;
    }, {} as Record<string, T[]>);
};

export const distribuirCargaEquilibrada = (ordenesParaDistribuir: PlanningOT[]): PlanResult[] => {
    const resultados: PlanResult[] = [];

    // 1. Agrupar por PLANTA
    const ordenesPorPlanta = groupBy(ordenesParaDistribuir, 'planta');

    Object.keys(ordenesPorPlanta).forEach(plantaKey => {
        const ordenesDeLaPlanta = ordenesPorPlanta[plantaKey];

        // 2. Agrupar por SEMANA
        const ordenesPorSemana = groupBy(ordenesDeLaPlanta, 'semana');

        Object.keys(ordenesPorSemana).forEach(weekKey => {
            const ordenesDeLaSemana = ordenesPorSemana[weekKey];
            const fechaReferencia = ordenesDeLaSemana[0].fechaIdeal;
            const lunesSemana = getMonday(fechaReferencia);

            // Buckets [Lun, Mar, Mie, Jue, Vie]
            const buckets: PlanningOT[][] = [[], [], [], [], []];

            // A. Asignación Inicial
            ordenesDeLaSemana.forEach((ot) => {
                let diaIdx = ot.fechaIdeal.getDay() - 1;
                if (diaIdx < 0) diaIdx = 0;
                if (diaIdx > 4) diaIdx = 4;
                buckets[diaIdx].push(ot);
            });

            // B. Peak Shaving
            const totalOTs = ordenesDeLaSemana.length;
            const techo = Math.ceil(totalOTs / 5);

            for (let origen = 0; origen < 5; origen++) {
                while (buckets[origen].length > techo) {
                    const otMover = buckets[origen].pop();
                    let mejorDestino = -1;
                    let menorDistancia = Infinity;

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
                        buckets[origen].push(otMover);
                        break;
                    }
                }
            }

            // C. Guardar Resultados
            buckets.forEach((listaOts, i) => {
                const fechaDia = new Date(lunesSemana);
                fechaDia.setDate(lunesSemana.getDate() + i);
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