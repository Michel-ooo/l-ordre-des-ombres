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
      className="fixed inset-0 bg-background flex items-center justify-center z-50 overflow-hidden"
      onClick={handleContinue}
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-gradient-radial from-white/5 via-transparent to-transparent animate-pulse-slow" />
      </div>

      <AnimatePresence mode="wait">
        {stage === 0 && (
          <motion.div
            key="stage0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="text-center px-8"
          >
            <motion.img
              src={logo}
              alt="L'Ordre"
              className="w-48 h-48 mx-auto mb-8 lunar-glow-strong animate-float"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
            <motion.p
              className="text-muted-foreground text-lg tracking-widest font-heading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
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
            className="text-center px-8 max-w-2xl"
          >
            <motion.div
              className="text-6xl mb-8"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 100 }}
            >
              ⚠
            </motion.div>
            <motion.h2
              className="font-heading text-2xl md:text-3xl mb-6 tracking-wide text-glow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              AVERTISSEMENT
            </motion.h2>
            <motion.p
              className="text-muted-foreground leading-relaxed mb-8"
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
              className="text-muted-foreground/60 text-sm tracking-widest"
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
            className="text-center px-8 max-w-2xl"
          >
            <motion.div
              className="text-4xl mb-8 tracking-[1em] ml-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              ☽ ◈ ⬡
            </motion.div>
            <motion.blockquote
              className="font-heading text-xl md:text-2xl italic text-foreground/90 mb-8 leading-relaxed"
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
              className="flex flex-col items-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <p className="text-muted-foreground text-sm">— Devise de l'Ordre —</p>
              <motion.button
                className="mt-4 px-8 py-3 border border-foreground/30 rounded-sm font-heading tracking-widest text-sm hover:bg-foreground/5 hover:border-foreground/50 transition-all duration-300 lunar-glow"
                whileHover={{ scale: 1.02 }}
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

      {/* Decorative corners */}
      <div className="absolute top-8 left-8 w-16 h-16 border-l border-t border-foreground/10" />
      <div className="absolute top-8 right-8 w-16 h-16 border-r border-t border-foreground/10" />
      <div className="absolute bottom-8 left-8 w-16 h-16 border-l border-b border-foreground/10" />
      <div className="absolute bottom-8 right-8 w-16 h-16 border-r border-b border-foreground/10" />
    </div>
  );
}
