/**
 * Calcula la edad en años completos a partir de una fecha de nacimiento.
 * @param {string | Date} fechaNacimiento
 * @returns {number}
 */
export const calcularEdad = (fechaNacimiento) => {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);

    let edad = hoy.getFullYear() - nacimiento.getFullYear();

    if (
        hoy.getMonth() < nacimiento.getMonth() ||
        (hoy.getMonth() === nacimiento.getMonth() &&
            hoy.getDate() < nacimiento.getDate())
    ) {
        edad--;
    }

    return edad;
};

/**
 * Formatea la edad en un texto legible: "X años" o "X meses" si es menor a 1 año.
 * Si no hay fecha de nacimiento, devuelve un texto por defecto.
 * @param {string | Date | null | undefined} fechaNacimiento
 * @returns {string}
 */
export const formatearEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return "Edad no disponible";

    const edad = calcularEdad(fechaNacimiento);

    if (edad >= 1) {
        return `${edad} ${edad === 1 ? "año" : "años"}`;
    }

    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let meses =
        (hoy.getFullYear() - nacimiento.getFullYear()) * 12 +
        (hoy.getMonth() - nacimiento.getMonth());

    if (hoy.getDate() < nacimiento.getDate()) {
        meses--;
    }

    meses = Math.max(meses, 0);
    return `${meses} ${meses === 1 ? "mes" : "meses"}`;
};