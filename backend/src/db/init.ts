import { query } from './config.js';

export const initDB = async () => {
  try {

    // 3. PF_IM_PLANIFICACION (Nueva tabla para guardar asignaciones separadas)
    await query(`
      BEGIN
        EXECUTE IMMEDIATE 'CREATE TABLE PF_IM_PLANIFICACION (
          id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          mes NUMBER NOT NULL,
          anio NUMBER NOT NULL,
          ot VARCHAR2(100) NOT NULL,
          detalles_tecnicos JSON NOT NULL,
          fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT UNQ_PLAN_OT_PF UNIQUE(anio, mes, ot)
        )';
      EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF;
      END;
    `);

    // 3.5 PF_IM_PLANIFICACION_TECNICOS (Nueva tabla detalle)
    await query(`
      BEGIN
        EXECUTE IMMEDIATE 'CREATE TABLE PF_IM_PLANIFICACION_TECNICOS (
          id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          ot VARCHAR2(100) NOT NULL,
          anio NUMBER NOT NULL,
          mes NUMBER NOT NULL,
          nombre_tecnico VARCHAR2(200),
          rol VARCHAR2(50),
          planta VARCHAR2(50),
          origen VARCHAR2(20) DEFAULT ''PLANIFICACION'',
          fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT UNQ_PLAN_OT_TEC UNIQUE(anio, mes, ot, nombre_tecnico)
        )';
      EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF;
      END;
    `);

    // 4. PF_IM_ACTIVOS (Antes activos)
    await query(`
      BEGIN
        EXECUTE IMMEDIATE 'CREATE TABLE PF_IM_ACTIVOS (
          id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          codigo VARCHAR2(100) UNIQUE, 
          descripcion VARCHAR2(500), 
          planta VARCHAR2(100), 
          ubicacion VARCHAR2(200)
        )';
      EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF;
      END;
    `);

    // 5. PF_IM_TECNICOS (Antes empleados)
    await query(`
      BEGIN
        EXECUTE IMMEDIATE 'CREATE TABLE PF_IM_TECNICOS (
          id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          nombre VARCHAR2(200) UNIQUE NOT NULL,
          planta VARCHAR2(100),
          rol VARCHAR2(50),
          activo NUMBER(1) DEFAULT 1
        )';
      EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF;
      END;
    `);

    // 6. PF_IM_HORARIOS (Antes horarios)
    await query(`
      BEGIN
        EXECUTE IMMEDIATE 'CREATE TABLE PF_IM_HORARIOS (
          id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          mes NUMBER NOT NULL,
          anio NUMBER NOT NULL,
          empleado_nombre VARCHAR2(200) NOT NULL,
          turnos JSON NOT NULL, 
          CONSTRAINT UNQ_SEM_EMP_PF UNIQUE(anio, mes, empleado_nombre)
        )';
      EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF;
      END;
    `);

    // 7. PF_IM_FALLAS (Antes fallas)
    await query(`
      BEGIN
        EXECUTE IMMEDIATE 'CREATE TABLE PF_IM_FALLAS (
          id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          fecha TIMESTAMP,
          semana VARCHAR2(50),
          anio NUMBER,
          mes NUMBER,
          planta VARCHAR2(100),
          area VARCHAR2(200),
          linea VARCHAR2(200),
          equipo VARCHAR2(200),
          causa VARCHAR2(500),
          estado_pedido VARCHAR2(100),
          tipo_pedido VARCHAR2(100),
          tecnico VARCHAR2(200),
          ot VARCHAR2(100),
          duracion_minutos NUMBER,
          gasto NUMBER,
          perdida_kg NUMBER,
          descripcion_operador VARCHAR2(4000),
          CONSTRAINT UNQ_FALLA_OT_FECHA UNIQUE(ot, fecha)
        )';
      EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF;
      END;
    `);

    // 8. PF_IM_USUARIOS (Nueva tabla solicitada)
    await query(`
      BEGIN
        EXECUTE IMMEDIATE 'CREATE TABLE PF_IM_USUARIOS (
          id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          username VARCHAR2(100) UNIQUE NOT NULL,
          password_hash VARCHAR2(500) NOT NULL,
          rol VARCHAR2(50) DEFAULT ''USER'',
          planta VARCHAR2(50)
        )';
      EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF;
      END;
    `);

    // 9. PF_EAM_PEDIDOS (Simulación Oracle EAM - Work Orders)
    await query(`
      BEGIN
        EXECUTE IMMEDIATE 'CREATE TABLE PF_EAM_PEDIDOS (
          pedido_trabajo VARCHAR2(100) PRIMARY KEY,
          numero_activo VARCHAR2(100),
          grupo_activos VARCHAR2(200),
          descripcion VARCHAR2(500),
          fecha_inicial_programada DATE,
          duracion_horas NUMBER,
          departamento_propiedad VARCHAR2(200),
          estado VARCHAR2(100),
          fecha_carga TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )';
      EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF;
      END;
    `);

    // 10. PF_EAM_CUMPLIMIENTO (Simulación Oracle EAM - Operation Resources)
    await query(`
      BEGIN
        EXECUTE IMMEDIATE 'CREATE TABLE PF_EAM_CUMPLIMIENTO (
          id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          planta VARCHAR2(100),
          empleado VARCHAR2(200),
          nro_ot VARCHAR2(100),
          tipo VARCHAR2(100),
          estado_om VARCHAR2(100),
          fecha_programada_inicio DATE,
          nro_operacion VARCHAR2(50),
          nro_seq_recurso VARCHAR2(50),
          op_finalizada VARCHAR2(10),
          fecha_carga TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )';
      EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF;
      END;
    `);

    // 11. PF_EAM_MASIVO (Simulación Oracle EAM - Detalles Masivos)
    await query(`
      BEGIN
        EXECUTE IMMEDIATE 'CREATE TABLE PF_EAM_MASIVO (
          numero VARCHAR2(100) PRIMARY KEY,
          activo VARCHAR2(100),
          descripcion VARCHAR2(500),
          tpt VARCHAR2(50),
          fecha_progr DATE,
          anx VARCHAR2(100),
          art_inv VARCHAR2(100),
          art_dir VARCHAR2(100),
          n_sol VARCHAR2(100),
          serv_ex VARCHAR2(100),
          horas NUMBER,
          rmd VARCHAR2(10),
          rse VARCHAR2(10),
          fecha_carga TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )';
      EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF;
      END;
    `);

    // 12. PF_EAM_ACTIVOS (Simulación Oracle EAM - Activos)
    await query(`
      BEGIN
        EXECUTE IMMEDIATE 'CREATE TABLE PF_EAM_ACTIVOS (
          grupo_de_activo VARCHAR2(100),
          desc_grupo_de_activo VARCHAR2(500),
          nro_de_serie VARCHAR2(100),
          mantenible VARCHAR2(10),
          cc VARCHAR2(50),
          nro_de_activo VARCHAR2(100) PRIMARY KEY,
          desc_nro_de_activo VARCHAR2(500),
          nro_de_activo_padre VARCHAR2(100),
          organizacion VARCHAR2(100),
          clase_contable VARCHAR2(100),
          planta VARCHAR2(100),
          fecha_carga TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )';
      EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF;
      END;
    `);

    await query(`
      BEGIN
        EXECUTE IMMEDIATE 'CREATE TABLE PF_GASTOS_PRESUPUESTO (
          ID VARCHAR2(36) DEFAULT SYS_GUID() PRIMARY KEY,
          ACTIVO_COD VARCHAR2(100),
          TIPO_FILA VARCHAR2(50),
          MES NUMBER,
          ANIO NUMBER,
          MONTO_BODEGA NUMBER DEFAULT 0,
          MONTO_SERV_EXT NUMBER DEFAULT 0,
          MONTO_CORRECTIVO NUMBER DEFAULT 0,
          CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )';
      EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF;
      END;
    `);

    // 14. PF_EAM_GASTOS_CONSOLIDADOS (Gastos reales importados de Excel)
    await query(`
      BEGIN
        EXECUTE IMMEDIATE 'CREATE TABLE PF_EAM_GASTOS_CONSOLIDADOS (
          ID NUMBER GENERATED BY DEFAULT ON NULL AS IDENTITY,
          TIPO VARCHAR2(50),
          NUMERO_OT VARCHAR2(50),
          TIPO_OT VARCHAR2(50),
          NRO_ACTIVO VARCHAR2(50),
          FECHA_TRANSACCION DATE,
          DESCRIP_ARTICULO VARCHAR2(500),
          COSTO_TRX NUMBER,
          CREATED_AT DATE DEFAULT SYSDATE
        )';
      EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF;
      END;
    `);

    // ÍNDICES
    const crearIndice = async (nombre: string, tabla: string, col: string) => {
      try { await query(`CREATE INDEX ${nombre} ON ${tabla}(${col})`); } catch (e) { }
    };

    // await crearIndice('idx_ped_snap_pf', 'pedidos_de_trabajo', 'snapshot_id'); // ELIMINADO
    await crearIndice('idx_plan_mes_pf', 'PF_IM_PLANIFICACION', 'mes');
    await crearIndice('idx_hor_mes_pf', 'PF_IM_HORARIOS', 'mes');
    await crearIndice('idx_tec_pla_pf', 'PF_IM_TECNICOS', 'planta');

    await crearIndice('idx_plan_tec_ot', 'PF_IM_PLANIFICACION_TECNICOS', 'ot');
    await crearIndice('idx_plan_tec_mes', 'PF_IM_PLANIFICACION_TECNICOS', 'mes');

    console.log("Base de datos Oracle (Refactorizada con Prefijos PF_IM) inicializada correctamente.");
  } catch (error) {
    console.error("Error inicializando DB Oracle:", error);
  }
};