import NavbarPublic from "../../../components/layout/NavbarPublic";
import Footer from "../../../components/layout/Footer";
import Hero from "../../../components/Landing/Hero";
import Features from "../../../components/Landing/Features";
import Roles from "../../../components/Landing/Roles";
import CtaSection from "../../../components/Landing/Ctasection";
import styles from "./Landing.module.css";
import AppPreview from "../../../components/Landing/AppPreview";
import UrgenciasMap from "../../../components/Landing/UrgenciasMap";

const Landing = () => {
  return (
    <div className={styles.landingWrapper}>
      <NavbarPublic />
      <Hero />
      <Features />
      <AppPreview />   
      <UrgenciasMap /> 
      <Roles />
      <CtaSection />
      <Footer />
    </div>
  );
};

export default Landing;