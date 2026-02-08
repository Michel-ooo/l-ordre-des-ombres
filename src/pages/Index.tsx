import { MainLayout } from '@/components/MainLayout';
import { motion } from 'framer-motion';
import { Lock, Scroll, Archive, ChevronRight, Eye, Shield, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import logo from '@/assets/logo-ordre.png';

const features = [
  {
    icon: Lock,
    title: 'Chiffrement',
    description: 'Encodez vos messages avec notre système de chiffrement avancé et le clavier sacré.',
    link: '/cipher',
    ornament: '⚿',
  },
  {
    icon: Scroll,
    title: 'Doctrine',
    description: 'Consultez les règles, serments et la hiérarchie de l\'Ordre.',
    link: '/doctrine',
    ornament: '⚜',
  },
  {
    icon: Archive,
    title: 'Archives',
    description: 'Accédez aux messages chiffrés sauvegardés.',
    link: '/archives',
    ornament: '⛧',
  }
];

const Index = () => {
  const { profile, isGuardianSupreme } = useAuth();

  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-12rem)] flex flex-col items-center justify-center">
        {/* Hero Section */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          {/* Ornamental top */}
          <motion.div
            className="text-gold-dim text-sm tracking-[1em] mb-8"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 1.5, delay: 0.2 }}
          >
            ─── ◆ ───
          </motion.div>

          <motion.img
            src={logo}
            alt="L'Ordre des Ombres"
            className="w-36 h-36 mx-auto mb-10 lunar-glow-strong"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
          
          <h1 className="font-heading text-3xl md:text-5xl tracking-[0.15em] mb-6 text-glow text-gold">
            L'ORDRE DES OMBRES
          </h1>
          
          <div className="gothic-divider max-w-xs mx-auto">
            <span className="text-gold-dim text-xs">◆</span>
          </div>

          <p className="text-muted-foreground text-lg mt-6 font-body">
            Bienvenue, <span className="text-gold font-heading-text tracking-wide">{profile?.pseudonym || 'Initié'}</span>
          </p>
          <p className="text-xs text-gold-dim/60 capitalize mt-2 font-heading-text tracking-widest">
            {isGuardianSupreme ? '☽ Gardien Suprême ☽' : `Grade : ${profile?.grade || 'Novice'}`}
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          className="grid md:grid-cols-3 gap-8 w-full max-w-4xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.15, duration: 0.6 }}
            >
              <Link
                to={feature.link}
                className="ritual-card p-8 block h-full group hover:lunar-glow transition-all duration-500"
              >
                <div className="text-center">
                  <span className="text-2xl text-gold-dim/40 block mb-4">{feature.ornament}</span>
                  <feature.icon className="w-7 h-7 mx-auto mb-5 text-gold-dim group-hover:text-gold transition-colors duration-500" />
                  <h3 className="font-heading text-base mb-3 tracking-[0.1em] text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground mb-5 leading-relaxed font-body">{feature.description}</p>
                  <span className="inline-flex items-center text-xs text-gold-dim group-hover:text-gold transition-colors duration-300 font-heading-text tracking-wider">
                    Accéder
                    <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Quote */}
        <motion.div
          className="mt-20 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <div className="gothic-divider max-w-sm mx-auto mb-6">
            <span className="text-gold-dim/50 text-xs tracking-[0.5em]">☽ ◈ ☽</span>
          </div>
          <p className="text-sm text-muted-foreground/60 italic font-body text-lg">
            "Dans l'ombre nous demeurons, dans le secret nous prospérons"
          </p>
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default Index;
