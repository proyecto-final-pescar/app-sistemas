import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/button/Button';
import styles from './LegalLayout.module.css';

export default function LegalLayout({ title, updated, children }) {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.brand}>My<span>Pet</span></Link>
        <Link to="/" className={styles.back}>‹ Volver</Link>
      </header>
      <main className={styles.main}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.updated}>Última actualización: {updated}</p>
        <article className={styles.card}>
          {children}
          <div className={styles.ctaWrap}>
            <Button
              texto="Registrarme gratis"
              variante="primario"
              tamaño="grande"
              onClick={() => navigate('/registro')}
            />
          </div>
        </article>
      </main>
      <footer className={styles.footer}>
        <Link to="/terminos">Términos y condiciones</Link>
        <Link to="/privacidad">Política de privacidad</Link>
      </footer>
    </div>
  );
}