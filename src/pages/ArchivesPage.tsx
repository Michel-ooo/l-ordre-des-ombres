import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { ArchivesSection, ArchivedMessage } from '@/components/ArchivesSection';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

const STORAGE_KEY = 'ordre_archives';

const ArchivesPage = () => {
  const [messages, setMessages] = useState<ArchivedMessage[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setMessages(JSON.parse(stored));
    }
  }, []);

  const handleDelete = (id: string) => {
    const updated = messages.filter(m => m.id !== id);
    setMessages(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    toast({
      title: "Message supprimé",
      description: "Le message a été retiré des archives.",
    });
  };

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <ArchivesSection messages={messages} onDelete={handleDelete} />
      </motion.div>
    </MainLayout>
  );
};

export default ArchivesPage;
