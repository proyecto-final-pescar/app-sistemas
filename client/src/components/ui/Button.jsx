import './Button.css';

function Button({ texto, variante, tamaño, onClick }) {
  return (
    <button
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