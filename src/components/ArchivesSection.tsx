import { useState, useEffect } from 'react';
import { Trash2, Copy, ChevronDown, ChevronUp, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export interface ArchivedMessage {
  id: string;
  original: string;
  encoded: string;
  method: string;
  date: string;
}

interface ArchivesSectionProps {
  messages: ArchivedMessage[];
  onDelete: (id: string) => void;
}

export function ArchivesSection({ messages, onDelete }: ArchivesSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast({
      title: "Copié",
      description: "Message copié dans le presse-papier.",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (messages.length === 0) {
    return (
      <div className="text-center py-16">
        <Archive className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
        <h3 className="font-heading text-xl text-muted-foreground mb-2">Archives Vides</h3>
        <p className="text-sm text-muted-foreground/70">
          Les messages chiffrés sauvegardés apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Archive className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="font-heading text-2xl tracking-wide">Archives Secrètes</h2>
        <p className="text-muted-foreground mt-2">
          {messages.length} message{messages.length > 1 ? 's' : ''} archivé{messages.length > 1 ? 's' : ''}
        </p>
      </div>

      <div className="space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="archive-item">
            <div 
              className="flex items-start justify-between cursor-pointer"
              onClick={() => setExpandedId(expandedId === message.id ? null : message.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground font-heading">
                    {message.method}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(message.date)}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 truncate">
                  {message.encoded.substring(0, 50)}...
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                {expandedId === message.id ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>

            {expandedId === message.id && (
              <div className="mt-4 pt-4 border-t border-border/30 animate-fade-in">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground font-heading tracking-wide">
                      Message Original
                    </label>
                    <div className="mt-1 p-3 bg-secondary/30 rounded text-sm">
                      {message.original}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-heading tracking-wide">
                      Message Chiffré
                    </label>
                    <div className="mt-1 p-3 bg-secondary/30 rounded text-sm break-all">
                      {message.encoded}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(message.encoded);
                      }}
                      className="gap-2"
                    >
                      <Copy className="w-3 h-3" />
                      Copier
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(message.id);
                      }}
                      className="gap-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
