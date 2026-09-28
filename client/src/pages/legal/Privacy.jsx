import LegalLayout from './LegalLayout';

export default function Privacy() {
  return (
    <LegalLayout title="Política de privacidad" updated="28 de septiembre de 2026">
      <h2>1. Responsable del tratamiento</h2>
      <p>
        [RAZÓN SOCIAL], CUIT [CUIT], domicilio [DOMICILIO]. Contacto:{' '}
        <a href="mailto:[EMAIL]">[EMAIL]</a>. Tratamos tus datos conforme a la Ley 25.326 de
        Protección de Datos Personales.
      </p>

      <h2>2. Qué datos recopilamos</h2>
      <ul>
        <li><strong>Cuenta:</strong> nombre, email, contraseña (almacenada cifrada) y teléfono.</li>
        <li><strong>Mascotas:</strong> nombre, especie, raza, edad, vacunas, consultas, estudios y fotos.</li>
        <li><strong>Ubicación:</strong> solo si nos das permiso, para mostrarte clínicas cercanas.</li>
        <li><strong>Uso:</strong> datos técnicos como dispositivo, navegador y páginas visitadas.</li>
      </ul>

      <h2>3. Para qué los usamos</h2>
      <ul>
        <li>Crear y gestionar tu cuenta y el historial de tus mascotas.</li>
        <li>Mostrarte clínicas de urgencias cerca tuyo.</li>
        <li>Procesar pagos y enviarte avisos importantes del servicio.</li>
        <li>Mejorar la plataforma y mantenerla segura.</li>
      </ul>
      <p>No vendemos tus datos a terceros.</p>

      <h2>4. Con quién los compartimos</h2>
      <p>Solo con proveedores necesarios para brindar el servicio:</p>
      <ul>
        <li>Cloudinary, para almacenar imágenes.</li>
        <li>MercadoPago, para procesar pagos.</li>
        <li>Google (Places), para la búsqueda de clínicas.</li>
        <li>Proveedores de hosting e infraestructura.</li>
      </ul>
      <p>
        Algunos de ellos pueden estar fuera de Argentina. También podemos compartir datos si una
        autoridad competente lo exige por ley.
      </p>

      <h2>5. Cuánto tiempo los conservamos</h2>
      <p>
        Mientras tu cuenta esté activa. Si la eliminás, borramos tus datos, salvo los que
        debamos conservar por obligación legal.
      </p>

      <h2>6. Tus derechos</h2>
      <p>
        Podés acceder, rectificar, actualizar y suprimir tus datos escribiendo a{' '}
        <a href="mailto:[EMAIL]">[EMAIL]</a>. El acceso es gratuito a intervalos no menores a seis
        meses, salvo interés legítimo acreditado (art. 14, Ley 25.326).
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

      <h2>8. Cookies</h2>
      <p>
        Usamos cookies y almacenamiento local para mantener tu sesión y recordar preferencias.
        Podés bloquearlas desde tu navegador, aunque algunas funciones podrían dejar de andar.
      </p>

      <h2>9. Cambios</h2>
      <p>
        Si actualizamos esta política, te avisaremos por email o dentro de la app cuando el
        cambio sea relevante.
      </p>
    </LegalLayout>
  );
}