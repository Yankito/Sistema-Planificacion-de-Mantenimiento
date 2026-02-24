import { API_ENDPOINTS } from "../../shared/api/config";
import { fetchAuth } from "../../shared/api/fetchAuth";

export const MasivoService = {
    uploadExcel: async (file: File, targetWeek?: string, mes?: number, anio?: number): Promise<any> => {
        const formData = new FormData();
        formData.append('file', file);
        if (targetWeek) {
            formData.append('targetWeek', targetWeek);
        }
        if (mes) formData.append('mes', String(mes));
        if (anio) formData.append('anio', String(anio));

        try {
            const res = await fetchAuth(`${API_ENDPOINTS.MASIVO}/upload`, {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Error en la carga masiva");
            }

            return await res.json();
        } catch (error) {
            const message = error instanceof Error ? error.message : "No se pudo conectar con el servidor para carga masiva";
            throw new Error(message);
        }
    },

    descargarPlantilla: async () => {
        const XLSX = await import("xlsx-js-style");

        const wb = XLSX.utils.book_new();

        // 1. Hoja EMPLEADOS
        const wsEmp = XLSX.utils.json_to_sheet([
            { EMPLEADO: "JUAN PEREZ", PLANTA: "PF1", ROL: "M" },
            { EMPLEADO: "PEDRO SOTO", PLANTA: "PF2", ROL: "E" }
        ]);
        XLSX.utils.book_append_sheet(wb, wsEmp, "EMPLEADOS");

        // 2. Hoja HORARIOS
        const headersHorarios = ["NOMBRE", ...Array.from({ length: 31 }, (_, i) => String(i + 1))];
        const wsHor = XLSX.utils.aoa_to_sheet([
            headersHorarios,
            ["JUAN PEREZ", ...Array(31).fill("N1")],
            ["PEDRO SOTO", ...Array(31).fill("M")]
        ]);
        XLSX.utils.book_append_sheet(wb, wsHor, "HORARIOS");

        // 3. Hoja ACTIVOS
        const wsAct = XLSX.utils.json_to_sheet([
            { CC: "(1234)", DESC_NRO_DE_ACTIVO: "COMPRESOR FRIGORIFICO", PLANTA: "PF1", DESC_GRUPO_DE_ACTIVO: "SALA MAQUINAS" }
        ]);
        XLSX.utils.book_append_sheet(wb, wsAct, "ACTIVOS");

        // 4. Hoja CUMPLIMIENTO
        const wsCum = XLSX.utils.json_to_sheet([
            { EMPLEADO: "JUAN PEREZ", NRO_OT: "100500", OP_FINALIZADA: "SI", FECHA_PROGRAMADA_INICIO: "17/02/2026" }
        ]);
        XLSX.utils.book_append_sheet(wb, wsCum, "CUMPLIMIENTO");

        // 5. Hoja MASIVO
        const wsMas = XLSX.utils.json_to_sheet([
            { "NÚMERO": "100500", ACTIVO: "1234", "DESCRIPCIÓN": "MANTENCION PREVENTIVA", TPT: "PM01", "FECHA PROGR.": "17/02/2026", HORAS: 2, RMD: "SI", RSE: "SI" }
        ]);
        XLSX.utils.book_append_sheet(wb, wsMas, "MASIVO");

        // 6. Hoja Detalle MTBF MTTR (Fallas)
        const wsFal = XLSX.utils.json_to_sheet([
            {
                Fecha: "17/02/2026", Planta: "PF1", "Descripcion Area": "SALA FRIA",
                "Nombre Línea Prod": "LINEA 1", "Equipo Nombre": "COMPRESOR 1",
                "Descripcion Causa": "FALLA MOTOR", "Estado Pedido": "LIB.",
                "Tipo Pedido Trabajo": "CORRECTIVO", "Técnico": "JUAN PEREZ",
                "Duración Paro Oracle [min]": 45, "Gasto OM [$]": 15000,
                "Pérdida por Paro [kg]": 0, "Descripción Operador": "SE DETIENE POR RUIDO"
            }
        ]);
        XLSX.utils.book_append_sheet(wb, wsFal, "Detalle MTBF MTTR");

        // 7. Hoja Planta Ejemplo (PF1)
        const wsPlanta = XLSX.utils.json_to_sheet([
            { "PEDIDO DE TRABAJO": "100500", "ESTADO": "Liberado", "DESCRIPCIÓN": "MANTENCION PREVENTIVA", "NÚMERO DE ACTIVO": "(1234)", "FECHA INICIAL PROGRAMADA": "17/02/2026" }
        ]);
        XLSX.utils.book_append_sheet(wb, wsPlanta, "PF1");

        XLSX.writeFile(wb, "Plantilla_Carga_Masiva_PF.xlsx");
    }
};

