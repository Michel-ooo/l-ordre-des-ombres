import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '@/assets/logo-ordre.png';

interface WelcomeRitualProps {
  onEnter: () => void;
}

export function WelcomeRitual({ onEnter }: WelcomeRitualProps) {
  const [stage, setStage] = useState(0);

  const handleContinue = () => {
    if (stage < 2) {
      setStage(stage + 1);
    } else {
      onEnter();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-background flex items-center justify-center z-50 overflow-hidden cursor-pointer"
      onClick={handleContinue}
    >
      {/* Background radial glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div 
          className="w-[800px] h-[800px] rounded-full animate-pulse-slow"
          style={{ background: 'radial-gradient(circle, hsl(42 70% 50% / 0.04) 0%, transparent 70%)' }}
        />
      </div>

      {/* Subtle vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 40%, hsl(30 10% 2%) 100%)',
      }} />

      <AnimatePresence mode="wait">
        {stage === 0 && (
          <motion.div
            key="stage0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="text-center px-8 relative z-10"
          >
            <motion.img
              src={logo}
              alt="L'Ordre"
              className="w-52 h-52 mx-auto mb-10 lunar-glow-strong animate-float"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 2, ease: "easeOut" }}
            />
            <motion.p
              className="text-gold-dim text-base tracking-[0.4em] font-heading-text"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              CLIQUEZ POUR CONTINUER
            </motion.p>
          </motion.div>
        )}

        {stage === 1 && (
          <motion.div
            key="stage1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center px-8 max-w-2xl relative z-10"
          >
            <motion.div
              className="text-6xl mb-8 text-gold-dim"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 80, damping: 12 }}
            >
              ⚜
            </motion.div>
            <motion.h2
              className="font-heading text-2xl md:text-3xl mb-6 tracking-[0.15em] text-glow text-gold"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              AVERTISSEMENT
            </motion.h2>
            <motion.div className="gothic-divider max-w-xs mx-auto mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <span className="text-gold-dim/50 text-xs">◆</span>
            </motion.div>
            <motion.p
              className="text-muted-foreground leading-relaxed mb-8 font-body text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Vous êtes sur le point d'accéder aux systèmes internes de l'Ordre.
              <br /><br />
              Toute tentative d'accès non autorisée sera tracée et signalée aux Archontes.
              Les secrets révélés ici sont protégés par des serments anciens.
            </motion.p>
            <motion.p
              className="text-gold-dim/50 text-sm tracking-[0.3em] font-heading-text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              CLIQUEZ POUR ACCEPTER
            </motion.p>
          </motion.div>
        )}

        {stage === 2 && (
          <motion.div
            key="stage2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center px-8 max-w-2xl relative z-10"
          >
            <motion.div
              className="text-3xl mb-10 tracking-[1em] ml-4 text-gold-dim/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              ☽ ⚜ ☽
            </motion.div>
            <motion.blockquote
              className="font-heading-text text-xl md:text-2xl italic text-gold/80 mb-10 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              "Dans l'ombre nous demeurons,
              <br />
              Par le silence nous régnons,
              <br />
              Sous la lune nous jurons."
            </motion.blockquote>
            <motion.div
              className="flex flex-col items-center gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <p className="text-muted-foreground text-sm font-body italic">— Devise de l'Ordre —</p>
              <motion.button
                className="mt-4 px-10 py-4 font-heading-text tracking-[0.2em] text-sm text-gold transition-all duration-500 lunar-glow"
                style={{
                  border: '1px solid hsl(42 70% 50% / 0.4)',
                  background: 'linear-gradient(180deg, hsl(42 70% 50% / 0.08) 0%, transparent 100%)',
                }}
                whileHover={{ 
                  scale: 1.03,
                  boxShadow: '0 0 40px hsl(42 70% 50% / 0.2)',
                }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onEnter();
                }}
              >
                ENTRER DANS L'ORDRE
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative gothic corners */}
      <div className="absolute top-8 left-8 w-20 h-20 pointer-events-none" style={{
        borderLeft: '1px solid hsl(42 70% 50% / 0.15)',
        borderTop: '1px solid hsl(42 70% 50% / 0.15)',
      }} />
      <div className="absolute top-8 right-8 w-20 h-20 pointer-events-none" style={{
        borderRight: '1px solid hsl(42 70% 50% / 0.15)',
        borderTop: '1px solid hsl(42 70% 50% / 0.15)',
      }} />
      <div className="absolute bottom-8 left-8 w-20 h-20 pointer-events-none" style={{
        borderLeft: '1px solid hsl(42 70% 50% / 0.15)',
        borderBottom: '1px solid hsl(42 70% 50% / 0.15)',
      }} />
      <div className="absolute bottom-8 right-8 w-20 h-20 pointer-events-none" style={{
        borderRight: '1px solid hsl(42 70% 50% / 0.15)',
        borderBottom: '1px solid hsl(42 70% 50% / 0.15)',
      }} />
    </div>
  );
}
