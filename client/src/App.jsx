import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";
import RutaVeterinariaActiva from "./components/rutaVeterinariaActiva/RutaVeterinariaActiva";
import { NotificacionesProvider } from "./context/NotificacionesContext";
import Landing from "./pages/public/LandingPage/Landing";
import NotFound from "./pages/NotFound/NotFound";

// Code-splitting por ruta: cada página viaja en su propio chunk y se
// descarga solo al visitarla. Landing y NotFound quedan en el bundle
// inicial para la primera pintura y el fallback de 404.
const CitasAgendadas = lazy(() => import("./pages/veterinaria/CitasAgendadas/CitasAgendadas"));
const RegistrarConsulta = lazy(() => import("./pages/veterinaria/HistorialClinico/RegistrarConsulta"));
const RegistroDeVeterinaria = lazy(() => import("./pages/veterinaria/RegistroDeVeterinaria/RegistroDeVeterinaria"));
const SolicitudEnRevision = lazy(() => import("./pages/veterinaria/SolicitudEnRevision/SolicitudEnRevision"));
const HomeVeterinaria = lazy(() => import("./pages/veterinaria/HomeVeterinaria/HomeVeterinaria"));
const MisTurnos = lazy(() => import("./pages/tutor/MisTurnos/MisTurnos"));
const MisMascotas = lazy(() => import("./pages/tutor/MisMascotas/MisMascotas"));
const Turnos = lazy(() => import("./pages/tutor/Turnos/Turnos"));
const AgendarTurnos = lazy(() => import("./pages/tutor/Turnos/AgendarTurno"));
const PerfilVeterinaria = lazy(() => import("./pages/tutor/Turnos/PerfilVeterinaria"));
const Foro = lazy(() => import("./pages/tutor/Foro/Foro"));
const Emergencias = lazy(() => import("./pages/tutor/Emergencias/Emergencias"));
const HomeTutor = lazy(() => import("./pages/tutor/HomeTutor/HomeTutor"));
const GestionVeterinarias = lazy(() => import("./pages/admin/GestionVeterinarias/GestionVeterinarias"));
const HistorialIndividual = lazy(() => import("./pages/tutor/HistorialMedico/HistorialIndividual"));
const ForgotPassword = lazy(() => import("./pages/public/ForgotPassword/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/public/ResetPassword/ResetPassword"));
const VerificarCuenta = lazy(() => import("./pages/public/VerificarCuenta/VerificarCuenta"));
const FichaPaciente = lazy(() => import("./pages/veterinaria/HistorialClinico/FichaPaciente"));
const Pacientes = lazy(() => import("./pages/veterinaria/Pacientes/Pacientes"));
const MiVeterinaria = lazy(() => import("./pages/veterinaria/MiVeterinaria/MiVeterinaria"));
const ModeracionForo = lazy(() => import("./pages/admin/ModeracionForo/ModeracionForo"));
const GestionUsuarios = lazy(() => import("./pages/admin/GestionUsuarios/GestionUsuarios"));
const PerfilUsuario = lazy(() => import("./pages/perfilUsuario/PerfilUsuario"));
const Login = lazy(() => import("./pages/public/Login/Login"));
const Registro = lazy(() => import("./pages/public/Registro/Registro"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard/AdminDashboard"));
const BuscarVeterinaria = lazy(() => import("./pages/tutor/BuscarVeterinaria/BuscarVeterinaria"));
const HistorialMedico = lazy(() => import("./pages/tutor/HistorialMedico/HistorialMedico"));
const CargaTurnos = lazy(() => import("./pages/veterinaria/CargaTurnos/CargaTurnos"));
const GestionTurnos = lazy(() => import("./pages/admin/GestionTurnos/GestionTurnos"));
const PagoExitoso = lazy(() => import("./pages/tutor/Pagos/PagoExitoso"));
const PagoPendiente = lazy(() => import("./pages/tutor/Pagos/PagoPendiente"));
const PagoFallido = lazy(() => import("./pages/tutor/Pagos/PagoFallido"));
const CompletarRegistroGoogle = lazy(() => import("./pages/public/CompletarRegistroGoogle/CompletarRegistroGoogle"));
const Terms = lazy(() => import("./pages/legal/Terms"));
const Privacy = lazy(() => import("./pages/legal/Privacy"));

const CargandoPagina = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "60vh",
      fontSize: "1rem",
      color: "#6b7280",
    }}
  >
    Cargando...
  </div>
);

function App() {
  return (
    <NotificacionesProvider>
      <BrowserRouter>
        <Suspense fallback={<CargandoPagina />}>
          <Routes>
            <Route
              path="/registro-veterinaria"
              element={
                <PrivateRoute allowedRoles={["veterinaria"]}>
                  <RegistroDeVeterinaria />
                </PrivateRoute>
              }
            />

            <Route
              path="/veterinaria-pendiente"
              element={
                <PrivateRoute allowedRoles={["veterinaria"]}>
                  <SolicitudEnRevision />
                </PrivateRoute>
              }
            />

            {/* ══ Rutas de veterinaria: rol + estado (solo ACT puede entrar) ══
                El guard cuelga de una ruta padre, así se monta una sola vez
                y no se revalida al navegar entre estas pantallas. */}
            <Route
              element={
                <PrivateRoute allowedRoles={["veterinaria"]}>
                  <RutaVeterinariaActiva />
                </PrivateRoute>
              }
            >
              <Route path="/home-veterinaria" element={<HomeVeterinaria />} />
              <Route path="/mi-veterinaria" element={<MiVeterinaria />} />
              <Route path="/agenda" element={<CitasAgendadas />} />
              <Route path="/historial/registrar/:turnoId" element={<RegistrarConsulta />} />
              <Route path="/pacientes" element={<Pacientes />} />
              <Route path="/pacientes/:mascotaId" element={<FichaPaciente />} />
              <Route path="/cargar-turnos" element={<CargaTurnos />} />
            </Route>

            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/register" element={<Registro />} />
            <Route path="/completar-registro-google" element={<CompletarRegistroGoogle />} />
            <Route path="/tutor/historial-medico/:mascotaId" element={<PrivateRoute allowedRoles={["dueno"]}><HistorialIndividual /></PrivateRoute>} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verificar-cuenta" element={<VerificarCuenta />} />
            <Route path="/home" element={<PrivateRoute allowedRoles={["dueno"]}><HomeTutor /></PrivateRoute>} />

            <Route path="/mascotas" element={<PrivateRoute allowedRoles={["dueno"]}><MisMascotas /></PrivateRoute>} />
            <Route path="/turnos" element={<PrivateRoute allowedRoles={["dueno"]}><Turnos /></PrivateRoute>} />
            <Route path="/mis-turnos" element={<PrivateRoute allowedRoles={["dueno"]}><MisTurnos /></PrivateRoute>} />
            <Route path="/turnos/agendar/:veterinariaId" element={<PrivateRoute allowedRoles={["dueno"]}><AgendarTurnos /></PrivateRoute>} />
            <Route path="/admin-foro-mascotas-perdidas" element={<PrivateRoute allowedRoles={["administrador"]}><ModeracionForo /></PrivateRoute>} />
            <Route path="/tutor/veterinarias/:id" element={<PerfilVeterinaria />} />
            <Route path="/veterinarias" element={<PrivateRoute allowedRoles={["dueno"]}><BuscarVeterinaria /></PrivateRoute>} />
            <Route path="/foro" element={<PrivateRoute allowedRoles={["dueno"]}><Foro /></PrivateRoute>} />
            <Route path="/terminos" element={<Terms />} />
            <Route path="/privacidad" element={<Privacy />} />

            <Route path="/urgencias" element={<PrivateRoute allowedRoles={["dueno"]}><Emergencias /></PrivateRoute>} />
            <Route path="/admin" element={<PrivateRoute allowedRoles={["administrador"]}><AdminDashboard /></PrivateRoute>} />
            <Route path="/dashboard" element={<PrivateRoute allowedRoles={["administrador"]}><AdminDashboard /></PrivateRoute>} />
            <Route path="/tutor/dashboard" element={<AdminDashboard />} />
            <Route path="/admin-duenos" element={<PrivateRoute allowedRoles={["administrador"]}><GestionUsuarios /></PrivateRoute>} />
            <Route path="/perfil" element={<PerfilUsuario />} />
            <Route path="/admin/veterinarias" element={<PrivateRoute allowedRoles={["administrador"]}><GestionVeterinarias /></PrivateRoute>} />
            <Route path="/historial-medico" element={<PrivateRoute allowedRoles={["dueno"]}><HistorialMedico /></PrivateRoute>} />
            <Route path="/admin-turnos" element={<PrivateRoute allowedRoles={["administrador"]}><GestionTurnos /></PrivateRoute>} />
            <Route path="/" element={<Landing />} />
            <Route path="/pago-exitoso" element={<PrivateRoute allowedRoles={["dueno"]}><PagoExitoso /></PrivateRoute>} />
            <Route path="/pago-pendiente" element={<PrivateRoute allowedRoles={["dueno"]}><PagoPendiente /></PrivateRoute>} />
            <Route path="/pago-fallido" element={<PrivateRoute allowedRoles={["dueno"]}><PagoFallido /></PrivateRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </NotificacionesProvider>
  );
}

export default App;