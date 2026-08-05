import Sidebar from "../../../components/layout/Sidebar";
import TopBar from "../../../components/layout/TopBar";
import styles from "./AdminDashboard.module.css";

function AdminDashboard() {
  return (
    <div className={styles.layout}>
      <Sidebar title="Panel de Administración" />

      <div className={styles.pageWrapper}>
        <TopBar title="Panel de Administración" />

        <main className={styles.content}>
          <p>En construcción...</p>
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;