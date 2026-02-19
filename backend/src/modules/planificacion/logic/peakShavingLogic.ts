import { type PlanResult } from "../types.js";
import { getMonday, formatearFecha } from "../utils/dateHelpers.js";

const groupBy = (xs: any[], key: string) => {
    return xs.reduce(function (rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
    }, {});
};

export const distribuirCargaEquilibrada = (ordenesParaDistribuir: any[]): PlanResult[] => {
    const resultados: PlanResult[] = [];

    // 1. Agrupar por PLANTA
    const ordenesPorPlanta = groupBy(ordenesParaDistribuir, 'planta');

    Object.keys(ordenesPorPlanta).forEach(plantaKey => {
        const ordenesDeLaPlanta = ordenesPorPlanta[plantaKey];

        // 2. Agrupar por SEMANA
        const ordenesPorSemana = groupBy(ordenesDeLaPlanta, 'weekId');

        Object.keys(ordenesPorSemana).forEach(weekKey => {
            const ordenesDeLaSemana = ordenesPorSemana[weekKey];
            const fechaReferencia = ordenesDeLaSemana[0].fechaIdeal;
            const lunesSemana = getMonday(fechaReferencia);

            // Buckets [Lun, Mar, Mie, Jue, Vie]
            const buckets: any[][] = [[], [], [], [], []];

            // A. Asignación Inicial
            ordenesDeLaSemana.forEach((ot: any) => {
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

                listaOts.forEach((ot: any) => {
                    const { fechaIdeal, ...rest } = ot;
                    resultados.push({ ...rest, fechaSugerida: fechaStr });
                });
            });
        });
    });

    return resultados;
};