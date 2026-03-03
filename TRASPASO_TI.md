# 📦 Documento de Traspaso a TI (Handover) - SPM
**Elaborado por:** Yanko Acuña Villaseca  
**Destinario:** Departamento de Tecnologías de Información (TI), Base de Datos y Plataformas - PF Alimentos.

Este documento detalla el estado exacto de avance funcional y las consideraciones lógicas y de infraestructura requeridas para el paso a Producción y estabilización del Sistema de Planificación de Mantenimiento (SPM).

---

## 🟢 Estado Actual del Desarrollo (Avance Funcional)
A la fecha, el código fuente entregado cubre exitosamente la base lógica de los módulos, con el siguiente nivel de madurez y validación:

- [x] **Módulo de Seguimiento Operativo (100% - Validado)**: Cuadros de mando, filtrado masivo y algoritmos de clasificación de causa raíz. Validado por usuarios finales.
- [x] **Módulo de Control de Fallas (100% - Validado)**: Procesamiento analítico avanzado del MTTR, top históricos comparativos (año actual vs anterior).
- [ ] **Módulo de Planificación y Horarios (60% - En Desarrollo)**: Funcionalidad base de mallas y asignación. Pendiente: Gestión de turnos dinámicos, validación de periodos de descanso y rotaciones automáticas.
- [ ] **Módulo de Control de Gastos (70% - En Desarrollo)**: Ingestión de un Presupuesto Meta e indicadores visuales. Pendiente: Motor automático de presupuesto base (obtención de OTs del año siguiente, frecuencia por descripción técnica y motor de asignación manual de presupuestos por planificador).
- [x] **Carga Masiva (Simulación para Desarrollo)**: Integración provisional para Excels exportados desde Oracle. *Nota: Solo para depuración técnica.*

---

## 🟡 Pendientes y Trabajo Futuro
Elementos que el equipo de integración de TI debe considerar o asumir como requerimientos de arquitectura en corto plazo:

- [ ] **Malla Horaria Dinámica**: Resolver incosistencias en la validación de turnos noche vs tarde y mallas de rotación técnica avanzada.
- [ ] **Generación Presupuestaria Base**: Implementar la lógica de obtención de OTs del próximo año desde el ERP para la configuración inicial del gasto anual de cada activo.
- [ ] **Auditoría de Presupuestos (DB)**: Configurar tabla `PF_SPM_AUDITORIA_PRESUPUESTO` para guardar registros de cambios manuales en el presupuesto.
- [ ] **Sincronización Directa a Oracle**: Desactivar carga masiva de archivos y conectar backend directamente a vistas/tablas originarias (`PF_EAM_`).
- [ ] **API de Escritura Oracle (Fase 2)**: Persistir la fecha planificada y el técnico directamente en el ERP.
- [ ] **Comparación de Seguimiento**: Habilitar el motor de comparación analítica de indicadores de flujo semana a semana.
- [ ] **Exportación Planificación (EAM Interfaz)**: Desarrollar el generador de archivos para traspasar la información de OTs y técnicos en Oracle EAM mientras no exista integración por API de escritura.

---

## 🛠 Entregables e Infraestructura Requerida

Para habilitar este software, el equipo de TI debe aprovisionar lo siguiente:

### 1. Motor de Base de Datos (Oracle)
- **Inicialización Estructural**: Se han provisto scripts SQL para la creación manual del esquema. **No utilizar inicialización automática (`init.ts`).**
  - Ejecucción requerida: `database_init_eam_simulation.sql` y `database_init_spm.sql`.
- **Aprovisionar el Esquema SPM (`PF_SPM_`)**:
  - `PF_SPM_TECNICOS`, `PF_SPM_PLANIFICACION`, `PF_SPM_HORARIOS`, `PF_SPM_GASTOS_PRESUPUESTO`.
- **Generar Rol/Usuario de Lectura de Vistas**: Crear un usuario que el Backend Node.js usará a través del Pool. Este usuario requerirá acceso a vistas consolidadas del negocio (como `PF_EAM_PEDIDOS`, `PF_EAM_CUMPLIMIENTO`, `PF_EAM_FALLAS`, `PF_EAM_GASTOS_CONSOLIDADOS`).

### 2. Despliegue del Backend (Servidor Node.js)
- **Runtime:** Instalar Node.js versión `v18.0.0` o superior en el servidor Windows Server / Linux corporativo.
- **Service Orchestrator:** Ejecutar la API mediante un orquestador como **PM2** (Linux) o **NSSM / IISNode** (Windows) para reinicio automático si el hardware colapsa.
- **Variables Críticas de Entorno (`.env`):**
  - Setear `DB_USER` y `DB_PASSWORD` entregados por DBAs locales.
  - Setear listado de `ALLOWED_ORIGINS` (Cors) para limitar ataques foráneos.

### 3. Despliegue del Frontend (Aplicación React)
- **Distribución:** Ejecutar en ambiente de compilación local el comando `npm run build` en el frontend, lo cual unificará, minificará y purificará Tailwind en la carpeta `dist/`.
- **Servidor Web:** Ubicar los estáticos generados en un servidor web estático local (IIS, Apache, Nginx) tras un nombre de dominio corporativo (ej: `http://spm.pfalimentos.cl`).

### 4. Directrices de Seguridad
El código actual incorpora defensa en profundidad. Se apoya a TI para:
- Adicionar protocolos HTTPS / SSL en NGINX/Apache al hacer el NAT hacia el puerto expuesto del Backend.
- Respaldar el parámetro `express-rate-limit` verificando que la granja de servidores de PF no actúe bajo proxy estricto bloqueando todas las IPs de la VPN.
