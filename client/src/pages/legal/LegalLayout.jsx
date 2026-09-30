import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './LegalLayout.module.css';

export default function LegalLayout({ title, updated, children }) {
  const navigate = useNavigate();

  // Al entrar a una página legal siempre arranca desde arriba.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Vuelve a la pantalla de la que venías; si se abrió directo, va al inicio.
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.brand} aria-label="MyPet, ir al inicio">
          <img src="/logo-mypet.svg" alt="" className={styles.brandIcon} />
          <img src="/mypet2.svg" alt="MyPet" className={styles.brandLogo} />
        </Link>
        <button type="button" onClick={handleBack} className={styles.back}>
          ‹ Volver
        </button>
      </header>

      <main className={styles.main}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.updated}>Última actualización: {updated}</p>
        <article className={styles.card}>{children}</article>
      </main>

      <footer className={styles.footer}>
        <Link to="/terminos">Términos y condiciones</Link>
        <Link to="/privacidad">Política de privacidad</Link>
      </footer>
    </div>
  );
}