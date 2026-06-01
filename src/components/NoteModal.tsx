import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Image as ImageIcon, Sparkles, FolderIcon, Trash, Check, 
  Camera, ArrowLeftRight, Loader2, Copy, FileText, CheckCircle,
  ChevronLeft, ChevronRight, Maximize2, Minimize2, ZoomIn, ZoomOut, Palette,
  ArrowUp, ArrowDown, RotateCcw, Share2, Bell, Clock, Paintbrush,
  Mic, MicOff
} from 'lucide-react';
import { Note, Folder, PRESET_COLORS, PRESET_GRADIENTS, PRESET_TEXT_COLORS } from '../types';
import { renderTextWithStyledLinks } from './NoteCard';

interface NoteModalProps {
  note: Note | null; // null means creating a new note
  folders: Folder[];
  currentFolderId: string;
  onClose: () => void;
  onSave: (updatedNote: Note) => void;
  onMoveOrder?: (noteId: string, direction: 'up' | 'down') => void;
  isFirst?: boolean;
  isLast?: boolean;
  onDeleteToggle?: (id: string) => void;
  onPermanentDelete?: (id: string, onConfirmSuccess?: () => void) => void;
  onShare?: (note: Note) => void;
}

const COVER_PRESETS = [
  { name: 'جبال شهباء هادئة', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80' },
  { name: 'فضاء ومجرات عميقة', url: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=1200&q=80' },
  { name: 'غروب ساحلي أحمر', url: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?auto=format&fit=crop&w=1200&q=80' },
  { name: 'مكتبة كلاسيكية دافئة', url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80' },
  { name: 'أكواد وحوسبة مظلمة', url: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=1200&q=80' },
  { name: 'غابات الهدوء الأخضر', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80' },
  { name: 'رمال وتلال الصحراء', url: 'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?auto=format&fit=crop&w=1200&q=80' },
  { name: 'فن تشكيلي معاصر', url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&q=80' },
];

export default function NoteModal({
  note,
  folders,
  currentFolderId,
  onClose,
  onSave,
  onMoveOrder,
  isFirst = false,
  isLast = false,
  onDeleteToggle,
  onPermanentDelete,
  onShare,
}: NoteModalProps) {
  // Local active states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState<string | undefined>(undefined);
  const [color, setColor] = useState('stone');
  const [folderId, setFolderId] = useState('all');
  const [isPinned, setIsPinned] = useState(false);

  // Custom visual states
  const [bgType, setBgType] = useState<'preset' | 'gradient' | 'image'>('preset');
  const [bgGradient, setBgGradient] = useState('sunset');
  const [bgImage, setBgImage] = useState<string>('');
  const [textColor, setTextColor] = useState('default');
  const [reminderAt, setReminderAt] = useState('');
  const [activeStylesTab, setActiveStylesTab] = useState<'bg' | 'text' | 'reminder'>('bg');
  const [bgSubTab, setBgSubTab] = useState<'solid' | 'gradient' | 'image'>('solid');

  const [lastSaved, setLastSaved] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'typing'>('saved');
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState(false);
  const [hasSavedOnce, setHasSavedOnce] = useState(!!note);
  const [isTextCopied, setIsTextCopied] = useState(false);
  const [isImageCopied, setIsImageCopied] = useState(false);

  // States for exit confirmation on unsaved notes
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const initialDataRef = useRef<{
    title: string;
    content: string;
    image?: string;
    color: string;
    folderId: string;
    isPinned: boolean;
    bgType: 'preset' | 'gradient' | 'image';
    bgGradient: string;
    bgImage: string;
    textColor: string;
    reminderAt: string;
  } | null>(null);

  const noteIdRef = useRef<string>('');

  const isNoteEmpty = (t: string, c: string, img?: string) => {
    return !t.trim() && !c.trim() && !img;
  };

  const showLocalToast = (message: string, isError = false) => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-10 left-1/2 transform -translate-x-1/2 ${
      isError ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'
    } text-white text-xs px-5 py-2.5 rounded-xl shadow-2xl z-[100000] font-bold flex items-center gap-2 animate-bounce`;
    toast.innerHTML = `<span>${isError ? '⚠️' : '✅'}</span><span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.5s ease-out';
      setTimeout(() => toast.remove(), 550);
    }, 2500);
  };

  const handleCopyText = async () => {
    if (!content.trim()) {
      showLocalToast('⚠️ لا يوجد نص لنسخه!', true);
      return;
    }
    
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(content);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = content;
        textarea.style.position = 'fixed';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setIsTextCopied(true);
      showLocalToast('✅ تم نسخ نص الملاحظة بنجاح!');
      setTimeout(() => setIsTextCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
      showLocalToast('⚠️ فشل في نسخ النص، يرجى المحاولة يدوياً.', true);
    }
  };

  const handleCopyImage = async () => {
    if (!image) {
      showLocalToast('⚠️ لا توجد صورة لنسخها!', true);
      return;
    }

    try {
      if (image.startsWith('data:image/')) {
        const response = await fetch(image);
        const blob = await response.blob();
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob
          })
        ]);
        setIsImageCopied(true);
        showLocalToast('✅ تم نسخ الصورة بنجاح!');
        setTimeout(() => setIsImageCopied(false), 2000);
        return;
      }
      
      try {
        const response = await fetch(image, { mode: 'cors' });
        const blob = await response.blob();
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob
          })
        ]);
        setIsImageCopied(true);
        showLocalToast('✅ تم نسخ الصورة بنجاح!');
        setTimeout(() => setIsImageCopied(false), 2000);
      } catch (corsOrWriteError) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(image);
        } else {
          const textarea = document.createElement('textarea');
          textarea.value = image;
          textarea.style.position = 'fixed';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
        }
        setIsImageCopied(true);
        showLocalToast('✅ تم نسخ رابط الصورة بنجاح!');
        setTimeout(() => setIsImageCopied(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy image', err);
      showLocalToast('⚠️ حدث خطأ أثناء نسخ الصورة.', true);
    }
  };

  // Carousel & Lightbox states
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showPresets, setShowPresets] = useState(false);

  // Camera Capture State
  const [showCameraStream, setShowCameraStream] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Voice dictation / Speech Recognition states
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore already stopped errors
        }
      }
    };
  }, []);

  const toggleListening = () => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      showLocalToast('⚠️ المتصفح لا يدعم ميزة الإملاء الصوتي المباشر. يرجى استخدام متصفح حديث مثل Chrome.', true);
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'ar-SA'; // Default to Arabic standard dictation

      recognition.onstart = () => {
        setIsListening(true);
        showLocalToast('🎙️ جاري الاستماع الآن... ابدأ بإملاء ملاحظتك بوضوح.');
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event);
        if (event.error === 'not-allowed') {
          showLocalToast('⚠️ تم رفض الإذن بالوصول للميكروفون! يرجى السماح به في إعدادات المتصفح.', true);
        } else if (event.error === 'no-speech') {
          showLocalToast('⚠️ لم يتم رصد أي صوت. يرجى التحدث بوضوح.', true);
        } else {
          showLocalToast(`⚠️ خطأ في التعرف على الصوت: ${event.error}`, true);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          setContent(prev => {
            const separator = prev.trim() ? ' ' : '';
            const updatedContent = prev + separator + finalTranscript.trim();
            setSaveStatus('typing');
            triggerAutoSave(title, updatedContent);
            return updatedContent;
          });
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      showLocalToast('⚠️ حدث خطأ أثناء تشغيل محرك التعرف على الصوت.', true);
      setIsListening(false);
    }
  };

  // AI assistant state
  const [aiAction, setAiAction] = useState<'summarize' | 'improve' | 'bullets' | 'tags' | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiError, setAiError] = useState('');

  // Auto-save timeout
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleManualSaveClick = () => {
    if (isNoteEmpty(title, content, image)) {
      showLocalToast('⚠️ لا يمكن حفظ ملاحظة فارغة تماماً! يرجى إدخال عنوان أو محتوى للملاحظة.', true);
      return;
    }
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    const now = new Date().toISOString();
    const payload: Note = {
      id: noteIdRef.current,
      folderId,
      title: title.trim() || 'ملاحظة جديدة غير معنونة',
      content,
      image,
      color,
      isPinned,
      isDeleted: note?.isDeleted || false,
      createdAt: note?.createdAt || now,
      updatedAt: now,
      order: note?.order || Date.now(),
      bgType,
      bgGradient,
      bgImage,
      textColor,
      reminderAt: reminderAt || undefined,
      reminderNotified: note?.reminderAt === reminderAt ? note?.reminderNotified : false,
    };
    
    onSave(payload);
    setIsSavedSuccessfully(true);
    setHasSavedOnce(true);
    
    // Update initial data ref to current to mark as saved
    initialDataRef.current = {
      title,
      content,
      image,
      color,
      folderId,
      isPinned,
      bgType,
      bgGradient,
      bgImage,
      textColor,
      reminderAt,
    };
    
    setTimeout(() => {
      setIsSavedSuccessfully(false);
      onClose();
    }, 1000);
  };

  const handleCloseAttempt = () => {
    const hasUnsavedChanges = 
      initialDataRef.current && (
        title !== initialDataRef.current.title ||
        content !== initialDataRef.current.content ||
        image !== initialDataRef.current.image ||
        color !== initialDataRef.current.color ||
        folderId !== initialDataRef.current.folderId ||
        isPinned !== initialDataRef.current.isPinned ||
        bgType !== initialDataRef.current.bgType ||
        bgGradient !== initialDataRef.current.bgGradient ||
        bgImage !== initialDataRef.current.bgImage ||
        textColor !== initialDataRef.current.textColor ||
        reminderAt !== initialDataRef.current.reminderAt
      );

    const isEmpty = isNoteEmpty(title, content, image);

    if (isEmpty) {
      // Just close directly because empty notes cannot be saved anyway
      onClose();
      return;
    }

    if (hasUnsavedChanges || saveStatus === 'typing' || saveStatus === 'saving') {
      setShowExitConfirmation(true);
    } else {
      onClose();
    }
  };

  // Initialize form
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setImage(note.image);
      setColor(note.color);
      setFolderId(note.folderId);
      setIsPinned(note.isPinned);
      
      setBgType(note.bgType || 'preset');
      setBgGradient(note.bgGradient || 'sunset');
      setBgImage(note.bgImage || '');
      setTextColor(note.textColor || 'default');
      setReminderAt(note.reminderAt || '');

      setLastSaved(new Date(note.updatedAt).toLocaleTimeString('ar-EG'));
      initialDataRef.current = {
        title: note.title,
        content: note.content,
        image: note.image,
        color: note.color,
        folderId: note.folderId,
        isPinned: note.isPinned,
        bgType: note.bgType || 'preset',
        bgGradient: note.bgGradient || 'sunset',
        bgImage: note.bgImage || '',
        textColor: note.textColor || 'default',
        reminderAt: note.reminderAt || '',
      };
      noteIdRef.current = note.id;
      setHasSavedOnce(true);
    } else {
      // New note creation defaults
      setTitle('');
      setContent('');
      setImage(undefined);
      setColor('stone');
      setFolderId(currentFolderId === 'trash' || currentFolderId === 'all' ? 'all' : currentFolderId);
      setIsPinned(false);
      
      setBgType('preset');
      setBgGradient('sunset');
      setBgImage('');
      setTextColor('default');
      setReminderAt('');

      setLastSaved('');
      initialDataRef.current = {
        title: '',
        content: '',
        image: undefined,
        color: 'stone',
        folderId: currentFolderId === 'trash' || currentFolderId === 'all' ? 'all' : currentFolderId,
        isPinned: false,
        bgType: 'preset',
        bgGradient: 'sunset',
        bgImage: '',
        textColor: 'default',
        reminderAt: '',
      };
      noteIdRef.current = Math.random().toString(36).substr(2, 9);
      setHasSavedOnce(false);
    }
    setSaveStatus('saved');
  }, [note, currentFolderId]);

  // BeforeUnload handler to warn user before leaving portal/page with unsaved modifications
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasUnsavedChanges = 
        initialDataRef.current && (
          title !== initialDataRef.current.title ||
          content !== initialDataRef.current.content ||
          image !== initialDataRef.current.image ||
          color !== initialDataRef.current.color ||
          folderId !== initialDataRef.current.folderId ||
          isPinned !== initialDataRef.current.isPinned ||
          bgType !== initialDataRef.current.bgType ||
          bgGradient !== initialDataRef.current.bgGradient ||
          bgImage !== initialDataRef.current.bgImage ||
          textColor !== initialDataRef.current.textColor ||
          reminderAt !== initialDataRef.current.reminderAt
        );
      
      const isEmpty = isNoteEmpty(title, content, image);

      if (hasUnsavedChanges && !isEmpty) {
        e.preventDefault();
        e.returnValue = 'هل تريد حفظ التغييرات قبل الخروج من التطبيق؟';
        return 'هل تريد حفظ التغييرات قبل الخروج من التطبيق؟';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [title, content, image, color, folderId, isPinned, bgType, bgGradient, bgImage, textColor, reminderAt]);

  // Handle auto-saving state on content or parameter changes - disabled direct background saving to avoid database spamming of draft notes until they are saved once
  const triggerAutoSave = (
    newTitle: string, 
    newContent: string, 
    newImg?: string, 
    newColor?: string, 
    newFolderId?: string, 
    isPinValue?: boolean,
    newBgType?: 'preset' | 'gradient' | 'image',
    newBgGradient?: string,
    newBgImage?: string,
    newTextColor?: string,
    newReminderAt?: string
  ) => {
    if (isNoteEmpty(newTitle, newContent, newImg ?? image)) {
      setSaveStatus('saved');
      return;
    }

    if (!hasSavedOnce) {
      setSaveStatus('typing');
      return;
    }

    setSaveStatus('saving');
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

    autoSaveTimerRef.current = setTimeout(() => {
      const now = new Date().toISOString();
      const payload: Note = {
        id: noteIdRef.current,
        folderId: newFolderId ?? folderId,
        title: newTitle.trim() || 'ملاحظة جديدة غير معنونة',
        content: newContent,
        image: newImg ?? image,
        color: newColor ?? color,
        isPinned: isPinValue ?? isPinned,
        isDeleted: note?.isDeleted || false,
        createdAt: note?.createdAt || now,
        updatedAt: now,
        order: note?.order || Date.now(),
        bgType: newBgType ?? bgType,
        bgGradient: newBgGradient ?? bgGradient,
        bgImage: newBgImage ?? bgImage,
        textColor: newTextColor ?? textColor,
        reminderAt: newReminderAt !== undefined ? (newReminderAt || undefined) : (reminderAt || undefined),
        reminderNotified: (newReminderAt !== undefined && newReminderAt !== reminderAt) ? false : note?.reminderNotified,
      };
      
      onSave(payload);
      setLastSaved(new Date().toLocaleTimeString('ar-EG'));
      setSaveStatus('saved');
      
      // Update initial data reference upon auto save
      initialDataRef.current = {
        title: newTitle,
        content: newContent,
        image: newImg ?? image,
        color: newColor ?? color,
        folderId: newFolderId ?? folderId,
        isPinned: isPinValue ?? isPinned,
        bgType: newBgType ?? bgType,
        bgGradient: newBgGradient ?? bgGradient,
        bgImage: newBgImage ?? bgImage,
        textColor: newTextColor ?? textColor,
        reminderAt: newReminderAt !== undefined ? newReminderAt : reminderAt,
      };
    }, 700); // Debounce duration
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    setSaveStatus('typing');
    triggerAutoSave(val, content);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    setSaveStatus('typing');
    triggerAutoSave(title, val);
  };

  const handleColorSelect = (colorVal: string) => {
    setColor(colorVal);
    triggerAutoSave(title, content, image, colorVal);
  };

  const handleFolderSelect = (folderVal: string) => {
    setFolderId(folderVal);
    triggerAutoSave(title, content, image, color, folderVal);
  };

  // Image file handler
  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImage(base64String);
        triggerAutoSave(title, content, base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger Camera View
  const startCamera = async () => {
    try {
      setShowCameraStream(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.log('webcam connection issues inside standard iframe, auto-falling back to generation.', err);
      // Generate a mock camera placeholder
      generateCameraSample();
    }
  };

  const generateCameraSample = () => {
    const ids = [10, 15, 25, 43, 64, 85, 122, 140, 201];
    const randId = ids[Math.floor(Math.random() * ids.length)];
    const sampleImg = `https://picsum.photos/id/${randId}/800/600`;
    setImage(sampleImg);
    setShowCameraStream(false);
    triggerAutoSave(title, content, sampleImg);
  };

  const captureSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.scale(-1, 1); // Flip horizontal
        ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL('image/jpeg');
        setImage(dataUrl);

        // Terminate camera stream
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        setShowCameraStream(false);
        triggerAutoSave(title, content, dataUrl);
      }
    }
  };

  const cancelCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCameraStream(false);
  };

  // Smart AI Analyzer call
  const callAIAnalyzer = async (action: 'summarize' | 'improve' | 'bullets' | 'tags') => {
    if (!content.trim()) {
      setAiError('الرجاء كتابة نص أولاً في الملاحظة لتتمكن من استخدام خبير الذكاء الاصطناعي.');
      return;
    }

    setAiAction(action);
    setAiLoading(true);
    setAiResult('');
    setAiError('');

    try {
      const response = await fetch('/api/smart-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content, action }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'فشلت معالجة النص.');
      }

      setAiResult(data.result);
    } catch (err: any) {
      setAiError(err.message || 'فشل الاتصال بالخادم الذكي.');
    } finally {
      setAiLoading(false);
    }
  };

  const applyAIReplacement = (mode: 'replace' | 'append') => {
    if (!aiResult) return;
    let newContent = content;
    if (mode === 'replace') {
      newContent = aiResult;
    } else {
      newContent = `${content}\n\n🤖 [ملخص الذكاء الاصطناعي]:\n${aiResult}`;
    }
    setContent(newContent);
    setAiResult('');
    triggerAutoSave(title, newContent);
  };

  // Prevent body scroll and cleanup timers
  useEffect(() => {
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalStyle;
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, []);

  const activeColorTheme = PRESET_COLORS.find(c => c.value === color) || PRESET_COLORS[0];

  const getModalStyles = () => {
    let bgClass = '';
    let textClass = 'text-stone-900 dark:text-white';
    let subtitleClass = 'text-stone-605 dark:text-zinc-350';

    if (bgType === 'gradient' && bgGradient) {
      const grad = PRESET_GRADIENTS.find(g => g.value === bgGradient);
      bgClass = grad ? grad.class : activeColorTheme.class;
    } else if (bgType === 'image' && bgImage) {
      bgClass = 'relative text-stone-900 dark:text-white';
    } else {
      bgClass = activeColorTheme.class;
    }

    if (textColor && textColor !== 'default') {
      const tc = PRESET_TEXT_COLORS.find(t => t.value === textColor);
      if (tc) {
        textClass = tc.class;
        subtitleClass = `${tc.class} opacity-80`;
      }
    }

    return { bgClass, textClass, subtitleClass };
  };

  const { bgClass: mBgClass, textClass: mTextClass, subtitleClass: mSubtitleClass } = getModalStyles();

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-stretch justify-stretch overflow-hidden">
      <div 
        className={`w-full h-full min-h-screen md:h-screen transition-all duration-300 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x md:divide-x-reverse overflow-hidden z-0 ${mBgClass}`}
      >
        {bgType === 'image' && bgImage && (
          <>
            <div 
              className="absolute inset-0 -z-20 scale-105 pointer-events-none"
              style={{
                backgroundImage: `url(${bgImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <div className="absolute inset-0 bg-stone-105/90 dark:bg-zinc-950/90 -z-10 mix-blend-normal pointer-events-none" />
          </>
        )}
        
        {/* Main Editor Section (Left / Center Pane) */}
        <div className="flex-1 p-6 flex flex-col overflow-y-auto min-h-[50vh] md:min-h-0">
          {/* Header Controls */}
          <div className="flex items-center justify-between mb-4 border-b border-stone-200/50 dark:border-zinc-800/50 pb-3">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                saveStatus === 'saving' ? 'bg-amber-500 animate-ping' :
                saveStatus === 'typing' ? 'bg-sky-500' : 'bg-emerald-500'
              }`}></span>
              <span className="text-[10px] font-bold text-stone-500 dark:text-zinc-400">
                {saveStatus === 'saving' ? 'جاري الحفظ...' :
                 saveStatus === 'typing' ? 'يكتب...' : `تم الحفظ تلقائياً ${lastSaved ? `${lastSaved}` : ''}`}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {note && onMoveOrder && (
                <div className="flex items-center gap-0.5 bg-stone-100/80 dark:bg-zinc-900/80 border border-stone-200/40 dark:border-zinc-800/40 rounded-xl p-0.5">
                  <button
                    type="button"
                    onClick={() => onMoveOrder(note.id, 'up')}
                    disabled={isFirst}
                    className="p-1.5 hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-600 dark:text-zinc-300 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-all"
                    title="تحريك لأعلى"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] text-stone-400 dark:text-zinc-600 font-bold px-0.5">|</span>
                  <button
                    type="button"
                    onClick={() => onMoveOrder(note.id, 'down')}
                    disabled={isLast}
                    className="p-1.5 hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-600 dark:text-zinc-300 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-all"
                    title="تحريك لأسفل"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {onShare && note && !note.isDeleted && (
                <button
                  type="button"
                  onClick={() => {
                    onShare({
                      ...note,
                      title,
                      content,
                      image,
                      color,
                      folderId,
                      isPinned,
                    });
                  }}
                  className="p-1 px-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl transition-all text-xs font-black flex items-center gap-1 cursor-pointer"
                  title="تصدير ومشاركة الملاحظة"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>مشاركة</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCloseAttempt}
                className="p-1 px-1.5 hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-600 dark:text-zinc-300 rounded-xl transition-all text-sm font-bold flex items-center gap-1"
              >
                <span>إغلاق</span>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Title and Metadata Inputs */}
          <div className="space-y-4 flex-1 flex flex-col">
            {note?.isDeleted && (
              <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-right mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl">
                    <Trash className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-red-800 dark:text-red-300">هذه المذكرة موجودة في سلة المهملات</h4>
                    <p className="text-[10px] text-red-500/90 dark:text-red-400/80">المذكرة معطلة للقراءة فقط. يمكنك استعادتها لاستئناف التحرير أو حذفها نهائياً ولا يمكن التراجع عنها.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onDeleteToggle && note) {
                        onDeleteToggle(note.id);
                        onClose();
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold rounded-xl transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>استعادة المذكرة</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onPermanentDelete && note) {
                        onPermanentDelete(note.id, onClose);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold rounded-xl transition cursor-pointer"
                  >
                    <Trash className="w-3.5 h-3.5" />
                    <span>حذف نهائي</span>
                  </button>
                </div>
              </div>
            )}

            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              disabled={!!note?.isDeleted}
              placeholder="اكتب عنواناً للملاحظة..."
              className={`w-full text-base font-extrabold bg-transparent border-b border-transparent hover:border-stone-200 dark:hover:border-zinc-800 focus:border-sky-500 focus:outline-none pb-2 transition-all block placeholder:text-stone-400 dark:placeholder:text-zinc-650 disabled:opacity-75 disabled:cursor-not-allowed ${mTextClass}`}
            />

            {/* Note Thumbnail Attachment Preview */}
            <div className="space-y-3">
              {/* Cover Banner Panel */}
              {image ? (
                <>
                  <div className="group relative rounded-2xl overflow-hidden border border-stone-250/50 dark:border-zinc-850 bg-stone-100 dark:bg-zinc-950 transition-all duration-300 shadow-lg hover:shadow-xl">
                    {/* Image Element */}
                    <div className="relative aspect-[21/9] md:aspect-[24/9] w-full overflow-hidden">
                      <img
                        src={image}
                        alt="غلاف الملاحظة الفني"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-zoom-in"
                        onClick={() => {
                          setLightboxOpen(true);
                          setZoomLevel(1);
                        }}
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Shadow gradient overlay for premium depth */}
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-900/40 via-transparent to-stone-900/40 pointer-events-none" />
                    </div>

                    {/* Absolute Top Control badging */}
                    <div className="absolute top-3 right-3 left-3 flex items-center justify-between opacity-95 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                      <span className="text-[10px] bg-stone-900/80 text-white font-extrabold px-2 py-1 rounded-lg backdrop-blur-xs flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                        <span>غلاف مفعل</span>
                      </span>

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            setLightboxOpen(true);
                            setZoomLevel(1);
                          }}
                          className="p-1.5 bg-stone-900/80 hover:bg-stone-900 text-white rounded-xl backdrop-blur-xs transition-all flex items-center gap-1 text-[10px] font-bold"
                          title="تكبير ومعاينة سينمائية"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">معاينة كاملة</span>
                        </button>

                        <button
                          onClick={() => setShowPresets(!showPresets)}
                          className={`p-1.5 rounded-xl backdrop-blur-xs transition-all flex items-center gap-1 text-[10px] font-bold ${
                            showPresets ? 'bg-sky-650 text-white' : 'bg-stone-900/80 hover:bg-stone-900 text-white'
                          }`}
                          title="تبديل معرض الأغلفة"
                        >
                          <Palette className="w-3.5 h-3.5 text-amber-400" />
                          <span className="hidden sm:inline">تغيير الغلاف</span>
                        </button>

                        <button
                          onClick={() => {
                            setImage(undefined);
                            triggerAutoSave(title, content, '');
                          }}
                          className="p-1.5 bg-red-650/80 hover:bg-red-650 text-white rounded-xl backdrop-blur-xs transition-all"
                          title="حذف الغلاف"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Tiny instruction at the bottom of cover */}
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 opacity-80">
                      <span className="text-[9px] bg-stone-950/75 text-stone-250 font-bold px-2 py-0.5 rounded-md">
                        انقر للتكبير والمعاينة السينمائية 🔍
                      </span>
                    </div>
                  </div>

                  {/* Copy Image Action Button below image */}
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleCopyImage}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-250/80 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-stone-200 dark:border-zinc-850 rounded-xl text-stone-600 dark:text-zinc-350 transition-all font-bold text-[10px] cursor-pointer shadow-sm active:scale-95"
                    >
                      {isImageCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-650 dark:text-emerald-450 font-black">تم نسخ الصورة! 🎉</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-sky-500" />
                          <span>نسخ غلاف الصورة 🖼️</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                // If there's no Image, show a beautiful "إضافة غلاف فني" activator carousel
                <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50/75 dark:bg-zinc-900/30 border border-stone-200/50 dark:border-zinc-850">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-sky-100 dark:bg-sky-950/50 rounded-xl text-sky-600 dark:text-sky-400">
                      <Palette className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-stone-850 dark:text-zinc-200">أضف غلافاً للملاحظة</h4>
                      <p className="text-[10px] text-stone-400 dark:text-zinc-500">اختر من المعرض الفني المنسق أو ارفع صورة خاصة</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPresets(!showPresets)}
                    className="px-3 py-1 bg-sky-100 hover:bg-sky-200 dark:bg-sky-950 dark:hover:bg-sky-900 text-sky-700 dark:text-sky-300 transition-all font-extrabold text-[10px] rounded-lg"
                  >
                    {showPresets ? 'إغلاق المعرض' : 'تصفح الأغلفة التشكيلية'}
                  </button>
                </div>
              )}

              {/* Cover Art Preset Carousel Slider (Expanded State) */}
              {showPresets && (
                <div className="p-3 bg-stone-100/60 dark:bg-zinc-900/60 rounded-2xl border border-stone-250/50 dark:border-zinc-800/80 space-y-2.5 transition-all duration-300">
                  <div className="flex items-center justify-between leading-none">
                    <span className="text-xs font-extrabold text-[#0284c7] dark:text-sky-400 flex items-center gap-1">
                      <Palette className="w-3.5 h-3.5 animate-pulse" />
                      <span>معرض الأغلفة المتميزة المنسقة (Carousel)</span>
                    </span>
                    <span className="text-[9px] text-stone-400 dark:text-zinc-500 font-bold">انقر لتطبيق الخيار مباشرة</span>
                  </div>

                  {/* Carousels cards scroll container */}
                  <div className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin scrollbar-thumb-stone-300 dark:scrollbar-thumb-zinc-700 flex-nowrap scroll-smooth">
                    {COVER_PRESETS.map((preset, index) => {
                      const isActive = image === preset.url;
                      return (
                        <button
                          key={index}
                          onClick={() => {
                            setImage(preset.url);
                            triggerAutoSave(title, content, preset.url);
                          }}
                          className={`flex-shrink-0 relative w-24 md:w-28 aspect-video rounded-xl overflow-hidden border transition-all duration-200 group/item ${
                            isActive ? 'ring-2 ring-sky-500 scale-95 border-transparent' : 'border-stone-200/60 dark:border-zinc-800 hover:scale-102 hover:border-stone-400'
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-950/80 to-transparent p-1">
                            <p className="text-[8px] font-bold text-white text-center truncate">{preset.name}</p>
                          </div>
                          {isActive && (
                            <div className="absolute top-1 right-1 p-0.5 bg-emerald-500 text-white rounded-full">
                              <Check className="w-2 h-2" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Camera View Overlay stream */}
            {showCameraStream && (
              <div className="p-3 bg-stone-900 rounded-2xl flex flex-col items-center gap-3 relative">
                <video ref={videoRef} className="rounded-xl w-full h-44 object-cover scale-x-[-1]"></video>
                <canvas ref={canvasRef} className="hidden"></canvas>
                <div className="flex gap-2">
                  <button
                    onClick={captureSnapshot}
                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow"
                  >
                    <Check className="w-3.5 h-3.5" /> التقاط صورة
                  </button>
                  <button
                    onClick={generateCameraSample}
                    className="px-3 py-1.5 bg-[#1c1917] hover:bg-[#292524] text-stone-200 font-bold text-xs rounded-lg flex items-center gap-1 border border-stone-850"
                  >
                    أخذ لقطة معملية
                  </button>
                  <button
                    onClick={cancelCamera}
                    className="px-3 py-1.5 bg-stone-650 hover:bg-stone-550 text-white font-bold text-xs rounded-lg"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}

            {/* Note Main Writing Area */}
            <textarea
              value={content}
              onChange={handleContentChange}
              disabled={!!note?.isDeleted}
              placeholder="اترك هُنا فكرة سريعة، كوداً منسوخاً، أو انقر فوق أيقونة الميكروفون 🎙️ بالأسفل لإملاء ملاحظتك صوتياً..."
              className={`w-full flex-1 min-h-48 md:min-h-[220px] text-xs font-sans leading-relaxed bg-transparent resize-none border-0 focus:ring-0 focus:outline-none placeholder:text-stone-400 dark:placeholder:text-zinc-650 disabled:opacity-75 disabled:cursor-not-allowed ${mTextClass}`}
            />
          </div>

          {/* Core premium visual customizer & school planner reminders footer */}
          <div className="mt-4 pt-3 border-t border-stone-200/50 dark:border-zinc-805/50 flex flex-col gap-4">
            
            {/* Quick Tab Select Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-stone-105/60 dark:bg-zinc-900/60 p-1.5 rounded-2xl border border-stone-200/60 dark:border-zinc-800/80">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveStylesTab('bg')}
                  className={`px-3 py-1.5 rounded-xl font-extrabold text-[10px] flex items-center gap-1 transition-all ${
                    activeStylesTab === 'bg'
                      ? 'bg-sky-600 text-white shadow-md'
                      : 'hover:bg-stone-200/50 dark:hover:bg-zinc-800/50 text-stone-650 dark:text-zinc-350'
                  }`}
                >
                  <Paintbrush className="w-3.5 h-3.5" />
                  <span>خلفية الملاحظة</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveStylesTab('text')}
                  className={`px-3 py-1.5 rounded-xl font-extrabold text-[10px] flex items-center gap-1 transition-all ${
                    activeStylesTab === 'text'
                      ? 'bg-sky-600 text-white shadow-md'
                      : 'hover:bg-stone-200/50 dark:hover:bg-zinc-800/50 text-stone-650 dark:text-zinc-350'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>لون الخط</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveStylesTab('reminder')}
                  className={`px-3 py-1.5 rounded-xl font-extrabold text-[10px] flex items-center gap-1 transition-all ${
                    activeStylesTab === 'reminder'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'hover:bg-stone-200/50 dark:hover:bg-zinc-800/50 text-stone-650 dark:text-zinc-350'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>منبه التذكير {reminderAt ? '🔔' : ''}</span>
                </button>
              </div>

              {/* Always visible folder selection & image triggers on the far left */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="flex items-center gap-1 bg-stone-100/80 dark:bg-zinc-950/40 px-2 py-1 rounded-xl border border-stone-200/20">
                  <FolderIcon className="w-3 h-3 text-stone-400" />
                  <select
                    value={folderId}
                    onChange={(e) => handleFolderSelect(e.target.value)}
                    disabled={!!note?.isDeleted}
                    className="text-[10px] font-bold bg-transparent text-stone-700 dark:text-zinc-350 focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-white dark:bg-zinc-900">بلا فئة</option>
                    {folders.map(f => (
                      <option key={f.id} value={f.id} className="bg-white dark:bg-zinc-900">{f.name}</option>
                    ))}
                  </select>
                </div>

                <label className={`p-1 bg-stone-100/80 hover:bg-stone-200 dark:bg-zinc-955 dark:hover:bg-zinc-850 rounded-xl cursor-pointer transition ${note?.isDeleted ? 'opacity-20' : ''}`} title="إرفاق صورة للمذكرة">
                  <ImageIcon className="w-3.5 h-3.5 text-sky-505" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFile}
                    disabled={!!note?.isDeleted}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={startCamera}
                  disabled={!!note?.isDeleted}
                  className="p-1 bg-stone-100/80 hover:bg-stone-200 dark:bg-zinc-955 dark:hover:bg-zinc-850 rounded-xl transition"
                  title="التقاط فوري بالكاميرا"
                >
                  <Camera className="w-3.5 h-3.5 text-indigo-505" />
                </button>

                <button
                  type="button"
                  onClick={toggleListening}
                  disabled={!!note?.isDeleted}
                  className={`p-1.5 rounded-xl transition-all relative cursor-pointer flex items-center justify-center ${
                    isListening
                      ? 'bg-red-500 hover:bg-red-600 text-white scale-105 shadow-md shadow-red-500/20'
                      : 'bg-stone-100/80 hover:bg-stone-200 dark:bg-zinc-955 dark:hover:bg-zinc-850 text-stone-605 dark:text-zinc-350'
                  }`}
                  title={isListening ? "جاري الإملاء... انقر للإيقاف 🛑" : "إملاء صوتي (تحويل الصوت إلى نص) 🎙️"}
                >
                  {isListening ? (
                    <Mic className="w-3.5 h-3.5 text-white animate-bounce" />
                  ) : (
                    <Mic className="w-3.5 h-3.5 text-rose-500" />
                  )}
                  {isListening && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full animate-ping" />
                  )}
                </button>
              </div>
            </div>

            {/* Sub content depending on the active bottom tab */}
            <div className="p-3.5 bg-stone-50/50 dark:bg-zinc-950/20 border border-stone-200/20 rounded-2xl">
              
              {/* Tab 1: BACKGROUND STYLING */}
              {activeStylesTab === 'bg' && (
                <div className="space-y-3">
                  {/* Background Type Subtabs */}
                  <div className="flex gap-2 border-b border-stone-200/30 dark:border-zinc-800/30 pb-2">
                    <button
                      type="button"
                      onClick={() => { setBgSubTab('solid'); setBgType('preset'); }}
                      className={`text-[10px] font-extrabold pb-0.5 ${bgSubTab === 'solid' ? 'text-sky-600 border-b border-sky-600' : 'text-stone-400 hover:text-stone-600'}`}
                    >
                      ألوان صلبة
                    </button>
                    <button
                      type="button"
                      onClick={() => { setBgSubTab('gradient'); setBgType('gradient'); }}
                      className={`text-[10px] font-extrabold pb-0.5 ${bgSubTab === 'gradient' ? 'text-sky-600 border-b border-sky-600' : 'text-stone-400 hover:text-stone-600'}`}
                    >
                      تدرجات لونية
                    </button>
                    <button
                      type="button"
                      onClick={() => { setBgSubTab('image'); }}
                      className={`text-[10px] font-extrabold pb-0.5 ${bgSubTab === 'image' ? 'text-sky-600 border-b border-sky-600' : 'text-stone-400 hover:text-stone-600'}`}
                    >
                      صورة مخصصة من الجهاز
                    </button>
                  </div>

                  {/* Subtab Content: Solid Colors */}
                  {bgSubTab === 'solid' && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[9px] text-stone-400 font-bold">اختر لوناً:</span>
                      <div className="flex gap-1.5 flex-wrap">
                        {PRESET_COLORS.map(col => (
                          <button
                            key={col.value}
                            type="button"
                            onClick={() => {
                              setColor(col.value);
                              setBgType('preset');
                              triggerAutoSave(title, content, image, col.value, folderId, isPinned, 'preset');
                            }}
                            disabled={!!note?.isDeleted}
                            className={`w-5 h-5 rounded-full border border-stone-300 dark:border-zinc-700 transition-all ${
                              col.value === 'stone' ? 'bg-stone-100 dark:bg-zinc-800' : 
                              col.value === 'rose' ? 'bg-rose-100 dark:bg-rose-950/50' :
                              col.value === 'sky' ? 'bg-sky-100 dark:bg-sky-950/50' :
                              col.value === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-950/50' :
                              col.value === 'amber' ? 'bg-amber-100 dark:bg-amber-950/50' :
                              col.value === 'purple' ? 'bg-purple-100 dark:bg-purple-950/50' : 'bg-indigo-100 dark:bg-indigo-950/50'
                            } ${color === col.value && bgType === 'preset' ? 'scale-120 ring-2 ring-sky-505' : ''}`}
                            title={col.name}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Subtab Content: Gradients */}
                  {bgSubTab === 'gradient' && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[9px] text-stone-400 font-bold">التدرج النشط:</span>
                      <div className="flex gap-2 flex-wrap">
                        {PRESET_GRADIENTS.map(grad => (
                          <button
                            key={grad.value}
                            type="button"
                            onClick={() => {
                              setBgGradient(grad.value);
                              setBgType('gradient');
                              triggerAutoSave(title, content, image, color, folderId, isPinned, 'gradient', grad.value);
                            }}
                            className={`px-2.5 py-1 text-[9px] font-bold rounded-lg border transition-all ${grad.class} ${
                              bgGradient === grad.value && bgType === 'gradient' ? 'ring-2 ring-sky-500 scale-105 border-transparent' : 'border-stone-250 dark:border-zinc-850 text-stone-800 dark:text-zinc-200'
                            }`}
                          >
                            {grad.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Subtab Content: Device Background Custom Image */}
                  {bgSubTab === 'image' && (
                    <div className="flex flex-col gap-2.5">
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="px-3.5 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-extrabold text-[10px] rounded-xl cursor-pointer shadow-md transition flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>اختر صورة كخلفية من جهازك 💻</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) {
                                const r = new FileReader();
                                r.onloadend = () => {
                                  if (typeof r.result === 'string') {
                                    setBgType('image');
                                    setBgImage(r.result);
                                    triggerAutoSave(title, content, image, color, folderId, isPinned, 'image', bgGradient, r.result);
                                    showLocalToast('🎨 تم تعيين الخلفية وتطبيقها بنجاح!');
                                  }
                                };
                                r.readAsDataURL(f);
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                        {bgImage && (
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                              ✨ صورة الخلفية نشطة
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setBgImage('');
                                setBgType('preset');
                                triggerAutoSave(title, content, image, color, folderId, isPinned, 'preset', bgGradient, '');
                                showLocalToast('🗑️ تم التخلص من صورة الخلفية الخاصة بك.');
                              }}
                              className="text-[9px] text-red-500 hover:underline font-extrabold"
                            >
                              إلغاء الخلفية
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-[9px] text-stone-400 dark:text-zinc-500">
                        * سيتم تحميل الصورة وتسكينها بشكل فخم خلف محتوى الملاحظة، مع معالجة ذكية للخط لتجنب ارتباك الرؤية.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: TEXT COLOR */}
              {activeStylesTab === 'text' && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold text-stone-450">ترغب بتغيير لون خط الملاحظة؟</span>
                  <div className="flex gap-2 flex-wrap">
                    {PRESET_TEXT_COLORS.map(tc => (
                      <button
                        key={tc.value}
                        type="button"
                        onClick={() => {
                          setTextColor(tc.value);
                          triggerAutoSave(title, content, image, color, folderId, isPinned, bgType, bgGradient, bgImage, tc.value);
                        }}
                        className={`px-3 py-1 text-[10px] font-extrabold rounded-xl transition ${tc.class} ${
                          textColor === tc.value 
                            ? 'ring-2 ring-sky-505 dark:ring-sky-400 scale-105 shadow-sm' 
                            : 'bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-800'
                        }`}
                      >
                        {tc.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: REMINDER AT SCHEDULER */}
              {activeStylesTab === 'reminder' && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                      <span className="text-[10px] font-extrabold text-stone-700 dark:text-zinc-300">
                        اضبط منبه وتنبيه الملاحظة:
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="datetime-local"
                        value={reminderAt}
                        onChange={(e) => {
                          const val = e.target.value;
                          setReminderAt(val);
                          triggerAutoSave(title, content, image, color, folderId, isPinned, bgType, bgGradient, bgImage, textColor, val);
                        }}
                        className="text-[10px] font-bold bg-white dark:bg-zinc-900 text-stone-700 dark:text-zinc-300 px-2 py-1 rounded-lg border border-stone-200 dark:border-zinc-805"
                      />
                      {reminderAt && (
                        <button
                          type="button"
                          onClick={() => {
                            setReminderAt('');
                            triggerAutoSave(title, content, image, color, folderId, isPinned, bgType, bgGradient, bgImage, textColor, '');
                            showLocalToast('🗑️ تم إلغاء منبه التنبيه.');
                          }}
                          className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 font-extrabold text-[9px] rounded-lg"
                        >
                          إلغاء المنبه
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Planner Quick Options */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[9px] text-stone-400 font-bold">خيارات الإعداد السريع:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setMinutes(d.getMinutes() + 10);
                        const str = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                        setReminderAt(str);
                        triggerAutoSave(title, content, image, color, folderId, isPinned, bgType, bgGradient, bgImage, textColor, str);
                        showLocalToast('⏰ تم ضبط المنبه بنجاح (بعد ١٠ دقائق)');
                      }}
                      className="px-2 py-1 bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-750 dark:text-zinc-300 rounded text-[9px] font-bold"
                    >
                      بعد ١٠ دقائق ⏱️
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setHours(d.getHours() + 1);
                        const str = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                        setReminderAt(str);
                        triggerAutoSave(title, content, image, color, folderId, isPinned, bgType, bgGradient, bgImage, textColor, str);
                        showLocalToast('⏰ تم ضبط المنبه بنجاح (بعد ساعة)');
                      }}
                      className="px-2 py-1 bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-750 dark:text-zinc-300 rounded text-[9px] font-bold"
                    >
                      بعد ساعة 🕐
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 1);
                        d.setHours(8, 0, 0, 0);
                        const str = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                        setReminderAt(str);
                        triggerAutoSave(title, content, image, color, folderId, isPinned, bgType, bgGradient, bgImage, textColor, str);
                        showLocalToast('⏰ تم ضبط المنبه لصباح الغد الساعة ٨:٠٠ ص');
                      }}
                      className="px-2 py-1 bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-750 dark:text-zinc-300 rounded text-[9px] font-bold"
                    >
                      غداً صباحاً ☀️
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 7);
                        d.setHours(9, 0, 0, 0);
                        const str = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                        setReminderAt(str);
                        triggerAutoSave(title, content, image, color, folderId, isPinned, bgType, bgGradient, bgImage, textColor, str);
                        showLocalToast('⏰ تم ضبط المنبه للأسبوع المقبل الساعة ٩:٠٠ ص');
                      }}
                      className="px-2 py-1 bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-750 dark:text-zinc-300 rounded text-[9px] font-bold"
                    >
                      الأسبوع المقبل 🌟
                    </button>
                  </div>
                  <p className="text-[9px] text-amber-600 dark:text-amber-400 font-bold leading-relaxed">
                    🔔 بمجرد مضاهاة الوقت، سيظهر تنبيه منبثق فوري مع رنين صوتي رقيق في واجهة النظام لإيقاظ انتباهك للمذكرة فوراً!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Manual Save Action Bar for High Trust & Confidence */}
          {!note?.isDeleted && (
            <div className="mt-5 pt-4 border-t border-stone-250/20 dark:border-zinc-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-[10px] text-stone-500 dark:text-zinc-400 font-bold max-w-sm sm:max-w-md leading-relaxed text-right">
                💡 <span className="text-stone-600 dark:text-zinc-350">ملاحظة أمان:</span> نظام الحفظ التلقائي الذكي نشط في الخلفية، للإنهاء والاعتماد، اضغط على زر الحفظ لتسجيل الإدخال فوراً والعودة للمجلدات.
              </div>
              <button
                type="button"
                onClick={handleManualSaveClick}
                disabled={isSavedSuccessfully}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transform active:scale-95 transition-all cursor-pointer shadow-md min-w-[180px] ${
                  isSavedSuccessfully
                    ? 'bg-emerald-600 hover:bg-emerald-600 text-white animate-pulse'
                    : 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white hover:shadow-lg shadow-sky-600/15'
                }`}
              >
                {isSavedSuccessfully ? (
                  <>
                    <Check className="w-4 h-4 text-white animate-bounce" />
                    <span>تم حفظ الملاحظة وتسجيلها! 🎉</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>إدخال وحفظ الملاحظة 💾</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* AI Assistant Side Panel (Right Pane on Desktop, Bottom on Mobile) */}
        <div className="w-full md:w-72 p-6 bg-stone-50/50 dark:bg-zinc-950/20 overflow-y-auto flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              <h3 className="text-xs font-extrabold text-[#0284c7] dark:text-sky-400">مساعد الذكاء الاصطناعي الذكي</h3>
            </div>
            <p className="text-[10px] text-stone-500 dark:text-zinc-400 mb-4 leading-relaxed">
              افتح آفاقاً جديدة لملاحظاتك بتلخيصها بذكاء، تدقيق الأخطاء، أو استخلاص بنود العمل بلمحة واحدة.
            </p>

            {/* Action buttons */}
            <div className="space-y-2 mb-4">
              <button
                onClick={() => callAIAnalyzer('summarize')}
                disabled={aiLoading || !!note?.isDeleted}
                className="w-full text-right px-3 py-2 text-[11px] font-bold bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300 rounded-xl transition-all flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>📝 تلخيص النص بذكاء</span>
                {aiLoading && aiAction === 'summarize' && <Loader2 className="w-3 h-3 animate-spin text-sky-500" />}
              </button>
              
              <button
                onClick={() => callAIAnalyzer('improve')}
                disabled={aiLoading || !!note?.isDeleted}
                className="w-full text-right px-3 py-2 text-[11px] font-bold bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300 rounded-xl transition-all flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>✨ تحسين الصياغة واللغة</span>
                {aiLoading && aiAction === 'improve' && <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />}
              </button>

              <button
                onClick={() => callAIAnalyzer('bullets')}
                disabled={aiLoading || !!note?.isDeleted}
                className="w-full text-right px-3 py-2 text-[11px] font-bold bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300 rounded-xl transition-all flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>📌 استخلاص أهم النقاط</span>
                {aiLoading && aiAction === 'bullets' && <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />}
              </button>

              <button
                onClick={() => callAIAnalyzer('tags')}
                disabled={aiLoading || !!note?.isDeleted}
                className="w-full text-right px-3 py-2 text-[11px] font-bold bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300 rounded-xl transition-all flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>🏷️ اقتراح وسم وتصنيف</span>
                {aiLoading && aiAction === 'tags' && <Loader2 className="w-3 h-3 animate-spin text-amber-500" />}
              </button>
            </div>

            {/* AI Response Display Module */}
            {(aiResult || aiLoading || aiError) && (
              <div className="p-3 bg-white dark:bg-zinc-900/60 border border-stone-250 dark:border-zinc-800 rounded-2xl text-[11px] leading-relaxed max-h-56 overflow-y-auto space-y-2">
                {aiLoading ? (
                  <div className="flex flex-col items-center justify-center py-4 text-stone-400 gap-1.5">
                    <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
                    <span className="animate-pulse font-bold text-[10px]">يقوم Gemini بتحليل الملاحظة...</span>
                  </div>
                ) : aiError ? (
                  <div className="text-red-500 font-bold p-1">
                    ⚠️ {aiError}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="font-extrabold text-[#0284c7] flex items-center gap-1 border-b pb-1">
                      <CheckCircle className="w-3 h-3 text-emerald-500" />
                      <span>اقتراح الذكاء الاصطناعي:</span>
                    </div>
                    <div className="whitespace-pre-wrap text-stone-800 dark:text-zinc-200 font-sans leading-relaxed break-words">{renderTextWithStyledLinks(aiResult)}</div>
                    
                    {/* Interaction buttons for smart content */}
                    <div className="flex gap-1.5 pt-2 border-t mt-2">
                      <button
                        onClick={() => applyAIReplacement('replace')}
                        className="flex-1 py-1 text-[9px] font-extrabold bg-sky-600 hover:bg-sky-500 text-white rounded transition"
                      >
                        استبدال المحتوى
                      </button>
                      <button
                        onClick={() => applyAIReplacement('append')}
                        className="flex-1 py-1 text-[9px] font-extrabold bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 hover:bg-stone-200 rounded transition border border-stone-200 dark:border-zinc-700"
                      >
                        إضافة للملاحظة
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 text-[9px] text-stone-400 dark:text-zinc-500 text-center border-t pt-2 border-stone-200/50 dark:border-zinc-800/50">
            مدعوم بواسطة طراز <span className="font-bold">Gemini 3.5 Flash</span> لتجربة ذكية متكاملة.
          </div>
        </div>
      </div>

      {/* Cinematic Fullscreen Lightbox Overlay */}
      {lightboxOpen && image && (
        <div className="fixed inset-0 z-[99999] bg-stone-950/95 backdrop-blur-xl flex flex-col justify-between p-4 md:p-8 transition-all duration-300">
          {/* Top Toolbar */}
          <div className="flex items-center justify-between text-white border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-sky-950/50 rounded-lg text-sky-450 border border-sky-900/40">
                <ImageIcon className="w-4 h-4 text-sky-450" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-stone-100">{title || "ملاحظة غلافية متميزة"}</h4>
                <p className="text-[9px] text-stone-450">معاينة السينما والتدقيق البصري الفائق</p>
              </div>
            </div>

            {/* Zoom indicators and actions */}
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-mono text-zinc-350 hidden sm:inline bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800">
                التكبير: {Math.round(zoomLevel * 100)}%
              </span>
              
              <button
                onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 3))}
                className="p-1.5 bg-[#ffffff10] hover:bg-[#ffffff20] text-stone-200 rounded-lg transition"
                title="تكبير الصورة"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <button
                onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.5))}
                className="p-1.5 bg-[#ffffff10] hover:bg-[#ffffff20] text-stone-200 rounded-lg transition"
                title="تصغير الصورة"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <button
                onClick={() => setZoomLevel(1)}
                className="p-1.5 bg-[#ffffff10] hover:bg-[#ffffff20] text-stone-200 rounded-lg transition"
                title="إعادة تعيين الأبعاد"
              >
                <Minimize2 className="w-4 h-4" />
              </button>

              {/* Copy Image Link */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(image);
                  const toast = document.createElement('div');
                  toast.className = 'fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-sky-600 text-white text-xs px-4 py-2 rounded-xl shadow-2xl z-[100000] font-bold';
                  toast.innerText = 'تم نسخ رابط الغلاف الفني إلى الحافظة!';
                  document.body.appendChild(toast);
                  setTimeout(() => toast.remove(), 2500);
                }}
                className="p-1.5 bg-sky-650 hover:bg-sky-600 text-white rounded-lg transition text-[10px] font-bold flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">نسخ الرابط</span>
              </button>

              <button
                onClick={() => setLightboxOpen(false)}
                className="p-1.5 bg-red-650 hover:bg-red-650/80 text-white rounded-lg transition"
                title="إغلاق المعاينة"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Immersive Image Canvas View with smooth dragging transition */}
          <div className="flex-1 flex items-center justify-center p-2 overflow-auto">
            <div 
              className="transition-transform duration-300 ease-out max-w-full max-h-[75vh]"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <img
                src={image}
                alt="معاينة كاملة متميزة"
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl shadow-2xl border border-white/5"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Bottom info row */}
          <div className="text-center font-bold text-[9px] text-[#0284c7] border-t border-zinc-805 pt-3">
            استكشف غلاف الملاحظة الفني بدعم من نظام <span className="font-extrabold text-[#38bdf8]">Gemini Ultra Studio</span> المتميز.
          </div>
        </div>
      )}

      {/* Save Confirmation Dialog on Exit */}
      {showExitConfirmation && (
        <div className="fixed inset-0 z-[100000] bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#121214] border border-stone-200 dark:border-zinc-850 rounded-3xl p-6 shadow-2xl max-w-sm w-full text-center space-y-4 animate-in fade-in zoom-in duration-250 font-sans" dir="rtl">
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-500 dark:text-amber-400 flex items-center justify-center text-2xl animate-bounce">
              💾
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-sm font-black text-stone-900 dark:text-zinc-150">هل تود حفظ هذه الملاحظة قبل المغادرة؟</h3>
              <p className="text-xs text-stone-500 dark:text-zinc-400 leading-relaxed font-bold">
                لقد أجريت تعديلات جديدة عليها. هل تريد اعتمادها وحفظها في قاعدة البيانات السحابية والمحلية، أم الخروج وتجاهل آخر تدوين؟
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirmation(false);
                  handleManualSaveClick();
                }}
                className="w-full py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black transition shadow-lg shadow-sky-600/15 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>حفظ التعديلات والاعتماد السحابي 💾</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowExitConfirmation(false);
                  onClose();
                }}
                className="w-full py-2.5 bg-red-50 dark:bg-red-950/20 text-red-650 hover:bg-red-100 dark:hover:bg-red-950/40 rounded-xl text-xs font-black transition cursor-pointer"
              >
                تجاهل وحذف آخر التعديلات 🗑️
              </button>

              <button
                type="button"
                onClick={() => setShowExitConfirmation(false)}
                className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-605 text-stone-600 dark:text-zinc-300 rounded-xl text-xs font-black transition cursor-pointer"
              >
                العودة وإكمال الكتابة ✏️
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
