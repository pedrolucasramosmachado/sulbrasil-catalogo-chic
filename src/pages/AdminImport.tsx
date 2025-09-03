import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileSpreadsheet, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AdminHeader } from '@/components/AdminHeader';

interface ProductData {
  name: string;
  description?: string;
  price?: number;
  category: string;
  whatsapp_message?: string;
  tags?: string[];
  is_featured?: boolean;
}

const AdminImport = () => {
  const [csvData, setCsvData] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const parseCsvData = (csv: string): ProductData[] => {
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const product: any = {};
      
      headers.forEach((header, index) => {
        const value = values[index];
        switch(header.toLowerCase()) {
          case 'name':
          case 'nome':
            product.name = value;
            break;
          case 'description':
          case 'descricao':
          case 'descrição':
            product.description = value;
            break;
          case 'price':
          case 'preco':
          case 'preço':
            product.price = parseFloat(value) || 0;
            break;
          case 'category':
          case 'categoria':
            product.category = value;
            break;
          case 'whatsapp_message':
          case 'mensagem':
            product.whatsapp_message = value;
            break;
          case 'tags':
            product.tags = value ? value.split(';').map(t => t.trim()) : [];
            break;
          case 'is_featured':
          case 'destaque':
            product.is_featured = value.toLowerCase() === 'true' || value === '1';
            break;
        }
      });
      
      return product;
    });
  };

  const uploadImages = async (files: FileList) => {
    const uploadPromises = Array.from(files).map(async (file, index) => {
      if (!file.type.startsWith('image/')) return null;
      
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('catalog')
        .upload(fileName, file);
      
      if (error) {
        console.error('Error uploading file:', error);
        return null;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('catalog')
        .getPublicUrl(fileName);
      
      setUploadProgress(((index + 1) / files.length) * 50);
      
      return {
        originalName: file.name,
        url: publicUrl
      };
    });
    
    const results = await Promise.all(uploadPromises);
    return results.filter(r => r !== null);
  };

  const handleImport = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast({
        title: 'Erro',
        description: 'Selecione pelo menos uma imagem',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('Fazendo upload das imagens...');

    try {
      // Upload images
      const imageUploads = await uploadImages(selectedFiles);
      
      setUploadStatus('Processando dados do CSV...');
      setUploadProgress(60);
      
      // Parse CSV data
      const productsData = csvData ? parseCsvData(csvData) : [];
      
      // Match images to products by filename
      const products = productsData.map(product => {
        const matchingImage = imageUploads.find(img => 
          img?.originalName.toLowerCase().includes(product.name.toLowerCase()) ||
          product.name.toLowerCase().includes(img?.originalName.toLowerCase().split('.')[0] || '')
        );
        
        return {
          ...product,
          image_url: matchingImage?.url || null
        };
      });
      
      // If no CSV data, create products from image names
      if (products.length === 0) {
        imageUploads.forEach(img => {
          if (img) {
            const productName = img.originalName.split('.')[0].replace(/-/g, ' ');
            products.push({
              name: productName,
              category: 'Geral',
              image_url: img.url
            });
          }
        });
      }
      
      setUploadStatus('Salvando produtos no banco de dados...');
      setUploadProgress(80);
      
      // Insert products into database
      const { error } = await supabase
        .from('products')
        .insert(products);
      
      if (error) {
        throw error;
      }
      
      setUploadProgress(100);
      setUploadStatus('Importação concluída com sucesso!');
      
      toast({
        title: 'Sucesso!',
        description: `${products.length} produtos importados com sucesso`,
      });
      
      // Clear form
      setCsvData('');
      setSelectedFiles(null);
      
    } catch (error) {
      console.error('Error importing products:', error);
      toast({
        title: 'Erro na importação',
        description: 'Ocorreu um erro ao importar os produtos',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => {
        setUploadProgress(0);
        setUploadStatus('');
      }, 3000);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <AdminHeader 
          title="Importador de Catálogo - Sulbrasil" 
          description="Faça upload das imagens e dados dos produtos" 
        />

        {/* Upload Progress */}
        {(isUploading || uploadProgress > 0) && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {uploadStatus}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {uploadProgress}%
                  </span>
                </div>
                <Progress value={uploadProgress} />
                {uploadProgress === 100 && (
                  <div className="flex items-center text-green-600 text-sm">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Importação concluída!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Image Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Upload de Imagens
            </CardTitle>
            <CardDescription>
              Selecione todas as imagens dos produtos (JPG, PNG, WebP)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setSelectedFiles(e.target.files)}
              className="cursor-pointer"
            />
            {selectedFiles && (
              <p className="text-sm text-muted-foreground mt-2">
                {selectedFiles.length} imagem(ns) selecionada(s)
              </p>
            )}
          </CardContent>
        </Card>

        {/* CSV Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileSpreadsheet className="h-5 w-5 mr-2" />
              Dados dos Produtos (Opcional)
            </CardTitle>
            <CardDescription>
              Cole os dados CSV ou deixe em branco para usar apenas nomes das imagens
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="csv-data">Dados CSV</Label>
              <Textarea
                id="csv-data"
                placeholder="nome,descricao,preco,categoria,mensagem,tags,destaque&#10;Produto 1,Descrição do produto,29.99,Categoria A,Olá! Tenho interesse neste produto,tag1;tag2,true"
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
            </div>
            
            <Alert>
              <AlertDescription>
                <strong>Formato CSV esperado:</strong><br />
                nome,descricao,preco,categoria,mensagem,tags,destaque<br />
                <em>Tags separadas por ";" e destaque como "true" ou "false"</em>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Import Button */}
        <Card>
          <CardContent className="pt-6">
            <Button 
              onClick={handleImport} 
              disabled={isUploading}
              className="w-full"
              size="lg"
            >
              {isUploading ? 'Importando...' : 'Importar Produtos'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminImport;