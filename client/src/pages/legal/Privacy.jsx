import LegalLayout from './LegalLayout';

export default function Privacy() {
  return (
    <LegalLayout title="Política de privacidad" updated="30 de septiembre de 2026">
      <h2>1. Introducción</h2>
      <p>
        En MyPet cuidamos tu información. Esta política explica de forma general qué datos
        recopilamos, para qué los usamos y cómo los protegemos. Tratamos los datos personales de
        acuerdo con la Ley 25.326 de Protección de Datos Personales de la República Argentina.
      </p>

      <h2>2. Qué datos recopilamos</h2>
      <ul>
        <li>
          <strong>Cuenta:</strong> nombre, apellido, email y contraseña. La contraseña se guarda
          de forma segura.
        </li>
        <li>
          <strong>Mascotas:</strong> nombre, especie, raza, edad, vacunas, consultas, estudios y
          fotos.
        </li>
        <li>
          <strong>Veterinarias:</strong> datos del establecimiento necesarios para mostrarlo en la
          plataforma.
        </li>
        <li>
          <strong>Ubicación:</strong> solo si nos das permiso, para mostrarte clínicas cercanas.
        </li>
      </ul>

      <h2>3. Para qué los usamos</h2>
      <ul>
        <li>Crear y gestionar tu cuenta y el historial de tus mascotas.</li>
        <li>Mostrarte clínicas veterinarias cerca tuyo y gestionar turnos.</li>
        <li>Procesar pagos y enviarte avisos importantes del servicio.</li>
        <li>Mejorar la plataforma y mantenerla segura.</li>
      </ul>
      <p>No vendemos tus datos a terceros.</p>

      <h2>4. Con quién los compartimos</h2>
      <p>Solo con proveedores necesarios para brindar el servicio:</p>
      <ul>
        <li>Cloudinary, para almacenar imágenes.</li>
        <li>MercadoPago, para procesar pagos.</li>
        <li>Google, para el inicio de sesión con Google y la búsqueda de clínicas.</li>
        <li>Proveedores de hosting, base de datos e infraestructura.</li>
      </ul>
      <p>
        Algunos de ellos pueden estar fuera de Argentina. También podemos compartir datos si una
        autoridad competente lo exige por ley.
      </p>

      <h2>5. Cuánto tiempo los conservamos</h2>
      <p>
        Conservamos tus datos mientras tu cuenta esté activa o sea necesario para prestarte el
        servicio y cumplir obligaciones legales.
      </p>

      <h2>6. Tus derechos</h2>
      <p>
        Podés acceder, rectificar, actualizar y solicitar la supresión de tus datos personales a
        través de los canales de contacto de MyPet. El acceso es gratuito a intervalos no menores
        a seis meses, salvo interés legítimo acreditado (art. 14, Ley 25.326).
      </p>
      <p>
        La Agencia de Acceso a la Información Pública (AAIP), órgano de control de la Ley 25.326,
        atiende denuncias y reclamos por incumplimientos en materia de protección de datos.
      </p>

      <h2>7. Seguridad</h2>
      <p>
        Usamos conexión cifrada (HTTPS), contraseñas hasheadas y acceso restringido a los datos.
        Ningún sistema es infalible, pero trabajamos para reducir los riesgos.
      </p>

      <h2>8. Cambios</h2>
      <p>
        Si actualizamos esta política, publicaremos la nueva versión en esta misma página con su
        fecha de actualización.
      </p>
    </LegalLayout>
  );
}