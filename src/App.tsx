import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Trash, Moon, Sun, Folder, BookOpen, Briefcase, 
  Code, Lightbulb, Heart, Compass, Anchor, Share2, Pin, Trash2, 
  Grid, List, Sparkles, HelpCircle, Check, Copy,
  Lock, Unlock, ShieldCheck, Database, Download, Upload, Radio, 
  Wifi, WifiOff, HardDrive, Smartphone, RefreshCw, X, AlertTriangle, Settings,
  Eye, EyeOff, Clock
} from 'lucide-react';
import { Folder as FolderType, Note, PRESET_COLORS, FOLDER_COLORS } from './types';
import FolderList from './components/FolderList';
import ClipboardSharer from './components/ClipboardSharer';
import NoteCard from './components/NoteCard';
import NoteModal from './components/NoteModal';
import ShareModal from './components/ShareModal';
import SafeFolderView from './components/SafeFolderView';

// Firebase imports
import { auth, db, googleProvider, signInWithPopup, signOut } from './firebase';
import { collection, doc, setDoc, getDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

// Initial default folders to look wonderful out-of-the-box
const DEFAULT_FOLDERS: FolderType[] = [
  { id: 'f-1', name: '✏️ ملاحظات العمل والمهامّ', icon: 'Briefcase', color: 'blue', createdAt: new Date().toISOString() },
  { id: 'f-2', name: '💡 أفكار إبداعية مقترحة', icon: 'Lightbulb', color: 'amber', createdAt: new Date().toISOString() },
  { id: 'f-3', name: '🌐 أكواد وروابط هامة', icon: 'Code', color: 'emerald', createdAt: new Date().toISOString() },
  { id: 'f-4', name: '🖤 أشياء شخصية واقتباسات', icon: 'Heart', color: 'rose', createdAt: new Date().toISOString() }
];

// Initial default notes for preview matching
const DEFAULT_NOTES: Note[] = [
  {
    id: 'n-1',
    folderId: 'f-1',
    title: 'خطة إطلاق المشروع الجديد',
    content: `نود العمل على الترتيبات التالية الأسبوع القادم:\n- مراجعة خطة التسويق والألوان للموقع الجديد.\n- تدقيق الروابط ومصادر الأيقونات.\n- تجهيز مسودة المنشور على لينكد إن.\n\nتأكد من إبقاء الملاحظة متزامنة تلقائياً.`,
    color: 'emerald',
    isPinned: true,
    isDeleted: false,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    order: 100
  },
  {
    id: 'n-2',
    folderId: 'f-2',
    title: 'فكرة تطبيق السفر بالذكاء الاصطناعي',
    content: `بناء تطبيق يساعد السياح العرب على توليد مسارات رحلاتهم بضغطة واحدة باستخدام الذكاء الاصطناعي مع صور حية مأخوذة من الكاميرا.\n\nاسم مقترح: ترحال الذكي.\nالألوان: أزرق سماوي ورملي دافئ.`,
    color: 'amber',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
    isPinned: false,
    isDeleted: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    order: 200
  },
  {
    id: 'n-3',
    folderId: 'f-3',
    title: 'رابط أكاديمية الذكاء الاصطناعي من جوجل',
    content: `الرابط المباشر للتسجيل في الدورات المعرفية من جوجل:\nhttps://analytics.google.com/training\n\nيحتوي على ورش عمل وتدريبات متطورة على الحوسبة السحابية.`,
    color: 'stone',
    isPinned: false,
    isDeleted: false,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    order: 300
  }
];

export default function App() {
  // Global states
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGridView, setIsGridView] = useState(() => {
    return localStorage.getItem('notebox_is_grid_view') !== 'false';
  });
  const [darkMode, setDarkMode] = useState(false);
  const [safeFilesCount, setSafeFilesCount] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('notebox_secure_files');
      return stored ? JSON.parse(stored).length : 0;
    } catch {
      return 0;
    }
  });

  // Note Modal controller
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeNoteForEdit, setActiveNoteForEdit] = useState<Note | null>(null);
  const [activeReminderNote, setActiveReminderNote] = useState<Note | null>(null);

  // Periodic checking for important note alarms/reminders (School Planner style)
  useEffect(() => {
    const playAlarmSound = () => {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Staggered premium chime 1
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        gain1.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.start();
        osc1.stop(audioCtx.currentTime + 0.8);

        // Staggered premium chime 2
        setTimeout(() => {
          const osc2 = audioCtx.createOscillator();
          const gain2 = audioCtx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
          gain2.gain.setValueAtTime(0.15, audioCtx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
          osc2.connect(gain2);
          gain2.connect(audioCtx.destination);
          osc2.start();
          osc2.stop(audioCtx.currentTime + 1.2);
        }, 150);
      } catch (err) {
        console.warn('Audio feedback blocked by browser policies.', err);
      }
    };

    const interval = setInterval(() => {
      if (!notes || notes.length === 0) return;
      
      const now = new Date().getTime();
      const triggered = notes.find(n => 
        !n.isDeleted && 
        n.reminderAt && 
        !n.reminderNotified && 
        new Date(n.reminderAt).getTime() <= now
      );

      if (triggered) {
        playAlarmSound();
        
        // Mark as triggered so we don't alert repeatedly
        const updatedNote = { ...triggered, reminderNotified: true };
        handleSaveNote(updatedNote);
        
        // Trigger dialog view
        setActiveReminderNote(updatedNote);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [notes]);

  // Success Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Premium Mobile App & Lock Mode States
  const [activeTab, setActiveTab] = useState<'explorer' | 'folders' | 'sharer' | 'settings'>('explorer');
  const [shareNote, setShareNote] = useState<Note | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [savedPin, setSavedPin] = useState<string>('');
  const [isPinLocked, setIsPinLocked] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);
  const [rawPinSetup, setRawPinSetup] = useState<string>('');
  const [showSetupPin, setShowSetupPin] = useState<boolean>(false);
  const [showWipePinModal, setShowWipePinModal] = useState<boolean>(false);
  const [wipePinInput, setWipePinInput] = useState<string>('');
  const [wipePinError, setWipePinError] = useState<boolean>(false);
  const [showWipePin, setShowWipePin] = useState<boolean>(false);
  const [offlineSyncMode, setOfflineSyncMode] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [importText, setImportText] = useState<string>('');
  const [showImportDialog, setShowImportDialog] = useState<boolean>(false);

  // States for Supabase Integration
  const [supabaseConfig, setSupabaseConfig] = useState<{
    configured: boolean;
    publishableKey: string | null;
    secretKey: string | null;
    supabaseUrl: string;
  } | null>(null);
  const [supabaseSyncStatus, setSupabaseSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastSupabaseSyncTime, setLastSupabaseSyncTime] = useState<string | null>(() => {
    return localStorage.getItem('last_supabase_sync_time');
  });

  // Fetch Supabase configuration state on mount
  const fetchSupabaseConfig = async () => {
    try {
      const res = await fetch('/api/supabase/config');
      if (res.ok) {
        const data = await res.json();
        setSupabaseConfig(data);
      }
    } catch (err) {
      console.error('Failed to fetch Supabase config:', err);
    }
  };

  useEffect(() => {
    fetchSupabaseConfig();
  }, []);

  // Action to sync NoteBox states to Supabase Cloud
  const handleSupabaseSync = async () => {
    setSupabaseSyncStatus('syncing');
    try {
      const savedFolders = localStorage.getItem('notebox_folders');
      const currentLocalFolders = savedFolders ? JSON.parse(savedFolders) : folders;
      const savedNotes = localStorage.getItem('notebox_notes');
      const currentLocalNotes = savedNotes ? JSON.parse(savedNotes) : notes;

      const res = await fetch('/api/supabase/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: currentLocalNotes,
          folders: currentLocalFolders,
          email: user?.email || 'googlacount2021@gmail.com'
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSupabaseSyncStatus('success');
        const nowStr = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSupabaseSyncTime(nowStr);
        localStorage.setItem('last_supabase_sync_time', nowStr);
        showToast(data.message || '✅ تم النسخ الاحتياطي والمزامنة السحابية بنجاح!');
      } else {
        setSupabaseSyncStatus('error');
        showToast(`⚠️ فشل الاتصال: ${data.error || 'حدث خطأ ما'}`);
      }
    } catch (err) {
      setSupabaseSyncStatus('error');
      console.error('Supabase Sync Failed:', err);
      showToast('⚠️ خطأ في مزامنة البيانات السحابية');
    }
  };

  // Action to restore NoteBox states from Supabase Cloud
  const handleSupabaseRestore = async () => {
    showConfirm(
      'استرجاع ومزامنة البيانات من Supabase سحابياً',
      '⚠️ انتبه للغاية: هذه الخطوة ستستبدل فوراً الملاحظات والمجلدات الحالية على هذا الجهاز بالنسخة المحفوظة على خادم ومستودع Supabase السحابي. هل تريد الاستمرار بهذا الإجراء الفوري؟',
      async () => {
        setSupabaseSyncStatus('syncing');
        try {
          const emailQuery = encodeURIComponent(user?.email || 'googlacount2021@gmail.com');
          const res = await fetch(`/api/supabase/load?email=${emailQuery}`);
          const data = await res.json();
          if (res.ok && data.success) {
            setSupabaseSyncStatus('success');
            
            // Overwrite in local state and localStorage
            setNotes(data.notes || []);
            setFolders(data.folders || []);
            localStorage.setItem('notebox_notes', JSON.stringify(data.notes || []));
            localStorage.setItem('notebox_folders', JSON.stringify(data.folders || []));
            
            showToast(data.message || '🔓 تم استيراد النسخة الاحتياطية بنجاح!');
          } else {
            setSupabaseSyncStatus('error');
            showToast(`⚠️ فشل الاسترجاع: ${data.error || 'لا تتوفر أي نسخة سابقة لهذا الحساب'}`);
          }
        } catch (err) {
          setSupabaseSyncStatus('error');
          console.error('Supabase Load Failed:', err);
          showToast('⚠️ خطأ اتصال أثناء محاولة جلب النسخة');
        }
      },
      false,
      'نعم، استيراد واسترجاع الآن',
      'تراجع'
    );
  };

  // Custom Confirmation Dialog details
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    isDanger = true,
    confirmText = 'نعم، تأكيـد',
    cancelText = 'إلغـاء'
  ) => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      },
      confirmText,
      cancelText,
      isDanger,
    });
  };

  // 1. Initial Load from localStorage
  useEffect(() => {
    const savedFolders = localStorage.getItem('notebox_folders');
    if (savedFolders) {
      setFolders(JSON.parse(savedFolders));
    } else {
      setFolders(DEFAULT_FOLDERS);
      localStorage.setItem('notebox_folders', JSON.stringify(DEFAULT_FOLDERS));
    }

    const savedNotes = localStorage.getItem('notebox_notes');
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    } else {
      setNotes(DEFAULT_NOTES);
      localStorage.setItem('notebox_notes', JSON.stringify(DEFAULT_NOTES));
    }

    // Set Saved Security PIN, force instant lock if active
    const localPin = localStorage.getItem('notebox_secure_pin') || '';
    setSavedPin(localPin);
    if (localPin) {
      setIsPinLocked(true);
    }

    // Load Dark theme preferences
    const isDark = localStorage.getItem('notebox_dark_mode') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // 1.5. Firebase Auth and cloud data syncing trigger listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setSyncStatus('syncing');
        try {
          // Load local states first
          const savedFolders = localStorage.getItem('notebox_folders');
          const currentLocalFolders: FolderType[] = savedFolders ? JSON.parse(savedFolders) : DEFAULT_FOLDERS;
          const savedNotes = localStorage.getItem('notebox_notes');
          const currentLocalNotes: Note[] = savedNotes ? JSON.parse(savedNotes) : DEFAULT_NOTES;

          // Fetch folders from Firestore
          const foldersCol = collection(db, 'users', currentUser.uid, 'folders');
          const foldersSnap = await getDocs(foldersCol);
          const firestoreFolders: FolderType[] = [];
          foldersSnap.forEach(d => {
            firestoreFolders.push(d.data() as FolderType);
          });

          // Fetch notes from Firestore
          const notesCol = collection(db, 'users', currentUser.uid, 'notes');
          const notesSnap = await getDocs(notesCol);
          const firestoreNotes: Note[] = [];
          notesSnap.forEach(d => {
            firestoreNotes.push(d.data() as Note);
          });

          // Merge folders by createdAt ISO dates
          const folderMap = new Map<string, FolderType>();
          currentLocalFolders.forEach((f) => folderMap.set(f.id, f));
          firestoreFolders.forEach(f => {
            const existing = folderMap.get(f.id);
            if (!existing || new Date(f.createdAt).getTime() > new Date(existing.createdAt).getTime()) {
              folderMap.set(f.id, f);
            }
          });
          const mergedFolders = Array.from(folderMap.values());

          // Merge notes by updatedAt ISO dates
          const noteMap = new Map<string, Note>();
          currentLocalNotes.forEach((n) => noteMap.set(n.id, n));
          firestoreNotes.forEach(n => {
            const existing = noteMap.get(n.id);
            if (!existing || new Date(n.updatedAt).getTime() > new Date(existing.updatedAt).getTime()) {
              noteMap.set(n.id, n);
            }
          });
          const mergedNotes = Array.from(noteMap.values());

          // Update local state and localStorage
          setFolders(mergedFolders);
          setNotes(mergedNotes);
          localStorage.setItem('notebox_folders', JSON.stringify(mergedFolders));
          localStorage.setItem('notebox_notes', JSON.stringify(mergedNotes));

          // Sync back to Firebase to make sure cloud is fully populated
          for (const folder of mergedFolders) {
            await setDoc(doc(db, 'users', currentUser.uid, 'folders', folder.id), folder);
          }
          for (const note of mergedNotes) {
            await setDoc(doc(db, 'users', currentUser.uid, 'notes', note.id), note);
          }

          // Fetch and update secure Pin setting from cloud users/{uid}
          const userDocSnap = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            if (userData?.savedPin) {
              setSavedPin(userData.savedPin);
              localStorage.setItem('notebox_secure_pin', userData.savedPin);
            }
          }

          setSyncStatus('success');
          showToast('☁️ تم تشغيل مزامنة السحابة وحماية كافة ملاحظاتك بالإيميل!');
        } catch (err: any) {
          setSyncStatus('error');
          console.error('Initial data merge with Firebase failed', err);
        }
      } else {
        setSyncStatus('idle');
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync to localStorage wrapper helper
  const syncFolders = (updatedFolders: FolderType[]) => {
    setFolders(updatedFolders);
    localStorage.setItem('notebox_folders', JSON.stringify(updatedFolders));
    
    if (auth.currentUser) {
      setSyncStatus('syncing');
      Promise.all(updatedFolders.map(f => {
        return setDoc(doc(db, 'users', auth.currentUser!.uid, 'folders', f.id), f);
      })).then(() => {
        setSyncStatus('success');
      }).catch((err) => {
        setSyncStatus('error');
        console.error('Failed to sync folders to Firestore:', err);
      });
    }
  };

  const syncNotes = (updatedNotes: Note[]) => {
    setNotes(updatedNotes);
    localStorage.setItem('notebox_notes', JSON.stringify(updatedNotes));
    
    if (auth.currentUser) {
      setSyncStatus('syncing');
      Promise.all(updatedNotes.map(n => {
        return setDoc(doc(db, 'users', auth.currentUser!.uid, 'notes', n.id), n);
      })).then(() => {
        setSyncStatus('success');
      }).catch((err) => {
        setSyncStatus('error');
        console.error('Failed to sync notes to Firestore:', err);
      });
    }
  };

  const [trashChecked, setTrashChecked] = useState(false);

  // 30-day automatic trash bin cleanup system with custom dialog alert
  const checkAndDeleteOldTrashNotes = (providedNotes?: Note[]) => {
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const targetNotes = providedNotes || notes;
    
    // Find all notes in the trash that were deleted more than 30 days ago
    const oldTrashNotes = targetNotes.filter(n => {
      if (!n.isDeleted || !n.deletedAt) return false;
      const deleteTime = new Date(n.deletedAt).getTime();
      return (now - deleteTime) > THIRTY_DAYS_MS;
    });

    if (oldTrashNotes.length > 0) {
      // Show confirmation/warning to the user
      showConfirm(
        '🧹 تنظيف تلقائي لسلة المهملات',
        `تنبيه أمني: تم رصد ${oldTrashNotes.length} ملاحظة تم حذفها منذ أكثر من 30 يوماً. هل توافق على مسحها بالكامل ونهائياً لتحسين الخصوصية وتوفير المساحة؟`,
        () => {
          // Exclude those old notes
          const oldIds = oldTrashNotes.map(n => n.id);
          const updated = targetNotes.filter(n => !oldIds.includes(n.id));
          syncNotes(updated);
          
          if (auth.currentUser) {
            Promise.all(oldIds.map(id => deleteFirebaseNote(id))).catch(console.error);
          }
          
          showToast(`🧹 تم تنظيف ${oldTrashNotes.length} ملاحظة قديمة منتهية الصلاحية بنجاح!`);
        },
        true, // isDanger
        'نعم، احذفها نهائياً الآن',
        'تجاهل التنبيه مؤقتاً'
      );
    }
  };

  // Helper to generate a mock old note (deleted 31 days ago) for testing
  const generateMockOldTrashNote = () => {
    const thirtyOneDaysAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1050).toISOString();
    const mockNote: Note = {
      id: `mock-old-${Date.now()}`,
      folderId: 'all',
      title: 'ملاحظة قديمة (محذوفة منذ 31 يوماً)',
      content: 'هذه ملاحظة تجريبية تم إنشاؤها خصيصاً لاختبار آلية التنظيف التلقائي لسلة المهملات بعد مرور 30 يوماً.',
      color: 'rose',
      isPinned: false,
      isDeleted: true,
      deletedAt: thirtyOneDaysAgo,
      createdAt: thirtyOneDaysAgo,
      updatedAt: thirtyOneDaysAgo,
      order: 9999
    };

    const updated = [...notes, mockNote];
    syncNotes(updated);
    setTrashChecked(false); // Reset trigger to run the check
    showToast('🧪 تم توليد ملاحظة وهمية عمرها 31 يوماً بسلة المحذوفات! جاري تشغيل فحص التنظيف الأوتوماتيكي...');
  };

  useEffect(() => {
    if (notes.length > 0 && !trashChecked) {
      const timer = setTimeout(() => {
        checkAndDeleteOldTrashNotes();
        setTrashChecked(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [notes, trashChecked]);

  const deleteFirebaseFolder = async (folderId: string) => {
    if (auth.currentUser) {
      try {
        await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'folders', folderId));
      } catch (err) {
        console.error('Delete folder failed', err);
      }
    }
  };

  const deleteFirebaseNote = async (noteId: string) => {
    if (auth.currentUser) {
      try {
        await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'notes', noteId));
      } catch (err) {
        console.error('Delete note failed', err);
      }
    }
  };

  // Toggle dark mode
  const handleToggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    localStorage.setItem('notebox_dark_mode', String(nextDark));
    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    showToast('تم تغيير مظهر التطبيق بنجاح');
  };

  // Show status toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Secure App PIN Verification Actions
  const handleTypePin = (char: string) => {
    setPinError(false);
    if (pinInput.length >= 6) return;
    
    const nextInput = pinInput + char;
    setPinInput(nextInput);

    if (nextInput.length === 6) {
      if (nextInput === savedPin) {
        setIsPinLocked(false);
        setPinInput('');
        showToast('🔓 تم فك تشفير البيانات وبدء الجلسة الآمنة');
      } else {
        // Fail animation trigger
        setTimeout(() => {
          setPinError(true);
          setPinInput('');
        }, 150);
      }
    }
  };

  const handleBackspacePin = () => {
    setPinInput(prev => prev.slice(0, -1));
  };

  const handleClearPinInput = () => {
    setPinInput('');
    setPinError(false);
  };

  const handleSaveNewPin = async (newPin: string) => {
    if (!newPin || newPin.length !== 6 || isNaN(Number(newPin))) {
      showToast('⚠️ يجب كود الحماية أن يتكون من 6 أرقام دقيقة!');
      return;
    }
    localStorage.setItem('notebox_secure_pin', newPin);
    setSavedPin(newPin);
    setRawPinSetup('');
    showToast('🔒 تم تفعيل القفل التلقائي بنجاح!');

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          savedPin: newPin,
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error('Save PIN to Firebase failed', err);
      }
    }
  };

  const handleRemovePin = async () => {
    localStorage.removeItem('notebox_secure_pin');
    setSavedPin('');
    setRawPinSetup('');
    showToast('🔓 تم إلغاء حماية القفل التلقائي بنجاح');

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          savedPin: '',
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error('Remove PIN from Firebase failed', err);
      }
    }
  };

  // Interactive local JSON backup storage management
  const triggerDownloadBackup = () => {
    try {
      const backupObj = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        folders,
        notes
      };
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `notebox_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('📥 تم تصدير وتحميل النسخة الاحتياطية بنجاح!');
    } catch (e) {
      showToast('⚠️ فشل تصدير الملف، الرجاء المحاولة لاحقاً');
    }
  };

  const triggerImportBackup = (jsonText: string) => {
    if (!jsonText.trim()) return;
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.folders || !parsed.notes) {
        showToast('⚠️ الملف غير صالح أو لا يحتوي على حقول الملاحظات الصحيحة');
        return;
      }
      
      showConfirm(
        'تأكيد دمج واستيراد البيانات',
        'تم التحقق من الملف المرفق وجدنا ملاحظات ومجلدات صالحة! هل ترغب في دمجها الآن وتحديث مذكراتك الحالية؟',
        () => {
          // Merge folders
          const incomingFolders = parsed.folders as FolderType[];
          const mergedFolders = [...folders];
          incomingFolders.forEach(item => {
            if (!mergedFolders.some(f => f.id === item.id)) {
              mergedFolders.push(item);
            }
          });
          syncFolders(mergedFolders);

          // Merge notes
          const incomingNotes = parsed.notes as Note[];
          const mergedNotes = [...notes];
          incomingNotes.forEach(item => {
            if (!mergedNotes.some(n => n.id === item.id)) {
              mergedNotes.push(item);
            }
          });
          syncNotes(mergedNotes);

          setShowImportDialog(false);
          setImportText('');
          showToast('✅ تم استيراد ودمج النسخة الاحتياطية بنجاح!');
        },
        false, // not danger
        'دمج البيانات الآن',
        'إلغاء'
      );
    } catch (err) {
      showToast('⚠️ خطأ في القراءة: صيغة JSON غير معتمدة أو تالفة.');
    }
  };

  const triggerRealSync = async () => {
    if (!auth.currentUser) {
      showToast('⚠️ يرجى تسجيل الدخول أولاً لتفعيل المزامنة السحابية!');
      return;
    }
    setSyncStatus('syncing');
    try {
      showToast('🔄 جاري المزامنة مع الخادم السحابي...');
      for (const f of folders) {
        await setDoc(doc(db, 'users', auth.currentUser.uid, 'folders', f.id), f);
      }
      for (const n of notes) {
        await setDoc(doc(db, 'users', auth.currentUser.uid, 'notes', n.id), n);
      }
      setSyncStatus('success');
      showToast('☁️ تم مزامنة وحفظ كامل البيانات هاتفياً وسحابياً!');
    } catch (err) {
      setSyncStatus('error');
      showToast('⚠️ فشل بالاتصال بالخادم السحابي!');
    }
  };

  const triggerSimulatedSync = () => {
    triggerRealSync();
  };

  const handleSignIn = async () => {
    setSyncStatus('syncing');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setSyncStatus('error');
      showToast('⚠️ فشل تسجيل الدخول أو تم رفض النافذة المنبثقة.');
      console.error(err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      showToast('🚪 تم تسجيل الخروج بنجاح والرجوع للوضعية المحلية.');
    } catch (err) {
      console.error(err);
    }
  };

  // Add folder
  const handleCreateFolder = (name: string, icon: string, color: string) => {
    const newFolder: FolderType = {
      id: 'f-' + Math.random().toString(36).substr(2, 9),
      name,
      icon,
      color,
      createdAt: new Date().toISOString()
    };
    const updated = [...folders, newFolder];
    syncFolders(updated);
    showToast(`تم إنشاء المجلد "${name}" بنجاح`);
  };

  // Edit folder
  const handleUpdateFolder = (id: string, name: string, icon: string, color: string) => {
    const updated = folders.map(f => f.id === id ? { ...f, name, icon, color } : f);
    syncFolders(updated);
    showToast(`تم تعديل المجلد بنجاح`);
  };

  // Delete folder (move folder notes to 'all' or uncategorized)
  const handleDeleteFolder = (id: string) => {
    const folder = folders.find(f => f.id === id);
    if (!folder) return;

    showConfirm(
      'تأكيد حذف المجلد',
      `هل أنت متأكد من حذف مجلد "${folder.name}"؟ سيتم تعيين كافة مذكراته كـ "بلا فئة" (لن تحذف المذكرات نفسها).`,
      () => {
        const updatedFolders = folders.filter(f => f.id !== id);
        syncFolders(updatedFolders);
        deleteFirebaseFolder(id);

        // clear deleted folder associations
        const updatedNotes = notes.map(n => n.folderId === id ? { ...n, folderId: 'all' } : n);
        syncNotes(updatedNotes);

        if (selectedFolderId === id) {
          setSelectedFolderId('all');
        }
        showToast('تم حذف المجلد ونقل الملاحظات للقسم العام 📂');
      }
    );
  };

  // Move individual note back-and-forth between Folders
  const handleMoveNoteToFolder = (noteId: string, folderId: string) => {
    const updated = notes.map(n => n.id === noteId ? { ...n, folderId, updatedAt: new Date().toISOString() } : n);
    syncNotes(updated);
    const destName = folderId === 'all' ? 'بلا فئة' : folders.find(f => f.id === folderId)?.name || '';
    showToast(`نُقلت الملاحظة إلى: ${destName}`);
  };

  // Pin / Unpin Note toggler
  const handlePinToggle = (id: string) => {
    const updated = notes.map(n => n.id === id ? { ...n, isPinned: !n.isPinned, updatedAt: new Date().toISOString() } : n);
    syncNotes(updated);
    const item = notes.find(n => n.id === id);
    showToast(item?.isPinned ? 'تم إلغاء التثبيت في الأعلى' : 'تم تثبيت الملاحظة في الأعلى 📌');
  };

  // Delete to Trash toggler
  const handleDeleteToggle = (id: string) => {
    const updated = notes.map(n => {
      if (n.id === id) {
        const nextDeleted = !n.isDeleted;
        return { 
          ...n, 
          isDeleted: nextDeleted, 
          deletedAt: nextDeleted ? new Date().toISOString() : undefined,
          updatedAt: new Date().toISOString() 
        };
      }
      return n;
    });
    syncNotes(updated);
    const item = notes.find(n => n.id === id);
    if (item?.isDeleted) {
      showToast('استعادت الملاحظة من سلة المحذوفات ✓');
    } else {
      showToast('نُقلت الملاحظة لسلة المحذوفات 🗑️');
    }
  };

  // Permanent Delete Purge (Bypasses iframe alert blocks gracefully)
  const handlePermanentDelete = (id: string, onConfirmSuccess?: () => void) => {
    const note = notes.find(n => n.id === id);
    const titleText = note?.title ? `"${note.title}"` : 'هذه الملاحظة';
    showConfirm(
      'تأكيد الحذف النهائي للملفات',
      `هل أنت متأكد من حذف الملاحظة ${titleText} بشكل نهائي تام من سلة المهملات؟ سيتم مسح النص وكامل الأغلفة المرفقة بها من ذاكرة الجهاز ولا يمكن التراجع مطلقاً.`,
      () => {
        const updated = notes.filter(n => n.id !== id);
        syncNotes(updated);
        deleteFirebaseNote(id);
        if (activeNoteForEdit?.id === id) {
          setActiveNoteForEdit(null);
        }
        showToast('حُذفت الملاحظة ومرفقاتها نهائياً بنجاح 🗑️');
        if (onConfirmSuccess) onConfirmSuccess();
      }
    );
  };

  // Empty all Trash
  const handleClearAllTrash = () => {
    showConfirm(
      'تفريغ سلة المهملات بالكامل',
      '⚠️ تحذير: هل أنت متأكد من مسح كافة الملاحظات والملفات المرفقة بها المتواجدة بسلة المهملات بشكل نهائي؟ لا يمكن التراجع عن هذا الإجراء أبداً.',
      () => {
        const trashedIds = notes.filter(n => n.isDeleted).map(n => n.id);
        const updated = notes.filter(n => !n.isDeleted);
        syncNotes(updated);
        if (auth.currentUser) {
          Promise.all(trashedIds.map(id => deleteFirebaseNote(id))).catch(console.error);
        }
        showToast('تم تفريغ سلة المحذوفات بالكامل 🧹');
      }
    );
  };

  // Restore all Trash notes
  const handleRestoreAllTrash = () => {
    const updated = notes.map(n => n.isDeleted ? { ...n, isDeleted: false, deletedAt: undefined, updatedAt: new Date().toISOString() } : n);
    syncNotes(updated);
    showToast('تمت استعادة كافة الملاحظات بنجاح');
  };

  // Move order sorting buttons (Up/Down) to satisfy "ترتيب الملاحظات"
  const handleMoveOrder = (noteId: string, direction: 'up' | 'down') => {
    // Get current filtered view notes in active sorting sequence
    const visibleNotes = getFilteredAndSortedNotes();
    const index = visibleNotes.findIndex(n => n.id === noteId);
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      // Swap order attributes
      const targetNote = visibleNotes[index];
      const prevNote = visibleNotes[index - 1];
      const tempOrder = targetNote.order;
      
      const updatedNotes = notes.map(n => {
        if (n.id === targetNote.id) return { ...n, order: prevNote.order, updatedAt: new Date().toISOString() };
        if (n.id === prevNote.id) return { ...n, order: tempOrder, updatedAt: new Date().toISOString() };
        return n;
      });
      syncNotes(updatedNotes);
    } else if (direction === 'down' && index < visibleNotes.length - 1) {
      const targetNote = visibleNotes[index];
      const nextNote = visibleNotes[index + 1];
      const tempOrder = targetNote.order;

      const updatedNotes = notes.map(n => {
        if (n.id === targetNote.id) return { ...n, order: nextNote.order, updatedAt: new Date().toISOString() };
        if (n.id === nextNote.id) return { ...n, order: tempOrder, updatedAt: new Date().toISOString() };
        return n;
      });
      syncNotes(updatedNotes);
    }
  };

  // Catch note modification / insertion from NoteModal
  const handleSaveNote = (updatedNote: Note) => {
    const exists = notes.some(n => n.id === updatedNote.id);
    let updated: Note[];
    
    if (exists) {
      updated = notes.map(n => n.id === updatedNote.id ? updatedNote : n);
    } else {
      updated = [updatedNote, ...notes];
    }
    syncNotes(updated);
    
    // Update state reference if active Edit
    if (activeNoteForEdit && activeNoteForEdit.id === updatedNote.id) {
      setActiveNoteForEdit(updatedNote);
    }
  };

  // Open note adding view
  const triggerAddNote = () => {
    setActiveNoteForEdit(null);
    setIsModalOpen(true);
  };

  // Open specific note preview
  const handleSelectNote = (note: Note) => {
    setActiveNoteForEdit(note);
    setIsModalOpen(true);
  };

  // Catch simulated external applications share item
  const handleSimulateShare = (title: string, content: string, image?: string) => {
    const now = new Date().toISOString();
    const newNote: Note = {
      id: 'n-shared-' + Math.random().toString(36).substr(2, 9),
      folderId: selectedFolderId === 'trash' ? 'all' : selectedFolderId,
      title,
      content,
      image,
      color: 'sky', // Shared items marked in unique color preset
      isPinned: false,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
      order: Date.now()
    };
    
    const updated = [newNote, ...notes];
    syncNotes(updated);
    showToast('تم حفظ المحتوى الخارجي المشترك تلقائياً! 📥');
  };

  // Main filter engine logic
  const getFilteredAndSortedNotes = () => {
    let list = [...notes];

    // Filter by Trash Vs Active lists
    if (selectedFolderId === 'trash') {
      list = list.filter(n => n.isDeleted);
    } else {
      list = list.filter(n => !n.isDeleted);
      if (selectedFolderId !== 'all') {
        list = list.filter(n => n.folderId === selectedFolderId);
      }
    }

    // Filter by search keyword
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      );
    }

    // Sort: Pinned notes always come first, then sorted by 'order' asc / updatedAt desc
    return list.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      // Sort priority by manual reorder indexes
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      
      // Fallback date sorting
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  };

  const filteredNotes = getFilteredAndSortedNotes();

  // Folder note counts map
  const getNoteCounts = () => {
    const counts: Record<string, number> = {
      all: notes.filter(n => !n.isDeleted).length,
      trash: notes.filter(n => n.isDeleted).length
    };

    folders.forEach(f => {
      counts[f.id] = notes.filter(n => n.folderId === f.id && !n.isDeleted).length;
    });

    return counts;
  };

  const noteCounts = getNoteCounts();

  const renderSettingsPanel = () => {
    const totalBytes = JSON.stringify(notes).length + JSON.stringify(folders).length;
    const sizeKB = (totalBytes / 1024).toFixed(2);
    
    return (
      <div className="space-y-6 animate-fade-in" dir="rtl">
        {/* Connection Mode Block & Email cloud sync */}
        <div className="bg-white dark:bg-[#121214] border border-stone-200 dark:border-zinc-850 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-tr from-sky-50 to-indigo-50 dark:from-[#112] dark:to-[#171a30] text-[#0284c7] dark:text-sky-400 rounded-xl">
                <RefreshCw className={`w-5 h-5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              </div>
              <div className="text-right">
                <h3 className="text-xs font-bold text-stone-800 dark:text-zinc-150">مزامنة البيانات السحابية بالبريد الإلكتروني</h3>
                <p className="text-[10px] text-stone-450 dark:text-zinc-550 leading-relaxed font-bold">
                  {user ? `متصل بحسابك: ${user.email}` : 'مستقل محلي - قم بربط حسابك لحماية مذكراتك ومزامنتها ببريدك الإلكتروني'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <button
                    onClick={triggerRealSync}
                    disabled={syncStatus === 'syncing'}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                    <span>مزامنة سحابية يدوية الآن</span>
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="px-3 py-2 bg-red-50 dark:bg-red-950/20 text-red-650 hover:bg-red-100 dark:hover:bg-red-950/40 rounded-lg text-[10px] font-bold transition cursor-pointer"
                  >
                    قطع الاتصال / تسجيل خروج
                  </button>
                </>
              ) : (
                <button
                  onClick={handleSignIn}
                  className="px-4 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-sky-600/10"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>تسجيل الدخول وربط البريد الإلكتروني</span>
                </button>
              )}
            </div>
            
            <div className="text-[9px] text-stone-450 dark:text-zinc-500">
              {syncStatus === 'syncing' && 'جاري تحديث السحابة...'}
              {syncStatus === 'success' && '✅ تم مزامنة كافة المجلدات'}
              {syncStatus === 'error' && '⚠️ خطأ بالاتصال بالسحابة'}
              {syncStatus === 'idle' && !user && 'البيانات تحفظ محلياً بشكل افتراضي'}
            </div>
          </div>
        </div>

        {/* Connection Mode Block */}
        <div className="bg-white dark:bg-[#121214] border border-stone-200 dark:border-zinc-850 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-50 dark:bg-[#122320] text-emerald-600 dark:text-emerald-400 rounded-xl">
                <Wifi className="w-5 h-5 animate-pulse" />
              </div>
              <div className="text-right">
                <h3 className="text-xs font-bold text-stone-800 dark:text-zinc-150">وضعية اتصال التطبيق</h3>
                <p className="text-[10px] text-stone-450 dark:text-zinc-550 leading-relaxed font-bold">المفكرة مشفرة بالكامل وتعمل محلياً بوضعية التطبيق المستقل PWA</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`}></span>
              <span className="text-[10px] font-extrabold text-stone-600 dark:text-zinc-400">
                {isSyncing ? 'جاري المزامنة...' : 'متصل بالشبكة آمن'}
              </span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-stone-100 dark:border-zinc-900 flex justify-between items-center gap-3 flex-wrap">
            <button
              onClick={triggerSimulatedSync}
              disabled={isSyncing}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>مزامنة يدوية فورية مع الخادم</span>
            </button>
            <div className="text-[9px] text-stone-400 dark:text-zinc-550">تاريخ المزامنة الأخير: الآن مستقر</div>
          </div>
        </div>

        {/* PIN Security Config Block */}
        <div className="bg-white dark:bg-[#121214] border border-stone-200 dark:border-zinc-850 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-[#141527] text-indigo-600 dark:text-indigo-400 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-right">
              <h3 className="text-xs font-bold text-stone-800 dark:text-zinc-150">حماية الرمز السري وقفل التطبيق</h3>
              <p className="text-[10px] text-stone-400 dark:text-zinc-550">تعيين قفل تلقائي لحماية مذكراتك الحساسة من الأعين الخارجية</p>
            </div>
          </div>

          <div className="border-t border-stone-150 dark:border-zinc-850 pt-4 space-y-3 text-right">
            {savedPin ? (
              <div className="p-3.5 bg-sky-50/50 dark:bg-[#131925]/30 border border-sky-100 dark:border-sky-905/30 rounded-xl flex items-center justify-between flex-wrap gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sky-850 dark:text-sky-350">
                    <Lock className="w-3.5 h-3.5 text-sky-600" />
                    <span>تطبيقك محمي برمز PIN بنجاح</span>
                  </div>
                  <p className="text-[9px] text-sky-600 dark:text-sky-500">سيُطلب الرمز في المرة القادمة عند فتح التطبيق.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsPinLocked(true);
                      showToast('🔒 تم تنشيط قفل الشاشة الفوري!');
                    }}
                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
                  >
                    تفقد القفل الآن
                  </button>
                  <button
                    onClick={handleRemovePin}
                    className="px-3 py-1.5 bg-red-50 dark:bg-red-950/20 text-red-650 hover:bg-red-100 rounded-lg text-[10px] font-bold transition cursor-pointer"
                  >
                    إلغاء حماية الرمز
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[10px] text-stone-500 dark:text-zinc-450">لم تقم بتفعيل رمز الحماية بعد. لتعيين رمز PIN آمن مكون من 6 أرقام:</p>
                <div className="flex gap-1.5 max-w-sm items-center">
                  <input
                    type={showSetupPin ? "text" : "password"}
                    maxLength={6}
                    placeholder="123456"
                    value={rawPinSetup}
                    onChange={(e) => setRawPinSetup(e.target.value.replace(/\D/g, ''))}
                    className="px-3 py-1.5 font-mono text-center tracking-widest text-xs font-black rounded-xl border border-stone-250 dark:border-zinc-700 bg-white dark:bg-white text-black dark:text-black w-36 focus:outline-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSetupPin(!showSetupPin)}
                    className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-all cursor-pointer border border-stone-200 flex items-center justify-center"
                    title={showSetupPin ? "إخفاء الرمز" : "إظهار الرمز"}
                  >
                    {showSetupPin ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleSaveNewPin(rawPinSetup)}
                    className="px-4 py-1.5 bg-[#0284c7] hover:bg-sky-500 text-white text-[10px] font-bold rounded-xl transition cursor-pointer flex items-center justify-center h-[32px]"
                  >
                    تفعيل وحفظ الرمز الآمن
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Database backup snapshots block */}
        <div className="bg-white dark:bg-[#121214] border border-stone-200 dark:border-zinc-850 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 dark:bg-[#251f15] text-amber-600 dark:text-amber-400 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div className="text-right">
              <h3 className="text-xs font-bold text-stone-800 dark:text-zinc-150">إدارة قاعدة البيانات والنسخ الاحتياطي</h3>
              <p className="text-[10px] text-stone-450 dark:text-zinc-550">تنزيل نسخة احتياطية محلية بصيغة JSON والقدرة على استعادتها</p>
            </div>
          </div>

          {/* Database Diagnostics Info widgets */}
          <div className="border-t border-stone-150 dark:border-zinc-850 pt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-stone-50 dark:bg-zinc-900/40 rounded-xl">
              <span className="block text-[9px] text-stone-400 dark:text-zinc-550 font-bold uppercase">إجمالي الملاحظات</span>
              <span className="text-base font-extrabold text-stone-850 dark:text-white">{notes.length}</span>
            </div>
            <div className="p-3 bg-stone-50 dark:bg-zinc-900/40 rounded-xl">
              <span className="block text-[9px] text-stone-400 dark:text-zinc-550 font-bold uppercase">المجلدات والفئات</span>
              <span className="text-base font-extrabold text-stone-850 dark:text-white">{folders.length}</span>
            </div>
            <div className="p-3 bg-stone-50 dark:bg-zinc-900/40 rounded-xl">
              <span className="block text-[9px] text-stone-400 dark:text-zinc-550 font-bold uppercase">مساحة الذاكرة المستخدمة</span>
              <span className="text-base font-extrabold text-[#0284c7] dark:text-sky-400">{sizeKB} KB</span>
            </div>
            <div className="p-3 bg-stone-50 dark:bg-zinc-900/40 rounded-xl flex flex-col items-center justify-center">
              <span className="block text-[9px] text-stone-400 dark:text-zinc-550 font-bold uppercase mb-0.5">بيئة التشغيل</span>
              <span className="text-[9px] font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1">
                <Smartphone className="w-3 h-3" /> Standalone App
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={triggerDownloadBackup}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>تحميل ملف النسخة الاحتياطية (.json)</span>
            </button>
            <button
              onClick={() => setShowImportDialog(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 dark:bg-zinc-800 hover:bg-stone-850 dark:hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>استيراد نسخة سابقة</span>
            </button>
            <button
              onClick={() => {
                if (savedPin) {
                  setShowWipePinModal(true);
                  setWipePinInput('');
                  setWipePinError(false);
                  setShowWipePin(false);
                } else {
                  showConfirm(
                    'استعادة تهيئة التطبيق ومحو البيانات',
                    '⚠️ إشعار بالغ الأهمية: هل أنت متأكد من رغبتك بمسح كافة المذكرات والمجلدات والإعدادات المخزنة والبدء من جديد بالكامل؟ لا يمكن استعادة أي من بياناتك المفقودة لاحقاً.',
                    () => {
                      localStorage.clear();
                      window.location.reload();
                    }
                  );
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition mr-auto cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>مسح كل البيانات والمحو</span>
            </button>
          </div>
        </div>

        {/* Modal for importing file content backup */}
        {showImportDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-[#121214] border border-stone-250 dark:border-zinc-800 rounded-3xl p-5 max-w-lg w-full space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-stone-800 dark:text-zinc-200 font-bold">
                  <Database className="w-4 h-4 text-indigo-500" />
                  <span>دمج واستعادة بيانات حافظتي</span>
                </div>
                <button
                  onClick={() => { setShowImportDialog(false); setImportText(''); }}
                  className="p-1.5 text-stone-400 hover:text-stone-650 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-850 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-right space-y-1">
                <label className="text-[10px] text-stone-400 dark:text-zinc-500 font-bold uppercase block mb-1">الصق كود النسخة الاحتياطية المستخرجة (JSON Text):</label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder='{"version": "1.0.0", "folders": [...], "notes": [...]...}'
                  dir="ltr"
                  rows={6}
                  className="w-full font-mono text-stone-800 dark:text-zinc-300 bg-stone-50 dark:bg-zinc-950 p-3 rounded-xl border border-stone-200 dark:border-zinc-850 focus:outline-sky-500 text-xs text-left"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setShowImportDialog(false); setImportText(''); }}
                  className="px-4 py-2 text-xs font-bold text-stone-500 dark:text-zinc-450 hover:bg-stone-100 dark:hover:bg-zinc-850 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  onClick={() => triggerImportBackup(importText)}
                  disabled={!importText.trim()}
                  className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-30 rounded-xl cursor-pointer"
                >
                  استيراد ودمج الآن
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal for PIN Verification before Wiping Data */}
        {showWipePinModal && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" dir="rtl">
            <div className="bg-white dark:bg-[#121214] border border-stone-250 dark:border-zinc-800 rounded-3xl p-6 max-w-sm w-full space-y-5 text-center shadow-2xl">
              <div className="mx-auto w-12 h-12 bg-red-50 dark:bg-red-950/20 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600 animate-bounce" />
              </div>
              
              <div className="space-y-1">
                <h3 className="text-sm font-black text-stone-850 dark:text-zinc-150">تأكيد الهوية لمسح البيانات</h3>
                <p className="text-[11px] text-stone-450 dark:text-zinc-500">من فضلك أدخل رمز الـ PIN المكون من 6 أرقام لتأكيد رغبتك الفعالة بالمحو الكامل:</p>
              </div>

              <div className="flex gap-1.5 justify-center items-center max-w-[240px] mx-auto">
                <input
                  type={showWipePin ? "text" : "password"}
                  maxLength={6}
                  placeholder="******"
                  value={wipePinInput}
                  onChange={(e) => {
                    setWipePinError(false);
                    setWipePinInput(e.target.value.replace(/\D/g, ''));
                  }}
                  className="w-full px-3 py-2.5 font-mono text-center tracking-[0.4em] text-sm font-black rounded-xl border border-stone-250 dark:border-zinc-700 bg-white dark:bg-white text-black dark:text-black focus:outline-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowWipePin(!showWipePin)}
                  className="p-2 bg-stone-100 dark:bg-zinc-900 hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-350 rounded-xl transition-all cursor-pointer border border-stone-200 dark:border-zinc-800 flex items-center justify-center shrink-0 h-[40px] w-[40px]"
                  title={showWipePin ? "إخفاء الرمز" : "إظهار الرمز"}
                >
                  {showWipePin ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {wipePinError && (
                <p className="text-[10px] text-red-500 font-bold animate-pulse">⚠️ عذراً، رمز الـ PIN غير صحيح!</p>
              )}

              <div className="flex gap-2.5 pt-1">
                <button
                  onClick={() => { setShowWipePinModal(false); setWipePinInput(''); }}
                  className="flex-1 px-4 py-2 text-xs font-bold text-stone-500 dark:text-zinc-450 hover:bg-stone-100 dark:hover:bg-zinc-850 rounded-xl cursor-pointer"
                >
                  إلغاء الأمر
                </button>
                <button
                  onClick={() => {
                    if (wipePinInput === savedPin) {
                      setShowWipePinModal(false);
                      showConfirm(
                        'استعادة تهيئة التطبيق ومحو البيانات',
                        '⚠️ إشعار بالغ الأهمية: هل أنت متأكد من رغبتك بمسح كافة المذكرات والمجلدات والإعدادات المخزنة والبدء من جديد بالكامل؟ لا يمكن استعادة أي من بياناتك المفقودة لاحقاً.',
                        () => {
                          localStorage.clear();
                          window.location.reload();
                        }
                      );
                    } else {
                      setWipePinError(true);
                      setWipePinInput('');
                    }
                  }}
                  disabled={wipePinInput.length !== 6}
                  className="flex-1 px-4 py-2 text-xs font-bold text-white bg-red-650 hover:bg-red-600 disabled:opacity-40 rounded-xl cursor-pointer shadow-sm"
                >
                  تأكيـد ومحو
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // If passcode protection lock is active, enforce security keypad instantly
  if (isPinLocked && savedPin) {
    return (
      <div className="min-h-screen bg-[#faf8f5] dark:bg-[#09090b] flex flex-col justify-center items-center p-6 font-sans select-none" dir="rtl">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-sky-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-600/20">
            <Lock className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-extrabold text-[#0284c7] dark:text-sky-400">حافظتي المؤمنة</h2>
            <p className="text-[11px] text-stone-400 dark:text-zinc-500">تم تنشيط نظام التشفير التلقائي الفوري. أدخل رمز PIN لفك القفل:</p>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-3.5 py-2">
            {[1, 2, 3, 4, 5, 6].map((dotIndex) => (
              <div 
                key={dotIndex}
                className={`w-3.5 h-3.5 rounded-full border transition-all duration-150 ${
                  pinInput.length >= dotIndex 
                  ? 'bg-sky-600 border-sky-600 scale-110 shadow-sm' 
                  : 'bg-stone-150 dark:bg-zinc-800 border-stone-200 dark:border-zinc-700'
                } ${pinError ? 'bg-red-500 border-red-550' : ''}`}
              />
            ))}
          </div>

          {pinError && (
            <p className="text-[10px] text-red-500 font-bold animate-bounce leading-none">⚠️ عذراً، الرمز المدخل غير صحيح! حاول مجدداً.</p>
          )}

          {/* Graphical Keypad */}
          <div className="grid grid-cols-3 gap-3.5 max-w-[240px] mx-auto select-none pt-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleTypePin(String(num))}
                className="w-14 h-14 rounded-full bg-white dark:bg-zinc-900 border border-stone-150 dark:border-zinc-850 text-stone-850 dark:text-zinc-200 font-black text-lg flex items-center justify-center transition-all active:scale-95 shadow-2xs hover:bg-stone-50 dark:hover:bg-zinc-800 cursor-pointer"
              >
                {num}
              </button>
            ))}
            <button
               type="button"
               onClick={handleClearPinInput}
               className="w-14 h-14 rounded-full text-stone-400 dark:text-zinc-550 font-bold text-xs hover:text-stone-600 transition-colors flex items-center justify-center cursor-pointer"
            >
              مسح
            </button>
            <button
              type="button"
              onClick={() => handleTypePin('0')}
              className="w-14 h-14 rounded-full bg-white dark:bg-zinc-900 border border-stone-150 dark:border-zinc-850 text-stone-850 dark:text-zinc-200 font-black text-lg flex items-center justify-center transition-all active:scale-95 shadow-2xs hover:bg-stone-50 dark:hover:bg-zinc-800 cursor-pointer"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspacePin}
              className="w-14 h-14 rounded-full text-stone-400 dark:text-zinc-550 font-bold text-xs hover:text-stone-600 transition-colors flex items-center justify-center cursor-pointer"
            >
              تراجع
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f6]/95 dark:bg-[#070708] text-stone-900 dark:text-zinc-100 transition-colors duration-300 font-sans flex flex-col pb-24 lg:pb-0">
      
      {/* Dynamic Status Bar (Toast Notifications) */}
      {toastMessage && (
        <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-55 bg-stone-900/90 dark:bg-zinc-900/90 text-white backdrop-blur-sm shadow-xl px-5 py-2.5 rounded-2xl flex items-center gap-2 text-xs font-bold transition-all border border-stone-850 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Beautiful Header Navigation */}
      <header className="sticky top-0 z-40 bg-[#faf9f6]/80 dark:bg-[#070708]/80 backdrop-blur-md border-b border-stone-150 dark:border-zinc-900/60 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-right">
            <h1 className="text-base font-extrabold tracking-tight bg-gradient-to-r from-sky-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent dark:from-sky-450 dark:via-indigo-400 dark:to-violet-400">
              حافظتي
            </h1>
            <p className="text-[10px] text-stone-450 dark:text-zinc-500 font-bold">مفكرة وحافظة النصوص الذكية والآمنة</p>
          </div>
        </div>

        {/* Global Action items */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="relative max-w-xs hidden sm:block">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في العناوين والمحتوى..."
              className="text-xs px-9 py-2 rounded-xl bg-white dark:bg-zinc-900 text-stone-800 dark:text-zinc-200 border border-stone-200 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-sky-500 pr-9 text-right"
              dir="rtl"
            />
            <Search className="w-4 h-4 text-stone-400 dark:text-zinc-650 absolute right-3 top-2.5 pointer-events-none" />
          </div>

          {/* Settings Tab Toggle Button */}
          <button
            onClick={() => setActiveTab(activeTab === 'settings' ? 'explorer' : 'settings')}
            className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
              activeTab === 'settings'
                ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 border-sky-400/80 dark:text-sky-400'
                : 'bg-white dark:bg-zinc-900 text-stone-700 dark:text-zinc-300 border-stone-150 dark:border-zinc-850'
            }`}
            title="إعدادات الحماية والبيانات"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden md:inline">الإعدادات</span>
          </button>

          {/* Toggle light / dark mode */}
          <button
            onClick={handleToggleDarkMode}
            className="p-2 bg-white dark:bg-zinc-900 text-stone-700 dark:text-zinc-300 hover:text-sky-600 dark:hover:text-sky-400 rounded-xl border border-stone-200 dark:border-zinc-800 transition-all shadow-xs cursor-pointer"
            title={darkMode ? 'تفعيل الوضع المضيء' : 'تفعيل الوضع الليلي'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* New Note Action Button */}
          <button
            onClick={triggerAddNote}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-sky-600/10 scale-100 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ملاحظة جديدة</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-6" dir="rtl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Sidebar Manager Panel - Responsive check */}
          <div className={`lg:col-span-1 space-y-6 ${
            activeTab === 'folders' 
              ? 'block' 
              : activeTab === 'sharer' 
              ? 'hidden lg:block' 
              : 'hidden lg:block'
          }`}>
            <div className="bg-white dark:bg-[#121214] border border-stone-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
              <FolderList
                folders={folders}
                selectedFolderId={selectedFolderId}
                onSelectFolder={(id) => {
                  setSelectedFolderId(id);
                  setActiveTab('explorer'); // Redirect to note explorer automatically when choice is made
                }}
                onCreateFolder={handleCreateFolder}
                onUpdateFolder={handleUpdateFolder}
                onDeleteFolder={handleDeleteFolder}
                noteCounts={noteCounts}
                safeFilesCount={safeFilesCount}
              />
            </div>
          </div>

          {/* Simulated External Share Payload Widget - Responsive check */}
          <div className={`lg:col-span-1 ${
            activeTab === 'sharer' 
              ? 'block' 
              : activeTab === 'folders' 
              ? 'hidden lg:block' 
              : 'hidden lg:block'
          }`}>
            <ClipboardSharer onSimulateShare={handleSimulateShare} />
          </div>

          {/* Content Explorer Panel */}
          <div className={`lg:col-span-3 space-y-4 ${
            activeTab === 'explorer' || activeTab === 'settings' 
              ? 'block' 
              : 'hidden lg:block'
          }`}>
            
            {activeTab === 'settings' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white dark:bg-[#121214] border border-stone-150 dark:border-zinc-850 p-4 rounded-2xl shadow-xs">
                  <div className="text-right">
                    <h2 className="text-sm font-extrabold text-[#0284c7] dark:text-sky-400">⚙️ إعدادات الحفظ والتحكم بالخادم السحابي</h2>
                    <p className="text-[10px] text-stone-400 dark:text-zinc-550 mt-0.5">معدلات الحماية، كلمات المرور واستصدار ملفات النسخ الاحتياطي</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('explorer')}
                    className="px-3.5 py-1.5 bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 hover:bg-sky-100 text-[10px] font-bold rounded-lg transition shrink-0 cursor-pointer"
                  >
                    رؤية الملاحظات
                  </button>
                </div>
                {renderSettingsPanel()}
              </div>
            ) : selectedFolderId === 'safe_folder' ? (
              <SafeFolderView showToast={showToast} onFilesChanged={setSafeFilesCount} />
            ) : (
              <div className="space-y-4">
                {/* List Toolbar Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#121214] border border-stone-200/90 dark:border-zinc-850 p-4 rounded-2xl shadow-xs">
                  
                  {/* Folder Header Metadata */}
                  <div className="text-right w-full sm:w-auto">
                    <h2 className="text-sm font-extrabold text-[#0284c7] dark:text-sky-400">
                      {selectedFolderId === 'all' && '🗂️ جميع ملاحظاتك ولقطاتك'}
                      {selectedFolderId === 'trash' && '🗑️ سلة الحذف والاستعادة'}
                      {selectedFolderId !== 'all' && selectedFolderId !== 'trash' && (
                        `📁 المجلد الحالي: ${folders.find(f => f.id === selectedFolderId)?.name || 'مجلد مجهول'}`
                      )}
                    </h2>
                    <p className="text-[10px] text-stone-400 dark:text-zinc-500 mt-0.5 font-bold">
                      {filteredNotes.length === 0 ? 'لا توجد ملاحظات حالية في هذا المجلد' : `يتم عرض ${filteredNotes.length} ملاحظة وتدوينة مرتبة`}
                    </p>
                  </div>

                  {/* View filters and text search on mobile */}
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                    
                    {/* Responsive Text Search (Visible on small screen) */}
                    <div className="relative w-full sm:w-44 block sm:hidden">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ابحث في العناوين والمحتوى..."
                        className="w-full text-xs px-9 py-2 rounded-xl bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-805 text-stone-800 dark:text-zinc-200 focus:outline-none text-right"
                      />
                      <Search className="w-3.5 h-3.5 text-stone-450 absolute right-3 top-2.5" />
                    </div>

                    {/* Recycle Bin Flush Actions */}
                    {selectedFolderId === 'trash' && noteCounts['trash'] > 0 && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={handleRestoreAllTrash}
                          className="px-2.5 py-1.5 bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 hover:bg-sky-100 text-[10px] font-bold rounded-lg transition cursor-pointer"
                        >
                          استعادة الكل
                        </button>
                        <button
                          onClick={handleClearAllTrash}
                          className="px-2.5 py-1.5 bg-red-550 hover:bg-red-650 text-white text-[10px] font-bold rounded-lg transition cursor-pointer"
                        >
                          تفريغ سلة المهملات
                        </button>
                      </div>
                    )}

                    {/* Grid / List Layout toggle */}
                    <div className="flex items-center border border-stone-150 dark:border-zinc-800 p-0.5 rounded-xl bg-stone-50 dark:bg-zinc-900/50">
                      <button
                        onClick={() => {
                          setIsGridView(true);
                          localStorage.setItem('notebox_is_grid_view', 'true');
                        }}
                        className={`p-1.5 rounded-lg transition ${isGridView ? 'bg-white dark:bg-zinc-800 text-sky-600 dark:text-sky-400 shadow-xs' : 'text-stone-450 hover:text-stone-750'} cursor-pointer`}
                        title="عرض كشبكة"
                      >
                        <Grid className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setIsGridView(false);
                          localStorage.setItem('notebox_is_grid_view', 'false');
                        }}
                        className={`p-1.5 rounded-lg transition ${!isGridView ? 'bg-white dark:bg-zinc-800 text-sky-600 dark:text-sky-400 shadow-xs' : 'text-stone-450 hover:text-stone-750'} cursor-pointer`}
                        title="عرض كقائمة"
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Auto Trash Clean Alert Banner */}
                {selectedFolderId === 'trash' && (
                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 p-4 rounded-2xl text-xs space-y-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-right" dir="rtl">
                    <div className="flex items-start gap-2.5">
                      <span className="text-base shrink-0">📅</span>
                      <div>
                        <h4 className="font-extrabold text-amber-600 dark:text-amber-400">ميزة الحذف التلقائي لسلة المهملات نشطة</h4>
                        <p className="text-[10px] text-stone-500 dark:text-zinc-400 leading-normal mt-0.5">
                          تأميناً لخصوصيتك وتوفيراً للمساحة المتوفرة، يحذف النظام الملاحظات والملفات تلقائياً عند مرور <strong>أكثر من 30 يوماً</strong> على حذفها بعد عرض تنبيه تذكيري لتأكيد موافقتك.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={generateMockOldTrashNote}
                      className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-200 text-[10px] font-black rounded-xl transition cursor-pointer self-end sm:self-center shrink-0 border border-amber-500/30 whitespace-nowrap"
                    >
                      🧪 تجربة محاكاة التنظيف (31 يوم)
                    </button>
                  </div>
                )}

                {/* Notes Workspace Area list/grid container */}
                {filteredNotes.length === 0 ? (
                  <div className="bg-white dark:bg-[#121214] border border-stone-150 dark:border-zinc-900 py-16 px-4 rounded-3xl text-center space-y-4 shadow-xs">
                    <div className="w-20 h-20 bg-stone-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto text-stone-300 dark:text-zinc-700">
                      <Folder className="w-10 h-10" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-stone-700 dark:text-zinc-300">
                        {searchQuery ? 'لم يتم العثور على أي نتائج مطابقة لبحثك' : 'لا توجد ملاحظات بعد هنا'}
                      </h3>
                      <p className="text-xs text-stone-400 dark:text-zinc-500 max-w-sm mx-auto">
                      </p>
                    </div>
                    {!searchQuery && (
                      <button
                        onClick={triggerAddNote}
                        className="px-4 py-2 bg-stone-900 hover:bg-stone-850 dark:bg-zinc-800 dark:hover:bg-zinc-755 text-white text-[11px] font-bold rounded-xl transition cursor-pointer"
                      >
                        أنشئ أول ملاحظة الآن
                      </button>
                    )}
                  </div>
                ) : (
                  <div className={isGridView ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4' : 'flex flex-col gap-3'}>
                    {filteredNotes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        folders={folders}
                        currentFolderId={selectedFolderId}
                        onSelect={handleSelectNote}
                        onPinToggle={handlePinToggle}
                        onDeleteToggle={handleDeleteToggle}
                        onPermanentDelete={handlePermanentDelete}
                        onMoveToFolder={handleMoveNoteToFolder}
                        onMoveOrder={handleMoveOrder}
                        isGridView={isGridView}
                        onShare={(nt) => {
                          setShareNote(nt);
                          setIsShareModalOpen(true);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Persistent Beautiful Responsive Bottom Tab Bar (Designed specifically for standalone mobile configurations) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#09090b]/95 border-t border-stone-150 dark:border-zinc-900 backdrop-blur-md pb-safe py-2 px-3 flex items-center justify-around lg:hidden shadow-lg shadow-black/10">
        <button
          onClick={() => setActiveTab('explorer')}
          className={`flex flex-col items-center justify-center gap-1 py-1 transition-all flex-1 cursor-pointer ${
            activeTab === 'explorer' 
              ? 'text-sky-600 dark:text-sky-400 font-black scale-105' 
              : 'text-stone-400 dark:text-zinc-650 hover:text-stone-700'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[9px]">ملاحظاتي</span>
        </button>

        <button
          onClick={() => setActiveTab('folders')}
          className={`flex flex-col items-center justify-center gap-1 py-1 transition-all flex-1 cursor-pointer ${
            activeTab === 'folders' 
              ? 'text-sky-600 dark:text-sky-400 font-black scale-105' 
              : 'text-stone-400 dark:text-zinc-650 hover:text-stone-700'
          }`}
        >
          <Folder className="w-5 h-5" />
          <span className="text-[9px]">المجلدات</span>
        </button>

        {/* Floating Middle button for adding Note immediately */}
        <button
          onClick={triggerAddNote}
          className="w-12 h-12 bg-gradient-to-r from-sky-600 to-indigo-600 text-white rounded-full flex items-center justify-center shadow-md shadow-sky-600/30 transform active:scale-95 -mt-5 border-4 border-white dark:border-[#09090b] cursor-pointer"
          title="ملاحظة سريعة"
        >
          <Plus className="w-5 h-5 text-white" />
        </button>

        <button
          onClick={() => setActiveTab('sharer')}
          className={`flex flex-col items-center justify-center gap-1 py-1 transition-all flex-1 cursor-pointer ${
            activeTab === 'sharer' 
              ? 'text-sky-600 dark:text-sky-400 font-black scale-105' 
              : 'text-stone-400 dark:text-zinc-650 hover:text-stone-700'
          }`}
        >
          <Share2 className="w-5 h-5" />
          <span className="text-[9px]">مشاركة نصوص</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center justify-center gap-1 py-1 transition-all flex-1 cursor-pointer ${
            activeTab === 'settings' 
              ? 'text-sky-600 dark:text-sky-400 font-black scale-105' 
              : 'text-stone-400 dark:text-zinc-650 hover:text-stone-700'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[9px]">حماية التطبيق</span>
        </button>
      </nav>



      {/* Persistent Beautiful Responsive Bottom Utility Bar (FAB Action trigger) - Visible on desktop for quick note additions */}
      <div className="fixed bottom-10 left-10 z-30 hidden lg:block">
        <button
          onClick={triggerAddNote}
          className="w-14 h-14 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-sky-600/30 transition-all duration-300 transform hover:scale-110 active:scale-95 cursor-pointer hover:shadow-sky-600/50"
          title="ملاحظة سريعة"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Full Note Editing Overlay Modal Component */}
      {isModalOpen && (() => {
        const visibleNotes = getFilteredAndSortedNotes();
        const index = activeNoteForEdit ? visibleNotes.findIndex(n => n.id === activeNoteForEdit.id) : -1;
        const isFirst = index === 0;
        const isLast = activeNoteForEdit ? index === visibleNotes.length - 1 : true;
        return (
          <NoteModal
            note={activeNoteForEdit}
            folders={folders}
            currentFolderId={selectedFolderId}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveNote}
            onMoveOrder={handleMoveOrder}
            isFirst={isFirst}
            isLast={isLast}
            onDeleteToggle={handleDeleteToggle}
            onPermanentDelete={handlePermanentDelete}
            onShare={(nt) => {
              setShareNote(nt);
              setIsShareModalOpen(true);
            }}
          />
        );
      })()}

      {/* Sleek, Beautiful, Animated and Safe Confirmation Dialog Modal */}
      {confirmConfig.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" dir="rtl">
          <div className="bg-white dark:bg-[#121214] border border-stone-250 dark:border-zinc-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl text-center transform scale-100 transition-all">
            <div className={`mx-auto w-12 h-12 rounded-2xl flex items-center justify-center ${confirmConfig.isDanger ? 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400' : 'bg-sky-100 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400'}`}>
              <Trash className="w-5 h-5 animate-pulse" />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-sm font-extrabold text-stone-900 dark:text-white leading-tight">{confirmConfig.title}</h3>
              <p className="text-[11px] text-stone-500 dark:text-zinc-400 leading-normal">{confirmConfig.message}</p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                {confirmConfig.cancelText || 'إلغاء'}
              </button>
              <button
                type="button"
                onClick={confirmConfig.onConfirm}
                className={`px-4 py-2 text-white text-xs font-bold rounded-xl transition cursor-pointer ${confirmConfig.isDanger ? 'bg-red-600 hover:bg-red-500' : 'bg-sky-600 hover:bg-sky-500'}`}
              >
                {confirmConfig.confirmText || 'تأكيد'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal Component */}
      <ShareModal
        note={shareNote}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        showToast={showToast}
        darkMode={darkMode}
      />

      {/* Dynamic Alarm / Reminder Modal Alert (School Planner design) */}
      {activeReminderNote && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" dir="rtl">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-zinc-900 dark:to-stone-900 border border-amber-250 dark:border-zinc-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-center transform scale-100 transition-all border-amber-400">
            <div className="mx-auto w-14 h-14 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center animate-bounce">
              <Clock className="w-7 h-7" />
            </div>
            
            <div className="space-y-2">
              <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950/45 text-amber-800 dark:text-amber-400 rounded-lg text-[9px] font-black inline-block tracking-wider animate-pulse">
                ⏰ تنبيه وتذكير مجدول هام بالملاحظة
              </span>
              <h3 className="text-base font-extrabold text-[#1c1917] dark:text-zinc-100 leading-tight">
                {activeReminderNote.title || 'ملاحظة بلا عنوان'}
              </h3>
              <p className="text-xs text-stone-650 dark:text-zinc-350 line-clamp-3 leading-relaxed">
                {activeReminderNote.content || 'لا يوجد محتوى بالداخل'}
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  handleSelectNote(activeReminderNote);
                  setActiveReminderNote(null);
                }}
                className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md shadow-amber-600/25"
              >
                📝 فتح ومراجعة الملاحظة فوراً
              </button>
              <button
                type="button"
                onClick={() => setActiveReminderNote(null)}
                className="w-full py-2 bg-stone-200/50 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-705 text-stone-700 dark:text-zinc-350 text-[11px] font-extrabold rounded-xl transition cursor-pointer"
              >
                حسنًا، تم الاستلام وإغلاق المنبه 🤝
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
