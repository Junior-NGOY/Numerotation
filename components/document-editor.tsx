"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  Trash2, 
  Plus,
  RefreshCw,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { 
  getDocumentsByProprietaire,
  getDocumentsByVehicule,
  getDocumentPreview,
  downloadDocument,
  formatFileSize,
  getFileTypeIcon,
  getDocumentFileUrlWithToken,
  type DocumentWithDetails,
  type DocumentPreview
} from "@/actions/documents-access";
import { uploadDocumentFormData } from "@/actions/documents";
import { toast } from "sonner";

interface DocumentEditorProps {
  entityType: 'proprietaire' | 'vehicule';
  entityId: string;
  entityName?: string;
  compact?: boolean; // Pour affichage compact dans les formulaires
}

export default function DocumentEditor({ 
  entityType, 
  entityId, 
  entityName,
  compact = false 
}: DocumentEditorProps) {
  const [documents, setDocuments] = useState<DocumentWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentPreview | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [replaceDocument, setReplaceDocument] = useState<DocumentWithDetails | null>(null);
  
  // États pour l'upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [uploading, setUploading] = useState(false);

  // Types de documents disponibles
  const documentTypes = [
    { value: 'PIECE_IDENTITE', label: 'Pièce d\'identité' },
    { value: 'PERMIS_CONDUIRE', label: 'Permis de conduire' },
    { value: 'CARTE_ROSE', label: 'Carte rose' },
    { value: 'PDF_COMPLET', label: 'PDF complet' },
    { value: 'AUTRE', label: 'Autre' }
  ];

  // Charger les documents
  const loadDocuments = async () => {
    setLoading(true);
    try {
      let response;
      if (entityType === 'proprietaire') {
        response = await getDocumentsByProprietaire(entityId);
      } else {
        response = await getDocumentsByVehicule(entityId);
      }
      
      if (response.data) {
        setDocuments(response.data.documents);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
      toast.error('Erreur lors du chargement des documents');
    } finally {
      setLoading(false);
    }
  };

  // Charger au démarrage
  useEffect(() => {
    if (entityId) {
      loadDocuments();
    }
  }, [entityId, entityType]);

  // Prévisualiser un document
  const handlePreview = async (documentId: string) => {
    try {
      const response = await getDocumentPreview(documentId);
      if (response.data) {
        setSelectedDocument(response.data);
        setPreviewOpen(true);
      }
    } catch (error) {
      console.error('Erreur lors de la prévisualisation:', error);
      toast.error('Erreur lors de la prévisualisation');
    }
  };

  // Télécharger un document
  const handleDownload = async (document: DocumentWithDetails) => {
    try {
      await downloadDocument(document.id, document.nom);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast.error('Erreur lors du téléchargement');
    }
  };

  // Préparer l'upload d'un nouveau document
  const handleNewDocument = () => {
    setReplaceDocument(null);
    setDocumentName('');
    setDocumentType('');
    setSelectedFile(null);
    setUploadOpen(true);
  };

  // Préparer le remplacement d'un document
  const handleReplaceDocument = (document: DocumentWithDetails) => {
    setReplaceDocument(document);
    setDocumentName(document.nom);
    setDocumentType(document.type);
    setSelectedFile(null);
    setUploadOpen(true);
  };

  // Gérer la sélection de fichier
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!documentName && !replaceDocument) {
        setDocumentName(file.name);
      }
    }
  };

  // Uploader/Remplacer un document
  const handleUpload = async () => {
    if (!selectedFile || !documentName || !documentType) {
      toast.error('Veuillez remplir tous les champs et sélectionner un fichier');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('nom', documentName);
      formData.append('type', documentType);
      
      if (entityType === 'proprietaire') {
        formData.append('proprietaireId', entityId);
      } else {
        formData.append('vehiculeId', entityId);
      }

      // Si c'est un remplacement, ajouter l'ID du document à remplacer
      if (replaceDocument) {
        formData.append('replaceDocumentId', replaceDocument.id);
      }

      const response = await uploadDocumentFormData(formData);
      
      if (response.data) {
        toast.success(replaceDocument ? 'Document remplacé avec succès' : 'Document ajouté avec succès');
        setUploadOpen(false);
        setSelectedFile(null);
        setDocumentName('');
        setDocumentType('');
        setReplaceDocument(null);
        loadDocuments(); // Recharger la liste
      }
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      toast.error('Erreur lors de l\'upload du document');
    } finally {
      setUploading(false);
    }
  };

  if (compact) {
    // Version compacte pour les formulaires
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <div className="text-center text-sm text-muted-foreground">Chargement...</div>
          ) : documents.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground">Aucun document</div>
          ) : (
            <div className="space-y-2">
              {documents.slice(0, 3).map((document) => (
                <div key={document.id} className="flex items-center justify-between text-sm border rounded p-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-base">{getFileTypeIcon(document.mimeType)}</span>
                    <span className="truncate">{document.nom}</span>
                    <Badge variant="outline" className="text-xs">
                      {document.type.replace('_', ' ')}
                    </Badge>
                  </div>                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handlePreview(document.id);
                        }}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleReplaceDocument(document);
                        }}
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    </div>
                </div>
              ))}
              {documents.length > 3 && (
                <div className="text-xs text-muted-foreground text-center">
                  et {documents.length - 3} autre(s)...
                </div>
              )}            </div>
          )}
          
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleNewDocument();
            }}
          >
            <Plus className="h-3 w-3 mr-1" />
            Ajouter un document
          </Button>
          
          {/* Lien vers le gestionnaire complet */}
          <a 
            href="/documents/manager"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary flex items-center justify-center gap-1 mt-2"
          >
            Gestionnaire complet <ExternalLink className="h-3 w-3" />
          </a>
        </CardContent>
      </Card>
    );
  }

  // Version complète
  return (
    <div className="space-y-4">
      {/* En-tête avec actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Documents</h3>
          {entityName && (
            <p className="text-sm text-muted-foreground">
              {entityType === 'proprietaire' ? 'Propriétaire' : 'Véhicule'}: {entityName}
            </p>
          )}
        </div>
        <div className="flex gap-2">          <Button onClick={loadDocuments} variant="outline" size="sm" type="button">
            <RefreshCw className="h-4 w-4 mr-1" />
            Actualiser
          </Button>
          <Button onClick={handleNewDocument} size="sm" type="button">
            <Plus className="h-4 w-4 mr-1" />
            Nouveau document
          </Button>
        </div>
      </div>

      {/* Liste des documents */}
      <Card>
        <CardContent className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Chargement des documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">Aucun document trouvé</p>              <Button onClick={handleNewDocument} type="button">
                <Plus className="h-4 w-4 mr-1" />
                Ajouter le premier document
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((document) => (
                <div key={document.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{getFileTypeIcon(document.mimeType)}</span>
                        <h4 className="font-medium truncate">{document.nom}</h4>
                        <Badge variant="outline">
                          {document.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-4">
                          <span>Taille: {formatFileSize(document.taille)}</span>
                          <span>Créé le: {new Date(document.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        onClick={() => handlePreview(document.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Voir
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        onClick={() => handleDownload(document)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Télécharger
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        onClick={() => handleReplaceDocument(document)}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Remplacer
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog d'upload/remplacement */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {replaceDocument ? 'Remplacer le document' : 'Nouveau document'}
            </DialogTitle>
            <DialogDescription>
              {replaceDocument 
                ? `Remplacer "${replaceDocument.nom}" par un nouveau fichier`
                : 'Ajouter un nouveau document'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {replaceDocument && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm font-medium">Document actuel:</p>
                <p className="text-sm text-muted-foreground">{replaceDocument.nom}</p>
              </div>
            )}
            
            {/* Sélection de fichier */}
            <div className="space-y-2">
              <Label htmlFor="file">Fichier</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileSelect}
                accept="image/*,.pdf,.doc,.docx"
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Fichier sélectionné: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              )}
            </div>

            {/* Nom du document */}
            <div className="space-y-2">
              <Label htmlFor="nom">Nom du document</Label>
              <Input
                id="nom"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="Nom du document"
              />
            </div>

            {/* Type de document */}
            <div className="space-y-2">
              <Label htmlFor="type">Type de document</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end">              <Button
                variant="outline"
                type="button"
                onClick={() => setUploadOpen(false)}
                disabled={uploading}
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={handleUpload}
                disabled={!selectedFile || !documentName || !documentType || uploading}
              >
                {uploading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                    {replaceDocument ? 'Remplacement...' : 'Upload...'}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-1" />
                    {replaceDocument ? 'Remplacer' : 'Ajouter'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
              <div className="border rounded-lg overflow-hidden">
                {selectedDocument.mimeType?.includes('image/') ? (
                  <div className="p-4">                    <img 
                      src={selectedDocument.fileUrl} 
                      alt={selectedDocument.nom}
                      className="w-full max-h-96 object-contain mx-auto"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden p-8 text-center text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4" />
                      <p className="mb-4">Impossible d'afficher l'image</p>
                      <Button 
                        onClick={() => window.open(getDocumentFileUrlWithToken(selectedDocument.id), '_blank')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger le fichier
                      </Button>
                    </div>
                  </div>
                ) : selectedDocument.mimeType?.includes('pdf') ? (
                  <div className="p-4">                    <iframe 
                      src={selectedDocument.fileUrl}
                      className="w-full h-96 border-0"
                      title={selectedDocument.nom}
                      onError={() => {
                        console.error('Erreur lors du chargement du PDF');
                      }}                    />
                    <div className="mt-2 text-center">
                      <Button 
                        variant="outline"
                        type="button"
                        onClick={() => window.open(selectedDocument.fileUrl, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Ouvrir dans un nouvel onglet
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">
                      Prévisualisation non disponible pour ce type de fichier
                    </p>
                    <Button 
                      type="button"
                      onClick={() => window.open(selectedDocument.fileUrl, '_blank')}
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
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
