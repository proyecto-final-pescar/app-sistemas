export function validateEmail(email) {
  if (!email || !email.trim()) {
    return "Por favor ingresá tu email.";
  }

  // Regex básico para formato de email
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!regex.test(email)) {
    return "El formato del correo no es válido.";
  }

  return true; // todo OK
}