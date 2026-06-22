import { useState, useEffect } from "react"; 
import { useNavigate } from "react-router-dom"; 
import Sidebar from "../../components/layout/Sidebar";
import TopBar from "../../components/layout/TopBar";
import logoMyPet from "../../assets/logo-mypet.png";
import "./usuario.css"; 

function Usuario() {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [formNombre, setFormNombre] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formTelefono, setFormTelefono] = useState("");
  const [formZona, setFormZona] = useState("");
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const usuarioId = localStorage.getItem("userId"); 
    const token = localStorage.getItem("token"); 

    if (!usuarioId || !token) {
      setError("No has iniciado sesión o tu sesión expiró.");
      setLoading(false);
      return;
    }

    fetch(`http://localhost:3000/api/usuarios/${usuarioId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` 
      }
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || `Error del servidor: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setUsuario(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });

  }, []);

  useEffect(() => {
  if (usuario?.data) {
    setFormNombre(usuario.data.nombre || "");
    setFormEmail(usuario.data.email || "");
    // Si tu backend maneja teléfono o zona en el futuro, los inicializas acá:
    setFormTelefono(usuario.data.telefono || "");
    setFormZona(usuario.data.zona || "");
  }
}, [usuario]);

  const datosPerfil = usuario?.data;
  const nombreUser = datosPerfil?.nombre || "Usuario";
  const emailUser = datosPerfil?.email || "correo@ejemplo.com";
  const listaMascotas = datosPerfil?.mascotas || [];

  const obtenerEtiquetaRol = (rolOriginal) => {
    if (!rolOriginal) return "Tutor";
    
    switch (rolOriginal.toLowerCase()) {
      case "dueno":
      case "tutor":
        return "Tutor"; 
      case "veterinaria":
      case "vet":
        return "Veterinaria";
      default:
        // Por si se agrega algún otro rol administrativo en el futuro (ej: "admin")
        return rolOriginal.charAt(0).toUpperCase() + rolOriginal.slice(1);
    }
  };

  const rolUser = obtenerEtiquetaRol(datosPerfil?.rol);

  const rolSidebar = datosPerfil?.rol === "Veterinaria" ? "Veterinaria" : "tutor";

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8f7ff" }}>
        <Sidebar role={rolSidebar} activeItem="Configuración" onSelect={() => {}} userInitial="A" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <TopBar title="Mi Perfil y Configuración" userInitial="A" notifications={2} />
          <main style={{ padding: "24px", flex: 1, fontFamily: "Arial, Helvetica, sans-serif" }}>
            <p>Cargando datos del perfil...</p>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8f7ff" }}>
        <Sidebar role={rolSidebar} activeItem="Configuración" onSelect={() => {}} userInitial="A" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <TopBar title="Mi Perfil" userInitial="A" notifications={2} />
          <main style={{ padding: "24px", flex: 1, fontFamily: "Arial, Helvetica, sans-serif" }}>
            <p style={{ color: "red" }}>Error: {error}</p>
          </main>
        </div>
      </div>
    );
  }

    const manejarGuardarCambios = (e) => {
    e.preventDefault(); // Evita recargas inesperadas de página

    if (!formNombre.trim()) {
        alert("❌ El nombre completo no puede quedar vacío.");
        return;
    }

    if (!formEmail.trim()) {
        alert("❌ El correo electrónico es obligatorio.");
        return;
    }

    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexEmail.test(formEmail.trim())) {
        alert("❌ Por favor, ingresa un correo electrónico válido (ejemplo@correo.com).");
        return;
    }

    if (formTelefono.trim()) {
        const regexTelefono = /^[0-9+\s()-]{7,20}$/;
        if (!regexTelefono.test(formTelefono.trim())) {
        alert("❌ El formato del teléfono no es válido. Ingresa solo números o códigos de área.");
        return;
        }
    }
        alert("¡Validación exitosa! Guardando cambios en el servidor...");
    };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8f7ff" }}>
      <Sidebar role={rolSidebar} activeItem="Configuración" onSelect={() => {}} userInitial={nombreUser.charAt(0).toUpperCase()} />
      
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar title="Mi Perfil y Configuración" userInitial={nombreUser.charAt(0).toUpperCase()} notifications={2} />
        
        <main style={{ padding: "24px", flex: 1, overflowY: "auto" }}>
          <div className="main-contenido">
            
            {/* 1. BANNER MORADO SUPERIOR */}
            <section className="perfil-banner-moderno">
              <div className="banner-logo"><img src={logoMyPet} alt="Logo MyPet" /></div>
              <div className="banner-info-textos">
                <h2 className="nombre-titulo">{nombreUser}</h2>
                <p>{emailUser} • Palermo, CABA</p>
                <div className="banner-tags-flex">
                  {/* Solo muestra la lista de mascotas si el usuario es un dueño/tutor */}
                  {(datosPerfil?.rol === "dueno" || datosPerfil?.rol === "tutor") && listaMascotas.map((mascota) => (
                    <span key={mascota._id} className="badge-tag-mascota" onClick={() => navigate(`/mascotas/${mascota._id}`)} style={{ cursor: "pointer" }}>
                      🐾 {mascota.nombre}
                    </span>
                  ))}
                  <span className="badge-tag-rol">{rolUser} desde 2026</span>
                </div>
              </div>
            </section>

            <div className="perfil-tabs-row">
              <button className="perfil-tab-link activa">Datos Personales</button>
              <button className="perfil-tab-link">Notificaciones</button>
              <button className="perfil-tab-link">Seguridad</button>
            </div>

            {/* 3. CONTENEDOR BLANCO DEL FORMULARIO PRINCIPAL */}
            <section className="formulario-perfil-card">
              
              {/* Avatar con opción de carga multimedia */}
            <div className="avatar-cambiar-wrapper">
            
            {/* Si el usuario cargó una foto, muestra la imagen; si no, muestra la inicial */}
            {fotoPerfil ? (
                <img 
                src={fotoPerfil} 
                alt="Previsualización de perfil" 
                className="avatar-letra-bloque"
                style={{ objectFit: "cover" }} 
                />
            ) : (
                <div className="avatar-letra-bloque">
                {nombreUser.charAt(0).toUpperCase()}
                </div>
            )}

            <div className="avatar-textos-col">
                <h3 className="nombre-titulo">{nombreUser}</h3>
                <p>{rolUser} • Miembro desde 2026</p>
                
                {/* La etiqueta label actúa como el disparador del input mediante el atributo htmlFor */}
                <label htmlFor="input-foto-perfil" className="link-cambiar-foto" style={{ display: "inline-block", cursor: "pointer" }}>
                Cambiar foto de perfil
                </label>
                
                {/* Input de tipo archivo oculto que solo acepta imágenes */}
                <input 
                type="file" 
                id="input-foto-perfil" 
                accept="image/*" 
                style={{ display: "none" }} 
                onChange={(e) => {
                    const archivo = e.target.files[0];
                    if (archivo) {
                    // Crea una URL temporal para mostrar la previsualización local de inmediato
                    setFotoPerfil(URL.createObjectURL(archivo));
                    
                    // NOTA: Si en el futuro vas a subirla a tu backend en Express/MongoDB,
                    // aquí deberías guardar el archivo 'archivo' en un estado o enviarlo con un FormData.
                    }
                }}
                />
            </div>
            </div>

            <div className="inputs-perfil-grid">
            <div className="campo-bloque">
                <label>Nombre completo</label>
                <input 
                type="text" 
                value={formNombre} 
                onChange={(e) => setFormNombre(e.target.value)}
                placeholder="Ej. Ana García" 
                />
            </div>

            <div className="campo-bloque">
                <label>Correo electrónico</label>
                <input 
                type="email" 
                value={formEmail} 
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="ejemplo@correo.com" 
                />
            </div>

            <div className="campo-bloque">
                <label>Teléfono</label>
                <input 
                type="text" 
                value={formTelefono}
                onChange={(e) => setFormTelefono(e.target.value)}
                placeholder="+54 11 4567-8901" 
                />
            </div>

            <div className="campo-bloque">
                <label>Zona (CABA / GBA)</label>
                <input 
                type="text" 
                value={formZona}
                onChange={(e) => setFormZona(e.target.value)}
                placeholder="Palermo, CABA" 
                />
            </div>
            </div>

            {/* Botón Guardar Cambios conectado a la función de verificación */}
            <button className="btn-guardar-cambios" onClick={manejarGuardarCambios}>
            💾 Guardar Cambios
            </button>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}

export default Usuario;