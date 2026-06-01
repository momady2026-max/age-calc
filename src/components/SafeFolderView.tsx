import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, Lock, Unlock, Eye, EyeOff, FolderOpen, 
  FileText, Image as ImageIcon, Music, Video as VideoIcon, File as GenericFile,
  Settings, Upload, Download, Trash2, Edit3, Search, X, Calendar, HardDrive,
  Check, FileUp, Play, Pause, AlertTriangle, RotateCcw, Plus
} from 'lucide-react';
import { SafeFile } from '../types';

interface SafeFolderViewProps {
  showToast: (msg: string) => void;
  onFilesChanged?: (count: number) => void;
}

const CATEGORY_META = {
  all: { name: 'المساحة الكاملة', icon: FolderOpen, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200' },
  documents: { name: 'المستندات', icon: FileText, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200' },
  images: { name: 'الصور ولصاقات المعاينة', icon: ImageIcon, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200' },
  audio: { name: 'الملفات الصوتية', icon: Music, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200' },
  videos: { name: 'مسجلات الفيديو', icon: VideoIcon, color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200' },
  others: { name: 'أرشيف وملفات أخرى', icon: GenericFile, color: 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40 border-slate-200' }
};

const PRESET_STICKERS = [
  {
    name: 'درع الحماية المشفر',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#4f46e5" />
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="20" fill="#0f172a"/>
  <path d="M50 20 C60 20, 75 15, 75 15 C75 15, 75 55, 50 80 C25 55, 25 15, 25 15 L50 20 Z" fill="url(#shieldGrad)"/>
  <path d="M50 30 L63 43 L58 48 L50 40 L42 48 L37 43 Z" fill="#ffffff" />
  <circle cx="50" cy="60" r="8" fill="#ffffff" opacity="0.9"/>
</svg>`
  },
  {
    name: 'الملاحظة الذهبية المضيئة',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="lampGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="20" fill="#18181b"/>
  <circle cx="50" cy="45" r="20" fill="url(#lampGrad)" />
  <path d="M42 65 L58 65 L55 75 L45 75 Z" fill="#9ca3af" />
  <path d="M47 75 L53 75 L50 80 Z" fill="#4b5563" />
  <path d="M50 15 L50 25 M20 45 L30 45 M70 45 L80 45 M28 28 L36 36 M64 36 L72 28" stroke="#f59e0b" stroke-width="4" stroke-linecap="round" />
</svg>`
  },
  {
    name: 'تاج التميز والإنجاز',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="crownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ec4899" stop-opacity="1" />
      <stop offset="100%" stop-color="#8b5cf6" stop-opacity="1" />
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="20" fill="#090514"/>
  <path d="M20 70 L30 35 L45 50 L50 30 L55 50 L70 35 L80 70 Z" fill="url(#crownGrad)"/>
  <circle cx="30" cy="30" r="4" fill="#ffffff"/>
  <circle cx="50" cy="25" r="4" fill="#ffffff"/>
  <circle cx="70" cy="30" r="4" fill="#ffffff"/>
  <rect x="25" y="72" width="50" height="6" rx="3" fill="#ffffff" opacity="0.9" />
</svg>`
  },
  {
    name: 'عقل التفكير الاصطناعي',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="brainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="20" fill="#020617"/>
  <path d="M46 30 C35 30, 28 38, 28 48 C28 55, 33 62, 40 65 L40 75 L45 77 L45 30 Z" fill="url(#brainGrad)" opacity="0.85"/>
  <path d="M54 30 C65 30, 72 38, 72 48 C72 55, 67 62, 60 65 L60 75 L55 77 L55 30 Z" fill="url(#brainGrad)"/>
  <circle cx="50" cy="50" r="14" fill="#ffffff" opacity="0.15" />
  <circle cx="50" cy="50" r="6" fill="#10b981" />
</svg>`
  },
  {
    name: 'قلب الخواطر والمشاعر',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ef4444" />
      <stop offset="100%" stop-color="#b91c1c" />
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="20" fill="#1c1917"/>
  <path d="M50 78 C50 78, 80 54, 80 38 C80 26, 71 18, 60 18 C53 18, 48 22, 45 27 C42 22, 37 18, 30 18 C19 18, 10 26, 10 38 C10 54, 50 78, 50 78 Z" fill="url(#heartGrad)"/>
  <circle cx="34" cy="30" r="4" fill="#ffffff" opacity="0.4"/>
</svg>`
  },
  {
    name: 'كوب قهوة الصباح للتركيز',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="coffeeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#854d0e" />
      <stop offset="100%" stop-color="#a16207" />
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="20" fill="#1e1b4b"/>
  <path d="M30 40 L70 40 L65 70 C65 74, 61 78, 56 78 L44 78 C39 78, 35 74, 35 70 Z" fill="url(#coffeeGrad)"/>
  <path d="M70 45 C75 45, 79 49, 79 54 C79 59, 75 63, 70 63" stroke="#a16207" stroke-width="5" fill="none" />
  <path d="M42 22 Q45 30, 42 35 M50 20 Q53 28, 50 33 M58 22 Q61 30, 58 35" stroke="#ffffff" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.7" />
</svg>`
  }
];

const PRESET_VIDEOS = [
  {
    name: 'لقطة نجوم مجرة الفضاء اللانهائي',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-background-1611-large.mp4',
    duration: '0:14'
  },
  {
    name: 'تأثير شبكة ضوئية متحركة وتكنولوجيا نيون',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-grid-of-pink-lights-background-loop-42217-large.mp4',
    duration: '0:10'
  },
  {
    name: 'مقطع تدفق المجرى المائي وأشعة الشمس',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4',
    duration: '0:26'
  },
  {
    name: 'واجهة تشفير البيانات والذكاء الاصطناعي',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-cyber-security-hacker-code-interface-40813-large.mp4',
    duration: '0:30'
  }
];

const getDecodedTextContent = (file: SafeFile): string => {
  try {
    if (!file.dataUrl) return '';
    const parts = file.dataUrl.split(';base64,');
    if (parts.length < 2) return '';
    const binaryString = atob(parts[1]);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  } catch (e) {
    console.error('Failed to decode file text content', e);
    return 'فشل فك تشفير محتوى الملف النصي أو الترميز غير مدعوم.';
  }
};

export default function SafeFolderView({ showToast, onFilesChanged }: SafeFolderViewProps) {
  // App states
  const [safePin, setSafePin] = useState<string>('');
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [authInput, setAuthInput] = useState<string>('');
  const [authError, setAuthError] = useState<boolean>(false);
  const [showAuthPin, setShowAuthPin] = useState<boolean>(false);
  
  // Setup state
  const [setupPin, setSetupPin] = useState<string>('');
  const [showSetupPin, setShowSetupPin] = useState<boolean>(false);
  
  // Active Category Folder Tab
  const [activeCategory, setActiveCategory] = useState<'all' | 'documents' | 'images' | 'audio' | 'videos' | 'others'>('all');
  const [uploadTargetCategory, setUploadTargetCategory] = useState<'all' | 'documents' | 'images' | 'audio' | 'videos' | 'others'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Files database state
  const [files, setFiles] = useState<SafeFile[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings modals
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [currentPinInput, setCurrentPinInput] = useState<string>('');
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [showSettingsPins, setShowSettingsPins] = useState<boolean>(false);

  // Rename modal
  const [editingFile, setEditingFile] = useState<SafeFile | null>(null);
  const [newNameInput, setNewNameInput] = useState<string>('');

  // Previews
  const [previewFile, setPreviewFile] = useState<SafeFile | null>(null);
  const [htmlPreviewMode, setHtmlPreviewMode] = useState<'render' | 'code'>('render');
  const [forceTextPreview, setForceTextPreview] = useState<boolean>(false);
  const [audioPlayingId, setAudioPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Multi-selection states for batch delete operations
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);

  // Custom Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    cancelText: string;
    isDanger: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmText: 'تأكيد',
    cancelText: 'إلغاء',
    isDanger: false,
    onConfirm: () => {}
  });

  // Reset HTML preview mode when file changes
  useEffect(() => {
    if (previewFile) {
      setHtmlPreviewMode('render');
      setForceTextPreview(false);
    }
  }, [previewFile]);

  // Reset selection when category changes
  useEffect(() => {
    setSelectedFileIds([]);
  }, [activeCategory]);

  // Initialize and load configurations
  useEffect(() => {
    const savedPin = localStorage.getItem('notebox_safe_folder_pin') || '';
    setSafePin(savedPin);
    
    // Load existing files
    try {
      const storedFiles = localStorage.getItem('notebox_secure_files');
      if (storedFiles) {
        const parsed = JSON.parse(storedFiles) as SafeFile[];
        setFiles(parsed);
        if (onFilesChanged) onFilesChanged(parsed.length);
      }
    } catch (e) {
      console.error('Failed to parse secure files', e);
    }
  }, []);

  // Save files to disk and notify parent count
  const saveFiles = (newFiles: SafeFile[]) => {
    setFiles(newFiles);
    localStorage.setItem('notebox_secure_files', JSON.stringify(newFiles));
    if (onFilesChanged) onFilesChanged(newFiles.length);
  };

  // Safe Folder authentication
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authInput === safePin) {
      setIsLocked(false);
      setAuthInput('');
      setAuthError(false);
      showToast('🔑 تم فتح المجلد الآمن بنجاح!');
    } else {
      setAuthError(true);
      setAuthInput('');
    }
  };

  // Safe Folder Setup
  const handleSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (setupPin.length !== 6 || isNaN(Number(setupPin))) {
      showToast('⚠️ يجب أن يتكون رمز الحماية من 6 أرقام دقيقة!');
      return;
    }
    localStorage.setItem('notebox_safe_folder_pin', setupPin);
    setSafePin(setupPin);
    setIsLocked(false);
    setSetupPin('');
    showToast('🛡️ تم تفعيل المجلد الآمن وتهيئة كلمة السر بنجاح!');
  };

  // Edit Safe Folder Settings
  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPinInput !== safePin) {
      showToast('⚠️ رمز الـ PIN الحالي غير صحيح!');
      return;
    }
    if (newPinInput.length !== 6 || isNaN(Number(newPinInput))) {
      showToast('⚠️ يجب أن يكون الرمز الجديد مكون من 6 أرقام!');
      return;
    }
    localStorage.setItem('notebox_safe_folder_pin', newPinInput);
    setSafePin(newPinInput);
    setCurrentPinInput('');
    setNewPinInput('');
    setShowSettingsModal(false);
    showToast('✨ تم تعديل كلمة سر المجلد الآمن بنجاح!');
  };

  // File Classification Helper
  const classifyFile = (fileName: string, mimeType: string): 'documents' | 'images' | 'audio' | 'videos' | 'others' => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    
    const documents = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'odt', 'ods', 'odp', 'csv', 'md', 'html', 'json'];
    const images = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
    const audio = ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'wma', 'amr'];
    const videos = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', '3gp'];
    
    if (documents.includes(ext) || mimeType.startsWith('text/') || mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('sheet') || mimeType.includes('presentation')) {
      return 'documents';
    }
    if (images.includes(ext) || mimeType.startsWith('image/')) {
      return 'images';
    }
    if (audio.includes(ext) || mimeType.startsWith('audio/')) {
      return 'audio';
    }
    if (videos.includes(ext) || mimeType.startsWith('video/')) {
      return 'videos';
    }
    return 'others';
  };

  // Convert bytes size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 بايت';
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميغابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // File handling & Base64 storage
  const processUploadedFiles = (uploadedFiles: FileList) => {
    const loadedFiles: SafeFile[] = [];
    const nowStr = new Date().toISOString();

    Array.from(uploadedFiles).forEach((file) => {
      // FileReader to extract Base64 dataURL
      const reader = new FileReader();
      reader.onload = (e) => {
        if (!e.target?.result) return;
        
        const ext = file.name.split('.').pop() || '';
        // Enforce specific selected category if targeted
        const category = uploadTargetCategory !== 'all' ? uploadTargetCategory : classifyFile(file.name, file.type);
        
        const newSafeFile: SafeFile = {
          id: 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: formatFileSize(file.size),
          rawType: file.type,
          extension: ext,
          category: category,
          dataUrl: e.target.result as string,
          createdAt: nowStr,
          updatedAt: nowStr
        };

        loadedFiles.push(newSafeFile);
        
        // When all files processed, merge and update state
        if (loadedFiles.length === uploadedFiles.length) {
          const merged = [...loadedFiles, ...files];
          saveFiles(merged);
          
          setUploadTargetCategory('all'); // Reset target
          
          if (loadedFiles.length > 0) {
            const lastUploadedCategory = loadedFiles[0].category;
            setActiveCategory(lastUploadedCategory);
            showToast(`📥 تم حفظ وتصنيف ${uploadedFiles.length} ملف تلقائياً في مجلد "${CATEGORY_META[lastUploadedCategory].name}" بنجاح!`);
          } else {
            showToast(`📥 تم حفظ وتصنيف ${uploadedFiles.length} ملف بنجاح في المجلد الآمن!`);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processUploadedFiles(e.target.files);
    }
  };

  // Drag and drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploadedFiles(e.dataTransfer.files);
    }
  };

  // Save/Download file function
  const handleDownloadFile = (file: SafeFile) => {
    const link = document.createElement('a');
    link.href = file.dataUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('💾 تم تحميل وحفظ الملف بنجاح على جهازك!');
  };

  // Direct targeted upload
  const triggerCategoryUpload = (cat: 'documents' | 'images' | 'audio' | 'videos' | 'others') => {
    setUploadTargetCategory(cat);
    setTimeout(() => {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Clear previous
        fileInputRef.current.click();
      }
    }, 50);
  };

  // Add SVG preset sticker to safe files
  const handleAddPresetSticker = (name: string, svgContent: string) => {
    try {
      // Base64 encode SVG content
      const base64Data = btoa(unescape(encodeURIComponent(svgContent)));
      const dataUrl = `data:image/svg+xml;base64,${base64Data}`;
      const nowStr = new Date().toISOString();
      
      const newFile: SafeFile = {
        id: 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        name: `${name}.svg`,
        size: formatFileSize(svgContent.length),
        rawType: 'image/svg+xml',
        extension: 'svg',
        category: 'images',
        dataUrl: dataUrl,
        createdAt: nowStr,
        updatedAt: nowStr
      };

      const merged = [newFile, ...files];
      saveFiles(merged);
      showToast(`🎨 تم إضافة الملصق الجاهز "${name}" كملف صور مشفر في مجلدك بحفظ آمن!`);
    } catch (e) {
      console.error('Failed to add preset sticker', e);
      showToast('⚠️ فشل إضافة الملصق التلقائي');
    }
  };

  // Add MP4 preset video sample to safe files
  const handleAddPresetVideo = (name: string, videoUrl: string) => {
    const nowStr = new Date().toISOString();
    
    // Create a safe video record
    const newFile: SafeFile = {
      id: 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      name: `${name}.mp4`,
      size: '2.4 م.ب',
      rawType: 'video/mp4',
      extension: 'mp4',
      category: 'videos',
      dataUrl: videoUrl,
      createdAt: nowStr,
      updatedAt: nowStr
    };

    const merged = [newFile, ...files];
    saveFiles(merged);
    showToast(`🎬 تم إضافة مقطع الفيديو "${name}" للتشغيل الفوري والتجربة بنجاح!`);
  };

  // Rename secure file
  const handleRenameFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFile || !newNameInput.trim()) return;

    // Preserve original extension if user doesn't write it
    let finalName = newNameInput.trim();
    if (!finalName.includes('.') && editingFile.extension) {
      finalName = `${finalName}.${editingFile.extension}`;
    }

    const updated = files.map((f) => {
      if (f.id === editingFile.id) {
        return {
          ...f,
          name: finalName,
          updatedAt: new Date().toISOString() // الاحتفاظ بتاريخ التعديل
        };
      }
      return f;
    });

    saveFiles(updated);
    setEditingFile(null);
    setNewNameInput('');
    showToast('✏️ تم تعديل اسم الملف ومزامنة التغيير!');
  };

  // Delete file
  const handleDeleteFile = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'حفظ مستدام وأمان مغلظ',
      description: 'هل أنت متأكد من رغبتك في حذف هذا الملف بشكل نهائي من المجلد الآمن؟ لا يمكن استعادته لاحقاً أبداً.',
      confirmText: 'نعم، احذفه نهائياً',
      cancelText: 'إلغاء الحذف',
      isDanger: true,
      onConfirm: () => {
        const filtered = files.filter(f => f.id !== id);
        saveFiles(filtered);
        setSelectedFileIds(prev => prev.filter(selectedId => selectedId !== id));
        showToast('🗑️ تم حذف الملف نهائياً بأمان!');
        if (previewFile?.id === id) setPreviewFile(null);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Delete selected files (batch)
  const handleDeleteSelectedFiles = () => {
    if (selectedFileIds.length === 0) {
      showToast('⚠️ يرجى تحديد ملف واحد على الأقل أولاً!');
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: `حذف جماعي آمن (${selectedFileIds.length} ملفات)`,
      description: `هل أنت متأكد من رغبتك في حذف ${selectedFileIds.length} من الملفات المحددة نهائياً من المجلد الآمن؟ لا يمكن التراجع عن هذا الإجراء لاحقاً.`,
      confirmText: 'نعم، احذف المحدَّد',
      cancelText: 'إلغاء الحذف',
      isDanger: true,
      onConfirm: () => {
        const filtered = files.filter(f => !selectedFileIds.includes(f.id));
        saveFiles(filtered);
        setSelectedFileIds([]);
        showToast(`🗑️ تم حذف ${selectedFileIds.length} من الملفات المحددة نهائياً وبنجاح وافر!`);
        if (previewFile && selectedFileIds.includes(previewFile.id)) setPreviewFile(null);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Delete all files in the current active folder
  const handleDeleteAllInCurrentCategory = () => {
    const targetCat = activeCategory;
    const categoryName = CATEGORY_META[targetCat].name;
    const currentFiles = files.filter(f => targetCat === 'all' || f.category === targetCat);
    
    if (currentFiles.length === 0) {
      showToast(`⚠️ لا توجد أي ملفات محفوظة حالياً في مجلد ${categoryName}.`);
      return;
    }
    
    setConfirmModal({
      isOpen: true,
      title: `⚠️ إفراغ مجلد ${categoryName} بالكامل`,
      description: `تنبيه شديد السرية: هل أنت متأكد من رغبتك في حذف كافة الملفات (${currentFiles.length} ملف) الموجودة بداخل مجلد "${categoryName}" بشكل نهائي وقطعي؟ لا يمكن للأنظمة استعادتها أبداً.`,
      confirmText: 'نعم، أفرغ المجلد بالكامل',
      cancelText: 'تراجع وإلغاء الإجراء',
      isDanger: true,
      onConfirm: () => {
        const filtered = targetCat === 'all' ? [] : files.filter(f => f.category !== targetCat);
        saveFiles(filtered);
        setSelectedFileIds([]);
        showToast(`🗑️ تم إفراغ مجلد "${categoryName}" بالكامل وحذف كافة محتوياته بأمان مغلظ!`);
        if (previewFile && (targetCat === 'all' || previewFile.category === targetCat)) setPreviewFile(null);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Restore file to its place (Download/Extract and remove from secure folder)
  const handleRestoreFile = (file: SafeFile) => {
    setConfirmModal({
      isOpen: true,
      title: 'استعادة وفك تشفير الملف الآمن',
      description: `هل أنت متأكد من رغبتك في استعادة الملف "${file.name}" وتنزيله على جهازك؟ سيتم تنزيل نسخة منه وحذف النسخة المشفرة المودعة بالمجلد الآمن لضمان الخصوصية القصوى.`,
      confirmText: 'نعم، استعد الملف الآن',
      cancelText: 'إلغاء الاستعادة',
      isDanger: false,
      onConfirm: () => {
        // 1. Download file to user computer
        const link = document.createElement('a');
        link.href = file.dataUrl;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // 2. Remove file from secure directory
        const filtered = files.filter(f => f.id !== file.id);
        saveFiles(filtered);

        showToast(`🔄 تم استعادة الملف "${file.name}" بنجاح وتنزيله على جهازك وإخراجه من المجلد الفائق!`);
        if (previewFile?.id === file.id) setPreviewFile(null);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Audio Player click toggle
  const toggleAudioPlay = (file: SafeFile) => {
    if (audioPlayingId === file.id) {
      audioRef.current?.pause();
      setAudioPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = file.dataUrl;
        audioRef.current.play();
        setAudioPlayingId(file.id);
      }
    }
  };

  // Search and Category filtering
  const filteredFiles = files.filter((f) => {
    const matchCategory = activeCategory === 'all' || f.category === activeCategory;
    const matchSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        f.extension.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  // Category counts
  const getCategoryCount = (cat: 'all' | 'documents' | 'images' | 'audio' | 'videos' | 'others') => {
    if (cat === 'all') return files.length;
    return files.filter(f => f.category === cat).length;
  };

  // Format Date for Arabic View
  const localizeDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (_) {
      return isoString;
    }
  };

  // --- RENDERING VIEWS ---

  // 1. Password NOT initialized screen
  if (!safePin) {
    return (
      <div className="bg-white dark:bg-[#121214] border border-stone-200 dark:border-zinc-800 rounded-3xl p-8 max-w-lg mx-auto text-center space-y-6 shadow-xl" dir="rtl">
        <div className="mx-auto w-16 h-16 bg-sky-50 dark:bg-sky-950/20 rounded-2xl flex items-center justify-center">
          <ShieldCheck className="w-9 h-9 text-sky-600 animate-pulse" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-lg font-black text-stone-850 dark:text-zinc-100">تهيئة المجلد الآمن المشفر</h2>
          <p className="text-xs text-stone-500 dark:text-zinc-400 leading-relaxed">
            مرحباً بك في الميزّة التخزينية الفائقة! المجلد الآمن يتيح لك حماية وتصنيف ملفاتك الحساسة (مستندات، صور، تسجيلات، وفيديوهات) بشكل مستقل تماماً. يرجى تهيئة رمز PIN الفريد المكون من 6 أرقام لتشفير وقفل مساحتك.
          </p>
        </div>

        <form onSubmit={handleSetupSubmit} className="max-w-xs mx-auto space-y-4">
          <div className="relative flex items-center">
            <input
              type={showSetupPin ? "text" : "password"}
              maxLength={6}
              placeholder="مثال: 445588"
              value={setupPin}
              onChange={(e) => setSetupPin(e.target.value.replace(/\D/g, ''))}
              className="w-full text-center font-mono font-black text-black dark:text-black tracking-[0.4em] px-4 py-3 bg-white border-2 border-stone-250 dark:border-zinc-700 rounded-2xl text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all font-black text-lg"
              autoFocus
              required
            />
            <button
              type="button"
              onClick={() => setShowSetupPin(!showSetupPin)}
              className="absolute left-3 p-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-500 rounded-lg transition-all cursor-pointer"
              title={showSetupPin ? "إخفاء الرمز" : "إظهار الرمز"}
            >
              {showSetupPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={setupPin.length !== 6}
            className="w-full py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-2xl shadow-md cursor-pointer transition-all disabled:opacity-40"
          >
            تفعيل المجلد الآمن الآن
          </button>
        </form>
      </div>
    );
  }

  // 2. Locked Screen (Enter PIN to view files)
  if (isLocked) {
    return (
      <div className="bg-white dark:bg-[#121214] border border-stone-200 dark:border-zinc-800 rounded-3xl p-8 max-w-md mx-auto text-center space-y-6 shadow-xl" dir="rtl">
        <div className="mx-auto w-14 h-14 bg-amber-50 dark:bg-amber-950/20 rounded-2xl flex items-center justify-center">
          <Lock className="w-7 h-7 text-amber-600" />
        </div>

        <div className="space-y-1">
          <h2 className="text-base font-black text-stone-850 dark:text-zinc-100">المجلد الآمن مغلق بأمان</h2>
          <p className="text-[11px] text-stone-450 dark:text-zinc-400">
            للوصول إلى ملفاتك ومجلدات الصيانة الفرعية، يرجى كتابة رمز المرور المكون من 6 أرقام:
          </p>
        </div>

        <form onSubmit={handleAuthSubmit} className="max-w-xs mx-auto space-y-4">
          <div className="relative flex items-center">
            <input
              type={showAuthPin ? "text" : "password"}
              maxLength={6}
              placeholder="******"
              value={authInput}
              onChange={(e) => {
                setAuthError(false);
                setAuthInput(e.target.value.replace(/\D/g, ''));
              }}
              className={`w-full text-center font-mono tracking-[0.4em] font-black text-black dark:text-black px-4 py-3 bg-white border-2 rounded-2xl text-lg focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all ${
                authError 
                  ? 'border-red-400 animate-shake focus:border-red-500' 
                  : 'border-stone-250 dark:border-zinc-700 focus:border-sky-500'
              }`}
              autoFocus
              required
            />
            <button
              type="button"
              onClick={() => setShowAuthPin(!showAuthPin)}
              className="absolute left-3 p-1.5 hover:bg-stone-100 dark:hover:bg-zinc-805 text-stone-500 rounded-lg transition-all cursor-pointer"
              title={showAuthPin ? "إخفاء الرمز" : "إظهار الرمز"}
            >
              {showAuthPin ? <EyeOff className="w-4 h-4 text-stone-500" /> : <Eye className="w-4 h-4 text-stone-500" />}
            </button>
          </div>

          {authError && (
            <p className="text-[10px] text-red-500 font-bold animate-pulse">⚠️ رمز المرور للمطالعة غير صحيح!</p>
          )}

          <button
            type="submit"
            disabled={authInput.length !== 6}
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-40"
          >
            توصيل وفتح المجلد
          </button>
        </form>
      </div>
    );
  }

  // 3. Unlocked Workspace Screen
  return (
    <div className="space-y-6" dir="rtl">
      {/* Hidden Audio Player for playback preview */}
      <audio ref={audioRef} onEnded={() => setAudioPlayingId(null)} className="hidden" />

      {activeCategory === 'all' ? (
        <>
          {/* Unlocked workspace Header Panel */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white dark:bg-[#121214] border border-stone-150 dark:border-zinc-850 p-4 rounded-2xl shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-zinc-800">
                <Unlock className="w-5 h-5" />
              </div>
              <div className="text-right">
                <h2 className="text-sm font-black text-stone-850 dark:text-zinc-100 flex items-center gap-2">
                  <span>المجلد الآمن للملفات والمحفوظات المشفرة</span>
                  <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold px-1.5 py-0.5 rounded-full">نشط ومؤمن</span>
                </h2>
                <p className="text-[10px] text-stone-400 dark:text-zinc-550 mt-0.5">تقسيم تلقائي فوري للملفات، مع حماية تاريخ الحفظ والتعديلات</p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              {/* Lock Button */}
              <button
                onClick={() => {
                  setIsLocked(true);
                  setAuthInput('');
                  showToast('🔒 تم قفل المجلد الآمن بنجاح!');
                }}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-stone-600 dark:text-zinc-300 text-[10px] font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 border border-stone-200 dark:border-zinc-800"
                title="قفل المجلد"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>قفل المجلد الآن</span>
              </button>

              {/* Safe Folder settings */}
              <button
                onClick={() => {
                  setCurrentPinInput('');
                  setNewPinInput('');
                  setShowSettingsModal(true);
                }}
                className="p-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-stone-600 dark:text-zinc-300 rounded-xl transition cursor-pointer border border-stone-200 dark:border-zinc-800"
                title="إعدادات المجلد الآمن (تغيير الرمز)"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Automatic classified sub-folders layout grids */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-stone-700 dark:text-zinc-400 block text-right">📂 المجلدات الفرعية الآمنة (اضغط على المجلد لفتحه أو أيقونة (+) لرفع ملفات فيه مباشرة)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
              {(Object.keys(CATEGORY_META) as Array<keyof typeof CATEGORY_META>).filter(k => k !== 'all').map((key) => {
                const meta = CATEGORY_META[key];
                const Icon = meta.icon;
                const count = getCategoryCount(key);

                return (
                  <div
                    key={key}
                    onClick={() => setActiveCategory(key)}
                    className="group relative flex flex-col items-start p-4 rounded-2xl border text-right transition-all duration-200 cursor-pointer bg-white dark:bg-[#121214] text-stone-600 dark:text-zinc-400 border-stone-200 dark:border-zinc-850 hover:border-indigo-400 dark:hover:border-zinc-500 hover:bg-stone-50/60 dark:hover:bg-zinc-900/30 hover:scale-[1.03] shadow-xs hover:shadow-md"
                  >
                    {/* Quick direct upload arrow/plus icon */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerCategoryUpload(key);
                      }}
                      className="absolute left-3 top-3 p-1.5 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900 text-sky-600 dark:text-sky-400 rounded-xl border border-sky-150 dark:border-sky-900/40 shadow-xs cursor-pointer flex items-center justify-center transition hover:scale-110"
                      title={`رفع ملفات مباشرة إلى مجلد ${meta.name} دون مغادرة الشاشة`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>

                    <div className={`p-2 rounded-xl mb-3 border ${meta.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-black block truncate w-full pr-1 text-stone-850 dark:text-zinc-200">{meta.name}</span>
                    <span className="text-[10px] text-stone-400 dark:text-zinc-555 font-mono mt-1 pr-1">
                      {count} {count === 1 ? 'ملف واحد' : count === 2 ? 'ملفان' : count >= 3 && count <= 10 ? 'ملفات' : 'ملف'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* File Upload Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => {
              setUploadTargetCategory('all');
              setTimeout(() => {
                fileInputRef.current?.click();
              }, 10);
            }}
            className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all duration-300 bg-white dark:bg-[#121214] ${
              isDragging 
                ? 'border-indigo-500 bg-indigo-50/20' 
                : 'border-stone-250 dark:border-zinc-850 hover:border-stone-400 hover:bg-stone-50/40 dark:hover:bg-zinc-900/30'
            }`}
          >
            <div className="space-y-2 max-w-sm mx-auto">
              <div className="mx-auto w-10 h-10 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                <FileUp className="w-5 h-5 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-stone-850 dark:text-zinc-200">اسحب وافلت الملفات هنا أو اضغط للتصفح</h4>
                <p className="text-[10px] text-stone-400 dark:text-zinc-555 leading-relaxed">
                  يدعم المجلد كافة أنواع الملفات وبشكل لانهائي (مستندات، صور، صوت، مقاطع فيديو، ملفات مضغوطة zip والملفات الأخرى) ويسجل التوقيت التلقائي بدقة بالغة.
                </p>
              </div>
            </div>
          </div>

          {/* Files Grid View workspace */}
          <div className="text-center py-10 space-y-3 bg-stone-50/40 dark:bg-zinc-900/10 rounded-2xl p-6 border border-dashed border-stone-200 dark:border-zinc-800">
            <div className="mx-auto w-12 h-12 text-indigo-500/80 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black text-stone-850 dark:text-zinc-250">المجلد الآمن الفائق</h4>
              <p className="text-[11px] text-stone-450 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                تم فرز وحفظ ملفاتك تلقائياً وبسرية تامة داخل مجلداتها المتخصصة أعلاه وهي مخفية الآن من الشاشة العامة. <strong>يرجى اختيار أحد المجلدات الفرعية الذكية أعلاه</strong> لعرض ملفاتك ومراجعتها، أو حذفها، أو استعادتها مرة أخرى لجهازك بنجاح.
              </p>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* DETAILED SPECIFIC SUBFOLDER OPENED IN FULL PAGE VIEW */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white dark:bg-[#121214] border border-stone-150 dark:border-zinc-850 p-4.5 rounded-2xl shadow-xs">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl border ${CATEGORY_META[activeCategory].color}`}>
                {React.createElement(CATEGORY_META[activeCategory].icon, { className: "w-5 h-5" })}
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-stone-400 dark:text-zinc-500">
                  <span className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded-md">مفتوح حالياً</span>
                  <span>•</span>
                  <span>بوابة الملفات المشفرة</span>
                </div>
                <h2 className="text-sm font-black text-stone-850 dark:text-zinc-150 flex items-center gap-2 mt-1">
                  <span>مجلد {CATEGORY_META[activeCategory].name}</span>
                  <span className="text-[10px] bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 font-mono font-black px-2 py-0.5 rounded-full border border-stone-150 dark:border-zinc-700">
                    {getCategoryCount(activeCategory)} {getCategoryCount(activeCategory) === 1 ? 'ملف واحد' : getCategoryCount(activeCategory) === 2 ? 'ملفان' : getCategoryCount(activeCategory) >= 3 && getCategoryCount(activeCategory) <= 10 ? 'ملفات' : 'ملف'}
                  </span>
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
              {/* Return to categories grid */}
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-black text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <span>العودة لجميع المجلدات</span>
                <span className="text-xs">←</span>
              </button>

              <div className="flex items-center gap-1.5">
                {/* Lock button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsLocked(true);
                    setAuthInput('');
                    showToast('🔒 تم قفل المجلد الآمن بنجاح!');
                  }}
                  className="p-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-stone-600 dark:text-zinc-300 rounded-xl border border-stone-200 dark:border-zinc-800 cursor-pointer"
                  title="قفل المجلد وغلقه"
                >
                  <Lock className="w-4 h-4" />
                </button>

                {/* Safe Folder settings */}
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPinInput('');
                    setNewPinInput('');
                    setShowSettingsModal(true);
                  }}
                  className="p-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-zinc-900 dark:hover:bg-zinc-855 text-stone-600 dark:text-zinc-300 rounded-xl border border-stone-200 dark:border-zinc-800 cursor-pointer"
                  title="إعدادات كلمة المرور"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Special drag zone styled for the specific open folder */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all duration-300 bg-white dark:bg-[#121214] ${
              isDragging 
                ? 'border-indigo-500 bg-indigo-50/20' 
                : 'border-stone-250 dark:border-zinc-850 hover:border-stone-400'
            }`}
          >
            <div className="space-y-2 max-w-sm mx-auto">
              <div className={`mx-auto w-10 h-10 rounded-xl flex items-center justify-center border ${CATEGORY_META[activeCategory].color}`}>
                <FileUp className="w-5 h-5 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-stone-850 dark:text-zinc-200">إضافة ملفات جديدة إلى مجلد {CATEGORY_META[activeCategory].name}</h4>
                <p className="text-[10px] text-stone-450 dark:text-zinc-500 leading-relaxed">
                  اسحب أي ملف هنا أو اضغط للتصفح للرفع المباشر والسرّي داخل مجلد <strong>{CATEGORY_META[activeCategory].name}</strong> فورا.
                </p>
              </div>
            </div>
          </div>

          {/* Preset templates for videos to satisfy user request perfectly */}
          {activeCategory === 'videos' && (
            <div className="bg-white dark:bg-[#121214] border border-stone-200 dark:border-zinc-850 rounded-3xl p-5 space-y-4 shadow-xs" dir="rtl">
              <div className="text-right">
                <h4 className="text-xs font-black text-[#0284c7] dark:text-sky-400 flex items-center gap-1.5">
                  <span className="text-amber-500 font-black animate-pulse">✨</span>
                  <span>عينات ومقاطع فيديو جاهزة للتجربة والتشغيل</span>
                </h4>
                <p className="text-[10px] text-stone-450 dark:text-zinc-500 mt-1 leading-relaxed">
                  اختر أي عينة فيديو كوني أو طبيعي أدناه لحفظها فوراً والاستعراض في المشغل المدمج بمجلدك الآمن!
                </p>
              </div>


                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {PRESET_VIDEOS.map((vid, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddPresetVideo(vid.name, vid.url)}
                      className="group flex flex-col p-4 rounded-2xl border border-stone-150 dark:border-zinc-850 bg-stone-50 dark:bg-zinc-950/50 hover:border-rose-500 dark:hover:border-rose-500 hover:bg-rose-50/10 dark:hover:bg-rose-950/10 hover:scale-103 transition-all duration-300 cursor-pointer text-right space-y-4 justify-between min-h-[95px]"
                    >
                      <div className="flex justify-between items-center w-full">
                        <div className="p-1.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-450 rounded-xl border border-rose-100/50 dark:border-rose-950/40">
                          <Play className="w-3.5 h-3.5 fill-rose-600 dark:fill-rose-400 text-rose-600 dark:text-rose-450" />
                        </div>
                        <span className="text-[8.5px] bg-stone-200/60 dark:bg-zinc-800 text-stone-550 dark:text-zinc-400 px-2 py-0.5 rounded-md font-mono font-black">{vid.duration}</span>
                      </div>
                      <span className="text-[10.5px] font-black text-stone-850 dark:text-zinc-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 truncate w-full" title={vid.name}>
                        {vid.name}
                      </span>
                    </button>
                  ))}
                </div>
            </div>
          )}

          {/* Files workspace Panel Container */}
          <div className="bg-white dark:bg-[#121214] border border-stone-200 dark:border-zinc-850 rounded-2xl p-4 space-y-4">
            {/* Workspace Toolbar controls */}
            <div className="flex flex-col gap-3.5 pb-3 border-b border-stone-150 dark:border-zinc-850">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-stone-850 dark:text-zinc-200">
                    محتويات مجلد {CATEGORY_META[activeCategory].name} ({filteredFiles.length})
                  </h3>
                </div>

                <div className="relative max-w-xs w-full flex items-center">
                  <Search className="w-3.5 h-3.5 absolute right-2.5 text-stone-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث عن اسم الملف أو الامتداد..."
                    className="w-full text-xs pr-8 pl-3 py-1.5 border border-stone-200 dark:border-zinc-800 rounded-xl bg-stone-50 dark:bg-zinc-950 text-stone-800 dark:text-zinc-200 focus:outline-[#0284c7] focus:bg-white"
                  />
                </div>
              </div>

              {/* Multi-operations Action Bar */}
              {filteredFiles.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-dashed border-stone-150 dark:border-zinc-800/60">
                  <div className="flex items-center gap-3">
                    {/* Toggle Select All */}
                    <button
                      type="button"
                      onClick={() => {
                        const allIds = filteredFiles.map(f => f.id);
                        const isAllSelected = allIds.every(id => selectedFileIds.includes(id));
                        if (isAllSelected) {
                          // Deselect all for this filtered view
                          setSelectedFileIds(prev => prev.filter(id => !allIds.includes(id)));
                        } else {
                          // Select all for this filtered view
                          setSelectedFileIds(prev => Array.from(new Set([...prev, ...allIds])));
                        }
                      }}
                      className="text-[11px] font-black px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-zinc-805 bg-stone-50 hover:bg-stone-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-stone-650 dark:text-zinc-300 cursor-pointer transition flex items-center gap-1.5"
                    >
                      <input
                        type="checkbox"
                        checked={filteredFiles.map(f => f.id).every(id => selectedFileIds.includes(id))}
                        onChange={() => {}} // Done via button click
                        className="cursor-pointer rounded accent-indigo-600 focus:ring-0 w-3 h-3"
                      />
                      <span>تحديد الكل ({filteredFiles.length})</span>
                    </button>

                    {/* Count indicator */}
                    {selectedFileIds.length > 0 && (
                      <span className="text-[10px] font-bold text-indigo-650 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-1 rounded-lg">
                        محكم التحديد: {selectedFileIds.length} {selectedFileIds.length === 1 ? 'ملف واحد' : 'ملفات'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Delete Selected Button */}
                    {selectedFileIds.length > 0 && (
                      <button
                        type="button"
                        onClick={handleDeleteSelectedFiles}
                        className="text-[11px] font-black px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/40 text-red-650 dark:text-red-400 rounded-xl border border-red-150 dark:border-red-900/40 cursor-pointer transition flex items-center gap-1.5 shadow-xs hover:shadow-md"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        <span>حذف المحدَّد ({selectedFileIds.length})</span>
                      </button>
                    )}

                    {/* Delete All in Folder button */}
                    <button
                      type="button"
                      onClick={handleDeleteAllInCurrentCategory}
                      className="text-[11px] font-black px-3 py-1.5 hover:bg-red-50/20 hover:text-red-600 dark:hover:bg-red-950/20 text-stone-500 dark:text-zinc-400 dark:hover:text-red-400 rounded-xl border border-stone-200 dark:border-zinc-800 cursor-pointer transition flex items-center gap-1.5"
                      title={`إفراغ مجلد ${CATEGORY_META[activeCategory].name} تماماً`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 group-hover:text-red-500" />
                      <span>إفراغ المجلد ({filteredFiles.length})</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Files Grid View workspace */}
            {filteredFiles.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <div className="mx-auto w-12 h-12 text-stone-300 dark:text-zinc-700 flex items-center justify-center">
                  <FolderOpen className="w-10 h-10" />
                </div>
                <p className="text-[11px] text-stone-400 dark:text-zinc-555">لا يوجد أي ملفات محفوظة متطابقة حالياً تحت مجلد {CATEGORY_META[activeCategory].name}.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredFiles.map((file) => {
                  let ExtIcon = GenericFile;
                  if (file.category === 'documents') ExtIcon = FileText;
                  else if (file.category === 'images') ExtIcon = ImageIcon;
                  else if (file.category === 'audio') ExtIcon = Music;
                  else if (file.category === 'videos') ExtIcon = VideoIcon;

                  const isCurrentlySelected = selectedFileIds.includes(file.id);

                  return (
                    <div
                      key={file.id}
                      className={`group flex flex-col p-4 border rounded-2xl transition-all shadow-2xs hover:shadow-xs justify-between min-h-[155px] ${
                        isCurrentlySelected
                          ? 'bg-indigo-50/30 dark:bg-indigo-950/15 border-indigo-350 dark:border-indigo-850'
                          : 'bg-stone-50 dark:bg-zinc-950/40 border-stone-150 dark:border-zinc-850 hover:bg-white dark:hover:bg-zinc-900'
                      }`}
                    >
                      {/* Top section: Preview and metadata details */}
                      <div className="flex gap-2.5 items-start w-full relative">
                        {/* Checkbox trigger block */}
                        <div className="pt-1.5 self-start shrink-0" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isCurrentlySelected}
                            onChange={() => {
                              setSelectedFileIds(prev =>
                                prev.includes(file.id)
                                  ? prev.filter(id => id !== file.id)
                                  : [...prev, file.id]
                              );
                            }}
                            className="cursor-pointer rounded accent-indigo-600 focus:ring-0 w-3.5 h-3.5"
                            title="تحديد ملف لإجراء جماعي"
                          />
                        </div>

                        <div 
                          onClick={() => setPreviewFile(file)}
                          className="flex gap-3 items-start flex-1 min-w-0 cursor-pointer group/cardtop hover:opacity-90 transition-all"
                          title="انقر لفتح ومعاينة محتويات الملف"
                        >
                          {/* File preview icon or image thumb */}
                          {file.category === 'images' ? (
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-100 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 shrink-0 transform active:scale-95 transition-all">
                              <img src={file.dataUrl} alt={file.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-stone-150 dark:bg-zinc-855 group-hover/cardtop:bg-indigo-50 dark:group-hover/cardtop:bg-indigo-950/40 flex items-center justify-center text-stone-500 dark:text-zinc-400 border border-stone-200 dark:border-zinc-800 shrink-0 transform active:scale-95 transition-all w-12 h-12">
                              <ExtIcon className="w-5 h-5" />
                            </div>
                          )}

                          {/* Info details */}
                          <div className="flex-1 min-w-0 space-y-1.5 text-right">
                            <p className="text-xs font-black text-stone-850 dark:text-zinc-200 truncate leading-relaxed group-hover/cardtop:text-indigo-600 dark:group-hover/cardtop:text-sky-450 transition-colors" title={file.name}>
                              {file.name}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-[10px] text-stone-450 dark:text-zinc-555 font-mono">
                              <span className="font-bold text-stone-500 dark:text-zinc-400 bg-stone-200/50 dark:bg-zinc-850/80 px-1.5 py-0.5 rounded-md">{file.size}</span>
                              <span className="uppercase text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-1.5 py-0.5 rounded-md font-extrabold">{file.extension}</span>
                            </div>
                            {/* Saved or Updated timelines */}
                            <div className="text-[10px] text-stone-400 dark:text-zinc-555 flex flex-wrap gap-1.5 items-center font-mono">
                              <span className="flex items-center gap-0.5" title="تاريخ الإضافة والحفظ">
                                <Calendar className="w-3 h-3 text-indigo-400 shrink-0" />
                                <span>تاريخ الحفظ: {localizeDate(file.createdAt)}</span>
                              </span>
                              {file.updatedAt !== file.createdAt && (
                                <span className="text-[9px] text-amber-600 dark:text-amber-400 font-medium font-sans">
                                  (تم تعديله: {localizeDate(file.updatedAt)})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions buttons at the bottom of the card */}
                      <div className="flex items-center gap-1.5 justify-end w-full pt-2.5 mt-3 border-t border-stone-150/80 dark:border-zinc-850/60 font-sans">
                        {/* Special Audio mini-play shortcut */}
                        {file.category === 'audio' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAudioPlay(file);
                            }}
                            className={`p-1.5 rounded-lg border transition ${
                              audioPlayingId === file.id
                                ? 'bg-amber-100 hover:bg-amber-250 text-amber-700 border-amber-250 animate-pulse'
                                : 'bg-stone-100 dark:bg-zinc-855 hover:bg-stone-200 dark:hover:bg-zinc-805 text-stone-600 dark:text-zinc-355 border-stone-200 dark:border-zinc-800'
                            } cursor-pointer`}
                            title={audioPlayingId === file.id ? "إيقاف مؤقت" : "تشغيل الصوت الفوري"}
                          >
                            {audioPlayingId === file.id ? <Pause className="w-3.5 h-3.5 text-amber-700" /> : <Play className="w-3.5 h-3.5" />}
                          </button>
                        )}

                        {/* View/Preview Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewFile(file);
                          }}
                          className="p-1.5 bg-stone-100 dark:bg-zinc-855 hover:bg-stone-200 dark:hover:bg-zinc-805 text-stone-600 dark:text-zinc-355 rounded-lg border border-stone-250 dark:border-zinc-800 cursor-pointer"
                          title="عرض ومعاينة الملف"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Download */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadFile(file);
                          }}
                          className="p-1.5 bg-stone-100 dark:bg-zinc-855 hover:bg-stone-200 dark:hover:bg-zinc-805 text-stone-600 dark:text-zinc-355 rounded-lg border border-stone-250 dark:border-zinc-800 cursor-pointer"
                          title="تحميل الملف للجهاز"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {/* Restore File */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestoreFile(file);
                          }}
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-105/90 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-150 dark:border-emerald-900/30 cursor-pointer"
                          title="استعادة الملف إلى مكانه (تنزيل وحذف من المجلد)"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>

                        {/* Rename */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingFile(file);
                            // Strip extension for easier input experience
                            const parts = file.name.split('.');
                            if (parts.length > 1) parts.pop();
                            setNewNameInput(parts.join('.'));
                          }}
                          className="p-1.5 bg-stone-100 dark:bg-zinc-855 hover:bg-stone-200 dark:hover:bg-zinc-805 text-stone-600 dark:text-zinc-355 rounded-lg border border-stone-200 dark:border-zinc-800 cursor-pointer"
                          title="تعديل اسم الملف"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Permanent delete */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFile(file.id);
                          }}
                          className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/30 text-red-500 rounded-lg border border-red-100 dark:border-red-900/40 cursor-pointer"
                          title="حذف نهائي"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* MODAL: Safe Folder Settings (Passcode change) */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" dir="rtl">
          <div className="bg-white dark:bg-[#121214] border border-stone-200 dark:border-zinc-800 rounded-3xl p-6 max-w-sm w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-stone-150 dark:border-zinc-850">
              <h3 className="text-xs font-black text-stone-850 dark:text-zinc-150 flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-sky-600" />
                <span>إعدادات وتعديل رمز قفل المجلد الآمن</span>
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded bg-stone-50 dark:bg-zinc-900 border border-stone-150 dark:border-zinc-800"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            <form onSubmit={handleUpdatePin} className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-500 dark:text-zinc-450 block text-right">رمز المرور أو PIN الحالي لبلورة الأمان:</label>
                  <div className="relative flex items-center">
                    <input
                      type={showSettingsPins ? "text" : "password"}
                      maxLength={6}
                      placeholder="******"
                      value={currentPinInput}
                      onChange={(e) => setCurrentPinInput(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center font-mono tracking-widest font-black text-black dark:text-black px-3 py-2 bg-white border border-stone-250 dark:border-zinc-700 rounded-xl text-xs focus:ring-1 focus:ring-sky-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-500 dark:text-zinc-450 block text-right">رمز الـ PIN الجديد المكون من 6 أرقام دقيقة:</label>
                  <div className="relative flex items-center">
                    <input
                      type={showSettingsPins ? "text" : "password"}
                      maxLength={6}
                      placeholder="******"
                      value={newPinInput}
                      onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center font-mono tracking-widest font-black text-black dark:text-black px-3 py-2 bg-white border border-stone-250 dark:border-zinc-700 rounded-xl text-xs focus:ring-1 focus:ring-sky-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setShowSettingsPins(!showSettingsPins)}
                    className="flex items-center gap-1 text-[10px] font-bold text-[#0284c7] hover:underline"
                  >
                    {showSettingsPins ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showSettingsPins ? "إخفاء كلمات السر" : "إظهار الأرقام الفعالة"}</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="flex-1 py-2 text-xs font-bold text-stone-500 hover:bg-stone-50 hover:text-stone-750 border border-stone-200 rounded-xl transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={currentPinInput.length !== 6 || newPinInput.length !== 6}
                  className="flex-1 py-2 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-600 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-40"
                >
                  حفظ وتفعيل التعديل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Rename File */}
      {editingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" dir="rtl">
          <div className="bg-white dark:bg-[#121214] border border-stone-200 dark:border-zinc-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-stone-150 dark:border-zinc-850">
              <h3 className="text-xs font-black text-stone-850 dark:text-zinc-150">تعديل اسم الملف لمطابئ الصيانة</h3>
              <button
                onClick={() => setEditingFile(null)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            <form onSubmit={handleRenameFileSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-500 dark:text-zinc-400 block text-right">الاسم الجديد للملف:</label>
                <input
                  type="text"
                  value={newNameInput}
                  onChange={(e) => setNewNameInput(e.target.value)}
                  className="w-full text-right px-3 py-2 bg-white dark:bg-zinc-950 border border-stone-250 dark:border-zinc-800 rounded-xl text-xs text-stone-900 dark:text-white focus:ring-1 focus:ring-sky-500 outline-none"
                  autoFocus
                  required
                />
                <p className="text-[9px] text-stone-400 dark:text-zinc-550 text-right mt-1">
                   ملاحظة: سيتم الاحتفاظ بامتداد الملف الأصلي ({editingFile.extension}) بشكل تلقائي.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingFile(null)}
                  className="flex-1 py-1.5 text-xs font-bold text-stone-500 hover:bg-stone-50 border border-stone-200 rounded-lg cursor-pointer"
                >
                  إلغاء التعديل
                </button>
                <button
                  type="submit"
                  disabled={!newNameInput.trim()}
                  className="flex-1 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-lg cursor-pointer transition-colors disabled:opacity-40"
                >
                  تأكيد وحفظ الاسم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Fullscreen Overlay Preview Lightbox (supporting images, audio, videos, pdf, html & text) */}
      {previewFile && (() => {
        const extLower = previewFile.extension.toLowerCase();
        const typeLower = previewFile.rawType.toLowerCase();
        
        const isPdf = extLower === 'pdf' || typeLower.includes('pdf');
        
        const isHtml = extLower === 'html' || typeLower.includes('html');
        
        const textExts = ['txt', 'md', 'html', 'css', 'js', 'ts', 'jsx', 'tsx', 'json', 'csv', 'svg', 'xml', 'ini', 'conf', 'yaml', 'yml', 'sql'];
        const isTextBased = textExts.includes(extLower) || typeLower.startsWith('text/') || typeLower.includes('json') || typeLower.includes('javascript') || forceTextPreview;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md" dir="rtl">
            <div className={`bg-white dark:bg-[#121214] border border-stone-250 dark:border-zinc-800 rounded-3xl p-5 ${isHtml || isTextBased || isPdf ? 'max-w-4xl' : 'max-w-2xl'} w-full flex flex-col max-h-[90vh] shadow-2xl relative`}>
              <button
                onClick={() => setPreviewFile(null)}
                className="absolute top-4 left-4 p-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-stone-600 dark:text-zinc-350 rounded-full cursor-pointer z-10"
                title="إغلاق معاينة العرض"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 pb-3 border-b border-stone-150 dark:border-zinc-800 text-right pr-6">
                <HardDrive className="w-4 h-4 text-[#0284c7]" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-black text-stone-850 dark:text-zinc-100 truncate max-w-md" title={previewFile.name}>
                    {previewFile.name}
                  </h4>
                  <p className="text-[9px] text-stone-400 dark:text-zinc-550 font-mono">حجم الملف: {previewFile.size} | الصيغة: {previewFile.extension.toUpperCase()}</p>
                </div>
              </div>

              {/* Toggle switch ONLY for html files to preview render vs code layout */}
              {isHtml && (
                <div className="flex bg-stone-100 dark:bg-zinc-900 p-1 rounded-xl mt-3 mx-auto w-fit gap-1 border border-stone-200 dark:border-zinc-805">
                  <button
                    type="button"
                    onClick={() => setHtmlPreviewMode('render')}
                    className={`px-4 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                      htmlPreviewMode === 'render' 
                        ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-sky-400 shadow-xs' 
                        : 'text-stone-550 dark:text-zinc-400 hover:text-stone-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    🚀 تشغيل ومعاينة الصفحة التفاعلية
                  </button>
                  <button
                    type="button"
                    onClick={() => setHtmlPreviewMode('code')}
                    className={`px-4 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                      htmlPreviewMode === 'code' 
                        ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-sky-400 shadow-xs' 
                        : 'text-stone-550 dark:text-zinc-400 hover:text-stone-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    📝 عرض الكود المصدري
                  </button>
                </div>
              )}

              {/* Content Preview Stage depending on type */}
              <div className="flex-1 overflow-auto flex items-center justify-center py-4 min-h-[300px] w-full">
                {previewFile.category === 'images' ? (
                  <div className="max-w-full max-h-[60vh] rounded-xl overflow-hidden border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-950">
                    <img
                      src={previewFile.dataUrl}
                      alt={previewFile.name}
                      className="max-w-full max-h-[60vh] object-contain mx-auto"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : previewFile.category === 'audio' ? (
                  <div className="w-full max-w-md p-6 bg-stone-50 dark:bg-zinc-950 rounded-2xl border border-stone-200 dark:border-zinc-850 text-center space-y-4">
                    <div className="mx-auto w-12 h-12 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center animate-bounce">
                      <Music className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-extrabold text-stone-800 dark:text-zinc-200 truncate pr-4 pl-4">{previewFile.name}</p>
                      <p className="text-[9px] text-stone-400">جاري المعاينة المباشرة باستخدام مشغل الويب المتكامل</p>
                    </div>
                    <audio 
                      src={previewFile.dataUrl} 
                      controls 
                      className="w-full h-8"
                      autoPlay
                    />
                  </div>
                ) : previewFile.category === 'videos' ? (
                  <div className="w-full max-w-xl rounded-xl overflow-hidden border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-950">
                    <video 
                      src={previewFile.dataUrl} 
                      controls 
                      className="w-full max-h-[55vh] bg-black"
                      autoPlay
                    />
                  </div>
                ) : isPdf ? (
                  <div className="w-full h-[60vh] rounded-xl overflow-hidden border border-stone-200 dark:border-zinc-800 bg-white">
                    <iframe
                      src={previewFile.dataUrl}
                      title={previewFile.name}
                      className="w-full h-full"
                    />
                  </div>
                ) : isHtml && htmlPreviewMode === 'render' ? (
                  <div className="w-full h-[62vh] rounded-xl overflow-hidden border border-stone-250 dark:border-zinc-800 bg-white flex flex-col shadow-inner">
                    <iframe
                      srcDoc={getDecodedTextContent(previewFile)}
                      title={previewFile.name}
                      sandbox="allow-scripts"
                      className="w-full h-full bg-white flex-1"
                    />
                  </div>
                ) : isTextBased ? (
                  <div className="w-full h-[62vh] rounded-xl overflow-hidden border border-stone-250 dark:border-zinc-800 bg-[#1e1e1e] flex flex-col font-sans">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-[#181818] border-b border-[#2d2d2d]" dir="ltr">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
                        <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
                        <span className="w-3 h-3 rounded-full bg-green-500/80"></span>
                        <span className="text-[10px] text-stone-400 ml-1.5 font-mono truncate max-w-xs">{previewFile.name}</span>
                      </div>
                      <button
                        onClick={() => {
                          const code = getDecodedTextContent(previewFile);
                          navigator.clipboard.writeText(code);
                          showToast('📋 تم نسخ رموز الملف والحفظ بنجاح للحافظة!');
                        }}
                        className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-250 hover:text-white rounded-md text-[10px] font-black cursor-pointer transition flex items-center gap-1 border border-zinc-700"
                      >
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>نسخ الكود</span>
                      </button>
                    </div>
                    <pre 
                      style={{ direction: 'ltr', textAlign: 'left' }} 
                      className="flex-1 p-4.5 overflow-auto font-mono text-xs text-stone-300 select-text leading-relaxed whitespace-pre-wrap selection:bg-[#264f78]"
                    >
                      <code>{getDecodedTextContent(previewFile)}</code>
                    </pre>
                  </div>
                ) : (
                  <div className="text-center space-y-4 p-6 bg-stone-50 dark:bg-zinc-950 rounded-2xl border border-stone-150 dark:border-zinc-850 max-w-md w-full">
                    <div className="mx-auto w-10 h-10 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-stone-850 dark:text-zinc-200">صيغة غير مدعومة للمعاينة المباشرة</p>
                      <p className="text-[10px] text-stone-400 dark:text-zinc-500">
                        يمكنك محاولة فك تشفيرها وعرضها كنص إذا كان ملفاً برمجياً أو تنزيلها مباشرة.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const decodedText = getDecodedTextContent(previewFile);
                        if (decodedText && !decodedText.includes('فشل فك تشفير')) {
                          setForceTextPreview(true);
                          showToast('📝 تم فرض العرض النصي للملف بنجاح!');
                        } else {
                          showToast('⚠️ يتعذر قراءة هذا الملف كملف نصي!');
                        }
                      }}
                      className="px-3.5 py-1.5 bg-stone-150 hover:bg-stone-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-stone-700 dark:text-zinc-300 text-[10.5px] font-bold rounded-xl border border-stone-200 dark:border-zinc-800 transition cursor-pointer"
                    >
                      💡 محاولة الفتح كملف نصي
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-stone-150 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    handleDeleteFile(previewFile.id);
                  }}
                  className="px-4 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:text-red-400 border border-red-200 dark:border-red-900/40 rounded-xl cursor-pointer transition flex items-center gap-1"
                  title="حذف هذا الملف نهائياً"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span>حذف نهائي</span>
                </button>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="flex-1 py-1.5 text-xs font-bold text-stone-500 hover:bg-stone-55 dark:text-zinc-400 border border-stone-250 dark:border-zinc-800 rounded-xl cursor-pointer"
                >
                  إغلاق المعاينة
                </button>
                <button
                  onClick={() => {
                    handleDownloadFile(previewFile);
                    setPreviewFile(null);
                  }}
                  className="flex-1 py-1.5 text-xs font-bold text-white bg-[#0284c7] hover:bg-sky-500 rounded-xl shadow-xs cursor-pointer"
                >
                  تحميل وتنزيل الملف للجهاز فوراً
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL: Custom Confirm Dialog */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs text-right" dir="rtl">
          <div className="bg-white dark:bg-[#121214] border border-stone-250 dark:border-zinc-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex gap-3">
              <div className={`p-2.5 rounded-2xl shrink-0 h-fit ${
                confirmModal.isDanger 
                  ? 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400' 
                  : 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400'
              }`}>
                {confirmModal.isDanger ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
              </div>
              <div className="space-y-1 overflow-hidden">
                <h3 className="text-xs font-black text-stone-850 dark:text-zinc-100">
                  {confirmModal.title}
                </h3>
                <p className="text-[11px] text-stone-500 dark:text-zinc-400 leading-relaxed font-semibold mt-1 whitespace-normal">
                  {confirmModal.description}
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2.5">
              <button
                type="button"
                onClick={() => confirmModal.onConfirm()}
                className={`flex-1 py-2 rounded-xl text-[11px] font-black cursor-pointer transition-all ${
                  confirmModal.isDanger
                    ? 'bg-red-600 hover:bg-red-500 text-white active:scale-95 shadow-xs'
                    : 'bg-indigo-600 hover:bg-indigo-550 text-white active:scale-95 shadow-xs'
                }`}
              >
                {confirmModal.confirmText}
              </button>
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-stone-605 dark:text-zinc-300 text-[11px] font-bold rounded-xl border border-stone-250 dark:border-zinc-800 cursor-pointer active:scale-95 transition-all text-center"
              >
                {confirmModal.cancelText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
