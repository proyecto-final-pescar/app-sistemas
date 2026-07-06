import { useState } from "react";

function RegistrarConsulta() {
  const [form, setForm] = useState({
    nombreDueno: "",
    email: "",
    nombreMascota: "",
    especie: "",
    raza: "",
    edad: "",
    sexo: "",
    peso: "",
  });

  const [errores, setErrores] = useState({});

  function handleChange(e) {
    const { name, value } = e.target;

    setForm({ ...form, [name]: value });

    if (errores[name]) {
      setErrores({ ...errores, [name]: "" });
    }
  }

  function validarFormulario() {
    const nuevosErrores = {};

    if (!form.nombreDueno.trim()) {
      nuevosErrores.nombreDueno = "El nombre del dueño es requerido";
    }

    if (!form.email.trim()) {
      nuevosErrores.email = "El email es requerido";
    }

    if (!form.nombreMascota.trim()) {
      nuevosErrores.nombreMascota = "El nombre de la mascota es requerido";
    }

    if (!form.especie) {
      nuevosErrores.especie = "Debe seleccionar una especie";
    }

    if (!form.raza.trim()) {
      nuevosErrores.raza = "La raza es requerida";
    }

    if (!form.edad.trim()) {
      nuevosErrores.edad = "La edad es requerida";
    }

    if (!form.sexo) {
      nuevosErrores.sexo = "Debe seleccionar el sexo";
    }

    if (!form.peso.trim()) {
      nuevosErrores.peso = "El peso es requerido";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!validarFormulario()) return;

    console.log("Datos de la consulta:", form);
    alert("Datos cargados correctamente");
  }

  const pageStyle = {
    minHeight: "100vh",
    background: "#fbf9ff",
    padding: "32px 24px",
    fontFamily: "Arial, Helvetica, sans-serif",
    color: "#24113f",
  };

  const containerStyle = {
    maxWidth: "980px",
    margin: "0 auto",
  };

  const bannerStyle = {
    background: "linear-gradient(135deg, #8b3df5, #5f22d9)",
    borderRadius: "26px",
    padding: "44px 46px",
    color: "white",
    marginBottom: "32px",
    boxShadow: "0 12px 28px rgba(95, 34, 217, 0.22)",
  };

  const cardStyle = {
    background: "white",
    border: "1px solid #eee7ff",
    borderRadius: "26px",
    padding: "34px",
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "22px",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "8px",
    fontSize: "16px",
    fontWeight: "800",
    color: "#24113f",
  };

  const inputStyle = (error) => ({
    width: "100%",
    height: "58px",
    border: error ? "2px solid #e74c3c" : "none",
    borderRadius: "22px",
    background: error ? "#fff5f5" : "#f1ecff",
    padding: "0 20px",
    fontSize: "16px",
    color: "#24113f",
    outline: "none",
    boxSizing: "border-box",
  });

  const errorStyle = {
    color: "#e74c3c",
    fontSize: "13px",
    fontWeight: "700",
    margin: "6px 0 0",
  };

  const titleStyle = {
    margin: "0 0 22px",
    fontSize: "24px",
    fontWeight: "900",
  };

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={bannerStyle}>
          <h1 style={{ margin: 0, fontSize: "38px", fontWeight: "900" }}>
            Registrá una consulta
          </h1>
          <p style={{ margin: "12px 0 0", fontSize: "22px", opacity: 0.9 }}>
            Cargá los datos del dueño y la mascota de tu última consulta.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={cardStyle}>
          <h2 style={titleStyle}>Datos del dueño</h2>

          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>Nombre</label>
              <input
                style={inputStyle(errores.nombreDueno)}
                name="nombreDueno"
                placeholder="Ingresá el nombre"
                value={form.nombreDueno}
                onChange={handleChange}
              />
              {errores.nombreDueno && <p style={errorStyle}>{errores.nombreDueno}</p>}
            </div>

            <div>
              <label style={labelStyle}>Email</label>
              <input
                style={inputStyle(errores.email)}
                name="email"
                type="email"
                placeholder="Ingresá el email"
                value={form.email}
                onChange={handleChange}
              />
              {errores.email && <p style={errorStyle}>{errores.email}</p>}
            </div>
          </div>

          <h2 style={{ ...titleStyle, marginTop: "28px" }}>Datos de la mascota</h2>

          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>Nombre</label>
              <input
                style={inputStyle(errores.nombreMascota)}
                name="nombreMascota"
                placeholder="Ingresá el nombre"
                value={form.nombreMascota}
                onChange={handleChange}
              />
              {errores.nombreMascota && <p style={errorStyle}>{errores.nombreMascota}</p>}
            </div>

            <div>
              <label style={labelStyle}>Especie</label>
              <select
                style={inputStyle(errores.especie)}
                name="especie"
                value={form.especie}
                onChange={handleChange}
              >
                <option value="">Seleccioná una especie</option>
                <option value="Perro">Perro</option>
                <option value="Gato">Gato</option>
                <option value="Ave">Ave</option>
                <option value="Otro">Otro</option>
              </select>
              {errores.especie && <p style={errorStyle}>{errores.especie}</p>}
            </div>

            <div>
              <label style={labelStyle}>Raza</label>
              <input
                style={inputStyle(errores.raza)}
                name="raza"
                placeholder="Ingresá la raza"
                value={form.raza}
                onChange={handleChange}
              />
              {errores.raza && <p style={errorStyle}>{errores.raza}</p>}
            </div>

            <div>
              <label style={labelStyle}>Fecha de nacimiento / Edad aproximada</label>
              <input
                style={inputStyle(errores.edad)}
                name="edad"
                placeholder="Ej: 2 años"
                value={form.edad}
                onChange={handleChange}
              />
              {errores.edad && <p style={errorStyle}>{errores.edad}</p>}
            </div>

            <div>
              <label style={labelStyle}>Sexo</label>
              <select
                style={inputStyle(errores.sexo)}
                name="sexo"
                value={form.sexo}
                onChange={handleChange}
              >
                <option value="">Seleccioná el sexo</option>
                <option value="Hembra">Hembra</option>
                <option value="Macho">Macho</option>
              </select>
              {errores.sexo && <p style={errorStyle}>{errores.sexo}</p>}
            </div>

            <div>
              <label style={labelStyle}>Peso</label>
              <input
                style={inputStyle(errores.peso)}
                name="peso"
                placeholder="Ej: 3kg"
                value={form.peso}
                onChange={handleChange}
              />
              {errores.peso && <p style={errorStyle}>{errores.peso}</p>}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", marginTop: "38px" }}>
            <button
              type="submit"
              style={{
                width: "520px",
                height: "68px",
                border: "none",
                borderRadius: "18px",
                background: "#0f9d73",
                color: "white",
                fontSize: "22px",
                fontWeight: "900",
                cursor: "pointer",
                boxShadow: "0 12px 22px rgba(15,157,115,0.28)",
              }}
            >
              Continuar →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegistrarConsulta;