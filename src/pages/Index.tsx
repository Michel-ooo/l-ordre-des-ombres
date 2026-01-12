import { useState, useEffect } from 'react';
import { WelcomeRitual } from '@/components/WelcomeRitual';
import { MainLayout } from '@/components/MainLayout';
import { motion } from 'framer-motion';
import { Lock, Scroll, Archive, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '@/assets/logo-ordre.png';
const features = [{
  icon: Lock,
  title: 'Chiffrement',
  description: 'Encodez vos messages avec le chiffre de César ou nos symboles ésotériques.',
  link: '/cipher'
}, {
  icon: Scroll,
  title: 'Doctrine',
  description: 'Consultez les règles, serments et la hiérarchie de l\'Ordre.',
  link: '/doctrine'
}, {
  icon: Archive,
  title: 'Archives',
  description: 'Accédez aux messages chiffrés sauvegardés.',
  link: '/archives'
}];
const Index = () => {
  const [hasEntered, setHasEntered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    // Check if user has already entered during this session
    const entered = sessionStorage.getItem('ordre_entered');
    if (entered === 'true') {
      setHasEntered(true);
    }
    setIsLoading(false);
  }, []);
  const handleEnter = () => {
    sessionStorage.setItem('ordre_entered', 'true');
    setHasEntered(true);
  };
  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border border-foreground/20 rounded-full animate-pulse" />
      </div>;
  }
  if (!hasEntered) {
    return <WelcomeRitual onEnter={handleEnter} />;
  }
  return <MainLayout>
      <div className="min-h-[calc(100vh-12rem)] flex flex-col items-center justify-center">
        {/* Hero Section */}
        <motion.div className="text-center mb-16" initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.8
      }}>
          <motion.img src={logo} alt="L'Ordre des Ombres" className="w-32 h-32 mx-auto mb-8 lunar-glow" initial={{
          scale: 0.9
        }} animate={{
          scale: 1
        }} transition={{
          duration: 1.2,
          ease: "easeOut"
        }} />
          <h1 className="font-heading text-4xl md:text-5xl tracking-wide mb-4 text-glow">
            L'ORDRE DES OMBRES
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">Bienvenue dans le sanctuaire.</p>
        </motion.div>

        {/* Features Grid */}
        <motion.div className="grid md:grid-cols-3 gap-6 w-full max-w-3xl" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} transition={{
        delay: 0.4,
        duration: 0.8
      }}>
          {features.map((feature, index) => <motion.div key={feature.title} initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.5 + index * 0.1
        }}>
              <Link to={feature.link} className="ritual-card p-6 block h-full group hover:lunar-glow transition-all duration-500">
                <feature.icon className="w-8 h-8 mb-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                <h3 className="font-heading text-lg mb-2 tracking-wide">{feature.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{feature.description}</p>
                <span className="inline-flex items-center text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                  Accéder
                  <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </motion.div>)}
        </motion.div>

        {/* Quote */}
        <motion.div className="mt-16 text-center" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} transition={{
        delay: 0.8
      }}>
          <div className="text-2xl tracking-[0.5em] text-muted-foreground/30 mb-4">
            ☽ ◈ ⬡ ◇ ☽
          </div>
          <p className="text-sm text-muted-foreground/50 italic">
            "Dans l'ombre nous demeurons"
          </p>
        </motion.div>
      </div>
    </MainLayout>;
};
export default Index;