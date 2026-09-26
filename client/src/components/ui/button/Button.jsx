import './Button.css';

function Button({ type = "button", texto, variante, tamaño, onClick, disabled = false, icon: Icon }) {
  return (
    <button
      type={type}
      className={`btn btn-${variante} btn-${tamaño}`}
      onClick={onClick}
      disabled={disabled}
    >
      {Icon && <Icon size={18} />}
      {texto}
    </button>
  );
}

export default Button;

/* La funcion se va a llamar de la siguiente forma 

<Button
  texto="Guardar"
  variante="primario"
  tamaño="mediano"
/>

Con ícono opcional (por ejemplo un Plus de lucide-react):

<Button
  texto="Agregar Mascota"
  variante="primario"
  tamaño="mediano"
  icon={Plus}
/>

*/