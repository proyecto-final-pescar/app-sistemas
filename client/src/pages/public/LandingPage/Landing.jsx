import NavbarPublic from "../../../components/layout/NavbarPublic";
import Footer from "../../../components/layout/Footer";
import Hero from "../../../components/Landing/Hero";
import Features from "../../../components/Landing/Features";
import CtaSection from "../../../components/Landing/CtaSection";
import styles from "./Landing.module.css";

const Landing = () => {
  return (
     <div className={styles.landingWrapper}>
      <NavbarPublic />
      <Hero />
      <Features />
      <CtaSection />
      <Footer />
    </div>
  );
};

export default Landing;