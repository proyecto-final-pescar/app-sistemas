import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import TopBar from "./components/layout/TopBar";
import PrivateRoute from "./components/PrivateRoute";
import CitasAgendadas from './pages/veterinaria/CitasAgendadas/CitasAgendadas';

import Login from "./pages/public/Login/Login";
import Registro from "./pages/public/registro/Registro";
import Landing from "./pages/public/LandingPage/Landing";
import MisMascotas from "./pages/tutor/MisMascotas/MisMascotas";
import Turnos from "./pages/tutor/Turnos/Turnos";
import Foro from "./pages/tutor/Foro/Foro";
import AdminDashboard from "./pages/admin/AdminDashboard/AdminDashboard";
import NotFound from "./pages/NotFound/NotFound";
import Emergencias from "./pages/tutor/Emergencias/Emergencias";
import RegistroDeVeterinaria from './pages/veterinaria/RegistroDeVeterinaria/RegistroDeVeterinaria';
import AgendarTurnos from "./pages/tutor/Turnos/AgendarTurno";

function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/registro-veterinaria" element={<PrivateRoute><RegistroDeVeterinaria /></PrivateRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/register" element={<Registro />} />
        <Route path="/home" element={<Landing />} />
        <Route path="/mascotas" element={<MisMascotas />} />
        <Route path="/turnos" element={<Turnos />} />
        <Route
          path="/turnos/agendar/:veterinariaId"
          element={<AgendarTurnos />}
        />
        <Route path="/foro" element={<Foro />} />
        <Route path="/veterinarias" element={<h1>Sección Veterinarias</h1>} />
        <Route path="/agenda" element={<CitasAgendadas />} />
        <Route path="/urgencias" element={<Emergencias />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/dashboard" element={<AdminDashboard />} />
        <Route
          path="/"
          element={
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
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
