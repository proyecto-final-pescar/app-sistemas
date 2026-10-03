const modulos = import.meta.glob(
  "../../assets/mascotas/*.{jpg,jpeg,png,webp,avif}",
  { eager: true, import: "default" }
);

const locales = Object.keys(modulos)
  .sort()
  .map((ruta) => ({ src: modulos[ruta], alt: "Mascota" }));

const respaldo = [
  {
    src: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=800&q=80",
    alt: "Perro mordiendo un jueguete",
  },
];

export const mascotas = locales.length > 0 ? locales : respaldo;

export const getMascota = (i) => mascotas[i % mascotas.length];