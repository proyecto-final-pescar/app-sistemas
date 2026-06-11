const NavbarPublic = () => {
  return (
    <header
      style={{
        width: "100%",
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #ede9fe",
      }}
    >
      <nav
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <a
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
          }}
        >
          <img
            src="/logo-mypet.svg"
            alt="Logo de MyPet"
            style={{
              width: "45px",
              height: "45px",
              objectFit: "contain",
              display: "block",
            }}
          />

          <img
            src="/mypet.svg"
            alt="MyPet"
            style={{
              height: "40px",
              width: "auto",
              objectFit: "contain",
              display: "block",
            }}
          />
        </a>

        <a
          href="/login"
          style={{
            padding: "8px 22px",
            border: "2px solid #7c3aed",
            borderRadius: "999px",
            color: "#7c3aed",
            fontSize: "14px",
            fontWeight: "600",
            fontFamily: "Arial, Helvetica, sans-serif",
            textDecoration: "none",
            backgroundColor: "#ffffff",
          }}
        >
          Iniciar Sesión
        </a>
      </nav>
    </header>
  );
};

export default NavbarPublic;