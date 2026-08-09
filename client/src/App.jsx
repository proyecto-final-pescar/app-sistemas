import { BrowserRouter, Routes, Route } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";
import CitasAgendadas from "./pages/veterinaria/CitasAgendadas/CitasAgendadas";
import RegistrarConsulta from "./pages/veterinaria/HistorialClinico/RegistrarConsulta";
import RegistroDeVeterinaria from "./pages/veterinaria/RegistroDeVeterinaria/RegistroDeVeterinaria";
import HomeVeterinaria from "./pages/veterinaria/HomeVeterinaria/HomeVeterinaria";
import MisTurnos from "./pages/tutor/MisTurnos/MisTurnos";
import MisMascotas from "./pages/tutor/MisMascotas/MisMascotas";
import Turnos from "./pages/tutor/Turnos/Turnos";
import AgendarTurnos from "./pages/tutor/Turnos/AgendarTurno";
import PerfilVeterinaria from "./pages/tutor/Turnos/PerfilVeterinaria";
import Foro from "./pages/tutor/Foro/Foro";
import Emergencias from "./pages/tutor/Emergencias/Emergencias";
import HomeTutor from "./pages/tutor/HomeTutor/HomeTutor";
import GestionVeterinarias from './pages/admin/GestionVeterinarias/GestionVeterinarias';
import HistorialIndividual from "./pages/tutor/HistorialMedico/HistorialIndividual";
import ForgotPassword from "./pages/public/ForgotPassword/ForgotPassword";
import ResetPassword from "./pages/public/ResetPassword/ResetPassword";
import Landing from "./pages/public/LandingPage/Landing";
import FichaPaciente from "./pages/veterinaria/HistorialClinico/FichaPaciente";
import ModeracionForo from "./pages/admin/ModeracionForo/ModeracionForo";
import GestionUsuarios from "./pages/admin/GestionUsuarios/GestionUsuarios";
import PerfilUsuario from "./pages/perfilUsuario/PerfilUsuario";
import Login from "./pages/public/Login/Login";
import Registro from "./pages/public/Registro/Registro";
import AdminDashboard from "./pages/admin/AdminDashboard/AdminDashboard";
import NotFound from "./pages/NotFound/NotFound";
import BuscarVeterinaria from "./pages/tutor/BuscarVeterinaria/BuscarVeterinaria";
import GestionTurnos from "./pages/admin/GestionTurnos/GestionTurnos";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/registro-veterinaria" element={<PrivateRoute allowedRoles={["veterinaria"]}><RegistroDeVeterinaria /></PrivateRoute>}/>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/register" element={<Registro />} />
        <Route path="/tutor/historial-medico/:mascotaId" element={<PrivateRoute allowedRoles={["dueno"]}><HistorialIndividual /></PrivateRoute>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/home" element={<PrivateRoute allowedRoles={["dueno"]}><HomeTutor /></PrivateRoute>} />
        <Route path="/home-veterinaria" element={<PrivateRoute allowedRoles={["veterinaria"]}><HomeVeterinaria /></PrivateRoute>} />
        <Route path="/mascotas" element={<PrivateRoute allowedRoles={["dueno"]}><MisMascotas /></PrivateRoute>} />
        <Route path="/turnos" element={<PrivateRoute allowedRoles={["dueno"]}><Turnos /></PrivateRoute>} />
        <Route path="/mis-turnos" element={<PrivateRoute allowedRoles={["dueno"]}><MisTurnos /></PrivateRoute>} />
        <Route path="/turnos/agendar/:veterinariaId" element={<PrivateRoute allowedRoles={["dueno"]}><AgendarTurnos /></PrivateRoute>} />
        <Route path="/admin-foro-mascotas-perdidas" element={<PrivateRoute allowedRoles={["administrador"]}><ModeracionForo /></PrivateRoute>}/>
        <Route path="/tutor/veterinarias/:id" element={<PerfilVeterinaria />} />
        <Route path="/veterinarias" element={<PrivateRoute allowedRoles={["dueno"]}><BuscarVeterinaria /></PrivateRoute>} />
        <Route path="/foro" element={<PrivateRoute allowedRoles={["dueno"]}><Foro /></PrivateRoute>} />
        <Route path="/agenda" element={<PrivateRoute allowedRoles={["veterinaria"]}><CitasAgendadas /></PrivateRoute>} />
        <Route path="/historial/registrar/:turnoId" element={<PrivateRoute allowedRoles={["veterinaria"]}><RegistrarConsulta /></PrivateRoute>}/>
        <Route path="/urgencias" element={<PrivateRoute allowedRoles={["dueno"]}><Emergencias /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute allowedRoles={["administrador"]}><AdminDashboard /></PrivateRoute>} />
        <Route path="/dashboard" element={<PrivateRoute allowedRoles={["administrador"]}><AdminDashboard /></PrivateRoute>} />
        <Route path="/tutor/dashboard" element={<AdminDashboard />} />
        <Route path="/admin-duenos" element={<PrivateRoute allowedRoles={["administrador"]}><GestionUsuarios /></PrivateRoute> }/>
        <Route path="/perfil" element={<PerfilUsuario />} />
        <Route path="/admin/veterinarias" element={<PrivateRoute allowedRoles={["administrador"]}><GestionVeterinarias /></PrivateRoute>} />
        <Route path="/admin-turnos" element={<PrivateRoute allowedRoles={["administrador"]}><GestionTurnos /></PrivateRoute>} />
        <Route path="/" element={<Landing />} />
       

        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;