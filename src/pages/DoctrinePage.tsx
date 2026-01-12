import { MainLayout } from '@/components/MainLayout';
import { DoctrineSection } from '@/components/DoctrineSection';
import { motion } from 'framer-motion';

const DoctrinePage = () => {
  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <DoctrineSection />
      </motion.div>
    </MainLayout>
  );
};

export default DoctrinePage;
