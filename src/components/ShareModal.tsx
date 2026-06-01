import React, { useState, useEffect, useRef } from 'react';
import { Note, PRESET_COLORS } from '../types';
import { 
  X, Share2, Clipboard, Image as ImageIcon, Download, Check, 
  ExternalLink, Sparkles, Sliders, Calendar, ChevronLeft, Award,
  Send, Mail, MessageCircle
} from 'lucide-react';

interface ShareModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string) => void;
  darkMode: boolean;
}

// Background preset options specifically for the exported image card
const IMAGE_BG_PRESETS = [
  { name: 'افتراضي المذكرة', value: 'preset' },
  { name: 'تدرج سماوي غامر', value: 'gradient-sky', css: 'bg-gradient-to-br from-cyan-500 to-blue-600' },
  { name: 'تدرج أرجواني فاخر', value: 'gradient-purple', css: 'bg-gradient-to-br from-fuchsia-600 to-indigo-600' },
  { name: 'تدرج غروب شمس ناعم', value: 'gradient-sunset', css: 'bg-gradient-to-br from-amber-400 via-pink-500 to-purple-600' },
  { name: 'تدرج ليموني منعش', value: 'gradient-mint', css: 'bg-gradient-to-br from-emerald-400 to-sky-500' },
  { name: 'فحم داكن مهيب', value: 'dark-slate', css: 'bg-[#121214]' }
];

export default function ShareModal({ note, isOpen, onClose, showToast, darkMode }: ShareModalProps) {
  // --- 1. React State Hooks ---
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const [copiedText, setCopiedText] = useState(false);
  const [selectedBg, setSelectedBg] = useState('preset');
  const [cardThemeMode, setCardThemeMode] = useState<'light' | 'dark'>(darkMode ? 'dark' : 'light');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // --- 2. Ref Hook ---
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // --- 3. High-DPI Canvas Rendering function (Must be defined before useEffect referencing it) ---
  const generateImageCard = async (downloadImmediately = false) => {
    if (!note) return;
    setIsGeneratingImage(true);
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not create canvas context');

      // 1. Calculate height dynamically based on content length
      const cardWidth = 800;
      const contentWidth = 720;
      
      // Setup temporary context to measure text sizes
      ctx.font = '22px Inter, system-ui, sans-serif';
      
      const words = (note.content || 'لا يوجد محتوى نصي...').split(/(\s+)/);
      const lines: string[] = [];
      let currentLine = '';

      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        if (word.includes('\n')) {
          const subWords = word.split('\n');
          for (let j = 0; j < subWords.length; j++) {
            if (j > 0) {
              lines.push(currentLine);
              currentLine = subWords[j];
            } else {
              const testLine = currentLine + subWords[j];
              const metrics = ctx.measureText(testLine);
              if (metrics.width > contentWidth) {
                lines.push(currentLine);
                currentLine = subWords[j];
              } else {
                currentLine = testLine;
              }
            }
          }
        } else {
          const testLine = currentLine + word;
          const metrics = ctx.measureText(testLine);
          if (metrics.width > contentWidth && currentLine !== '') {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
      }
      if (currentLine) lines.push(currentLine);

      // Measure total components height
      let totalHeight = 0;
      const isWithCover = !!note.image;
      
      const coverHeight = isWithCover ? 340 : 0;
      const titleHeight = 85; 
      const contentHeight = lines.length * 36;
      const footerHeight = 100;
      
      totalHeight = coverHeight + titleHeight + contentHeight + footerHeight + 110; // margin padding
      
      // Ensure a reasonable minimum height
      if (totalHeight < 600) totalHeight = 600;

      // 2. High-DPI setup (Retina looks crisp!)
      const scale = 2; // scale factor
      canvas.width = cardWidth * scale;
      canvas.height = totalHeight * scale;
      ctx.scale(scale, scale);

      // 3. Clear Canvas / Draw backgrounds
      // Let's resolve Background fill
      let fillStyle: any = '#ffffff';
      let textColor = '#1c1917';
      let titleColor = '#0c0a09';
      let subTextColor = '#78716c';
      let metaPanelStyle = '#f5f5f4';
      let isDarkLayout = cardThemeMode === 'dark';

      if (isDarkLayout) {
        fillStyle = '#121214';
        textColor = '#d4d4d8';
        titleColor = '#ffffff';
        subTextColor = '#71717a';
        metaPanelStyle = '#18181b';
      }

      // Draw Base Inner card
      ctx.fillStyle = fillStyle;
      ctx.fillRect(0, 0, cardWidth, totalHeight);

      // If presets gradient background is selected, draw outer margins style
      if (selectedBg !== 'preset') {
        // Draw Outer Frame Box
        ctx.fillStyle = fillStyle;
        ctx.fillRect(0, 0, cardWidth, totalHeight);
        
        // Draw decorative subtle background on canvas top right
        const gradient = ctx.createLinearGradient(0, 0, cardWidth, totalHeight);
        if (selectedBg === 'gradient-sky') {
          gradient.addColorStop(0, '#06b6d4');
          gradient.addColorStop(1, '#2563eb');
        } else if (selectedBg === 'gradient-purple') {
          gradient.addColorStop(0, '#d946ef');
          gradient.addColorStop(1, '#4f46e5');
        } else if (selectedBg === 'gradient-sunset') {
          gradient.addColorStop(0, '#f59e0b');
          gradient.addColorStop(0.5, '#ec4899');
          gradient.addColorStop(1, '#7c3aed');
        } else if (selectedBg === 'gradient-mint') {
          gradient.addColorStop(0, '#34d399');
          gradient.addColorStop(1, '#0284c7');
        } else if (selectedBg === 'dark-slate') {
          gradient.addColorStop(0, '#18181b');
          gradient.addColorStop(1, '#09090b');
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, cardWidth, totalHeight);

        // Render shadow frame container inside
        ctx.fillStyle = fillStyle;
        ctx.beginPath();
        ctx.roundRect(32, 32, cardWidth - 64, totalHeight - 64, 28);
        ctx.fill();
        ctx.clip(); // Restricts drawing to inside the cardboard wrapper
      }

      // 4. Draw Cover Image if any
      const topOffset = selectedBg !== 'preset' ? 32 : 0;
      const horizontalPadding = selectedBg !== 'preset' ? 32 : 0;
      const drawableWidth = cardWidth - (horizontalPadding * 2);
      
      let cursorY = topOffset + 32;

      if (note.image) {
        try {
          // Helper to load image
          const loadImageAsync = (src: string): Promise<HTMLImageElement> => {
            return new Promise((resolve, reject) => {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => resolve(img);
              img.onerror = (e) => reject(e);
              img.src = src;
            });
          };

          const img = await loadImageAsync(note.image);
          
          // Draw image cropped object-cover fit
          ctx.save();
          
          ctx.beginPath();
          ctx.roundRect(40, cursorY, drawableWidth - 16, 300, 20);
          ctx.clip();
          
          // Aspect crop calculations
          const imgAspect = img.width / img.height;
          const targetAspect = (drawableWidth - 16) / 300;
          let drawWidth = drawableWidth - 16;
          let drawHeight = 300;
          let fileX = 0;
          let fileY = 0;

          if (imgAspect > targetAspect) {
            drawWidth = 300 * imgAspect;
            fileX = (drawableWidth - 16 - drawWidth) / 2;
          } else {
            drawHeight = (drawableWidth - 16) / imgAspect;
            fileY = (300 - drawHeight) / 2;
          }

          ctx.drawImage(img, 40 + fileX, cursorY + fileY, drawWidth, drawHeight);
          ctx.restore();
          
          cursorY += 330;
        } catch (err) {
          console.warn('Canvas cover image draw error, bypassing:', err);
          // fall through
        }
      }

      // 5. Draw Note Title (RTL Arabic alignment)
      ctx.fillStyle = titleColor;
      ctx.font = '900 32px Inter, system-ui, "Segoe UI"';
      ctx.textAlign = 'right';
      ctx.direction = 'rtl';
      
      const titleText = note.title || 'ملاحظة بلا عنوان';
      ctx.fillText(titleText, cardWidth - 50 - horizontalPadding, cursorY);
      cursorY += 45;

      // Draw cute decorative line divider below title
      ctx.fillStyle = isDarkLayout ? '#3f3f46' : '#e7e5e4';
      ctx.fillRect(50 + horizontalPadding, cursorY, drawableWidth - 36, 2);
      cursorY += 45;

      // 6. Draw Content Lines
      ctx.fillStyle = textColor;
      ctx.font = '500 21px Inter, system-ui, -apple-system, sans-serif';
      ctx.textBaseline = 'top';
      
      lines.forEach((line) => {
        ctx.fillText(line, cardWidth - 50 - horizontalPadding, cursorY);
        cursorY += 36;
      });

      // 7. Footer metadata banner 
      cursorY += 40;
      ctx.fillStyle = isDarkLayout ? '#27272a' : '#f5f5f4';
      ctx.beginPath();
      ctx.roundRect(50 + horizontalPadding, cursorY, drawableWidth - 36, 75, 14);
      ctx.fill();

      // Format Note Date specifically inside generator
      const dateStr = new Date(note.updatedAt).toLocaleDateString('ar-EG', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Timestamp text right
      ctx.fillStyle = isDarkLayout ? '#a1a1aa' : '#57534e';
      ctx.font = 'bold 13px Inter, system-ui';
      ctx.fillText(`📅 تاريخ الحفظ والتوثيق: ${dateStr}`, cardWidth - 70 - horizontalPadding, cursorY + 30);

      // Watermark Text left
      ctx.fillStyle = isDarkLayout ? '#a1a1aa' : '#78716c';
      ctx.font = '900 13px Inter, system-ui';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#0284c7'; // brand color
      ctx.fillText('المنشور الذكي 📝 NoteBox', 70 + horizontalPadding, cursorY + 30);

      // 8. Output results
      const exportUrl = canvas.toDataURL('image/png');
      setImagePreviewUrl(exportUrl);

      if (downloadImmediately) {
        const link = document.createElement('a');
        link.download = `NoteBox-Share-${note.id}.png`;
        link.href = exportUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('🎨 تم حفظ وتنزيل بطاقات الصور الفنية بنجاح!');
      }
    } catch (err: any) {
      console.error(err);
      showToast('⚠️ فشل تهيئة الفنون الرسومية: ' + err.message);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // --- 4. React Effect Hooks ---
  useEffect(() => {
    if (isOpen) {
      // Default theme to current app wide dark mode
      setCardThemeMode(darkMode ? 'dark' : 'light');
    }
  }, [isOpen, darkMode]);

  // Re-run image preview generator automatically when options toggle
  useEffect(() => {
    if (activeTab === 'image' && isOpen && note) {
      generateImageCard(false);
    }
  }, [activeTab, selectedBg, cardThemeMode, isOpen, note]);

  // --- 5. Early Return Condition (Safeguard) ---
  if (!isOpen || !note) return null;

  // Format Note Date
  const formattedDate = new Date(note.updatedAt).toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Share text formatting
  const shareableText = `📝【 ${note.title || 'ملاحظة بلا عنوان'} 】\n\n${note.content || 'لا يوجد محتوى...'}\n\n📅 تاريخ التعديل: ${formattedDate}\n\n🚀 تمت المشاركة ومزامنتها عبر الحافظة الذكية (Smart NoteBox)`;

  const handleCopyText = () => {
    navigator.clipboard.writeText(shareableText);
    setCopiedText(true);
    showToast('📋 تم نسخ نص الملاحظة المنسق بنجاح!');
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Web Share API
  const handleSystemShare = async () => {
    if (!navigator.share) {
      showToast('⚠️ متصفحك الحالي لا يدعم ميزة مشاركة النظام المباشرة من الـ iFrame.');
      return;
    }
    try {
      const shareData: ShareData = {
        title: note.title || 'ملاحظة',
        text: note.content || '',
      };
      
      if (note.image) {
        try {
          const res = await fetch(note.image);
          const blob = await res.blob();
          const file = new File([blob], 'note-cover.jpg', { type: blob.type || 'image/jpeg' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            shareData.files = [file];
          }
        } catch (e) {
          console.warn("Could not load image file object for sharing, falling back to text share.", e);
        }
      }

      await navigator.share(shareData);
      showToast('🚀 تم الفتح بنجاح!');
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        showToast(`⚠️ تعذر تفعيل المشاركة: يرجى نسخ المحتوى بدلاً من ذلك، أو فتح التطبيق في علامة تبويب جديدة.`);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl animate-fade-in" dir="rtl">
      <div className="bg-white dark:bg-[#121214] border border-stone-250 dark:border-zinc-800 rounded-3xl max-w-2xl w-full h-[90vh] md:h-auto md:max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-stone-200/60 dark:border-zinc-800 flex items-center justify-between bg-stone-50/50 dark:bg-zinc-900/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-100 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 rounded-2xl">
              <Share2 className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-stone-900 dark:text-white leading-tight">تصدير ونشر الملاحظة</h3>
              <p className="text-[11px] text-stone-500 dark:text-zinc-400">شارك مقتطفاتك بنصوص مهندمة أو كبطاقات صور فنية مذهلة</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-500 hover:text-stone-850 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-xl transition"
            title="إغلاق التصدير"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-150 dark:border-zinc-800 px-4 pt-2 bg-stone-50/20 dark:bg-zinc-950/20">
          <button
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-black transition-all border-b-2 cursor-pointer ${
              activeTab === 'text'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-stone-500 dark:text-zinc-400 hover:text-stone-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>نص وروابط مهندمة</span>
          </button>
          <button
            onClick={() => setActiveTab('image')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-black transition-all border-b-2 cursor-pointer ${
              activeTab === 'image'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-stone-500 dark:text-zinc-400 hover:text-stone-700'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>تصميم بطاقة صورة فنية مخصصة</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {activeTab === 'text' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-stone-800 dark:text-zinc-200 block">معاينة نص المنشور الصادر:</label>
                <div className="relative rounded-2xl border border-stone-250 dark:border-zinc-850 bg-stone-50 dark:bg-zinc-900/40 p-4 font-mono text-[11px] text-stone-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap select-all">
                  {shareableText}
                  <div className="absolute top-2.5 left-2.5">
                    <button
                      onClick={handleCopyText}
                      className="p-2 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 hover:ring-2 hover:ring-sky-500/20 text-stone-600 dark:text-zinc-200 rounded-xl shadow-xs hover:shadow transition flex items-center justify-center"
                      title="نسخ النص الكامل"
                    >
                      {copiedText ? <Check className="w-4 h-4 text-emerald-500" /> : <Clipboard className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSystemShare}
                  className="px-4 py-3 bg-gradient-to-r from-sky-600 via-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-black text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>تفعيل مشاركة النظام الخارجية</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="px-4 py-3 bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-stone-700 dark:text-zinc-200 font-extrabold text-xs rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Clipboard className="w-4 h-4 hover:animate-pulse" />
                  <span>نسخ إلى الحافظة فقط</span>
                </button>
              </div>

              {/* Direct Social Media Share Buttons - Native Links */}
              <div className="space-y-2.5 pt-3 border-t border-stone-150 dark:border-zinc-800">
                <span className="text-xs font-black text-stone-800 dark:text-zinc-200 block">نشر ومشاركة سريعة عبر قنوات التواصل:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareableText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 p-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] rounded-xl transition-all border border-emerald-200/50 hover:shadow-sm"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span>مشاركة واتساب</span>
                  </a>
                  
                  <a
                    href={`https://t.me/share/url?url=&text=${encodeURIComponent(shareableText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 p-2.5 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/20 dark:hover:bg-sky-950/40 text-sky-600 dark:text-sky-450 font-extrabold text-[10px] rounded-xl transition-all border border-sky-200/50 hover:shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5 text-sky-550" />
                    <span>قناة تيليجرام</span>
                  </a>

                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareableText.length > 250 ? shareableText.substring(0, 240) + '...' : shareableText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 p-2.5 bg-zinc-50 hover:bg-zinc-150 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-stone-800 dark:text-zinc-205 font-extrabold text-[10px] rounded-xl transition-all border border-zinc-200/50 hover:shadow-sm"
                  >
                    <span className="font-sans font-bold leading-none text-xs text-stone-900 dark:text-white">𝕏</span>
                    <span>منصة إكس / تويتر</span>
                  </a>

                  <a
                    href={`mailto:?subject=${encodeURIComponent(note.title || 'مشاركة ملاحظة')}&body=${encodeURIComponent(shareableText)}`}
                    className="flex items-center justify-center gap-1.5 p-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-extrabold text-[10px] rounded-xl transition-all border border-indigo-200/50 hover:shadow-sm"
                  >
                    <Mail className="w-3.5 h-3.5 text-indigo-550" />
                    <span>إرسال بريد مميز</span>
                  </a>
                </div>
              </div>

              {/* Alert Tips about Frame capabilities */}
              <div className="p-3 bg-sky-50/60 dark:bg-sky-950/20 rounded-2xl border border-sky-100 dark:border-sky-950/40 flex gap-2 text-right">
                <Sparkles className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-sky-700 dark:text-sky-350 leading-relaxed">
                  تلميح ذكي: بسبب قيود النوافذ الافتراضية (iFrame)، فإن محاكاة مشاركة النظام تعمل بأعلى كفاءة عند فتح التطبيق في تبويب مخصص، يمكنك نسخ النص المنسق ومشاركتة بأمان على منصات (واتساب، تيليجرام، إكس، فيسبوك) بنقرة زر واحدة!
                </p>
              </div>
            </div>
          )}

          {activeTab === 'image' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              
              {/* Controls Column */}
              <div className="md:col-span-5 space-y-4">
                {/* Background preset color */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-stone-800 dark:text-zinc-250 block">مؤثر الإطار الخلفي:</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {IMAGE_BG_PRESETS.map((bg) => (
                      <button
                        key={bg.value}
                        onClick={() => setSelectedBg(bg.value)}
                        className={`p-2 text-center text-[10px] font-extrabold rounded-xl border transition-all ${
                          selectedBg === bg.value
                            ? 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/20 dark:bg-sky-950/10 text-sky-600 dark:text-sky-450'
                            : 'border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-400 hover:bg-stone-50 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {bg.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dark or light theme inside card */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-stone-800 dark:text-zinc-250 block">مظهر بطاقة المكتوب الداخلي:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCardThemeMode('light')}
                      className={`py-2 text-center text-[10px] font-bold rounded-xl border transition ${
                        cardThemeMode === 'light'
                          ? 'bg-stone-50 text-stone-900 border-sky-500 shadow-xs'
                          : 'bg-stone-100 text-stone-500 border-stone-200/50 dark:bg-zinc-850 dark:border-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      بطاقة ناصعة مضيئة
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardThemeMode('dark')}
                      className={`py-2 text-center text-[10px] font-bold rounded-xl border transition ${
                        cardThemeMode === 'dark'
                          ? 'bg-zinc-900 text-white border-sky-500 shadow-xs'
                          : 'bg-stone-100 text-stone-500 border-stone-200/50 dark:bg-zinc-850 dark:border-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      بطاقة ليلية معتمة
                    </button>
                  </div>
                </div>

                {/* Confirm trigger button */}
                <button
                  type="button"
                  onClick={() => generateImageCard(true)}
                  disabled={isGeneratingImage}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-2xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>تصدير وحفظ بطاقة الصورة</span>
                </button>
              </div>

              {/* Preview Column */}
              <div className="md:col-span-7 space-y-2">
                <label className="text-xs font-extrabold text-stone-800 dark:text-zinc-250 block">معاينة فنية حية (Live Image Render):</label>
                <div className="border border-stone-200 dark:border-zinc-800 rounded-3xl overflow-hidden bg-stone-50 dark:bg-zinc-950 p-4 aspect-auto flex justify-center items-center relative min-h-[300px]">
                  {isGeneratingImage ? (
                    <div className="text-center space-y-2 py-8 animate-pulse">
                      <div className="w-8 h-8 rounded-full border-2 border-sky-500 border-t-transparent animate-spin mx-auto"></div>
                      <span className="text-[10px] text-stone-500 dark:text-zinc-400 font-extrabold block">جاري دمج الفنون وتصدير الأغلفة...</span>
                    </div>
                  ) : imagePreviewUrl ? (
                    <div className="max-w-full max-h-[450px] overflow-hidden rounded-xl border border-stone-200/50 shadow-lg relative group/preview">
                      <img
                        src={imagePreviewUrl}
                        alt="Preview card"
                        className="w-full object-contain cursor-zoom-in"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <span className="bg-white/95 dark:bg-black/95 text-stone-900 dark:text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-md">
                          جاهز للتصدير الفوري ⚡
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-1.5 text-stone-400 py-12">
                      <ImageIcon className="w-6 h-6 mx-auto opacity-40" />
                      <span className="text-[10px] font-bold block">لم نقم بإنشاء الفنون بعد</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
