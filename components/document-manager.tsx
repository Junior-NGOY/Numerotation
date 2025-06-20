"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Search, 
  Download, 
  Eye, 
  FileText, 
  User, 
  Car, 
  Calendar,
  Filter,
  ArrowUpDown,
  Trash2
} from "lucide-react";
import { 
  searchDocuments, 
  getDocumentPreview, 
  downloadDocument,
  deleteDocument,
  formatFileSize, 
  getFileTypeIcon,
  getDocumentFileUrl,
  type DocumentWithDetails,
  type DocumentPreview,
  type DocumentsSearchResult
} from "@/actions/documents-access";
import { toast } from "sonner";

interface DocumentManagerProps {
  proprietaireId?: string;
  vehiculeId?: string;
}

export default function DocumentManager({ proprietaireId, vehiculeId }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<DocumentWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState<'proprietaire' | 'vehicule' | 'all'>('all');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<DocumentPreview | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  // Charger les documents
  const loadDocuments = async (page = 1) => {
    setLoading(true);
    try {      const filters = {
        search: searchTerm || undefined,
        type: typeFilter === 'all' ? undefined : typeFilter || undefined,
        source: sourceFilter === 'all' ? undefined : sourceFilter,
        proprietaireId: proprietaireId || undefined,
        vehiculeId: vehiculeId || undefined,
        dateFrom: dateFromFilter || undefined,
        dateTo: dateToFilter || undefined,
        page,
        limit: pagination.limit
      };

      const response = await searchDocuments(filters);
      
      if (response.data) {
        setDocuments(response.data.documents);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
    } finally {
      setLoading(false);
    }
  };
  // Prévisualiser un document
  const handlePreview = async (documentId: string) => {
    try {
      const response = await getDocumentPreview(documentId);
      if (response.data) {
        setSelectedDocument(response.data);
        setPreviewOpen(true);
      } else {
        toast.error("❌ Impossible de charger la prévisualisation du document.");
      }
    } catch (error) {
      console.error('Erreur lors de la prévisualisation:', error);
      toast.error("❌ Erreur lors de la prévisualisation du document.");
    }
  };

  // Télécharger un document
  const handleDownload = async (document: DocumentWithDetails) => {
    try {
      await downloadDocument(document.id, document.nom);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
    }
  };

  // Supprimer un document
  const handleDelete = async (document: DocumentWithDetails) => {
    const confirmMessage = `Êtes-vous sûr de vouloir supprimer le document "${document.nom}" ?`;
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      await deleteDocument(document.id);
      // Recharger la liste des documents après suppression
      await loadDocuments();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error("❌ Erreur lors de la suppression du document.");
    }
  };

  // Effet pour charger les documents
  useEffect(() => {
    loadDocuments();
  }, [searchTerm, typeFilter, sourceFilter, dateFromFilter, dateToFilter, proprietaireId, vehiculeId]);

  // Types de documents disponibles
  const documentTypes = [
    'PIECE_IDENTITE',
    'PERMIS_CONDUIRE', 
    'CARTE_ROSE',
    'PDF_COMPLET',
    'AUTRE'
  ];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gestionnaire de Documents
          </CardTitle>
          <CardDescription>
            {proprietaireId && "Documents du propriétaire et de ses véhicules"}
            {vehiculeId && "Documents du véhicule"}
            {!proprietaireId && !vehiculeId && "Tous les documents du système"}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Recherche */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Recherche</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nom du document..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Type de document */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {documentTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>            {/* Source (si pas de filtre spécifique) */}
            {!proprietaireId && !vehiculeId && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Source</label>                <Select 
                  value={sourceFilter} 
                  onValueChange={(value) => setSourceFilter(value as 'proprietaire' | 'vehicule' | 'all')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les sources</SelectItem>
                    <SelectItem value="proprietaire">Propriétaire</SelectItem>
                    <SelectItem value="vehicule">Véhicule</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Date de début */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date de début</label>
              <Input
                type="date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
              />
            </div>

            {/* Date de fin */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date de fin</label>
              <Input
                type="date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
              />
            </div>
          </div>

          {/* Bouton de réinitialisation */}          <div className="mt-4">
            <Button 
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('all');
                setSourceFilter('all');
                setDateFromFilter('');
                setDateToFilter('');
              }}
            >
              Réinitialiser les filtres
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des documents */}
      <Card>
        <CardHeader>
          <CardTitle>Documents ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Chargement des documents...</div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun document trouvé
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((document) => (
                <div 
                  key={document.id} 
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">
                          {getFileTypeIcon(document.mimeType)}
                        </span>
                        <h3 className="font-semibold">{document.nom}</h3>
                        <Badge variant="outline">
                          {document.type.replace('_', ' ')}
                        </Badge>
                        {document.source && (
                          <Badge variant="secondary">
                            {document.source === 'proprietaire' ? (
                              <><User className="h-3 w-3 mr-1" /> Propriétaire</>
                            ) : (
                              <><Car className="h-3 w-3 mr-1" /> Véhicule</>
                            )}
                          </Badge>
                        )}
                      </div>

                      <div className="text-sm text-muted-foreground space-y-1">
                        {document.proprietaire && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {document.proprietaire.prenom} {document.proprietaire.nom}
                          </div>
                        )}
                        {document.vehicule && (
                          <div className="flex items-center gap-1">
                            <Car className="h-3 w-3" />
                            {document.vehicule.marque} {document.vehicule.modele} 
                            ({document.vehicule.numeroImmatriculation})
                          </div>
                        )}
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(document.createdAt).toLocaleDateString()}
                          </span>
                          {document.taille && (
                            <span>{formatFileSize(document.taille)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePreview(document.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Voir
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(document)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Télécharger
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(document)}
                        className="text-red-500 border-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                disabled={pagination.page <= 1}
                onClick={() => loadDocuments(pagination.page - 1)}
              >
                Précédent
              </Button>
              <span className="flex items-center px-4">
                Page {pagination.page} sur {pagination.pages}
              </span>
              <Button
                variant="outline"
                disabled={pagination.page >= pagination.pages}
                onClick={() => loadDocuments(pagination.page + 1)}
              >
                Suivant
              </Button>
            </div>
          )}        </CardContent>
      </Card>

      {/* Dialog de prévisualisation */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Prévisualisation du document</DialogTitle>
            {selectedDocument && (
              <DialogDescription>
                {selectedDocument.nom} - {formatFileSize(selectedDocument.taille)}
              </DialogDescription>
            )}
          </DialogHeader>          
          {selectedDocument && (
            <div className="space-y-4">

              {/* Prévisualisation du fichier */}
              <div className="border rounded-lg overflow-hidden">                {selectedDocument.mimeType?.includes('image/') ? (
                  <div className="p-4">
                    <img 
                      src={selectedDocument.fileUrl} 
                      alt={selectedDocument.nom}
                      className="w-full max-h-96 object-contain mx-auto"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const errorDiv = e.currentTarget.nextElementSibling as HTMLElement;
                        if (errorDiv) {
                          errorDiv.classList.remove('hidden');
                        }
                      }}
                    />
                    <div className="hidden p-8 text-center text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4" />
                      <p className="mb-4">Impossible d'afficher l'image</p>
                      <Button 
                        onClick={() => handleDownload({ 
                          id: selectedDocument.id, 
                          nom: selectedDocument.nom 
                        } as DocumentWithDetails)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger le fichier
                      </Button>
                    </div>
                  </div>
                ) : selectedDocument.mimeType?.includes('pdf') ? (
                  <div className="p-4">
                    <div className="bg-muted/30 rounded-lg p-6 text-center">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">
                        Prévisualisation PDF (téléchargez pour voir le contenu complet)
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button 
                          variant="outline"
                          onClick={() => handleDownload({ 
                            id: selectedDocument.id, 
                            nom: selectedDocument.nom 
                          } as DocumentWithDetails)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger le PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">
                      Prévisualisation non disponible pour ce type de fichier
                    </p>
                    <Button 
                      onClick={() => handleDownload({ 
                        id: selectedDocument.id, 
                        nom: selectedDocument.nom 
                      } as DocumentWithDetails)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger le fichier
                    </Button>
                  </div>
                )}
              </div>

              {/* Informations du document */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-3">Informations du document</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Type:</strong> {selectedDocument.type.replace('_', ' ')}
                  </div>
                  <div>
                    <strong>Taille:</strong> {formatFileSize(selectedDocument.taille)}
                  </div>
                  <div>
                    <strong>Créé le:</strong> {new Date(selectedDocument.createdAt).toLocaleDateString()}
                  </div>
                  <div>
                    <strong>Modifié le:</strong> {new Date(selectedDocument.updatedAt).toLocaleDateString()}
                  </div>
                  {selectedDocument.proprietaire && (
                    <div className="col-span-2">
                      <strong>Propriétaire:</strong> {selectedDocument.proprietaire.prenom} {selectedDocument.proprietaire.nom}
                    </div>
                  )}
                  {selectedDocument.vehicule && (
                    <div className="col-span-2">
                      <strong>Véhicule:</strong> {selectedDocument.vehicule.marque} {selectedDocument.vehicule.modele} ({selectedDocument.vehicule.numeroImmatriculation})
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
