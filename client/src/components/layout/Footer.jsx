const Footer = () => {
  return (
    <footer
      style={{
        width: "100%",
        backgroundColor: "#ffffff",
        borderTop: "1px solid #ede9fe",
        padding: "20px 40px",
        fontFamily: "'Inter', Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "24px",
          flexWrap: "wrap",
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
              width: "30px",
              height: "30px",
              objectFit: "contain",
              display: "block",
            }}
          />

          <img
            src="/mypet2.svg"
            alt="MyPet"
            style={{
              height: "14px",
              width: "auto",
              objectFit: "contain",
              display: "block",
            }}
          />
        </a>

        <p
          style={{
            margin: 0,
            color: "#7c6aa6",
            fontSize: "14px",
            lineHeight: "20px",
            fontWeight: "400",
            letterSpacing: "-0.15px",
          }}
        >
          Datos protegidos bajo ley 25.326
        </p>

        <p
          style={{
            margin: 0,
            color: "#7c6aa6",
            fontSize: "14px",
            lineHeight: "20px",
            fontWeight: "400",
            letterSpacing: "-0.15px",
          }}
        >
          © 2026 MyPet · Buenos Aires, Argentina
        </p>
      </div>
    </footer>
  );
};

export default Footer;
