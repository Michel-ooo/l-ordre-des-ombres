import { MainLayout } from '@/components/MainLayout';
import { AdvancedCipherModule } from '@/components/AdvancedCipherModule';
import { motion } from 'framer-motion';
import { ArchivedMessage } from '@/components/ArchivesSection';

const STORAGE_KEY = 'ordre_archives';

const CipherPage = () => {
  const handleSaveToArchive = (message: Omit<ArchivedMessage, 'id'>) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const archives: ArchivedMessage[] = stored ? JSON.parse(stored) : [];
    
    const newMessage: ArchivedMessage = {
      ...message,
      id: Date.now().toString(),
    };
    
    archives.unshift(newMessage);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(archives));
  };

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-12">
          <h1 className="font-heading text-3xl tracking-wide mb-4">Module de Chiffrement</h1>
          <p className="text-muted-foreground">
            Encodez et décodez vos messages secrets avec le clavier sacré
          </p>
        </div>

        <AdvancedCipherModule onSaveToArchive={handleSaveToArchive} />
      </motion.div>
    </MainLayout>
  );
};

export default CipherPage;
