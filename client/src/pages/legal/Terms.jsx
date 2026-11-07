import LegalLayout from './LegalLayout';

export default function Terms() {
  return (
    <LegalLayout title="Términos y condiciones" updated="30 de septiembre de 2026">
      <h2>1. Qué es MyPet</h2>
      <p>
        MyPet es una plataforma digital que conecta a tutores de mascotas con clínicas
        veterinarias. Permite llevar el historial de tus mascotas en un solo lugar, encontrar
        clínicas y gestionar turnos.
      </p>

      <h2>2. Aceptación</h2>
      <p>
        Al registrarte o usar MyPet aceptás estos términos y nuestra{' '}
        <a href="/privacidad">Política de privacidad</a>. Si no estás de acuerdo, no uses la
        plataforma.
      </p>

      <h2>3. Tu cuenta</h2>
      <ul>
        <li>Tenés que darnos datos verdaderos al registrarte.</li>
        <li>Sos responsable de mantener tu contraseña en secreto y de lo que ocurra en tu cuenta.</li>
        <li>Si detectás un uso no autorizado, avisanos cuanto antes.</li>
      </ul>

      <h2>4. Qué ofrece MyPet</h2>
      <p>
        Un historial digital de tus mascotas (vacunas, consultas, estudios), un buscador de
        clínicas veterinarias y la gestión de turnos con ellas. La información de las clínicas
        (horarios, disponibilidad, contacto) puede cambiar: te recomendamos confirmarla antes de
        trasladarte.
      </p>

      <h2>5. MyPet no es un servicio veterinario</h2>
      <p>
        MyPet no brinda diagnósticos ni tratamientos, y su contenido no reemplaza la consulta con
        un profesional matriculado. Ante una emergencia, contactá directamente a una clínica.
      </p>

      <h2>6. Uso aceptable</h2>
      <ul>
        <li>No cargues información falsa, ilícita o que vulnere derechos de terceros.</li>
        <li>No intentes acceder a cuentas ajenas ni interferir con el funcionamiento de la plataforma.</li>
        <li>Si sos veterinaria, la información de tu establecimiento tiene que ser real y estar actualizada.</li>
      </ul>

      <h2>7. Contenido que subís</h2>
      <p>
        Seguís siendo titular de las fotos y documentos que cargues. Nos autorizás a almacenarlos
        y mostrarlos únicamente para prestarte el servicio.
      </p>

      <h2>8. Pagos</h2>
      <p>
        Los pagos de servicios se procesan a través de MercadoPago. No almacenamos los datos de tu
        tarjeta. Los precios y condiciones se informan antes de confirmar cada compra.
      </p>

      <h2>9. Responsabilidad</h2>
      <p>
        Hacemos lo posible por mantener el servicio disponible y la información actualizada, pero
        no garantizamos que funcione sin interrupciones ni errores. No respondemos por decisiones
        tomadas en base a la información de la plataforma ni por el servicio de las clínicas
        listadas, en la medida que la ley lo permita.
      </p>

      <h2>10. Suspensión de cuentas</h2>
      <p>
        Podemos suspender cuentas que incumplan estos términos o hagan un uso indebido de la
        plataforma.
      </p>

      <h2>11. Cambios</h2>
      <p>
        Podemos actualizar estos términos. La versión vigente siempre estará publicada en esta
        página con su fecha de actualización.
      </p>

      <h2>12. Ley aplicable</h2>
      <p>
        Rigen las leyes de la República Argentina, incluida la Ley 24.240 de Defensa del
        Consumidor.
      </p>
    </LegalLayout>
  );
}