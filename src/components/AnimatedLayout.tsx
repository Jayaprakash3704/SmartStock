import React from 'react';
import { motion, Variants } from 'framer-motion';

const pageVariants: Variants = {
  initial: { opacity: 0, y: 12, filter: 'blur(2px)' },
  enter:   { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: -8, filter: 'blur(1px)', transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
};

export function AnimatedLayout({ id, children }: { id: string; children: React.ReactNode }) {
  // Note: Using key on motion.div triggers re-animate on page switch without AnimatePresence
  return (
    <motion.div key={id} variants={pageVariants} initial="initial" animate="enter">
      {children}
    </motion.div>
  );
}

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.25 } },
};
