import './Badge.css';

function Badge({ texto, variante = 'buscado' }) {
  return (
    <span className={`badge badge-${variante}`}>
      {texto}
    </span>
  );
}

export default Badge;

/* La funcion se va a llamar de la siguiente forma

<Badge texto="SE BUSCA" variante="buscado" />
<Badge texto="¡ENCONTRADO!" variante="encontrado" />
<Badge texto="Caso Cerrado" variante="resuelto" />
<Badge texto="Zona: Palermo" variante="zona" />

*/