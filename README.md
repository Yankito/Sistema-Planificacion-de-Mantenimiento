<div align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge" alt="Express" />
  <img src="https://img.shields.io/badge/Oracle-F80000?style=for-the-badge&logo=oracle&logoColor=white" alt="Oracle" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
</div>

<h1 align="center">Sistema de Planificación de Mantenimiento (SPM)</h1>

<p align="center">
  Una plataforma web avanzada y segura diseñada para la gestión operativa, control presupuestario y planificación inteligente de recursos técnicos, integrada directamente con el ERP Oracle EAM.
</p>

---

## 📖 Descripción del Proyecto

El **SPM (Sistema de Planificación de Mantenimiento)** surge como una solución tecnológica para automatizar y agilizar los procesos de la Gerencia de Mantenimiento e Ingeniería, tradicionalmente manejados mediante planillas Excel. 

Este sistema actúa como una capa de inteligencia y gestión operativa sobre el ERP Oracle, permitiendo visualizar datos en tiempo real, asignar técnicos mediante reglas de negocio, rastrear gastos financieros, y analizar el ciclo de vida y la confiabilidad de los activos industriales.

## ✨ Características Principales

El sistema está compuesto por 4 módulos funcionales y altamente cohesivos:

*   📊 **Seguimiento y Control Operativo (100% - Validado)**
    *   Dashboard en tiempo real con semaforización de Órdenes de Trabajo (OT).
    *   Clasificación automática de Causas Raíz de Atraso mediante análisis de cumplimiento en Oracle (RML/RSE). *(Nota: Comparación de flujo semana a semana pendiente).*
*   📅 **Planificación Automática y Mallas de Turnos (60% - En Desarrollo)**
    *   Algoritmos de asignación inteligente de técnicos según disponibilidad y rol.
    *   Interfaz estilo Calendario/Gantt para validación visual.
    *   *Pendiente:* Gestión de turnos dinámicos, validación de periodos de descanso y rotaciones automáticas complejas, además de exportar archivo para traspasar información a Oracle, mientras no exista integración por API de escritura.
*   📉 **Análisis de Fallas / Confiabilidad (100% - Validado)**
    *   Reportes estadísticos de MTTR y frecuencia de fallas.
    *   Gráficos dinámicos de comparativa interanual.
*   💰 **Control de Gastos y Presupuestos (70% - En Desarrollo)**
    *   Consolidación y monitoreo del gasto real vs presupuesto configurado.
    *   Alertas de desviación financiera.
    *   *Pendiente (Fase 2):* Obtención automática de OTs del año siguiente desde ERP, determinación de frecuencia por descripción y motor de asignación manual de presupuesto base por planificador.

## 🏗️ Arquitectura y Tecnologías

El proyecto sigue un diseño de **Monorepo** con separación absoluta de responsabilidades:

### 🖥️ Frontend (SPA)
Basado en *Feature-Sliced Design* para máxima mantenibilidad.
*   **React 18** + **TypeScript**
*   **Vite** (Build tool ultrarrápido)
*   **Tailwind CSS** (Estilización responsiva y modo oscuro)
*   **Recharts** (Gráficos interactivos SVG)
*   **React Router v6** (Navegación fluida)
*   `xlsx-js-style` (Exportación nativa de Excel inteligente)

### ⚙️ Backend (API REST)
*   **Node.js** + **Express**
*   **TypeScript** (`tsx` para ejecución nativa)
*   `oracledb` (Conexión nativa y *Connection Pool* seguro a base de datos Oracle EAM)
*   **Multer** *(Solo Desarrollo)* (Procesamiento de planillas Excel creadas de Oracle para simulaciones transitorias previas a integración directa).

### 🔐 Seguridad (OWASP Top 10)
*   Autenticación centralizada leyendo permisos directos de Oracle.
*   **Helmet.js** (Protección de cabeceras HTTP contra Clickjacking y Sniffing).
*   **Rate Limiter** (Prevención de ataques DDoS limitando requests por IP) y protección anti-Brute Force en el Login.
*   Mitigación total de inyección SQL mediante validadores *Binding* (`:variables`).

## 🚀 Instalación y Despliegue Local

### Prerrequisitos
*   [Node.js](https://nodejs.org/) (v18 o superior)
*   NPM o Yarn
*   Acceso a una instancia de Oracle Database.

### Configuración del Entorno

1.  **Clona el repositorio:**
    ```bash
    git clone https://github.com/yankito/Sistema-Planificacion-de-Mantenimiento.git
    cd Sistema-Planificacion-de-Mantenimiento
    ```

2.  **Inicialización de Base de Datos (Oracle):**
    El sistema ya no crea tablas automáticamente al arrancar. Debes ejecutar los scripts SQL en el siguiente orden:
    1.  `database_init_eam_simulation.sql`: Crea las tablas maestro simuladas del ERP Oracle EAM.
    2.  `database_init_spm.sql`: Crea la estructura propia del sistema de planificación.
    3.  `database_seed_spm.sql`: (Opcional) Carga datos iniciales para pruebas.

3.  **Configura el Backend:**
    ```bash
    cd backend
    npm install
    ```
    Crea un archivo `.env` en `/backend` con tus credenciales:
    ```env
    PORT=3000
    DB_USER=MY_USER
    DB_PASSWORD=MY_PASSWORD
    DB_CONNECT_STRING=localhost:1521/XEPDB1
    JWT_SECRET=super_secret_key_change_me
    ALLOWED_ORIGINS=http://localhost:5173,http://[IP_ADDRESS],http://www.dominio.cl
    ```

3.  **Habilita el Frontend:**
    ```bash
    cd ../frontend
    npm install
    ```
    (Opcional) Crea un `.env` en `/frontend` si cambiaste la ruta de tu API local:
    ```env
    VITE_API_URL=http://[IP_ADDRESS]/api
    ```

### Iniciar en Desarrollo (Development)
Levanta ambas consolas en paralelo:

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

## 🧪 Testing Automático
El sistema utiliza **Vitest** para garantizar la fiabilidad a largo plazo de los algoritmos (Normas ISO-8601, Clasificadores financieros, etc.).

Para correr las pruebas unitarias:
```bash
# En frontend o backend:
npm run test
```

---

<p align="center">
  Desarrollado por Yanko Acuña Villaseca
</p>
