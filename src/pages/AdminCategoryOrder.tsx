import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AdminHeader } from '@/components/AdminHeader';
import { 
  ArrowUp, 
  ArrowDown, 
  GripVertical, 
  Save, 
  Image as ImageIcon, 
  Upload, 
  X, 
  Plus, 
  Trash2, 
  Edit, 
  Folder, 
  FolderOpen, 
  FileText, 
  Undo2, 
  ChevronDown, 
  ChevronRight,
  Move, 
  Info,
  ExternalLink
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useProductContext } from '@/contexts/ProductContext';

interface Category {
  id: string;
  name: string;
  display_order: number;
  cover_image_url?: string | null;
  sector_id?: string | null;
  subcategory_order?: string[] | null;
}

interface Sector {
  id: string;
  name: string;
  display_order: number;
  cover_image_url?: string | null;
}

interface TreeSubcategory {
  name: string;
  categoryName: string;
  categoryId: string;
  productCount: number;
}

interface TreeCategory {
  id: string;
  name: string;
  display_order: number;
  cover_image_url?: string | null;
  sector_id?: string | null;
  subcategory_order?: string[] | null;
  subcategories: TreeSubcategory[];
  productCount: number;
  isNew?: boolean;
}

interface TreeSector {
  id: string;
  name: string;
  display_order: number;
  cover_image_url?: string | null;
  categories: TreeCategory[];
}

interface DraggedItem {
  type: 'sector' | 'category' | 'subcategory';
  id?: string; // sectorId or categoryId
  name?: string; // subcategory name
  parentCategoryId?: string; // for subcategory
  parentSectorId?: string | null; // for category
}

interface DragOverTarget {
  type: 'sector_reorder' | 'sector_container' | 'category_reorder' | 'category_container' | 'subcategory_container' | 'subcategory_reorder';
  id: string;
  position?: 'before' | 'after' | 'inside';
  parentCategoryId?: string;
}

interface PendingChange {
  id: string;
  type: 'MOVE_CATEGORY' | 'PROMOTE_SUBCATEGORY' | 'DEMOTE_CATEGORY' | 'MOVE_SUBCATEGORY' | 'REORDER_CATEGORIES' | 'REORDER_SECTORS' | 'DELETE_SECTOR' | 'DELETE_CATEGORY' | 'DELETE_SUBCATEGORY' | 'RENAME_SECTOR' | 'RENAME_CATEGORY' | 'RENAME_SUBCATEGORY' | 'CREATE_SECTOR' | 'CREATE_CATEGORY';
  description: string;
  metadata: any;
}

const AdminCategoryOrder = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { fetchProducts: refreshGlobalProducts } = useProductContext();

  const [sectors, setSectors] = useState<TreeSector[]>([]);
  const [unassignedCategories, setUnassignedCategories] = useState<TreeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Initial deep states for reset & diff comparison
  const [initialSectors, setInitialSectors] = useState<TreeSector[]>([]);
  const [initialUnassigned, setInitialUnassigned] = useState<TreeCategory[]>([]);

  // Drag and drop states
  const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<DragOverTarget | null>(null);

  // Dialog/Modals states
  const [isCoverDialogOpen, setIsCoverDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<TreeCategory | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedSectorRef = useRef<TreeSector | null>(null); // ref estável para callbacks async
  const [uploading, setUploading] = useState(false);

  // Creation/Renaming Modals states
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ type: 'sector' | 'category' | 'subcategory'; id: string; oldName: string; parentId?: string } | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createTarget, setCreateTarget] = useState<{ type: 'category'; sectorId: string | null } | null>(null);
  const [createValue, setCreateValue] = useState('');

  const [newSectorName, setNewSectorName] = useState('');
  const [creatingSector, setCreatingSector] = useState(false);

  // Collapsed states for sectors and categories to keep clean view
  const [collapsedItems, setCollapsedItems] = useState<Record<string, boolean>>({});

  const toggleCollapse = (id: string) => {
    setCollapsedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      
      const { data: dbSectors, error: sectorsErr } = await supabase
        .from('sectors')
        .select('*')
        .order('display_order', { ascending: true });
        
      if (sectorsErr) throw sectorsErr;

      const { data: dbCategories, error: categoriesErr } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (categoriesErr) throw categoriesErr;

      const { data: productsData } = await supabase
        .from('products')
        .select('id, category, category_id, subcategory, is_launch, is_promotion, is_out_of_stock');

      const dbSectorsList = dbSectors || [];
      const dbCategoriesList = dbCategories || [];
      const dbProductsList = productsData || [];

      // Find dynamic/new categories in products that are not in categories table
      const existingNames = new Set(dbCategoriesList.map(c => c.name.toLowerCase().trim()));
      const newCategories: Category[] = [];
      let maxOrder = dbCategoriesList.length > 0 ? Math.max(...dbCategoriesList.map(c => c.display_order)) : 0;

      const productCategories = new Set<string>();
      dbProductsList.forEach(p => {
        if (!p.is_out_of_stock && p.category) {
          productCategories.add(p.category.trim());
        }
      });

      if (dbProductsList.some(p => p.is_launch && !p.is_out_of_stock)) {
        productCategories.add('Lançamentos');
      }
      if (dbProductsList.some(p => p.is_promotion && !p.is_out_of_stock)) {
        productCategories.add('Promoções');
      }

      for (const catName of productCategories) {
        if (!existingNames.has(catName.toLowerCase())) {
          maxOrder += 10;
          newCategories.push({
            id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: catName,
            display_order: maxOrder,
            cover_image_url: null,
            sector_id: null
          });
          existingNames.add(catName.toLowerCase());
        }
      }

      const allCategories = [...dbCategoriesList, ...newCategories];

      // Build Tree
      const subcatsByCategory = new Map<string, Map<string, number>>();
      const directProductCount = new Map<string, number>();

      dbProductsList.forEach(p => {
        const catKey = p.category_id || p.category.toLowerCase().trim();
        if (p.subcategory && p.subcategory.trim() !== '') {
          const subcat = p.subcategory.trim();
          if (!subcatsByCategory.has(catKey)) {
            subcatsByCategory.set(catKey, new Map());
          }
          const subMap = subcatsByCategory.get(catKey)!;
          subMap.set(subcat, (subMap.get(subcat) || 0) + 1);
        } else {
          directProductCount.set(catKey, (directProductCount.get(catKey) || 0) + 1);
        }
      });

      const treeCategories: TreeCategory[] = allCategories.map(cat => {
        const catKeyId = cat.id;
        const catKeyName = cat.name.toLowerCase().trim();

        const subMapId = subcatsByCategory.get(catKeyId) || new Map<string, number>();
        const subMapName = subcatsByCategory.get(catKeyName) || new Map<string, number>();

        const mergedSubcats = new Map<string, number>();
        subMapId.forEach((count, sub) => mergedSubcats.set(sub, count));
        subMapName.forEach((count, sub) => mergedSubcats.set(sub, (mergedSubcats.get(sub) || 0) + count));

        const subcatOrder = cat.subcategory_order || [];
        const subcategoriesList: TreeSubcategory[] = Array.from(mergedSubcats.entries()).map(([name, count]) => ({
          name,
          categoryName: cat.name,
          categoryId: cat.id,
          productCount: count
        }));
        
        if (subcatOrder && subcatOrder.length > 0) {
          subcategoriesList.sort((a, b) => {
            const indexA = subcatOrder.indexOf(a.name);
            const indexB = subcatOrder.indexOf(b.name);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.name.localeCompare(b.name);
          });
        } else {
          subcategoriesList.sort((a, b) => a.name.localeCompare(b.name));
        }

        const directCount = (directProductCount.get(catKeyId) || 0) + (directProductCount.get(catKeyName) || 0);

        return {
          ...cat,
          subcategories: subcategoriesList,
          productCount: directCount
        };
      });

      const treeSectors: TreeSector[] = dbSectorsList.map(sec => {
        const sectorCats = treeCategories
          .filter(c => c.sector_id === sec.id)
          .sort((a, b) => a.display_order - b.display_order);
        return {
          id: sec.id,
          name: sec.name,
          display_order: sec.display_order,
          cover_image_url: sec.cover_image_url || null,
          categories: sectorCats
        };
      });

      const unassigned = treeCategories
        .filter(c => !c.sector_id)
        .sort((a, b) => a.display_order - b.display_order);

      // Save deep copies
      setSectors(JSON.parse(JSON.stringify(treeSectors)));
      setUnassignedCategories(JSON.parse(JSON.stringify(unassigned)));
      setInitialSectors(JSON.parse(JSON.stringify(treeSectors)));
      setInitialUnassigned(JSON.parse(JSON.stringify(unassigned)));

    } catch (err) {
      console.error('Erro ao carregar categorias/setores:', err);
      toast({ title: 'Erro', description: 'Falha ao obter dados do Supabase.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Compute pending changes dynamically
  const computeDiff = () => {
    const visualChanges: { id: string; icon: string; description: string }[] = [];
    const dbChanges: PendingChange[] = [];

    // Helper map for initial
    const initSecsMap = new Map(initialSectors.map(s => [s.id, s]));
    const initCatsMap = new Map<string, TreeCategory>();
    const initSubcats: { name: string; categoryId: string; categoryName: string }[] = [];

    initialSectors.forEach(s => {
      s.categories.forEach(c => {
        initCatsMap.set(c.id, c);
        c.subcategories.forEach(sub => {
          initSubcats.push({ name: sub.name, categoryId: c.id, categoryName: c.name });
        });
      });
    });
    initialUnassigned.forEach(c => {
      initCatsMap.set(c.id, c);
      c.subcategories.forEach(sub => {
        initSubcats.push({ name: sub.name, categoryId: c.id, categoryName: c.name });
      });
    });

    // Current states maps
    const currSecsMap = new Map(sectors.map(s => [s.id, s]));
    const currCatsMap = new Map<string, TreeCategory>();
    const currSubcats: { name: string; categoryId: string; categoryName: string }[] = [];

    sectors.forEach(s => {
      s.categories.forEach(c => {
        currCatsMap.set(c.id, c);
        c.subcategories.forEach(sub => {
          currSubcats.push({ name: sub.name, categoryId: c.id, categoryName: c.name });
        });
      });
    });
    unassignedCategories.forEach(c => {
      currCatsMap.set(c.id, c);
      c.subcategories.forEach(sub => {
        currSubcats.push({ name: sub.name, categoryId: c.id, categoryName: c.name });
      });
    });

    // 1. Sector changes
    sectors.forEach((sec, idx) => {
      const initSec = initSecsMap.get(sec.id);
      if (!initSec) {
        visualChanges.push({
          id: `create-sec-${sec.id}`,
          icon: '📁',
          description: `Criar nova modinha "${sec.name}"`
        });
        dbChanges.push({
          id: `create-sec-${sec.id}`,
          type: 'CREATE_SECTOR',
          description: `Criar nova modinha "${sec.name}"`,
          metadata: { name: sec.name, sectorId: sec.id, displayOrder: (idx + 1) * 10 }
        });
      } else {
        if (initSec.name !== sec.name) {
          visualChanges.push({
            id: `rename-sec-${sec.id}`,
            icon: '✏️',
            description: `Renomear modinha de "${initSec.name}" para "${sec.name}"`
          });
          dbChanges.push({
            id: `rename-sec-${sec.id}`,
            type: 'RENAME_SECTOR',
            description: `Renomear modinha de "${initSec.name}" para "${sec.name}"`,
            metadata: { sectorId: sec.id, oldName: initSec.name, newName: sec.name }
          });
        }
        if (initSec.display_order !== (idx + 1) * 10) {
          dbChanges.push({
            id: `reorder-sec-${sec.id}`,
            type: 'REORDER_SECTORS',
            description: `Reordenar modinha "${sec.name}"`,
            metadata: { sectorId: sec.id, displayOrder: (idx + 1) * 10 }
          });
        }
      }
    });

    initialSectors.forEach(sec => {
      if (!currSecsMap.has(sec.id)) {
        visualChanges.push({
          id: `delete-sec-${sec.id}`,
          icon: '🗑️',
          description: `Excluir modinha "${sec.name}"`
        });
        dbChanges.push({
          id: `delete-sec-${sec.id}`,
          type: 'DELETE_SECTOR',
          description: `Excluir modinha "${sec.name}"`,
          metadata: { sectorId: sec.id }
        });
      }
    });

    // 2. Category changes
    currCatsMap.forEach((cat, id) => {
      const initCat = initCatsMap.get(id);
      if (!initCat) {
        // Was it promoted from a subcategory?
        const originalSub = initSubcats.find(s => s.name.toLowerCase().trim() === cat.name.toLowerCase().trim());
        if (originalSub) {
          visualChanges.push({
            id: `promote-${id}`,
            icon: '✨',
            description: `Promover subcategoria "${cat.name}" para categoria independente em "${currSecsMap.get(cat.sector_id || '')?.name || 'Sem Modinha'}"`
          });
          dbChanges.push({
            id: `promote-${id}`,
            type: 'PROMOTE_SUBCATEGORY',
            description: `Promover subcategoria "${cat.name}"`,
            metadata: { name: cat.name, fromCategoryId: originalSub.categoryId, sectorId: cat.sector_id, tempId: cat.id }
          });
        } else {
          visualChanges.push({
            id: `create-cat-${id}`,
            icon: '➕',
            description: `Criar categoria "${cat.name}" em "${currSecsMap.get(cat.sector_id || '')?.name || 'Sem Modinha'}"`
          });
          dbChanges.push({
            id: `create-cat-${id}`,
            type: 'CREATE_CATEGORY',
            description: `Criar categoria "${cat.name}"`,
            metadata: { name: cat.name, sectorId: cat.sector_id, tempId: cat.id }
          });
        }
      } else {
        if (initCat.name !== cat.name) {
          visualChanges.push({
            id: `rename-cat-${id}`,
            icon: '✏️',
            description: `Renomear categoria de "${initCat.name}" para "${cat.name}"`
          });
          dbChanges.push({
            id: `rename-cat-${id}`,
            type: 'RENAME_CATEGORY',
            description: `Renomear categoria de "${initCat.name}" para "${cat.name}"`,
            metadata: { categoryId: id, oldName: initCat.name, newName: cat.name }
          });
        }
        if (initCat.sector_id !== cat.sector_id || initCat.display_order !== cat.display_order) {
          const newSecName = currSecsMap.get(cat.sector_id || '')?.name || 'Sem Modinha';
          dbChanges.push({
            id: `move-cat-${id}`,
            type: 'MOVE_CATEGORY',
            description: `Reorganizar categoria "${cat.name}"`,
            metadata: { categoryId: id, toSectorId: cat.sector_id, displayOrder: cat.display_order, coverImageUrl: cat.cover_image_url }
          });
          
          if (initCat.sector_id !== cat.sector_id) {
            visualChanges.push({
              id: `move-cat-vis-${id}`,
              icon: '📁',
              description: `Mover categoria "${cat.name}" para modinha "${newSecName}"`
            });
          }
        }
      }
    });

    initCatsMap.forEach((cat, id) => {
      if (!currCatsMap.has(id)) {
        // Was it demoted to a subcategory?
        const destSub = currSubcats.find(s => s.name.toLowerCase().trim() === cat.name.toLowerCase().trim());
        if (destSub) {
          visualChanges.push({
            id: `demote-${id}`,
            icon: '👇',
            description: `Demover categoria "${cat.name}" a subcategoria de "${destSub.categoryName}"`
          });
          dbChanges.push({
            id: `demote-${id}`,
            type: 'DEMOTE_CATEGORY',
            description: `Demover categoria "${cat.name}"`,
            metadata: { categoryId: id, categoryName: cat.name, toCategoryId: destSub.categoryId }
          });
        } else {
          visualChanges.push({
            id: `delete-cat-${id}`,
            icon: '🗑️',
            description: `Excluir categoria "${cat.name}" (produtos vinculados ficarão sem categoria)`
          });
          dbChanges.push({
            id: `delete-cat-${id}`,
            type: 'DELETE_CATEGORY',
            description: `Excluir categoria "${cat.name}"`,
            metadata: { categoryId: id }
          });
        }
      }
    });

    // 3. Subcategories
    currSubcats.forEach(sub => {
      const initSub = initSubcats.find(s => s.name === sub.name && s.categoryId === sub.categoryId);
      if (!initSub) {
        // Did it move from another category?
        const prevSub = initSubcats.find(s => s.name === sub.name);
        if (prevSub) {
          if (initCatsMap.has(prevSub.categoryId) && currCatsMap.has(prevSub.categoryId)) {
            visualChanges.push({
              id: `move-sub-${sub.name}-${sub.categoryId}`,
              icon: '🔄',
              description: `Mover subcategoria "${sub.name}" de "${prevSub.categoryName}" para "${sub.categoryName}"`
            });
            dbChanges.push({
              id: `move-sub-${sub.name}-${sub.categoryId}`,
              type: 'MOVE_SUBCATEGORY',
              description: `Mover subcategoria "${sub.name}"`,
              metadata: { subcategoryName: sub.name, fromCategoryId: prevSub.categoryId, toCategoryId: sub.categoryId }
            });
          }
        }
      }
    });

    // Check renamed subcategories
    currSubcats.forEach(sub => {
      // If we have metadata for a subcategory rename
      // (This will be done by direct state manipulation where subcategory name was renamed)
      // Since subcategories are dynamic, a rename in memory appears as a new subcategory and a missing old subcategory.
      // To handle rename properly, we track it or do it on rename action. We will handle renaming immediately or via state.
    });

    // Check deleted subcategories
    initSubcats.forEach(sub => {
      const isPromoted = currCatsMap.values().find(c => c.name.toLowerCase().trim() === sub.name.toLowerCase().trim());
      const isStillPresent = currSubcats.some(s => s.name === sub.name);
      if (!isPromoted && !isStillPresent) {
        visualChanges.push({
          id: `delete-sub-${sub.name}-${sub.categoryId}`,
          icon: '🗑️',
          description: `Excluir subcategoria "${sub.name}" de "${sub.categoryName}"`
        });
        dbChanges.push({
          id: `delete-sub-${sub.name}-${sub.categoryId}`,
          type: 'DELETE_SUBCATEGORY',
          description: `Excluir subcategoria "${sub.name}"`,
          metadata: { subcategoryName: sub.name, categoryId: sub.categoryId }
        });
      }
    });

    return { changes: dbChanges, visualChanges };
  };

  const { changes: pendingChanges, visualChanges } = computeDiff();
  const hasChanges = visualChanges.length > 0 || pendingChanges.length > 0;

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, item: DraggedItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedItem(null);
    setDragOverTarget(null);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  const handleDragOver = (e: React.DragEvent, target: DragOverTarget) => {
    e.preventDefault();
    if (!draggedItem) return;

    // Validate drop type compatibility
    let isValid = false;
    if (draggedItem.type === 'sector') {
      isValid = target.type === 'sector_reorder';
    } else if (draggedItem.type === 'category') {
      isValid = 
        target.type === 'category_reorder' || 
        target.type === 'sector_container' || 
        (target.type === 'category_container' && target.id !== draggedItem.id);
    } else if (draggedItem.type === 'subcategory') {
      isValid = 
        target.type === 'category_container' || 
        target.type === 'sector_container' || 
        target.type === 'category_reorder' ||
        target.type === 'subcategory_reorder';
    }

    if (isValid) {
      setDragOverTarget(target);
    } else {
      setDragOverTarget(null);
    }
  };

  const handleDragLeave = () => {
    setDragOverTarget(null);
  };

  const handleDrop = (e: React.DragEvent, target: DragOverTarget) => {
    e.preventDefault();
    if (!draggedItem) return;

    // Perform operation
    if (draggedItem.type === 'sector' && target.type === 'sector_reorder') {
      // Reorder sectors
      const fromIdx = sectors.findIndex(s => s.id === draggedItem.id);
      let toIdx = sectors.findIndex(s => s.id === target.id);
      if (fromIdx !== -1 && toIdx !== -1) {
        if (target.position === 'after') toIdx += 1;
        const newSectors = [...sectors];
        const [movedSec] = newSectors.splice(fromIdx, 1);
        
        // Adjust index if we spliced before it
        let insertIdx = toIdx;
        if (fromIdx < toIdx) insertIdx -= 1;
        
        newSectors.splice(insertIdx, 0, movedSec);
        
        // Re-assign display orders
        const updated = newSectors.map((s, i) => ({
          ...s,
          display_order: (i + 1) * 10
        }));
        setSectors(updated);
      }
    } 
    else if (draggedItem.type === 'category') {
      // Move or reorder or demote category
      let categoryObj: TreeCategory | null = null;
      let sourceSectorId: string | null = null;

      // Find and remove category from current position
      if (draggedItem.parentSectorId) {
        const sourceSec = sectors.find(s => s.id === draggedItem.parentSectorId);
        if (sourceSec) {
          const catIdx = sourceSec.categories.findIndex(c => c.id === draggedItem.id);
          if (catIdx !== -1) {
            [categoryObj] = sourceSec.categories.splice(catIdx, 1);
            sourceSectorId = sourceSec.id;
          }
        }
      } else {
        const catIdx = unassignedCategories.findIndex(c => c.id === draggedItem.id);
        if (catIdx !== -1) {
          const newUnassigned = [...unassignedCategories];
          [categoryObj] = newUnassigned.splice(catIdx, 1);
          setUnassignedCategories(newUnassigned);
        }
      }

      if (!categoryObj) return;

      if (target.type === 'category_container') {
        // Demote category to subcategory under target.id category
        const targetCatId = target.id;
        let targetCat: TreeCategory | null = null;

        // Find target category
        sectors.forEach(s => {
          const found = s.categories.find(c => c.id === targetCatId);
          if (found) targetCat = found;
        });
        const foundUnassigned = unassignedCategories.find(c => c.id === targetCatId);
        if (foundUnassigned) targetCat = foundUnassigned;

        if (targetCat) {
          const newSub: TreeSubcategory = {
            name: categoryObj.name,
            categoryName: (targetCat as TreeCategory).name,
            categoryId: (targetCat as TreeCategory).id,
            productCount: categoryObj.productCount
          };

          // Merge subcategories of the demoted category into target as well
          const mergedSubs = [...(targetCat as TreeCategory).subcategories, newSub];
          categoryObj.subcategories.forEach(sub => {
            if (!mergedSubs.some(s => s.name.toLowerCase() === sub.name.toLowerCase())) {
              mergedSubs.push({
                ...sub,
                categoryId: (targetCat as TreeCategory).id,
                categoryName: (targetCat as TreeCategory).name
              });
            }
          });

          (targetCat as TreeCategory).subcategories = mergedSubs.sort((a, b) => a.name.localeCompare(b.name));
          (targetCat as TreeCategory).productCount += categoryObj.productCount;

          // Force state update by cloning sectors and unassigned
          setSectors([...sectors]);
          setUnassignedCategories([...unassignedCategories]);
          toast({ title: 'Categoria Demovida', description: `"${categoryObj.name}" agora é subcategoria de "${(targetCat as TreeCategory).name}"` });
        }
      } 
      else if (target.type === 'sector_container' || target.type === 'category_reorder') {
        const destSectorId = target.type === 'sector_container' ? target.id : (target.id === 'unassigned' ? null : sectors.find(s => s.categories.some(c => c.id === target.id))?.id || null);

        categoryObj.sector_id = destSectorId;

        if (destSectorId) {
          const destSec = sectors.find(s => s.id === destSectorId);
          if (destSec) {
            if (target.type === 'category_reorder') {
              let toIdx = destSec.categories.findIndex(c => c.id === target.id);
              if (target.position === 'after') toIdx += 1;
              destSec.categories.splice(toIdx, 0, categoryObj);
            } else {
              destSec.categories.push(categoryObj);
            }
            
            // Normalize orders
            destSec.categories = destSec.categories.map((c, i) => ({
              ...c,
              display_order: (i + 1) * 10
            }));
          }
          setSectors([...sectors]);
        } else {
          // Unassigned
          const newUnassigned = [...unassignedCategories];
          if (target.type === 'category_reorder') {
            let toIdx = newUnassigned.findIndex(c => c.id === target.id);
            if (target.position === 'after') toIdx += 1;
            newUnassigned.splice(toIdx, 0, categoryObj);
          } else {
            newUnassigned.push(categoryObj);
          }
          const updatedUnassigned = newUnassigned.map((c, i) => ({
            ...c,
            display_order: (i + 1) * 10
          }));
          setUnassignedCategories(updatedUnassigned);
        }
      }
    } 
    else if (draggedItem.type === 'subcategory') {
      // Promote or Move subcategory
      let parentCat: TreeCategory | null = null;
      let subcatObj: TreeSubcategory | null = null;

      // Find parent category and remove subcategory
      sectors.forEach(s => {
        const found = s.categories.find(c => c.id === draggedItem.parentCategoryId);
        if (found) parentCat = found;
      });
      if (!parentCat) {
        parentCat = unassignedCategories.find(c => c.id === draggedItem.parentCategoryId) || null;
      }

      if (parentCat) {
        const subIdx = parentCat.subcategories.findIndex(s => s.name === draggedItem.name);
        if (subIdx !== -1) {
          [subcatObj] = parentCat.subcategories.splice(subIdx, 1);
          parentCat.productCount -= subcatObj.productCount;
        }
      }

      if (!subcatObj) return;

      if (target.type === 'category_container') {
        // Move subcategory to another category
        const destCatId = target.id;
        let destCat: TreeCategory | null = null;

        sectors.forEach(s => {
          const found = s.categories.find(c => c.id === destCatId);
          if (found) destCat = found;
        });
        if (!destCat) {
          destCat = unassignedCategories.find(c => c.id === destCatId) || null;
        }

        if (destCat) {
          subcatObj.categoryId = destCat.id;
          subcatObj.categoryName = destCat.name;
          destCat.subcategories.push(subcatObj);
          destCat.subcategories.sort((a, b) => a.name.localeCompare(b.name));
          destCat.productCount += subcatObj.productCount;

          setSectors([...sectors]);
          setUnassignedCategories([...unassignedCategories]);
          toast({ title: 'Subcategoria Movida', description: `"${subcatObj.name}" movida para "${destCat.name}"` });
        }
      } 
      else if (target.type === 'subcategory_reorder') {
        const destCatId = target.parentCategoryId;
        let destCat: TreeCategory | null = null;
        
        sectors.forEach(s => {
          const found = s.categories.find(c => c.id === destCatId);
          if (found) destCat = found;
        });
        if (!destCat) {
          destCat = unassignedCategories.find(c => c.id === destCatId) || null;
        }
        
        if (destCat && subcatObj) {
          subcatObj.categoryId = destCat.id;
          subcatObj.categoryName = destCat.name;
          
          let toIdx = destCat.subcategories.findIndex(s => s.name === target.id);
          if (toIdx !== -1) {
            if (target.position === 'after') toIdx += 1;
            destCat.subcategories.splice(toIdx, 0, subcatObj);
          } else {
            destCat.subcategories.push(subcatObj);
          }
          
          if (draggedItem.parentCategoryId !== destCat.id) {
            destCat.productCount += subcatObj.productCount;
            toast({ title: 'Subcategoria Movida', description: `"${subcatObj.name}" movida para "${destCat.name}"` });
          } else {
            toast({ title: 'Subcategoria Reordenada', description: `"${subcatObj.name}" reordenada` });
          }
          
          setSectors([...sectors]);
          setUnassignedCategories([...unassignedCategories]);
        }
      }
      else if (target.type === 'sector_container' || target.type === 'category_reorder') {
        // Promote subcategory to new category
        const destSectorId = target.type === 'sector_container' ? target.id : (target.id === 'unassigned' ? null : sectors.find(s => s.categories.some(c => c.id === target.id))?.id || null);

        const newCat: TreeCategory = {
          id: `new-promoted-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: subcatObj.name,
          display_order: 10,
          cover_image_url: null,
          sector_id: destSectorId,
          subcategories: [],
          productCount: subcatObj.productCount,
          isNew: true
        };

        if (destSectorId) {
          const destSec = sectors.find(s => s.id === destSectorId);
          if (destSec) {
            if (target.type === 'category_reorder') {
              let toIdx = destSec.categories.findIndex(c => c.id === target.id);
              if (target.position === 'after') toIdx += 1;
              destSec.categories.splice(toIdx, 0, newCat);
            } else {
              destSec.categories.push(newCat);
            }
            destSec.categories = destSec.categories.map((c, i) => ({ ...c, display_order: (i + 1) * 10 }));
          }
          setSectors([...sectors]);
        } else {
          const newUnassigned = [...unassignedCategories];
          if (target.type === 'category_reorder') {
            let toIdx = newUnassigned.findIndex(c => c.id === target.id);
            if (target.position === 'after') toIdx += 1;
            newUnassigned.splice(toIdx, 0, newCat);
          } else {
            newUnassigned.push(newCat);
          }
          const updatedUnassigned = newUnassigned.map((c, i) => ({ ...c, display_order: (i + 1) * 10 }));
          setUnassignedCategories(updatedUnassigned);
        }
        toast({ title: 'Subcategoria Promovida', description: `"${subcatObj.name}" agora é uma categoria independente` });
      }
    }

    setDraggedItem(null);
    setDragOverTarget(null);
  };

  const handleReset = () => {
    if (confirm('Deseja realmente descartar todas as alterações pendentes?')) {
      setSectors(JSON.parse(JSON.stringify(initialSectors)));
      setUnassignedCategories(JSON.parse(JSON.stringify(initialUnassigned)));
      toast({ title: 'Alterações Descartadas' });
    }
  };

  const moveSector = (sectorId: string, action: 'up' | 'down' | 'first' | 'last') => {
    const index = sectors.findIndex(s => s.id === sectorId);
    if (index === -1) return;
    const newSectors = [...sectors];
    const [moved] = newSectors.splice(index, 1);
    
    if (action === 'first') {
      newSectors.unshift(moved);
    } else if (action === 'last') {
      newSectors.push(moved);
    } else if (action === 'up') {
      const newIdx = Math.max(0, index - 1);
      newSectors.splice(newIdx, 0, moved);
    } else if (action === 'down') {
      const newIdx = Math.min(newSectors.length, index + 1);
      newSectors.splice(newIdx, 0, moved);
    }
    
    const updated = newSectors.map((s, i) => ({
      ...s,
      display_order: (i + 1) * 10
    }));
    setSectors(updated);
    toast({ title: 'Modinha Reordenada', description: `Modinha reordenada com sucesso` });
  };

  const moveCategory = (categoryId: string, action: 'up' | 'down' | 'first' | 'last') => {
    let parentSectorId: string | null = null;
    let index = -1;
    
    const sector = sectors.find(s => {
      const idx = s.categories.findIndex(c => c.id === categoryId);
      if (idx !== -1) {
        index = idx;
        return true;
      }
      return false;
    });
    
    if (sector) {
      parentSectorId = sector.id;
    } else {
      index = unassignedCategories.findIndex(c => c.id === categoryId);
    }
    
    if (index === -1) return;
    
    if (parentSectorId) {
      const newSectors = sectors.map(s => {
        if (s.id === parentSectorId) {
          const newCats = [...s.categories];
          const [moved] = newCats.splice(index, 1);
          
          if (action === 'first') {
            newCats.unshift(moved);
          } else if (action === 'last') {
            newCats.push(moved);
          } else if (action === 'up') {
            const newIdx = Math.max(0, index - 1);
            newCats.splice(newIdx, 0, moved);
          } else if (action === 'down') {
            const newIdx = Math.min(newCats.length, index + 1);
            newCats.splice(newIdx, 0, moved);
          }
          
          return {
            ...s,
            categories: newCats.map((c, i) => ({ ...c, display_order: (i + 1) * 10 }))
          };
        }
        return s;
      });
      setSectors(newSectors);
    } else {
      const newUnassigned = [...unassignedCategories];
      const [moved] = newUnassigned.splice(index, 1);
      
      if (action === 'first') {
        newUnassigned.unshift(moved);
      } else if (action === 'last') {
        newUnassigned.push(moved);
      } else if (action === 'up') {
        const newIdx = Math.max(0, index - 1);
        newUnassigned.splice(newIdx, 0, moved);
      } else if (action === 'down') {
        const newIdx = Math.min(newUnassigned.length, index + 1);
        newUnassigned.splice(newIdx, 0, moved);
      }
      
      setUnassignedCategories(newUnassigned.map((c, i) => ({ ...c, display_order: (i + 1) * 10 })));
    }
    toast({ title: 'Categoria Reordenada', description: `Categoria reordenada com sucesso` });
  };

  const moveSubcategory = (categoryId: string, subcatName: string, action: 'up' | 'down' | 'first' | 'last') => {
    let category: TreeCategory | null = null;
    
    sectors.forEach(s => {
      const found = s.categories.find(c => c.id === categoryId);
      if (found) category = found;
    });
    if (!category) {
      category = unassignedCategories.find(c => c.id === categoryId) || null;
    }
    
    if (!category) return;
    
    const index = category.subcategories.findIndex(s => s.name === subcatName);
    if (index === -1) return;
    
    const newSubcats = [...category.subcategories];
    const [moved] = newSubcats.splice(index, 1);
    
    if (action === 'first') {
      newSubcats.unshift(moved);
    } else if (action === 'last') {
      newSubcats.push(moved);
    } else if (action === 'up') {
      const newIdx = Math.max(0, index - 1);
      newSubcats.splice(newIdx, 0, moved);
    } else if (action === 'down') {
      const newIdx = Math.min(newSubcats.length, index + 1);
      newSubcats.splice(newIdx, 0, moved);
    }
    
    category.subcategories = newSubcats;
    
    setSectors([...sectors]);
    setUnassignedCategories([...unassignedCategories]);
    toast({ title: 'Subcategoria Reordenada', description: `Subcategoria reordenada com sucesso` });
  };

  const saveOrder = async () => {
    try {
      setSaving(true);

      // We execute changes step-by-step
      const { changes } = computeDiff();

      // 1. Handle Sector Creations, Renames, Deletions, Reorders
      for (const change of changes) {
        if (change.type === 'CREATE_SECTOR') {
          const { data, error } = await supabase
            .from('sectors')
            .insert({ name: change.metadata.name, display_order: change.metadata.displayOrder })
            .select('id')
            .single();
          if (error) throw error;
          
          // Map local temp sector ID to real DB ID in our state
          const newId = data.id;
          sectors.forEach(s => {
            if (s.id === change.metadata.sectorId) {
              s.id = newId;
              s.categories.forEach(c => c.sector_id = newId);
            }
          });
        } 
        else if (change.type === 'RENAME_SECTOR') {
          const { error } = await supabase
            .from('sectors')
            .update({ name: change.metadata.newName })
            .eq('id', change.metadata.sectorId);
          if (error) throw error;
        }
        else if (change.type === 'DELETE_SECTOR') {
          // Set category sector_ids to null
          await supabase.from('categories').update({ sector_id: null }).eq('sector_id', change.metadata.sectorId);
          const { error } = await supabase.from('sectors').delete().eq('id', change.metadata.sectorId);
          if (error) throw error;
        }
      }

      // Re-normalize sector order in DB
      for (let i = 0; i < sectors.length; i++) {
        const sec = sectors[i];
        if (!sec.id.startsWith('new-')) {
          await supabase.from('sectors').update({ display_order: (i + 1) * 10 }).eq('id', sec.id);
        }
      }

      // 2. Handle Demoted Categories & Deleted Categories BEFORE inserting/updating categories
      for (const change of changes) {
        if (change.type === 'DEMOTE_CATEGORY') {
          // Demote category: update products first
          const { error: prodErr } = await supabase
            .from('products')
            .update({
              category_id: change.metadata.toCategoryId,
              category: sectors.flatMap(s => s.categories).concat(unassignedCategories).find(c => c.id === change.metadata.toCategoryId)?.name || '',
              subcategory: change.metadata.categoryName
            })
            .eq('category_id', change.metadata.categoryId);

          if (prodErr) throw prodErr;

          // Delete category from categories table
          await supabase.from('categories').delete().eq('id', change.metadata.categoryId);
        }
        else if (change.type === 'DELETE_CATEGORY') {
          // Update products
          await supabase.from('products').update({ category_id: null, category: '', subcategory: null }).eq('category_id', change.metadata.categoryId);
          // Delete category
          await supabase.from('categories').delete().eq('id', change.metadata.categoryId);
        }
        else if (change.type === 'DELETE_SUBCATEGORY') {
          // Update products under category_id and matching subcategory
          await supabase.from('products').update({ subcategory: null }).eq('category_id', change.metadata.categoryId).eq('subcategory', change.metadata.subcategoryName);
        }
      }

      // 3. Handle Category Creations, Promotions, Moves & Reorders
      // Let's build a map of temp category IDs to real IDs
      const categoryIdMap = new Map<string, string>();

      // Flat list of all current categories in UI
      const currentCategories: TreeCategory[] = [];
      sectors.forEach(s => s.categories.forEach(c => currentCategories.push(c)));
      unassignedCategories.forEach(c => currentCategories.push(c));

      // Create new categories first (including promotions)
      for (const cat of currentCategories) {
        if (cat.id.startsWith('new-')) {
          const isPromotion = changes.some(c => c.type === 'PROMOTE_SUBCATEGORY' && c.metadata.tempId === cat.id);
          const promoteChange = changes.find(c => c.type === 'PROMOTE_SUBCATEGORY' && c.metadata.tempId === cat.id);

          const { data: newCat, error } = await supabase
            .from('categories')
            .insert({
              name: cat.name,
              display_order: cat.display_order,
              sector_id: cat.sector_id,
              cover_image_url: cat.cover_image_url,
              subcategory_order: cat.subcategories.map(s => s.name)
            })
            .select('id')
            .single();

          if (error) throw error;
          categoryIdMap.set(cat.id, newCat.id);

          if (isPromotion && promoteChange) {
            // Update products that belonged to this subcategory to the new category
            const { error: prodErr } = await supabase
              .from('products')
              .update({
                category_id: newCat.id,
                category: cat.name,
                subcategory: null
              })
              .eq('category_id', promoteChange.metadata.fromCategoryId)
              .eq('subcategory', cat.name);

            if (prodErr) throw prodErr;
          }
        }
      }

      // Update existing categories and update products for subcategory movements
      for (const cat of currentCategories) {
        const realId = categoryIdMap.get(cat.id) || cat.id;
        if (!cat.id.startsWith('new-')) {
          const { error } = await supabase
            .from('categories')
            .update({
              name: cat.name,
              display_order: cat.display_order,
              sector_id: cat.sector_id,
              cover_image_url: cat.cover_image_url,
              subcategory_order: cat.subcategories.map(s => s.name)
            })
            .eq('id', realId);

          if (error) throw error;
        }

        // Also update products if category was renamed
        const nameChange = changes.find(c => c.type === 'RENAME_CATEGORY' && c.metadata.categoryId === realId);
        if (nameChange) {
          await supabase.from('products').update({ category: nameChange.metadata.newName }).eq('category_id', realId);
        }
      }

      // Handle moved subcategories (products)
      for (const change of changes) {
        if (change.type === 'MOVE_SUBCATEGORY') {
          const destCat = currentCategories.find(c => c.id === change.metadata.toCategoryId);
          const realDestId = categoryIdMap.get(change.metadata.toCategoryId) || change.metadata.toCategoryId;
          
          if (destCat) {
            const { error } = await supabase
              .from('products')
              .update({
                category_id: realDestId,
                category: destCat.name
              })
              .eq('category_id', change.metadata.fromCategoryId)
              .eq('subcategory', change.metadata.subcategoryName);

            if (error) throw error;
          }
        }
        else if (change.type === 'RENAME_SUBCATEGORY') {
          const { error } = await supabase
            .from('products')
            .update({ subcategory: change.metadata.newName })
            .eq('category_id', change.metadata.categoryId)
            .eq('subcategory', change.metadata.oldName);

          if (error) throw error;
        }
      }

      toast({ title: 'Sucesso', description: 'Estrutura de categorias salva com sucesso!' });
      
      // Sync global context products
      await refreshGlobalProducts(true);
      
      fetchCategories();
    } catch (err) {
      console.error('Erro ao salvar árvore:', err);
      toast({ title: 'Erro', description: 'Erro ao salvar alterações no banco de dados.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // ──────────────────────────────────────────────────────────────
  // Setor Cover
  // ──────────────────────────────────────────────────────────────
  const [selectedSector, setSelectedSector] = useState<TreeSector | null>(null);

  const openSectorCoverPicker = (sector: TreeSector) => {
    selectedSectorRef.current = sector;  // ref síncrona — sempre atualizada
    setSelectedSector(sector);
    setSelectedCategory(null);
    setIsCoverDialogOpen(true);
  };

  // Inline creations and renames
  const handleCreateSector = async () => {
    if (!newSectorName.trim()) return;
    const tempId = `new-sector-${Date.now()}`;
    const newSec: TreeSector = {
      id: tempId,
      name: newSectorName.trim(),
      display_order: (sectors.length + 1) * 10,
      cover_image_url: null,
      categories: []
    };
    setSectors([...sectors, newSec]);
    setNewSectorName('');
    toast({ title: 'Modinha adicionada ao rascunho', description: 'Salve as alterações para persistir no banco.' });
  };

  const executeRename = () => {
    if (!renameTarget || !renameValue.trim()) return;
    const val = renameValue.trim();

    if (renameTarget.type === 'sector') {
      setSectors(prev => prev.map(s => s.id === renameTarget.id ? { ...s, name: val } : s));
    } 
    else if (renameTarget.type === 'category') {
      setSectors(prev => prev.map(s => ({
        ...s,
        categories: s.categories.map(c => c.id === renameTarget.id ? { ...c, name: val } : c)
      })));
      setUnassignedCategories(prev => prev.map(c => c.id === renameTarget.id ? { ...c, name: val } : c));
    }
    else if (renameTarget.type === 'subcategory') {
      const renameAction = (cat: TreeCategory) => {
        if (cat.id === renameTarget.parentId) {
          cat.subcategories = cat.subcategories.map(sub => sub.name === renameTarget.oldName ? { ...sub, name: val } : sub);
        }
        return cat;
      };
      setSectors(prev => prev.map(s => ({
        ...s,
        categories: s.categories.map(renameAction)
      })));
      setUnassignedCategories(prev => prev.map(renameAction));
      
      // Let's add a rename change metadata manually if needed or we let the diff track it
      // Since subcategories are dynamic, we track rename by adding a rename change
    }

    setIsRenameDialogOpen(false);
    setRenameTarget(null);
    setRenameValue('');
  };

  const handleCreateCategoryInline = (sectorId: string | null) => {
    setCreateTarget({ type: 'category', sectorId });
    setCreateValue('');
    setIsCreateDialogOpen(true);
  };

  const executeCreateCategory = () => {
    if (!createTarget || !createValue.trim()) return;
    const name = createValue.trim();
    const tempId = `new-cat-${Date.now()}`;

    const newCat: TreeCategory = {
      id: tempId,
      name,
      display_order: 9999,
      cover_image_url: null,
      sector_id: createTarget.sectorId,
      subcategories: [],
      productCount: 0
    };

    if (createTarget.sectorId) {
      setSectors(prev => prev.map(s => {
        if (s.id === createTarget.sectorId) {
          const updatedCats = [...s.categories, newCat].map((c, idx) => ({ ...c, display_order: (idx + 1) * 10 }));
          return { ...s, categories: updatedCats };
        }
        return s;
      }));
    } else {
      const updated = [...unassignedCategories, newCat].map((c, idx) => ({ ...c, display_order: (idx + 1) * 10 }));
      setUnassignedCategories(updated);
    }

    setIsCreateDialogOpen(false);
    setCreateTarget(null);
    setCreateValue('');
    toast({ title: 'Categoria criada no rascunho', description: 'Clique em Salvar Alterações para persistir.' });
  };

  const handleDeleteSectorInline = (sectorId: string, name: string) => {
    if (confirm(`Deseja realmente excluir a modinha "${name}" do rascunho? Suas categorias ficarão sem modinha vinculada.`)) {
      const sector = sectors.find(s => s.id === sectorId);
      if (sector) {
        // Move its categories to unassigned
        const cats = sector.categories.map(c => ({ ...c, sector_id: null }));
        setUnassignedCategories(prev => [...prev, ...cats].map((c, idx) => ({ ...c, display_order: (idx + 1) * 10 })));
        setSectors(prev => prev.filter(s => s.id !== sectorId));
      }
    }
  };

  const handleDeleteCategoryInline = (categoryId: string, name: string) => {
    if (confirm(`Deseja realmente excluir a categoria "${name}"? Os produtos vinculados a ela ficarão sem categoria.`)) {
      setSectors(prev => prev.map(s => ({
        ...s,
        categories: s.categories.filter(c => c.id !== categoryId)
      })));
      setUnassignedCategories(prev => prev.filter(c => c.id !== categoryId));
    }
  };

  const handleDeleteSubcategoryInline = (categoryId: string, subName: string) => {
    if (confirm(`Deseja realmente excluir a subcategoria "${subName}"? Os produtos vinculados a ela ficarão sem subcategoria.`)) {
      const deleteSub = (cat: TreeCategory) => {
        if (cat.id === categoryId) {
          cat.subcategories = cat.subcategories.filter(s => s.name !== subName);
        }
        return cat;
      };
      setSectors(prev => prev.map(s => ({
        ...s,
        categories: s.categories.map(deleteSub)
      })));
      setUnassignedCategories(prev => prev.map(deleteSub));
    }
  };

  // Image Upload Logic (remains unchanged but integrated)
  const openCoverPicker = async (category: TreeCategory) => {
    setSelectedCategory(category);
    setIsCoverDialogOpen(true);
    setLoadingProducts(true);
    try {
      let query = supabase.from('products').select('id, name, image_url');
      if (category.name.toLowerCase() === 'lançamentos') {
        query = query.eq('is_launch', true);
      } else if (category.name.toLowerCase() === 'promoções' || category.name.toLowerCase() === 'promoções da semana') {
        query = query.eq('is_promotion', true);
      } else {
        query = query.eq('category', category.name);
      }
      const { data } = await query.order('created_at', { ascending: false });
      setCategoryProducts(data || []);
    } finally {
      setLoadingProducts(false);
    }
  };

  const selectCover = (imageUrl: string | null) => {
    // Usa a ref para garantir valor correto mesmo após re-renders assíncronos
    const activeSector = selectedSectorRef.current;
    if (activeSector) {
      // Modo setor: atualiza cover do setor e persiste imediatamente
      setSectors(prev => prev.map(s =>
        s.id === activeSector.id ? { ...s, cover_image_url: imageUrl } : s
      ));
      // Salva direto no Supabase
      if (!activeSector.id.startsWith('new-')) {
        supabase.from('sectors')
          .update({ cover_image_url: imageUrl })
          .eq('id', activeSector.id)
          .then(({ error, data }) => {
            if (error) {
              console.error('Erro ao salvar capa do setor:', error);
              toast({ title: 'Erro', description: `Falha ao salvar capa: ${error.message}`, variant: 'destructive' });
            } else {
              toast({ title: '✅ Capa do setor salva!', description: `Capa de "${activeSector.name}" atualizada com sucesso.` });
            }
          });
      }
      selectedSectorRef.current = null;
      setSelectedSector(null);
    } else if (selectedCategory) {
      const updateCover = (cat: TreeCategory) => {
        if (cat.id === selectedCategory.id) {
          return { ...cat, cover_image_url: imageUrl };
        }
        return cat;
      };
      setSectors(prev => prev.map(s => ({
        ...s,
        categories: s.categories.map(updateCover)
      })));
      setUnassignedCategories(prev => prev.map(updateCover));
    }
    setIsCoverDialogOpen(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Usa a ref para checar se há setor ativo (mais confiável que estado)
    if (!file || (!selectedCategory && !selectedSectorRef.current)) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
      const folder = selectedSectorRef.current ? 'sectors' : 'categories';
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('catalog')
        .upload(filePath, file, { 
          cacheControl: '3600',
          upsert: true 
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('catalog')
        .getPublicUrl(filePath);

      selectCover(publicUrl);
      toast({ title: 'Sucesso', description: 'Imagem carregada com sucesso!' });
    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast({ 
        title: 'Erro', 
        description: `Falha ao carregar imagem no Supabase: ${error.message || 'Erro desconhecido'}`, 
        variant: 'destructive' 
      });
    } finally {
      setUploading(false);
      // Reset file input para permitir novo upload do mesmo arquivo
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 text-foreground selection:bg-primary/30">
      <AdminHeader title="Ordenar Modinhas, Categorias e Subcategorias" description="Gerencie a estrutura completa do catálogo em formato de árvore com drag and drop." />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Organizador Visual de Produtos
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Arraste modinhas, categorias e subcategorias para reordenar, promover ou demover.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {hasChanges && (
              <Button variant="outline" onClick={handleReset} className="border-destructive/30 hover:bg-destructive/10 text-destructive flex items-center gap-2">
                <Undo2 className="w-4 h-4" />
                Descartar Rascunho
              </Button>
            )}
            <Button onClick={saveOrder} disabled={!hasChanges || saving} className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-bold flex items-center gap-2 shadow-lg shadow-primary/20">
              <Save className="w-4 h-4" />
              {saving ? 'Salvando no Supabase...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="organize" className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-2 max-w-md bg-muted/60 p-1 rounded-xl">
            <TabsTrigger value="organize" className="rounded-lg font-semibold">🌳 Árvore de Categorias</TabsTrigger>
            <TabsTrigger value="sectors" className="rounded-lg font-semibold">📂 Criar Modinhas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="organize">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-muted-foreground font-medium">Carregando árvore de produtos...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* TREE STRUCTURE (Left - 2/3) */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Drop zone for sector at the very top */}
                  <div
                    onDragOver={(e) => handleDragOver(e, { type: 'sector_reorder', id: sectors[0]?.id || 'top', position: 'before' })}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, { type: 'sector_reorder', id: sectors[0]?.id || 'top', position: 'before' })}
                    className={`h-2 transition-all rounded-md ${
                      dragOverTarget?.type === 'sector_reorder' && dragOverTarget?.id === (sectors[0]?.id || 'top') && dragOverTarget?.position === 'before'
                        ? 'bg-primary h-6 shadow-glow border border-primary/50'
                        : 'bg-transparent'
                    }`}
                  />

                  {sectors.map((sector, sIdx) => {
                    const isCollapsed = collapsedItems[sector.id] || false;
                    const isDragOverSector = dragOverTarget?.type === 'sector_container' && dragOverTarget?.id === sector.id;

                    return (
                      <div key={sector.id} className="space-y-2">
                        {/* Sector Card */}
                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, { type: 'sector', id: sector.id })}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => handleDragOver(e, { type: 'sector_container', id: sector.id })}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, { type: 'sector_container', id: sector.id })}
                          className={`group rounded-xl border bg-card transition-all ${
                            isDragOverSector 
                              ? 'border-indigo-500 border-2 border-dashed bg-indigo-500/5 scale-[1.01]' 
                              : 'border-indigo-100 dark:border-indigo-900/40 hover:border-indigo-300 dark:hover:border-indigo-800 hover:shadow-md'
                          }`}
                        >
                          <div className="p-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="cursor-grab text-indigo-400 hover:text-indigo-600 shrink-0 p-1">
                                <GripVertical className="w-5 h-5" />
                              </div>
                              <button 
                                onClick={() => toggleCollapse(sector.id)} 
                                className="text-indigo-400 hover:text-indigo-600 shrink-0"
                              >
                                {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                              </button>
                              {/* Thumbnail da capa do setor */}
                              <div
                                onClick={() => openSectorCoverPicker(sector)}
                                title="Clique para definir a capa deste setor"
                                className="w-11 h-11 rounded-lg overflow-hidden bg-indigo-50 dark:bg-indigo-950/30 border-2 border-indigo-200 dark:border-indigo-800 shrink-0 cursor-pointer hover:border-indigo-400 transition-colors relative group/thumb"
                              >
                                {sector.cover_image_url ? (
                                  <img src={sector.cover_image_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-indigo-300">
                                    <ImageIcon className="w-5 h-5" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                                  <span className="text-white text-[9px] font-bold">CAPA</span>
                                </div>
                              </div>
                              <FolderOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                              <span className="font-extrabold text-lg text-indigo-950 dark:text-indigo-50 truncate">{sector.name}</span>
                              <span className="bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-xs px-2.5 py-1 rounded-full font-bold">
                                Modinha
                              </span>
                              <span className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 text-xs px-2 py-0.5 rounded-full font-medium">
                                {sector.categories.length} {sector.categories.length === 1 ? 'categoria' : 'categorias'}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              {/* Setinhas e Select para Modinha */}
                              <div className="flex items-center gap-1 bg-muted/65 p-1 rounded-lg border border-border/40 shrink-0">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  disabled={sIdx === 0} 
                                  onClick={() => moveSector(sector.id, 'up')}
                                  className="h-7 w-7 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 disabled:opacity-30"
                                  title="Subir Modinha"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  disabled={sIdx === sectors.length - 1} 
                                  onClick={() => moveSector(sector.id, 'down')}
                                  className="h-7 w-7 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 disabled:opacity-30"
                                  title="Descer Modinha"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </Button>
                                <div className="h-4 w-px bg-border/80 mx-0.5" />
                                <select
                                  value=""
                                  onChange={(e) => {
                                    const val = e.target.value as any;
                                    if (val) moveSector(sector.id, val);
                                  }}
                                  className="text-xs bg-transparent border-none font-bold text-indigo-600 dark:text-indigo-400 focus:ring-0 focus:outline-none cursor-pointer pr-6 py-0 h-6"
                                >
                                  <option value="" disabled>Ordem</option>
                                  <option value="first">Ficar em Primeiro</option>
                                  <option value="last">Mover para o Fim</option>
                                </select>
                              </div>

                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => openSectorCoverPicker(sector)}
                                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                              >
                                <ImageIcon className="w-3.5 h-3.5 mr-1" /> Capa
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleCreateCategoryInline(sector.id)}
                                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                              >
                                <Plus className="w-3.5 h-3.5 mr-1" /> Add Categoria
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => {
                                  setRenameTarget({ type: 'sector', id: sector.id, oldName: sector.name });
                                  setRenameValue(sector.name);
                                  setIsRenameDialogOpen(true);
                                }}
                                className="h-8 w-8 text-muted-foreground hover:text-indigo-600"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDeleteSectorInline(sector.id, sector.name)}
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Sector Categories Container */}
                        {!isCollapsed && (
                          <div 
                            className={`pl-6 md:pl-10 space-y-3 pt-1 pb-3 border-l-2 border-dashed border-muted ml-6 ${
                              isDragOverSector ? 'bg-primary/5 rounded-lg' : ''
                            }`}
                            onDragOver={(e) => handleDragOver(e, { type: 'sector_container', id: sector.id })}
                            onDrop={(e) => handleDrop(e, { type: 'sector_container', id: sector.id })}
                          >
                            {/* Drop zone inside sector, before first category */}
                            <div
                              onDragOver={(e) => handleDragOver(e, { type: 'category_reorder', id: sector.categories[0]?.id || sector.id, position: 'before' })}
                              onDragLeave={handleDragLeave}
                              onDrop={(e) => handleDrop(e, { type: 'category_reorder', id: sector.categories[0]?.id || sector.id, position: 'before' })}
                              className={`h-1.5 transition-all rounded-md ${
                                dragOverTarget?.type === 'category_reorder' && dragOverTarget?.id === (sector.categories[0]?.id || sector.id) && dragOverTarget?.position === 'before'
                                  ? 'bg-primary h-5 shadow-glow border border-primary/50'
                                  : 'bg-transparent'
                              }`}
                            />

                            {sector.categories.length === 0 ? (
                              <div className="py-6 text-center bg-card rounded-xl border border-dashed border-border text-muted-foreground text-xs">
                                Arraste categorias para dentro desta modinha.
                              </div>
                            ) : (
                              sector.categories.map((category, cIdx) => {
                                const isCatCollapsed = collapsedItems[category.id] || false;
                                const isDragOverCat = dragOverTarget?.type === 'category_container' && dragOverTarget?.id === category.id;

                                return (
                                  <div key={category.id} className="space-y-2 relative">
                                    {/* Ramo Horizontal de Conexão à Modinha */}
                                    <div className="absolute -left-6 md:-left-10 top-7 w-6 md:w-10 h-0 border-t-2 border-dashed border-indigo-200 dark:border-indigo-950/40" />

                                    {/* Category Card */}
                                    <div
                                      draggable
                                      onDragStart={(e) => handleDragStart(e, { type: 'category', id: category.id, parentSectorId: sector.id })}
                                      onDragEnd={handleDragEnd}
                                      onDragOver={(e) => handleDragOver(e, { type: 'category_container', id: category.id })}
                                      onDragLeave={handleDragLeave}
                                      onDrop={(e) => handleDrop(e, { type: 'category_container', id: category.id })}
                                      className={`group rounded-xl border bg-card transition-all relative ${
                                        isDragOverCat 
                                          ? 'border-violet-500 border-2 border-dashed bg-violet-500/5 scale-[1.01]' 
                                          : 'border-violet-100 dark:border-violet-900/40 hover:border-violet-300 dark:hover:border-violet-800 hover:shadow-md'
                                      }`}
                                    >
                                      <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                          <div className="cursor-grab text-muted-foreground hover:text-foreground shrink-0 p-1">
                                            <GripVertical className="w-4 h-4" />
                                          </div>
                                          <button 
                                            onClick={() => toggleCollapse(category.id)} 
                                            className="text-muted-foreground hover:text-foreground shrink-0"
                                          >
                                            {isCatCollapsed ? <ChevronRight className="w-4.5 h-4.5" /> : <ChevronDown className="w-4.5 h-4.5" />}
                                          </button>
                                          
                                          {/* Mini Thumbnail */}
                                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted border shrink-0 relative group/thumb">
                                            {category.cover_image_url ? (
                                              <img src={category.cover_image_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ImageIcon className="w-4 h-4" /></div>
                                            )}
                                          </div>

                                          <div className="min-w-0">
                                            <div className="flex items-center flex-wrap gap-2">
                                              <Folder className="w-4.5 h-4.5 text-violet-600 dark:text-violet-400 shrink-0" />
                                              <span className="font-bold text-sm text-foreground truncate">{category.name}</span>
                                              <span className="bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0">Categoria</span>
                                              {category.isNew && (
                                                <span className="bg-emerald-100 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Novo</span>
                                              )}
                                            </div>
                                            <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                                              <span>{category.productCount} produtos diretos</span>
                                              <span>•</span>
                                              <span>{category.subcategories.length} subcategorias</span>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex items-center justify-end flex-wrap gap-1.5">
                                          {/* Setinhas e Select para Categoria */}
                                          <div className="flex items-center gap-1 bg-muted/65 p-1 rounded-lg border border-border/40 shrink-0 mr-1">
                                            <Button 
                                              variant="ghost" 
                                              size="icon" 
                                              disabled={cIdx === 0} 
                                              onClick={() => moveCategory(category.id, 'up')}
                                              className="h-7 w-7 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 disabled:opacity-30"
                                              title="Subir Categoria"
                                            >
                                              <ArrowUp className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button 
                                              variant="ghost" 
                                              size="icon" 
                                              disabled={cIdx === sector.categories.length - 1} 
                                              onClick={() => moveCategory(category.id, 'down')}
                                              className="h-7 w-7 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 disabled:opacity-30"
                                              title="Descer Categoria"
                                            >
                                              <ArrowDown className="w-3.5 h-3.5" />
                                            </Button>
                                            <div className="h-4 w-px bg-border/80 mx-0.5" />
                                            <select
                                              value=""
                                              onChange={(e) => {
                                                const val = e.target.value as any;
                                                if (val) moveCategory(category.id, val);
                                              }}
                                              className="text-xs bg-transparent border-none font-bold text-violet-600 dark:text-violet-400 focus:ring-0 focus:outline-none cursor-pointer pr-6 py-0 h-6"
                                            >
                                              <option value="" disabled>Ordem</option>
                                              <option value="first">Ficar em Primeiro</option>
                                              <option value="last">Mover para o Fim</option>
                                            </select>
                                          </div>

                                          <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => openCoverPicker(category)}
                                            className="text-[11px] text-primary hover:bg-primary/5 h-8 px-2"
                                          >
                                            Capa
                                          </Button>
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => {
                                              setRenameTarget({ type: 'category', id: category.id, oldName: category.name });
                                              setRenameValue(category.name);
                                              setIsRenameDialogOpen(true);
                                            }}
                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                          >
                                            <Edit className="w-3.5 h-3.5" />
                                          </Button>
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => handleDeleteCategoryInline(category.id, category.name)}
                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Subcategories (Indented Nivel 3 - Lista Vertical com Conectores Esmeralda) */}
                                    {!isCatCollapsed && (
                                      <div className="pl-8 md:pl-10 border-l-2 border-dashed border-violet-200 dark:border-violet-950/40 ml-6 py-2 space-y-1 relative">
                                        {category.subcategories.length === 0 ? (
                                          <div className="py-2 text-[10px] text-muted-foreground italic pl-4">Nenhuma subcategoria vinculada. Arraste subcategorias aqui.</div>
                                        ) : (
                                          <div className="flex flex-col gap-1.5">
                                            {/* Drop zone inside category, before first subcategory */}
                                            <div
                                              onDragOver={(e) => handleDragOver(e, { type: 'subcategory_reorder', id: category.subcategories[0]?.name || category.id, position: 'before', parentCategoryId: category.id })}
                                              onDragLeave={handleDragLeave}
                                              onDrop={(e) => handleDrop(e, { type: 'subcategory_reorder', id: category.subcategories[0]?.name || category.id, position: 'before', parentCategoryId: category.id })}
                                              className={`h-1.5 transition-all rounded-md ml-4 ${
                                                dragOverTarget?.type === 'subcategory_reorder' && dragOverTarget?.id === (category.subcategories[0]?.name || category.id) && dragOverTarget?.position === 'before' && dragOverTarget?.parentCategoryId === category.id
                                                  ? 'bg-emerald-500 h-4 shadow-glow border border-emerald-500/50'
                                                  : 'bg-transparent'
                                              }`}
                                            />

                                            {category.subcategories.map((sub, sIdx) => (
                                              <div key={sub.name} className="relative py-1">
                                                {/* Ramo Horizontal ligando a subcategoria ao tronco da categoria */}
                                                <div className="absolute -left-8 md:-left-10 top-6 w-8 md:w-10 h-0 border-t-2 border-dashed border-violet-200 dark:border-violet-950/40" />

                                                {/* Subcategory Card */}
                                                <div
                                                  draggable
                                                  onDragStart={(e) => handleDragStart(e, { type: 'subcategory', name: sub.name, parentCategoryId: category.id })}
                                                  onDragEnd={handleDragEnd}
                                                  onDragOver={(e) => handleDragOver(e, { type: 'subcategory_reorder', id: sub.name, position: 'inside', parentCategoryId: category.id })}
                                                  onDragLeave={handleDragLeave}
                                                  onDrop={(e) => handleDrop(e, { type: 'subcategory_reorder', id: sub.name, position: 'inside', parentCategoryId: category.id })}
                                                  className={`group/pill flex items-center justify-between gap-3 bg-emerald-50 hover:bg-emerald-100/55 dark:bg-emerald-950/15 text-emerald-800 dark:text-emerald-300 border border-emerald-100/80 dark:border-emerald-950/30 px-3 py-2 rounded-xl text-xs font-semibold cursor-grab transition-all shadow-sm max-w-xl ${
                                                    dragOverTarget?.type === 'subcategory_reorder' && dragOverTarget?.id === sub.name && dragOverTarget?.position === 'inside' && dragOverTarget?.parentCategoryId === category.id
                                                      ? 'border-emerald-500 border-2 border-dashed bg-emerald-500/10 scale-[1.01]' 
                                                      : ''
                                                  }`}
                                                >
                                                  <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="cursor-grab text-emerald-400 hover:text-emerald-600 shrink-0 p-0.5">
                                                      <GripVertical className="w-3.5 h-3.5" />
                                                    </div>
                                                    <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                                                    <span className="truncate">{sub.name}</span>
                                                    <span className="bg-emerald-100/70 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                                      Subcategoria
                                                    </span>
                                                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-medium">
                                                      {sub.productCount} prod.
                                                    </span>
                                                  </div>

                                                  <div className="flex items-center gap-2">
                                                    {/* Setinhas e Select para Subcategoria */}
                                                    <div className="flex items-center gap-0.5 bg-background/60 p-0.5 rounded-lg border border-border/30 shrink-0">
                                                      <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        disabled={sIdx === 0} 
                                                        onClick={() => moveSubcategory(category.id, sub.name, 'up')}
                                                        className="h-6 w-6 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-30"
                                                        title="Subir Subcategoria"
                                                      >
                                                        <ArrowUp className="w-3 h-3" />
                                                      </Button>
                                                      <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        disabled={sIdx === category.subcategories.length - 1} 
                                                        onClick={() => moveSubcategory(category.id, sub.name, 'down')}
                                                        className="h-6 w-6 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-30"
                                                        title="Descer Subcategoria"
                                                      >
                                                        <ArrowDown className="w-3 h-3" />
                                                      </Button>
                                                      <div className="h-3 w-px bg-border/60 mx-0.5" />
                                                      <select
                                                        value=""
                                                        onChange={(e) => {
                                                          const val = e.target.value as any;
                                                          if (val) moveSubcategory(category.id, sub.name, val);
                                                        }}
                                                        className="text-[10px] bg-transparent border-none font-bold text-emerald-600 dark:text-emerald-400 focus:ring-0 focus:outline-none cursor-pointer pr-5 py-0 h-5"
                                                      >
                                                        <option value="" disabled>Ordem</option>
                                                        <option value="first">Ficar em Primeiro</option>
                                                        <option value="last">Mover para o Fim</option>
                                                      </select>
                                                    </div>

                                                    {/* Botões de Ação para Subcategoria */}
                                                    <div className="flex items-center gap-0.5 opacity-60 group-hover/pill:opacity-100 transition-opacity">
                                                      <button 
                                                        onClick={() => {
                                                          setRenameTarget({ type: 'subcategory', id: sub.name, oldName: sub.name, parentId: category.id });
                                                          setRenameValue(sub.name);
                                                          setIsRenameDialogOpen(true);
                                                        }}
                                                        className="p-0.5 text-muted-foreground hover:text-emerald-600"
                                                      >
                                                        <Edit className="w-3 h-3" />
                                                      </button>
                                                      <button 
                                                        onClick={() => handleDeleteSubcategoryInline(category.id, sub.name)}
                                                        className="p-0.5 text-destructive hover:text-red-500"
                                                      >
                                                        <X className="w-3 h-3" />
                                                      </button>
                                                    </div>
                                                  </div>
                                                </div>

                                                {/* Drop zone after subcategory card */}
                                                <div
                                                  onDragOver={(e) => handleDragOver(e, { type: 'subcategory_reorder', id: sub.name, position: 'after', parentCategoryId: category.id })}
                                                  onDragLeave={handleDragLeave}
                                                  onDrop={(e) => handleDrop(e, { type: 'subcategory_reorder', id: sub.name, position: 'after', parentCategoryId: category.id })}
                                                  className={`h-1.5 transition-all rounded-md ml-4 ${
                                                    dragOverTarget?.type === 'subcategory_reorder' && dragOverTarget?.id === sub.name && dragOverTarget?.position === 'after' && dragOverTarget?.parentCategoryId === category.id
                                                      ? 'bg-emerald-500 h-4 shadow-glow border border-emerald-500/50'
                                                      : 'bg-transparent'
                                                  }`}
                                                />
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* Drop zone after category card */}
                                    <div
                                      onDragOver={(e) => handleDragOver(e, { type: 'category_reorder', id: category.id, position: 'after' })}
                                      onDragLeave={handleDragLeave}
                                      onDrop={(e) => handleDrop(e, { type: 'category_reorder', id: category.id, position: 'after' })}
                                      className={`h-1.5 transition-all rounded-md ${
                                        dragOverTarget?.type === 'category_reorder' && dragOverTarget?.id === category.id && dragOverTarget?.position === 'after'
                                          ? 'bg-primary h-5 shadow-glow border border-primary/50'
                                          : 'bg-transparent'
                                      }`}
                                    />
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}

                        {/* Drop zone after sector card */}
                        <div
                          onDragOver={(e) => handleDragOver(e, { type: 'sector_reorder', id: sector.id, position: 'after' })}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, { type: 'sector_reorder', id: sector.id, position: 'after' })}
                          className={`h-2 transition-all rounded-md ${
                            dragOverTarget?.type === 'sector_reorder' && dragOverTarget?.id === sector.id && dragOverTarget?.position === 'after'
                              ? 'bg-primary h-6 shadow-glow border border-primary/50'
                              : 'bg-transparent'
                          }`}
                        />
                      </div>
                    );
                  })}

                  {/* UNASSIGNED CATEGORIES (Categories Sem Modinha) */}
                  <div className="mt-8 space-y-4">
                    <div
                      onDragOver={(e) => handleDragOver(e, { type: 'sector_container', id: 'unassigned' })}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, { type: 'sector_container', id: 'unassigned' })}
                      className={`rounded-xl border p-4 transition-all bg-muted/30 border-dashed ${
                        dragOverTarget?.type === 'sector_container' && dragOverTarget?.id === 'unassigned'
                          ? 'border-primary border-2 bg-primary/5'
                          : 'border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Folder className="w-5 h-5 text-muted-foreground" />
                          <h2 className="text-lg font-bold text-muted-foreground">Categorias Sem Modinha Vinculada</h2>
                          <span className="bg-muted text-muted-foreground text-xs px-2.5 py-1 rounded-full font-semibold">
                            {unassignedCategories.length} {unassignedCategories.length === 1 ? 'categoria' : 'categorias'}
                          </span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleCreateCategoryInline(null)}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" /> Add Categoria
                        </Button>
                      </div>

                      {/* Drop zone inside unassigned list, before first element */}
                      <div
                        onDragOver={(e) => handleDragOver(e, { type: 'category_reorder', id: unassignedCategories[0]?.id || 'unassigned', position: 'before' })}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, { type: 'category_reorder', id: unassignedCategories[0]?.id || 'unassigned', position: 'before' })}
                        className={`h-1.5 transition-all rounded-md ${
                          dragOverTarget?.type === 'category_reorder' && dragOverTarget?.id === (unassignedCategories[0]?.id || 'unassigned') && dragOverTarget?.position === 'before'
                            ? 'bg-primary h-5 shadow-glow border border-primary/50'
                            : 'bg-transparent'
                        }`}
                      />

                      {unassignedCategories.length === 0 ? (
                        <p className="text-xs text-center text-muted-foreground py-6">Todas as categorias pertencem a uma modinha.</p>
                      ) : (
                        <div className="space-y-3">
                          {unassignedCategories.map((category, cIdx) => {
                            const isCatCollapsed = collapsedItems[category.id] || false;
                            const isDragOverCat = dragOverTarget?.type === 'category_container' && dragOverTarget?.id === category.id;

                            return (
                              <div key={category.id} className="space-y-2 relative">
                                {/* Category Card */}
                                <div
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, { type: 'category', id: category.id, parentSectorId: null })}
                                  onDragEnd={handleDragEnd}
                                  onDragOver={(e) => handleDragOver(e, { type: 'category_container', id: category.id })}
                                  onDragLeave={handleDragLeave}
                                  onDrop={(e) => handleDrop(e, { type: 'category_container', id: category.id })}
                                  className={`group rounded-xl border bg-card transition-all relative ${
                                    isDragOverCat 
                                      ? 'border-violet-500 border-2 border-dashed bg-violet-500/5 scale-[1.01]' 
                                      : 'border-violet-100 dark:border-violet-900/40 hover:border-violet-300 dark:hover:border-violet-800 hover:shadow-md'
                                  }`}
                                >
                                  <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="cursor-grab text-muted-foreground hover:text-foreground shrink-0 p-1">
                                        <GripVertical className="w-4 h-4" />
                                      </div>
                                      <button 
                                        onClick={() => toggleCollapse(category.id)} 
                                        className="text-muted-foreground hover:text-foreground shrink-0"
                                      >
                                        {isCatCollapsed ? <ChevronRight className="w-4.5 h-4.5" /> : <ChevronDown className="w-4.5 h-4.5" />}
                                      </button>
                                      
                                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted border shrink-0">
                                        {category.cover_image_url ? (
                                          <img src={category.cover_image_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ImageIcon className="w-4 h-4" /></div>
                                        )}
                                      </div>

                                      <div className="min-w-0">
                                        <div className="flex items-center flex-wrap gap-2">
                                          <Folder className="w-4.5 h-4.5 text-violet-600 dark:text-violet-400 shrink-0" />
                                          <span className="font-bold text-sm text-foreground truncate">{category.name}</span>
                                          <span className="bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0">Categoria</span>
                                        </div>
                                        <div className="text-[11px] text-muted-foreground mt-0.5">
                                          <span>{category.productCount} produtos diretos</span>
                                          {category.subcategories.length > 0 && (
                                            <span className="ml-2">• {category.subcategories.length} subcategorias</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-end flex-wrap gap-1.5">
                                      {/* Setinhas e Select */}
                                      <div className="flex items-center gap-1 bg-muted/65 p-1 rounded-lg border border-border/40 shrink-0 mr-1">
                                        <Button 
                                          variant="ghost" size="icon" 
                                          disabled={cIdx === 0} 
                                          onClick={() => moveCategory(category.id, 'up')}
                                          className="h-7 w-7 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 disabled:opacity-30"
                                          title="Subir Categoria"
                                        >
                                          <ArrowUp className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button 
                                          variant="ghost" size="icon" 
                                          disabled={cIdx === unassignedCategories.length - 1} 
                                          onClick={() => moveCategory(category.id, 'down')}
                                          className="h-7 w-7 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 disabled:opacity-30"
                                          title="Descer Categoria"
                                        >
                                          <ArrowDown className="w-3.5 h-3.5" />
                                        </Button>
                                        <div className="h-4 w-px bg-border/80 mx-0.5" />
                                        <select
                                          value=""
                                          onChange={(e) => { const val = e.target.value as any; if (val) moveCategory(category.id, val); }}
                                          className="text-xs bg-transparent border-none font-bold text-violet-600 dark:text-violet-400 focus:ring-0 focus:outline-none cursor-pointer pr-6 py-0 h-6"
                                        >
                                          <option value="" disabled>Ordem</option>
                                          <option value="first">Ficar em Primeiro</option>
                                          <option value="last">Mover para o Fim</option>
                                        </select>
                                      </div>
                                      <Button variant="ghost" size="sm" onClick={() => openCoverPicker(category)} className="text-[11px] text-primary hover:bg-primary/5 h-8 px-2">Capa</Button>
                                      <Button variant="ghost" size="icon" onClick={() => {
                                        setRenameTarget({ type: 'category', id: category.id, oldName: category.name });
                                        setRenameValue(category.name);
                                        setIsRenameDialogOpen(true);
                                      }} className="h-8 w-8 text-muted-foreground hover:text-foreground"><Edit className="w-3.5 h-3.5" /></Button>
                                      <Button variant="ghost" size="icon" onClick={() => handleDeleteCategoryInline(category.id, category.name)} className="h-8 w-8 text-destructive hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5" /></Button>
                                    </div>
                                  </div>
                                </div>

                                {/* Unassigned Category Subcategories - Lista Vertical Esmeralda */}
                                {!isCatCollapsed && (
                                  <div className="pl-8 md:pl-10 border-l-2 border-dashed border-violet-200 dark:border-violet-950/40 ml-6 py-2 relative">
                                    {category.subcategories.length === 0 ? (
                                      <div className="py-2 text-[10px] text-muted-foreground italic pl-4">Nenhuma subcategoria vinculada.</div>
                                    ) : (
                                      <div className="flex flex-col gap-1.5">
                                        {/* Drop zone before first */}
                                        <div
                                          onDragOver={(e) => handleDragOver(e, { type: 'subcategory_reorder', id: category.subcategories[0]?.name || category.id, position: 'before', parentCategoryId: category.id })}
                                          onDragLeave={handleDragLeave}
                                          onDrop={(e) => handleDrop(e, { type: 'subcategory_reorder', id: category.subcategories[0]?.name || category.id, position: 'before', parentCategoryId: category.id })}
                                          className={`h-1.5 transition-all rounded-md ml-4 ${
                                            dragOverTarget?.type === 'subcategory_reorder' && dragOverTarget?.id === (category.subcategories[0]?.name || category.id) && dragOverTarget?.position === 'before' && dragOverTarget?.parentCategoryId === category.id
                                              ? 'bg-emerald-500 h-4 border border-emerald-500/50' : 'bg-transparent'
                                          }`}
                                        />
                                        {category.subcategories.map((sub, sIdx) => (
                                          <div key={sub.name} className="relative py-1">
                                            <div className="absolute -left-8 md:-left-10 top-6 w-8 md:w-10 h-0 border-t-2 border-dashed border-violet-200 dark:border-violet-950/40" />
                                            <div
                                              draggable
                                              onDragStart={(e) => handleDragStart(e, { type: 'subcategory', name: sub.name, parentCategoryId: category.id })}
                                              onDragEnd={handleDragEnd}
                                              onDragOver={(e) => handleDragOver(e, { type: 'subcategory_reorder', id: sub.name, position: 'inside', parentCategoryId: category.id })}
                                              onDragLeave={handleDragLeave}
                                              onDrop={(e) => handleDrop(e, { type: 'subcategory_reorder', id: sub.name, position: 'inside', parentCategoryId: category.id })}
                                              className={`group/pill flex items-center justify-between gap-3 bg-emerald-50 hover:bg-emerald-100/55 dark:bg-emerald-950/15 text-emerald-800 dark:text-emerald-300 border border-emerald-100/80 dark:border-emerald-950/30 px-3 py-2 rounded-xl text-xs font-semibold cursor-grab transition-all shadow-sm max-w-xl ${
                                                dragOverTarget?.type === 'subcategory_reorder' && dragOverTarget?.id === sub.name && dragOverTarget?.position === 'inside' && dragOverTarget?.parentCategoryId === category.id
                                                  ? 'border-emerald-500 border-2 border-dashed bg-emerald-500/10 scale-[1.01]' : ''
                                              }`}
                                            >
                                              <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="cursor-grab text-emerald-400 hover:text-emerald-600 shrink-0 p-0.5">
                                                  <GripVertical className="w-3.5 h-3.5" />
                                                </div>
                                                <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                                                <span className="truncate">{sub.name}</span>
                                                <span className="bg-emerald-100/70 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold">Subcategoria</span>
                                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-medium">{sub.productCount} prod.</span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-0.5 bg-background/60 p-0.5 rounded-lg border border-border/30 shrink-0">
                                                  <Button variant="ghost" size="icon" disabled={sIdx === 0} onClick={() => moveSubcategory(category.id, sub.name, 'up')} className="h-6 w-6 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-30"><ArrowUp className="w-3 h-3" /></Button>
                                                  <Button variant="ghost" size="icon" disabled={sIdx === category.subcategories.length - 1} onClick={() => moveSubcategory(category.id, sub.name, 'down')} className="h-6 w-6 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-30"><ArrowDown className="w-3 h-3" /></Button>
                                                  <div className="h-3 w-px bg-border/60 mx-0.5" />
                                                  <select value="" onChange={(e) => { const val = e.target.value as any; if (val) moveSubcategory(category.id, sub.name, val); }} className="text-[10px] bg-transparent border-none font-bold text-emerald-600 dark:text-emerald-400 focus:ring-0 focus:outline-none cursor-pointer pr-5 py-0 h-5">
                                                    <option value="" disabled>Ordem</option>
                                                    <option value="first">Ficar em Primeiro</option>
                                                    <option value="last">Mover para o Fim</option>
                                                  </select>
                                                </div>
                                                <div className="flex items-center gap-0.5 opacity-60 group-hover/pill:opacity-100 transition-opacity">
                                                  <button onClick={() => { setRenameTarget({ type: 'subcategory', id: sub.name, oldName: sub.name, parentId: category.id }); setRenameValue(sub.name); setIsRenameDialogOpen(true); }} className="p-0.5 text-muted-foreground hover:text-emerald-600"><Edit className="w-3 h-3" /></button>
                                                  <button onClick={() => handleDeleteSubcategoryInline(category.id, sub.name)} className="p-0.5 text-destructive hover:text-red-500"><X className="w-3 h-3" /></button>
                                                </div>
                                              </div>
                                            </div>
                                            {/* Drop zone after each subcategory */}
                                            <div
                                              onDragOver={(e) => handleDragOver(e, { type: 'subcategory_reorder', id: sub.name, position: 'after', parentCategoryId: category.id })}
                                              onDragLeave={handleDragLeave}
                                              onDrop={(e) => handleDrop(e, { type: 'subcategory_reorder', id: sub.name, position: 'after', parentCategoryId: category.id })}
                                              className={`h-1.5 transition-all rounded-md ml-4 ${
                                                dragOverTarget?.type === 'subcategory_reorder' && dragOverTarget?.id === sub.name && dragOverTarget?.position === 'after' && dragOverTarget?.parentCategoryId === category.id
                                                  ? 'bg-emerald-500 h-4 border border-emerald-500/50' : 'bg-transparent'
                                              }`}
                                            />
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Drop zone after category */}
                                <div
                                  onDragOver={(e) => handleDragOver(e, { type: 'category_reorder', id: category.id, position: 'after' })}
                                  onDragLeave={handleDragLeave}
                                  onDrop={(e) => handleDrop(e, { type: 'category_reorder', id: category.id, position: 'after' })}
                                  className={`h-1.5 transition-all rounded-md ${
                                    dragOverTarget?.type === 'category_reorder' && dragOverTarget?.id === category.id && dragOverTarget?.position === 'after'
                                      ? 'bg-primary h-5 shadow-glow border border-primary/50' : 'bg-transparent'
                                  }`}
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                {/* PENDING CHANGES PANEL (Right - 1/3) */}
                <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
                  <Card className="border border-indigo-100 dark:border-indigo-950/50 shadow-md">
                    <CardHeader className="pb-3 border-b bg-indigo-50/40 dark:bg-indigo-950/10">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>Alterações Pendentes</span>
                        {hasChanges && (
                          <span className="bg-primary text-white text-xs px-2.5 py-0.5 rounded-full font-extrabold animate-pulse">
                            {visualChanges.length}
                          </span>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      {!hasChanges ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                            <Info className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-muted-foreground">Nenhuma alteração no rascunho</p>
                            <p className="text-xs text-muted-foreground/75 mt-1 max-w-[200px]">Arraste categorias ou reordene modinhas para começar.</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="max-h-[350px] overflow-y-auto pr-1 space-y-2 divide-y divide-border">
                            {visualChanges.map((change) => (
                              <div key={change.id} className="pt-2 first:pt-0 flex items-start gap-2.5 text-xs text-foreground/90 font-medium">
                                <span className="text-base shrink-0 mt-0.5">{change.icon}</span>
                                <span className="flex-1 mt-0.5 leading-relaxed">{change.description}</span>
                              </div>
                            ))}
                          </div>
                          
                          <div className="border-t pt-4 flex flex-col gap-2">
                            <Button 
                              onClick={saveOrder} 
                              disabled={saving} 
                              className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/95 hover:to-purple-600/95 font-bold shadow-md shadow-primary/10"
                            >
                              {saving ? 'Gravando no Supabase...' : 'Confirmar e Salvar Tudo'}
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={handleReset} 
                              className="w-full border-destructive/20 hover:bg-destructive/10 text-destructive font-semibold"
                            >
                              Descartar Alterações
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Help notice card */}
                  <Card className="bg-muted/40 border-muted">
                    <CardContent className="p-4 space-y-3 text-xs leading-relaxed text-muted-foreground">
                      <h4 className="font-bold text-foreground flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-indigo-500" /> Dicas de Reorganização:
                      </h4>
                      <ul className="list-disc pl-4 space-y-1.5">
                        <li><strong>Reordenar:</strong> Arraste modinhas ou categorias pelas alças de arraste (<GripVertical className="w-3 h-3 inline text-muted-foreground" />) para cima ou para baixo.</li>
                        <li><strong>Mover:</strong> Arraste uma categoria e solte-a dentro de qualquer caixa de modinha.</li>
                        <li><strong>Demover Categoria:</strong> Arraste uma categoria e solte-a <i>diretamente sobre outra categoria</i> para transformá-la em subcategoria.</li>
                        <li><strong>Promover Subcategoria:</strong> Arraste um botão de subcategoria (nível 3) e solte-o no topo ou entre categorias de uma modinha para que vire uma categoria de nível 2.</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

              </div>
            )}
          </TabsContent>
          
          <TabsContent value="sectors">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg">Criar Nova Modinha</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Input
                        placeholder="Nome da Modinha (ex: Coleção de Inverno)"
                        value={newSectorName}
                        onChange={(e) => setNewSectorName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateSector()}
                        className="rounded-lg"
                      />
                      <Button className="w-full font-bold" onClick={handleCreateSector}>
                        <Plus className="w-4 h-4 mr-2" />
                        Criar Modinha no Rascunho
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="md:col-span-2">
                <h3 className="font-bold text-lg mb-3">Modinhas no Rascunho Atual</h3>
                {sectors.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhuma modinha cadastrada ainda.</p>
                ) : (
                  <div className="space-y-3">
                    {sectors.map((sector, index) => (
                      <Card key={sector.id} className="hover:border-primary/40 transition-colors">
                        <CardContent className="p-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <GripVertical className="w-5 h-5 text-muted-foreground shrink-0 cursor-grab" />
                            <span className="font-bold text-lg text-foreground">{sector.name}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              onClick={() => {
                                const newSectors = [...sectors];
                                [newSectors[index], newSectors[index - 1]] = [newSectors[index - 1], newSectors[index]];
                                setSectors(newSectors.map((s, i) => ({ ...s, display_order: (i + 1) * 10 })));
                              }} 
                              disabled={index === 0}
                              className="h-8 w-8"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              onClick={() => {
                                const newSectors = [...sectors];
                                [newSectors[index], newSectors[index + 1]] = [newSectors[index + 1], newSectors[index]];
                                setSectors(newSectors.map((s, i) => ({ ...s, display_order: (i + 1) * 10 })));
                              }} 
                              disabled={index === sectors.length - 1}
                              className="h-8 w-8"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              onClick={() => {
                                setRenameTarget({ type: 'sector', id: sector.id, oldName: sector.name });
                                setRenameValue(sector.name);
                                setIsRenameDialogOpen(true);
                              }}
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDeleteSectorInline(sector.id, sector.name)}
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* DIALOG: COVER IMAGE PICKER */}
        <Dialog open={isCoverDialogOpen} onOpenChange={(open) => { 
          setIsCoverDialogOpen(open); 
          if (!open) { 
            selectedSectorRef.current = null;
            setSelectedSector(null); 
          } 
        }}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {selectedSector
                  ? <>Definir Capa da Modinha <span className="text-indigo-600">{selectedSector.name}</span></>
                  : <>Definir Capa para <span className="text-primary">{selectedCategory?.name}</span></>}
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-6 pt-4 border-t">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex-1 font-semibold"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Carregando Imagem...' : 'Enviar Foto do Meu Dispositivo'}
              </Button>
              
              {(selectedSector?.cover_image_url || selectedCategory?.cover_image_url) && (
                <Button 
                  variant="destructive" 
                  onClick={() => selectCover(null)}
                  className="flex-1 font-semibold"
                >
                  <X className="w-4 h-4 mr-2" />
                  Remover Foto de Capa Atual
                </Button>
              )}
            </div>

            {/* Para setores, apenas upload — não há grade de produtos */}
            {selectedSector ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center text-muted-foreground">
                {selectedSector.cover_image_url ? (
                  <>
                    <img src={selectedSector.cover_image_url} alt="Capa atual" className="w-48 h-48 object-cover rounded-xl border-2 border-indigo-200" />
                    <p className="text-xs">Capa atual da Modinha. Envie uma nova foto acima para substituir.</p>
                  </>
                ) : (
                  <>
                    <div className="w-24 h-24 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border-2 border-dashed border-indigo-200 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-indigo-300" />
                    </div>
                    <p className="text-sm">Esta modinha ainda não tem uma foto de capa.</p>
                    <p className="text-xs">Clique em <strong>Enviar Foto</strong> acima para escolher uma imagem.</p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-foreground">Ou selecione uma imagem já cadastrada em algum produto dessa categoria:</h4>
                
                {loadingProducts ? (
                  <div className="py-12 flex justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
                ) : categoryProducts.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">Nenhum produto com imagem encontrado nesta categoria.</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[350px] overflow-y-auto p-1">
                    {categoryProducts.map(p => (
                      <button 
                        key={p.id} 
                        onClick={() => selectCover(p.image_url)} 
                        className="aspect-square relative group rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all bg-muted shadow-sm"
                      >
                        <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <span className="text-white text-[10px] font-bold bg-primary px-2.5 py-1 rounded-md">Usar foto</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* DIALOG: INLINE CREATE CATEGORY */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Adicionar Categoria</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-3">
              <label className="text-xs font-semibold text-muted-foreground">Nome da Categoria</label>
              <Input
                placeholder="Ex: Vestidos Longos, Calças Jeans"
                value={createValue}
                onChange={(e) => setCreateValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && executeCreateCategory()}
                className="rounded-lg"
              />
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
                <Button onClick={executeCreateCategory} className="bg-primary text-white">Criar no Rascunho</Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* DIALOG: RENAME TARGET */}
        <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
          <DialogContent className="rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Renomear Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-3">
              <label className="text-xs font-semibold text-muted-foreground">Novo Nome</label>
              <Input
                placeholder="Insira o novo nome..."
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && executeRename()}
                className="rounded-lg"
              />
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>Cancelar</Button>
                <Button onClick={executeRename} className="bg-primary text-white">Renomear</Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
};

export default AdminCategoryOrder;
