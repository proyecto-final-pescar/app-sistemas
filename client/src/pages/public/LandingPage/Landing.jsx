import NavbarPublic from "../../../components/layout/NavbarPublic";
import Footer from "../../../components/layout/Footer";
import Hero from "../../../components/landing/Hero";
import Features from "../../../components/landing/Features";
import CtaSection from "../../../components/landing/CtaSection";

const Landing = () => {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#ffffff" }}>
      <NavbarPublic />
      <Hero />
      <Features />
      <CtaSection />
      <Footer />
    </div>
  );
};

export default Landing;