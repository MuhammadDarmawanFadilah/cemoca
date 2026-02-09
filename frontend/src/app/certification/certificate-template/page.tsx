'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Search, FileText, Eye, Loader2, Upload, ArrowLeft, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CertificateTemplateService } from '@/services/certificateService';
import { FileUploadService } from '@/services/fileUploadService';
import { CertificateTemplate, CertificateTemplateRequest, TemplateVariable } from '@/types/certificate';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Image from 'next/image';

const TEMPLATE_OPTIONS = [
  { value: 'ACHIEVEMENT', label: 'Certificate of Achievement', variableCount: 4 },
  { value: 'PARTICIPATION', label: 'Certificate of Participation', variableCount: 3 },
  { value: 'COMPLETION', label: 'Certificate of Completion', variableCount: 4 },
];

export default function CertificateTemplatePage() {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CertificateTemplate | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<CertificateTemplate | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  // 2-step form
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplateType, setSelectedTemplateType] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    templateCode: '',
    templateName: '',
    description: '',
    imageUrl: '',
    variableCount: 4,
    variable1Name: '',
    variable1X: 0,
    variable1Y: 0,
    variable1FontSize: 24,
    variable1Color: '#000000',
    variable2Name: '',
    variable2X: 0,
    variable2Y: 0,
    variable2FontSize: 24,
    variable2Color: '#000000',
    variable3Name: '',
    variable3X: 0,
    variable3Y: 0,
    variable3FontSize: 24,
    variable3Color: '#000000',
    variable4Name: '',
    variable4X: 0,
    variable4Y: 0,
    variable4FontSize: 24,
    variable4Color: '#000000',
    isActive: true
  });

  // Variables for preview
  const [previewVariables, setPreviewVariables] = useState<{ [key: string]: string }>({
    variable1: 'Sample Name',
    variable2: '10,000,000',
    variable3: '15th Jan 2026',
    variable4: 'Indonesia',
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mergedImageUrl, setMergedImageUrl] = useState<string>('');

  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [currentPage, searchTerm]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const response = await CertificateTemplateService.getAll(searchTerm || undefined, undefined, currentPage, pageSize);
      setTemplates(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    setEditingTemplate(null);
    setCurrentStep(1);
    setSelectedTemplateType('');
    setGeneratedCode('');
    setSelectedFile(null);
    setPreviewUrl('');
    setMergedImageUrl('');
    resetFormData();
    setIsDialogOpen(true);
  };

  const handleEdit = (template: CertificateTemplate) => {
    setEditingTemplate(template);
    setCurrentStep(2);
    setFormData({
      templateCode: template.templateCode,
      templateName: template.templateName,
      description: template.description || '',
      imageUrl: template.imageUrl || '',
      variableCount: template.variableCount,
      variable1Name: template.variable1Name || '',
      variable1X: template.variable1X || 0,
      variable1Y: template.variable1Y || 0,
      variable1FontSize: template.variable1FontSize || 24,
      variable1Color: template.variable1Color || '#000000',
      variable2Name: template.variable2Name || '',
      variable2X: template.variable2X || 0,
      variable2Y: template.variable2Y || 0,
      variable2FontSize: template.variable2FontSize || 24,
      variable2Color: template.variable2Color || '#000000',
      variable3Name: template.variable3Name || '',
      variable3X: template.variable3X || 0,
      variable3Y: template.variable3Y || 0,
      variable3FontSize: template.variable3FontSize || 24,
      variable3Color: template.variable3Color || '#000000',
      variable4Name: template.variable4Name || '',
      variable4X: template.variable4X || 0,
      variable4Y: template.variable4Y || 0,
      variable4FontSize: template.variable4FontSize || 24,
      variable4Color: template.variable4Color || '#000000',
      isActive: template.isActive
    });
    if (template.imageUrl) {
      setPreviewUrl(template.imageUrl);
    }
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus template ini?')) return;

    try {
      setIsLoading(true);
      await CertificateTemplateService.delete(id);
      toast({
        title: "Berhasil",
        description: "Template berhasil dihapus",
      });
      await loadData();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus template",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = (template: CertificateTemplate) => {
    setViewingTemplate(template);
    setIsPreviewOpen(true);
  };

  const resetFormData = () => {
    setFormData({
      templateCode: '',
      templateName: '',
      description: '',
      imageUrl: '',
      variableCount: 4,
      variable1Name: '',
      variable1X: 0,
      variable1Y: 0,
      variable1FontSize: 24,
      variable1Color: '#000000',
      variable2Name: '',
      variable2X: 0,
      variable2Y: 0,
      variable2FontSize: 24,
      variable2Color: '#000000',
      variable3Name: '',
      variable3X: 0,
      variable3Y: 0,
      variable3FontSize: 24,
      variable3Color: '#000000',
      variable4Name: '',
      variable4X: 0,
      variable4Y: 0,
      variable4FontSize: 24,
      variable4Color: '#000000',
      isActive: true
    });
  };

  const handleStep1Next = async () => {
    if (!selectedTemplateType) {
      toast({
        title: "Error",
        description: "Pilih template terlebih dahulu",
        variant: "destructive"
      });
      return;
    }

    try {
      const selectedOption = TEMPLATE_OPTIONS.find(opt => opt.value === selectedTemplateType);
      if (!selectedOption) return;

      // Generate code if creating new
      if (!editingTemplate) {
        const codeResponse = await CertificateTemplateService.generateCode('AC');
        setGeneratedCode(codeResponse.templateCode);
        setFormData(prev => ({
          ...prev,
          templateCode: codeResponse.templateCode,
          templateName: selectedOption.label,
          variableCount: selectedOption.variableCount,
        }));
      }

      // Set default positions based on template type (Certificate of Achievement)
      if (selectedTemplateType === 'ACHIEVEMENT') {
        setFormData(prev => ({
          ...prev,
          variable1Name: 'Name',
          variable1X: 400,
          variable1Y: 350,
          variable1FontSize: 32,
          variable1Color: '#1a5f3e',
          variable2Name: 'APE Amount',
          variable2X: 400,
          variable2Y: 420,
          variable2FontSize: 28,
          variable2Color: '#1a5f3e',
          variable3Name: 'Date',
          variable3X: 250,
          variable3Y: 520,
          variable3FontSize: 18,
          variable3Color: '#666666',
          variable4Name: 'Location',
          variable4X: 550,
          variable4Y: 520,
          variable4FontSize: 18,
          variable4Color: '#666666',
        }));
      }

      setCurrentStep(2);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Gagal generate kode template",
        variant: "destructive"
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const mergeImageWithVariables = async () => {
    if (!previewUrl || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.drawImage(img, 0, 0);
      
      // Draw variables
      for (let i = 1; i <= formData.variableCount; i++) {
        const varName = formData[`variable${i}Name` as keyof typeof formData] as string;
        const varX = formData[`variable${i}X` as keyof typeof formData] as number;
        const varY = formData[`variable${i}Y` as keyof typeof formData] as number;
        const fontSize = formData[`variable${i}FontSize` as keyof typeof formData] as number;
        const color = formData[`variable${i}Color` as keyof typeof formData] as string;
        const value = previewVariables[`variable${i}`] || '';
        
        if (varName && value) {
          ctx.font = `bold ${fontSize}px Arial`;
          ctx.fillStyle = color;
          ctx.textAlign = 'center';
          ctx.fillText(value, varX, varY);
        }
      }
      
      const mergedUrl = canvas.toDataURL('image/png');
      setMergedImageUrl(mergedUrl);
    };
    
    img.src = previewUrl;
  };

  useEffect(() => {
    if (currentStep === 2 && previewUrl) {
      mergeImageWithVariables();
    }
  }, [previewUrl, formData, previewVariables, currentStep]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let imageUrl = formData.imageUrl;
      
      if (selectedFile) {
        setUploading(true);
        const uploadResult = await FileUploadService.uploadImage(selectedFile);
        if (uploadResult.success && uploadResult.url) {
          imageUrl = uploadResult.url;
        } else {
          throw new Error(uploadResult.message);
        }
        setUploading(false);
      }

      const requestData: CertificateTemplateRequest = {
        ...formData,
        imageUrl,
      };

      if (editingTemplate) {
        await CertificateTemplateService.update(editingTemplate.id, requestData);
        toast({
          title: "Berhasil",
          description: "Template berhasil diperbarui",
        });
      } else {
        await CertificateTemplateService.create(requestData);
        toast({
          title: "Berhasil",
          description: "Template berhasil ditambahkan",
        });
      }

      handleCloseDialog();
      await loadData();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal menyimpan template",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setUploading(false);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTemplate(null);
    setCurrentStep(1);
    setSelectedTemplateType('');
    setGeneratedCode('');
    setSelectedFile(null);
    setPreviewUrl('');
    setMergedImageUrl('');
    resetFormData();
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-6 w-6" />
                Certificate Template
              </CardTitle>
              <CardDescription>Kelola template sertifikat</CardDescription>
            </div>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari template..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(0);
                }}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Nama Template</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Variables</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Tidak ada data template
                      </TableCell>
                    </TableRow>
                  ) : (
                    templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.templateCode}</TableCell>
                        <TableCell>{template.templateName}</TableCell>
                        <TableCell>{template.description || '-'}</TableCell>
                        <TableCell>{template.variableCount}</TableCell>
                        <TableCell>
                          <Badge variant={template.isActive ? "default" : "secondary"}>
                            {template.isActive ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handlePreview(template)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEdit(template)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDelete(template.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Menampilkan {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, totalElements)} dari {totalElements} data
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                      disabled={currentPage === 0}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Sebelumnya
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                      disabled={currentPage === totalPages - 1}
                    >
                      Selanjutnya
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog with 2 Steps */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : `Tambah Template - Step ${currentStep}/2`}
            </DialogTitle>
            <DialogDescription>
              {currentStep === 1 ? 'Pilih tipe template yang akan digunakan' : 'Lengkapi data template dan upload gambar'}
            </DialogDescription>
          </DialogHeader>

          {currentStep === 1 && !editingTemplate && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="templateType">Template Type</Label>
                <Select value={selectedTemplateType} onValueChange={setSelectedTemplateType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih template" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTemplateType && (
                <div className="space-y-2 p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold">Preview Variables</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {TEMPLATE_OPTIONS.find(opt => opt.value === selectedTemplateType)?.variableCount &&
                      Array.from({ length: TEMPLATE_OPTIONS.find(opt => opt.value === selectedTemplateType)!.variableCount }).map((_, idx) => (
                        <div key={idx}>
                          <Label htmlFor={`preview-var${idx + 1}`}>Variable {idx + 1}</Label>
                          <Input
                            id={`preview-var${idx + 1}`}
                            value={previewVariables[`variable${idx + 1}`]}
                            onChange={(e) => setPreviewVariables(prev => ({ ...prev, [`variable${idx + 1}`]: e.target.value }))}
                            placeholder={`Value ${idx + 1}`}
                          />
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={handleCloseDialog}>
                  Batal
                </Button>
                <Button onClick={handleStep1Next}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </DialogFooter>
            </div>
          )}

          {currentStep === 2 && (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="templateCode">Kode Template</Label>
                    <Input
                      id="templateCode"
                      value={formData.templateCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, templateCode: e.target.value }))}
                      required
                      readOnly={!editingTemplate}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="templateName">Nama Template</Label>
                    <Input
                      id="templateName"
                      value={formData.templateName}
                      onChange={(e) => setFormData(prev => ({ ...prev, templateName: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imageFile">Upload Template Image</Label>
                  <Input
                    id="imageFile"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>

                {previewUrl && (
                  <div className="space-y-2">
                    <Label>Preview with Variables</Label>
                    <div className="border rounded-lg p-4 bg-muted">
                      <canvas ref={canvasRef} style={{ display: 'none' }} />
                      {mergedImageUrl && (
                        <img src={mergedImageUrl} alt="Preview" className="w-full" />
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-semibold">Variable Configuration</h3>
                  {Array.from({ length: formData.variableCount }).map((_, idx) => (
                    <div key={idx} className="grid grid-cols-5 gap-2 p-3 bg-muted rounded-lg">
                      <div className="col-span-5 mb-2">
                        <Label>Variable {idx + 1}</Label>
                      </div>
                      <div>
                        <Label className="text-xs">Name</Label>
                        <Input
                          value={formData[`variable${idx + 1}Name` as keyof typeof formData] as string}
                          onChange={(e) => setFormData(prev => ({ ...prev, [`variable${idx + 1}Name`]: e.target.value }))}
                          placeholder="Name"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">X Position</Label>
                        <Input
                          type="number"
                          value={formData[`variable${idx + 1}X` as keyof typeof formData] as number}
                          onChange={(e) => setFormData(prev => ({ ...prev, [`variable${idx + 1}X`]: parseInt(e.target.value) }))}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Y Position</Label>
                        <Input
                          type="number"
                          value={formData[`variable${idx + 1}Y` as keyof typeof formData] as number}
                          onChange={(e) => setFormData(prev => ({ ...prev, [`variable${idx + 1}Y`]: parseInt(e.target.value) }))}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Font Size</Label>
                        <Input
                          type="number"
                          value={formData[`variable${idx + 1}FontSize` as keyof typeof formData] as number}
                          onChange={(e) => setFormData(prev => ({ ...prev, [`variable${idx + 1}FontSize`]: parseInt(e.target.value) }))}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Color</Label>
                        <Input
                          type="color"
                          value={formData[`variable${idx + 1}Color` as keyof typeof formData] as string}
                          onChange={(e) => setFormData(prev => ({ ...prev, [`variable${idx + 1}Color`]: e.target.value }))}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter>
                {!editingTemplate && (
                  <Button variant="outline" type="button" onClick={() => setCurrentStep(1)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                )}
                <Button variant="outline" type="button" onClick={handleCloseDialog}>
                  Batal
                </Button>
                <Button type="submit" disabled={isLoading || uploading}>
                  {(isLoading || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {uploading ? 'Uploading...' : 'Simpan'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Preview Template</DialogTitle>
          </DialogHeader>
          {viewingTemplate && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">{viewingTemplate.templateName}</h3>
                <p className="text-sm text-muted-foreground">{viewingTemplate.description}</p>
              </div>
              {viewingTemplate.imageUrl && (
                <div className="border rounded-lg overflow-hidden">
                  <img src={viewingTemplate.imageUrl} alt={viewingTemplate.templateName} className="w-full" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: viewingTemplate.variableCount }).map((_, idx) => {
                  const varName = viewingTemplate[`variable${idx + 1}Name` as keyof CertificateTemplate];
                  if (varName) {
                    return (
                      <div key={idx} className="text-sm">
                        <span className="font-medium">Variable {idx + 1}:</span> {String(varName)}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
