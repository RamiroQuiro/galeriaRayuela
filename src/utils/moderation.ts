// Lista reducida de palabras prohibidas (solo contenido explícito)
const BLACKLIST = [
    "porno", "sexo explícito"
];

/**
 * Filtra un texto buscando palabras de la lista negra.
 * @returns true si el contenido es seguro, false si contiene palabras prohibidas.
 */
export function esContenidoSeguro(texto: string): boolean {
    const textoLower = texto.toLowerCase();
    return !BLACKLIST.some(palabra => {
        const regex = new RegExp(`\\b${palabra}\\b`, 'i');
        return regex.test(textoLower);
    });
}
