import './Button.css';

function Button({ type = "button", texto, variante, tamaño, onClick }) {
  return (
    <button
      type={type}
      className={`btn btn-${variante} btn-${tamaño}`}
      onClick={onClick}
    >
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

*/