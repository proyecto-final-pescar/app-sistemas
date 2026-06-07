import { useState } from "react";
import Sidebar from "./components/layout/Sidebar";
import TopBar from "./components/layout/TopBar";


// LE DEJO DEMO TEMPORAL de los componentes, POR SI QUIEREN VISUALIZARLO:
// creados para la tarea S2-06: Sidebar, TopBar, NavbarPublic y Footer.
// Más adelante se reemplaza por las rutas reales de la aplicación.

function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#f8f7ff",
      }}
    >
      <Sidebar
        role="tutor"
        activeItem={activePage}
        onSelect={setActivePage}
        userName="Ana García"
        userRole="Tutora · CABA"
        userInitial="A"
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <TopBar title={activePage} userInitial="A" notifications={2} />

        <main
          style={{
            padding: "24px",
            flex: 1,
            fontFamily: "Arial, Helvetica, sans-serif",
          }}
        >
          <h1
            style={{
              margin: 0,
              color: "#24113f",
              fontSize: "28px",
              fontWeight: "800",
            }}
          >
            {activePage}
          </h1>

          <p
            style={{
              color: "#7c6aa6",
              fontSize: "16px",
              marginTop: "12px",
            }}
          >
            Contenido de prueba — página: {activePage}
          </p>
        </main>
      </div>
    </div>
  );
}

export default App;