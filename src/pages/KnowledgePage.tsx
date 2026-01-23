import { useState } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Users, Gavel, Map, Calendar, BookOpen, FileQuestion, History, Key, Lightbulb } from 'lucide-react';
import { useKnowledgeAccess } from '@/hooks/useKnowledgeAccess';
import { Navigate } from 'react-router-dom';
import logo from '@/assets/logo-ordre.png';
import { KnowledgeFilesTab } from '@/components/knowledge/KnowledgeFilesTab';
import { CouncilChamberTab } from '@/components/knowledge/CouncilChamberTab';
import { JudgmentsTab } from '@/components/knowledge/JudgmentsTab';
import { InfluenceMapTab } from '@/components/knowledge/InfluenceMapTab';
import { EventsRegistryTab } from '@/components/knowledge/EventsRegistryTab';
import { LivingRulesTab } from '@/components/knowledge/LivingRulesTab';
import { CouncilRequestsTab } from '@/components/knowledge/CouncilRequestsTab';
import { ActionHistoryTab } from '@/components/knowledge/ActionHistoryTab';
import { TemporaryAccessTab } from '@/components/knowledge/TemporaryAccessTab';
import { SuggestionsTab } from '@/components/knowledge/SuggestionsTab';
import { AlertStateIndicator } from '@/components/knowledge/AlertStateIndicator';

export default function KnowledgePage() {
  const { hasAccess, isLoading, isGuardianSupreme } = useKnowledgeAccess();
  const [activeTab, setActiveTab] = useState('files');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <img 
            src={logo} 
            alt="L'Ordre" 
            className="w-20 h-20 mx-auto mb-4 animate-pulse-slow lunar-glow"
          />
          <p className="text-muted-foreground text-sm font-heading tracking-widest">
            VÉRIFICATION DES ACCÈS...
          </p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return (
    <MainLayout>
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header with Alert State */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-2 tracking-wider">
                LE SAVOIR
              </h1>
              <p className="text-muted-foreground font-body">
                Mémoire, observation et délibération de l'Ordre
              </p>
            </div>
            <AlertStateIndicator />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-10 w-full bg-card/50 border border-border h-auto p-1 gap-1">
              <TabsTrigger 
                value="files" 
                className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary py-3"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden lg:inline">Fiches</span>
              </TabsTrigger>
              <TabsTrigger 
                value="council" 
                className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary py-3"
              >
                <Users className="w-4 h-4" />
                <span className="hidden lg:inline">Conseil</span>
              </TabsTrigger>
              <TabsTrigger 
                value="requests" 
                className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary py-3"
              >
                <FileQuestion className="w-4 h-4" />
                <span className="hidden lg:inline">Demandes</span>
              </TabsTrigger>
              <TabsTrigger 
                value="judgments" 
                className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary py-3"
              >
                <Gavel className="w-4 h-4" />
                <span className="hidden lg:inline">Jugements</span>
              </TabsTrigger>
              <TabsTrigger 
                value="map" 
                className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary py-3"
              >
                <Map className="w-4 h-4" />
                <span className="hidden lg:inline">Carte</span>
              </TabsTrigger>
              <TabsTrigger 
                value="events" 
                className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary py-3"
              >
                <Calendar className="w-4 h-4" />
                <span className="hidden lg:inline">Registre</span>
              </TabsTrigger>
              <TabsTrigger 
                value="rules" 
                className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary py-3"
              >
                <BookOpen className="w-4 h-4" />
                <span className="hidden lg:inline">Règles</span>
              </TabsTrigger>
              <TabsTrigger 
                value="access" 
                className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary py-3"
              >
                <Key className="w-4 h-4" />
                <span className="hidden lg:inline">Accès</span>
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary py-3"
              >
                <History className="w-4 h-4" />
                <span className="hidden lg:inline">Historique</span>
              </TabsTrigger>
              <TabsTrigger 
                value="suggestions" 
                className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary py-3"
              >
                <Lightbulb className="w-4 h-4" />
                <span className="hidden lg:inline">Suggestions</span>
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="files">
                <KnowledgeFilesTab />
              </TabsContent>
              <TabsContent value="council">
                <CouncilChamberTab />
              </TabsContent>
              <TabsContent value="requests">
                <CouncilRequestsTab />
              </TabsContent>
              <TabsContent value="judgments">
                <JudgmentsTab isGuardianSupreme={isGuardianSupreme} />
              </TabsContent>
              <TabsContent value="map">
                <InfluenceMapTab />
              </TabsContent>
              <TabsContent value="events">
                <EventsRegistryTab />
              </TabsContent>
              <TabsContent value="rules">
                <LivingRulesTab />
              </TabsContent>
              <TabsContent value="access">
                <TemporaryAccessTab />
              </TabsContent>
              <TabsContent value="history">
                <ActionHistoryTab />
              </TabsContent>
              <TabsContent value="suggestions">
                <SuggestionsTab />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
