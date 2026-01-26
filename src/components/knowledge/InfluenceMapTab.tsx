import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Plus, Link2, ArrowRight, Trash2, ZoomIn, ZoomOut, Maximize2, List, Network, Eye, Users, Target, Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

type RelationshipType = 'alliance' | 'conflict' | 'influence' | 'observation' | 'unknown';
type NarrativeStatus = 'neutral' | 'observed' | 'ally' | 'at_risk' | 'protected' | 'unknown';
type ViewMode = 'graph' | 'list';

interface FileRelationship {
  id: string;
  source_file_id: string;
  target_file_id: string;
  relationship_type: RelationshipType;
  description: string | null;
  created_by: string;
  created_at: string;
}

interface KnowledgeFile {
  id: string;
  name: string;
  alias: string | null;
  narrative_status: NarrativeStatus;
  file_type: 'internal' | 'external';
}

interface NodePosition {
  x: number;
  y: number;
}

const relationshipColors: Record<RelationshipType, { bg: string; line: string; label: string }> = {
  alliance: { bg: 'bg-green-500/20 text-green-300 border-green-500/50', line: '#22c55e', label: 'Alliance' },
  conflict: { bg: 'bg-red-500/20 text-red-300 border-red-500/50', line: '#ef4444', label: 'Conflit' },
  influence: { bg: 'bg-blue-500/20 text-blue-300 border-blue-500/50', line: '#3b82f6', label: 'Influence' },
  observation: { bg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50', line: '#eab308', label: 'Observation' },
  unknown: { bg: 'bg-purple-500/20 text-purple-300 border-purple-500/50', line: '#a855f7', label: 'Inconnu' },
};

const statusColors: Record<NarrativeStatus, string> = {
  neutral: '#6b7280',
  observed: '#eab308',
  ally: '#22c55e',
  at_risk: '#ef4444',
  protected: '#3b82f6',
  unknown: '#a855f7',
};

const statusIcons: Record<NarrativeStatus, typeof Users> = {
  neutral: Users,
  observed: Eye,
  ally: Shield,
  at_risk: AlertTriangle,
  protected: Shield,
  unknown: Target,
};

export function InfluenceMapTab() {
  const { user, isGuardianSupreme } = useAuth();
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filterType, setFilterType] = useState<RelationshipType | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('graph');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [nodePositions, setNodePositions] = useState<Record<string, NodePosition>>({});
  
  const [formData, setFormData] = useState({
    source_file_id: '',
    target_file_id: '',
    relationship_type: 'unknown' as RelationshipType,
    description: '',
  });

  const { data: relationships, isLoading: loadingRelationships } = useQuery({
    queryKey: ['file-relationships'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('file_relationships')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as FileRelationship[];
    },
  });

  const { data: files, isLoading: loadingFiles } = useQuery({
    queryKey: ['knowledge-files-for-map'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_files')
        .select('id, name, alias, narrative_status, file_type');
      
      if (error) throw error;
      return data as KnowledgeFile[];
    },
  });

  // Initialize node positions in a circular layout
  useEffect(() => {
    if (files && Object.keys(nodePositions).length === 0) {
      const centerX = 400;
      const centerY = 300;
      const radius = Math.min(250, files.length * 30);
      
      const positions: Record<string, NodePosition> = {};
      files.forEach((file, index) => {
        const angle = (2 * Math.PI * index) / files.length;
        positions[file.id] = {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        };
      });
      setNodePositions(positions);
    }
  }, [files, nodePositions]);

  const createRelationshipMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('file_relationships').insert({
        source_file_id: formData.source_file_id,
        target_file_id: formData.target_file_id,
        relationship_type: formData.relationship_type,
        description: formData.description || null,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file-relationships'] });
      toast.success('Lien créé');
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate')) {
        toast.error('Ce lien existe déjà');
      } else {
        toast.error('Erreur lors de la création du lien');
      }
    },
  });

  const deleteRelationshipMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('file_relationships').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file-relationships'] });
      toast.success('Lien supprimé');
    },
  });

  const resetForm = () => {
    setFormData({
      source_file_id: '',
      target_file_id: '',
      relationship_type: 'unknown',
      description: '',
    });
  };

  const getFile = (fileId: string) => files?.find(f => f.id === fileId);
  const getFileName = (fileId: string) => {
    const file = getFile(fileId);
    return file?.alias || file?.name || 'Inconnu';
  };

  const filteredRelationships = useMemo(() => {
    if (!relationships) return [];
    if (filterType === 'all') return relationships;
    return relationships.filter(r => r.relationship_type === filterType);
  }, [relationships, filterType]);

  // Get connected nodes for selected node
  const connectedNodes = useMemo(() => {
    if (!selectedNode || !relationships) return new Set<string>();
    const connected = new Set<string>();
    relationships.forEach(rel => {
      if (rel.source_file_id === selectedNode) connected.add(rel.target_file_id);
      if (rel.target_file_id === selectedNode) connected.add(rel.source_file_id);
    });
    return connected;
  }, [selectedNode, relationships]);

  // Calculate node statistics
  const nodeStats = useMemo(() => {
    if (!files || !relationships) return {};
    const stats: Record<string, { connections: number; allies: number; conflicts: number; influence: number }> = {};
    
    files.forEach(file => {
      stats[file.id] = { connections: 0, allies: 0, conflicts: 0, influence: 0 };
    });
    
    relationships.forEach(rel => {
      if (stats[rel.source_file_id]) {
        stats[rel.source_file_id].connections++;
        if (rel.relationship_type === 'alliance') stats[rel.source_file_id].allies++;
        if (rel.relationship_type === 'conflict') stats[rel.source_file_id].conflicts++;
        if (rel.relationship_type === 'influence') stats[rel.source_file_id].influence++;
      }
      if (stats[rel.target_file_id]) {
        stats[rel.target_file_id].connections++;
        if (rel.relationship_type === 'alliance') stats[rel.target_file_id].allies++;
        if (rel.relationship_type === 'conflict') stats[rel.target_file_id].conflicts++;
      }
    });
    
    return stats;
  }, [files, relationships]);

  // Group relationships by source file for list view
  const groupedRelationships = useMemo(() => {
    const groups: Record<string, FileRelationship[]> = {};
    filteredRelationships.forEach(rel => {
      if (!groups[rel.source_file_id]) {
        groups[rel.source_file_id] = [];
      }
      groups[rel.source_file_id].push(rel);
    });
    return groups;
  }, [filteredRelationships]);

  const handleNodeDrag = useCallback((fileId: string, e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;
    
    setNodePositions(prev => ({
      ...prev,
      [fileId]: { x, y },
    }));
  }, [pan, zoom]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggingNode) {
      handleNodeDrag(draggingNode, e);
    }
  }, [draggingNode, handleNodeDrag]);

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedNode(null);
  };

  const isLoading = loadingRelationships || loadingFiles;

  // Get most connected nodes for insights
  const topConnectors = useMemo(() => {
    if (!files || !nodeStats) return [];
    return files
      .map(f => ({ ...f, ...nodeStats[f.id] }))
      .sort((a, b) => (b.connections || 0) - (a.connections || 0))
      .slice(0, 5);
  }, [files, nodeStats]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-heading">Cartographie d'Influence</h2>
          <p className="text-sm text-muted-foreground">
            {files?.length || 0} entités · {relationships?.length || 0} liens
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* View mode toggle */}
          <div className="flex bg-card border border-border rounded-lg p-1">
            <Button
              size="sm"
              variant={viewMode === 'graph' ? 'default' : 'ghost'}
              onClick={() => setViewMode('graph')}
              className="gap-1"
            >
              <Network className="w-4 h-4" />
              <span className="hidden sm:inline">Graphe</span>
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              onClick={() => setViewMode('list')}
              className="gap-1"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Liste</span>
            </Button>
          </div>
          
          <Select
            value={filterType}
            onValueChange={(value) => setFilterType(value as RelationshipType | 'all')}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Filtrer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les liens</SelectItem>
              {Object.entries(relationshipColors).map(([value, { label }]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nouveau lien</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Créer un lien</DialogTitle>
                <DialogDescription>Établir une relation entre deux fiches</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Fiche source</Label>
                  <Select
                    value={formData.source_file_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, source_file_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une fiche" />
                    </SelectTrigger>
                    <SelectContent>
                      {files?.map((file) => (
                        <SelectItem key={file.id} value={file.id}>
                          {file.name} {file.alias && `(${file.alias})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-center">
                  <ArrowRight className="w-6 h-6 text-muted-foreground" />
                </div>

                <div className="space-y-2">
                  <Label>Fiche cible</Label>
                  <Select
                    value={formData.target_file_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, target_file_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une fiche" />
                    </SelectTrigger>
                    <SelectContent>
                      {files?.filter(f => f.id !== formData.source_file_id).map((file) => (
                        <SelectItem key={file.id} value={file.id}>
                          {file.name} {file.alias && `(${file.alias})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Type de relation</Label>
                  <Select
                    value={formData.relationship_type}
                    onValueChange={(value: RelationshipType) => setFormData(prev => ({ ...prev, relationship_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(relationshipColors).map(([value, { label }]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Description (optionnel)</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Nature du lien..."
                  />
                </div>

                <Button 
                  onClick={() => createRelationshipMutation.mutate()} 
                  className="w-full" 
                  disabled={!formData.source_file_id || !formData.target_file_id}
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  Créer le lien
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Graph View */}
      {viewMode === 'graph' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main Graph Area */}
          <div className="lg:col-span-3">
            <Card className="bg-card/30 border-border overflow-hidden">
              {/* Graph controls */}
              <div className="flex items-center justify-between p-2 border-b border-border bg-card/50">
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => setZoom(z => Math.min(z + 0.2, 2))}>
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}>
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={resetView}>
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                </div>
                <span className="text-xs text-muted-foreground">
                  Zoom: {Math.round(zoom * 100)}%
                </span>
              </div>
              
              {/* Graph canvas */}
              <div
                ref={containerRef}
                className="relative h-[500px] overflow-hidden cursor-grab active:cursor-grabbing"
                onMouseMove={handleMouseMove}
                onMouseUp={() => setDraggingNode(null)}
                onMouseLeave={() => setDraggingNode(null)}
              >
                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    Chargement...
                  </div>
                ) : (
                  <svg
                    className="absolute inset-0 w-full h-full"
                    style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
                  >
                    {/* Draw relationship lines */}
                    {filteredRelationships.map((rel) => {
                      const sourcePos = nodePositions[rel.source_file_id];
                      const targetPos = nodePositions[rel.target_file_id];
                      if (!sourcePos || !targetPos) return null;
                      
                      const isHighlighted = !selectedNode || 
                        selectedNode === rel.source_file_id || 
                        selectedNode === rel.target_file_id;
                      
                      return (
                        <g key={rel.id}>
                          <line
                            x1={sourcePos.x}
                            y1={sourcePos.y}
                            x2={targetPos.x}
                            y2={targetPos.y}
                            stroke={relationshipColors[rel.relationship_type].line}
                            strokeWidth={isHighlighted ? 2 : 1}
                            strokeOpacity={isHighlighted ? 0.8 : 0.2}
                            strokeDasharray={rel.relationship_type === 'observation' ? '5,5' : undefined}
                          />
                          {/* Arrow head */}
                          <polygon
                            points={calculateArrowHead(sourcePos, targetPos)}
                            fill={relationshipColors[rel.relationship_type].line}
                            opacity={isHighlighted ? 0.8 : 0.2}
                          />
                        </g>
                      );
                    })}
                    
                    {/* Draw nodes */}
                    {files?.map((file) => {
                      const pos = nodePositions[file.id];
                      if (!pos) return null;
                      
                      const isSelected = selectedNode === file.id;
                      const isConnected = connectedNodes.has(file.id);
                      const isHighlighted = !selectedNode || isSelected || isConnected;
                      const stats = nodeStats[file.id];
                      const nodeSize = 24 + Math.min((stats?.connections || 0) * 3, 20);
                      
                      const StatusIcon = statusIcons[file.narrative_status] || Users;
                      
                      return (
                        <g
                          key={file.id}
                          transform={`translate(${pos.x}, ${pos.y})`}
                          style={{ cursor: 'pointer' }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setDraggingNode(file.id);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNode(isSelected ? null : file.id);
                          }}
                        >
                          {/* Glow effect for selected */}
                          {isSelected && (
                            <circle
                              r={nodeSize + 8}
                              fill="none"
                              stroke={statusColors[file.narrative_status]}
                              strokeWidth="2"
                              opacity="0.5"
                              className="animate-pulse"
                            />
                          )}
                          
                          {/* Node circle */}
                          <circle
                            r={nodeSize}
                            fill={`${statusColors[file.narrative_status]}20`}
                            stroke={statusColors[file.narrative_status]}
                            strokeWidth={isSelected ? 3 : 2}
                            opacity={isHighlighted ? 1 : 0.3}
                          />
                          
                          {/* Node type indicator */}
                          <circle
                            r={8}
                            cx={nodeSize - 5}
                            cy={-nodeSize + 5}
                            fill={file.file_type === 'internal' ? '#3b82f6' : '#6b7280'}
                            stroke="#1f2937"
                            strokeWidth="1"
                            opacity={isHighlighted ? 1 : 0.3}
                          />
                          
                          {/* Node label */}
                          <text
                            y={nodeSize + 16}
                            textAnchor="middle"
                            fill="currentColor"
                            fontSize="11"
                            fontWeight={isSelected ? 'bold' : 'normal'}
                            opacity={isHighlighted ? 1 : 0.3}
                            className="pointer-events-none"
                          >
                            {file.alias || file.name.substring(0, 12)}
                            {file.name.length > 12 && !file.alias && '...'}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                )}
              </div>
            </Card>
          </div>
          
          {/* Sidebar - Insights & Selected Node */}
          <div className="space-y-4">
            {/* Selected Node Details */}
            <AnimatePresence mode="wait">
              {selectedNode && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card className="bg-card/50 border-primary/30">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-heading text-lg">{getFileName(selectedNode)}</h3>
                        <Button size="icon" variant="ghost" onClick={() => setSelectedNode(null)}>
                          ×
                        </Button>
                      </div>
                      
                      {nodeStats[selectedNode] && (
                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                          <div className="bg-muted/50 rounded p-2 text-center">
                            <div className="text-lg font-bold">{nodeStats[selectedNode].connections}</div>
                            <div className="text-xs text-muted-foreground">Connexions</div>
                          </div>
                          <div className="bg-green-500/10 rounded p-2 text-center">
                            <div className="text-lg font-bold text-green-400">{nodeStats[selectedNode].allies}</div>
                            <div className="text-xs text-muted-foreground">Alliés</div>
                          </div>
                          <div className="bg-red-500/10 rounded p-2 text-center">
                            <div className="text-lg font-bold text-red-400">{nodeStats[selectedNode].conflicts}</div>
                            <div className="text-xs text-muted-foreground">Conflits</div>
                          </div>
                          <div className="bg-blue-500/10 rounded p-2 text-center">
                            <div className="text-lg font-bold text-blue-400">{nodeStats[selectedNode].influence}</div>
                            <div className="text-xs text-muted-foreground">Influence</div>
                          </div>
                        </div>
                      )}
                      
                      {/* Connected nodes */}
                      <Label className="text-xs text-muted-foreground">Connexions directes</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Array.from(connectedNodes).slice(0, 6).map(nodeId => (
                          <Badge 
                            key={nodeId} 
                            variant="outline" 
                            className="cursor-pointer text-xs"
                            onClick={() => setSelectedNode(nodeId)}
                          >
                            {getFileName(nodeId)}
                          </Badge>
                        ))}
                        {connectedNodes.size > 6 && (
                          <Badge variant="outline" className="text-xs">
                            +{connectedNodes.size - 6}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Top Connectors */}
            <Card className="bg-card/30">
              <CardContent className="pt-4">
                <Label className="text-xs text-muted-foreground mb-3 block">Nœuds les plus connectés</Label>
                <div className="space-y-2">
                  {topConnectors.map((node, index) => (
                    <div 
                      key={node.id} 
                      className="flex items-center justify-between text-sm cursor-pointer hover:bg-muted/50 rounded p-1 -mx-1"
                      onClick={() => setSelectedNode(node.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs w-4">{index + 1}.</span>
                        <span>{node.alias || node.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {node.connections || 0}
                      </Badge>
                    </div>
                  ))}
                  {topConnectors.length === 0 && (
                    <p className="text-xs text-muted-foreground">Aucune connexion</p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Legend */}
            <Card className="bg-card/30">
              <CardContent className="pt-4">
                <Label className="text-xs text-muted-foreground mb-2 block">Légende des liens</Label>
                <div className="space-y-1">
                  {Object.entries(relationshipColors).map(([type, { bg, label }]) => (
                    <div key={type} className="flex items-center gap-2 text-xs">
                      <div 
                        className="w-6 h-0.5" 
                        style={{ backgroundColor: relationshipColors[type as RelationshipType].line }}
                      />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
                <Label className="text-xs text-muted-foreground mt-3 mb-2 block">Statuts narratifs</Label>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(statusColors).map(([status, color]) => (
                    <div 
                      key={status} 
                      className="w-4 h-4 rounded-full border-2"
                      style={{ borderColor: color, backgroundColor: `${color}20` }}
                      title={status}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Chargement...</div>
          ) : Object.keys(groupedRelationships).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Aucun lien établi
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(groupedRelationships).map(([sourceId, rels]) => (
                <motion.div
                  key={sourceId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="bg-card/50 border-border">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: statusColors[getFile(sourceId)?.narrative_status || 'neutral'] }}
                        />
                        <h3 className="font-medium">{getFileName(sourceId)}</h3>
                        <Badge variant="outline" className="text-xs ml-auto">
                          {rels.length} lien{rels.length > 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {rels.map((rel) => (
                          <div
                            key={rel.id}
                            className={`flex items-center justify-between p-2 rounded-lg border ${relationshipColors[rel.relationship_type].bg}`}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <ArrowRight className="w-3 h-3 shrink-0" />
                              <span className="font-medium truncate">{getFileName(rel.target_file_id)}</span>
                              <Badge variant="outline" className="text-xs shrink-0">
                                {relationshipColors[rel.relationship_type].label}
                              </Badge>
                            </div>
                            {isGuardianSupreme && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 shrink-0"
                                onClick={() => deleteRelationshipMutation.mutate(rel.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Helper function to calculate arrow head points
function calculateArrowHead(source: NodePosition, target: NodePosition): string {
  const angle = Math.atan2(target.y - source.y, target.x - source.x);
  const arrowLength = 8;
  const arrowWidth = 4;
  
  // Position arrow head 30px from target (to account for node radius)
  const dist = Math.sqrt(Math.pow(target.x - source.x, 2) + Math.pow(target.y - source.y, 2));
  const ratio = Math.max(0, (dist - 35)) / dist;
  
  const tipX = source.x + (target.x - source.x) * ratio;
  const tipY = source.y + (target.y - source.y) * ratio;
  
  const baseX = tipX - arrowLength * Math.cos(angle);
  const baseY = tipY - arrowLength * Math.sin(angle);
  
  const leftX = baseX + arrowWidth * Math.cos(angle + Math.PI / 2);
  const leftY = baseY + arrowWidth * Math.sin(angle + Math.PI / 2);
  
  const rightX = baseX + arrowWidth * Math.cos(angle - Math.PI / 2);
  const rightY = baseY + arrowWidth * Math.sin(angle - Math.PI / 2);
  
  return `${tipX},${tipY} ${leftX},${leftY} ${rightX},${rightY}`;
}
