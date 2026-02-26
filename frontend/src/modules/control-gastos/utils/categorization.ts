
export type AssetCategory = 'Maquinaria' | 'Redes' | 'Infra' | 'Otros';

export const categorizeAsset = (claseContable: string | undefined): AssetCategory => {
    if (!claseContable) return 'Otros';

    const val = claseContable.trim().toLowerCase();

    // Redes: todos los que empiezan con Edif y Redes
    if (val.startsWith('edif') || val.startsWith('redes')) {
        return 'Redes';
    }

    // Maquinaria: Equipo PF, los que empiezan con Mant, y Supermerca
    if (val.startsWith('equipo pf') || val.startsWith('mant') || val.startsWith('supermerca')) {
        return 'Maquinaria';
    }

    // Infra: los que empiezan con Infra y Rack
    if (val.startsWith('infra') || val.startsWith('rack')) {
        return 'Infra';
    }

    return 'Otros';
};
