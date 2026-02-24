
export type AssetCategory = 'Maquinaria' | 'Redes' | 'Infra' | 'Otros';

export const categorizeAsset = (claseContable: string | undefined): AssetCategory => {
    if (!claseContable) return 'Otros';

    const val = claseContable.trim();

    // Redes: todos los que empiezan con Edif y Redes
    if (val.startsWith('Edif') || val.startsWith('Redes')) {
        return 'Redes';
    }

    // Maquinaria: Equipo PF, los que empiezan con Mant, y Supermerca
    if (val.startsWith('Equipo PF') || val.startsWith('Mant') || val.startsWith('Supermerca')) {
        return 'Maquinaria';
    }

    // Infra: los que empiezan con Infra y Rack
    if (val.startsWith('Infra') || val.startsWith('Rack')) {
        return 'Infra';
    }

    return 'Otros';
};
