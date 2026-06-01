import React, { useState } from 'react';
import { Share2, Clipboard, Image as ImageIcon, Check, Sparkles, HelpCircle } from 'lucide-react';

interface ClipboardSharerProps {
  onSimulateShare: (title: string, content: string, image?: string) => void;
}

export default function ClipboardSharer({ onSimulateShare }: ClipboardSharerProps) {
  const [inputText, setInputText] = useState('');
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [simulatedTitle, setSimulatedTitle] = useState('محتوى مُشارك خارجي');
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const executeSimulatedShare = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !imageFile) return;

    onSimulateShare(
      simulatedTitle || 'منشور أو اقتباس مشارك',
      inputText,
      imageFile || undefined
    );

    // Reset fields
    setInputText('');
    setImageFile(null);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 3000);
  };

  const handleQuickPreset = (type: string) => {
    switch (type) {
      case 'quote':
        setSimulatedTitle('اقتباس ملهم اليوم');
        setInputText('«إن أعظم طريقة لإنجاز عمل عظيم هي أن تحب ما تفعله.» — ستيف جوبز');
        break;
      case 'code':
        setSimulatedTitle('مقتطف برمجيات مفيد');
        setInputText('const greet = () => console.log("مرحباً بك في حافظتي الذكية!");\ngreet();');
        break;
      case 'recipe':
        setSimulatedTitle('رابط مقال للقرءاة لاحقاً');
        setInputText('https://ai.google.com/research\nموقع أبحاث الذكاء الاصطناعي من جوجل لقراءة أحدث المستجدات.');
        break;
    }
  };

  return (
    <div className="bg-white dark:bg-[#18181b] border border-stone-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm relative overflow-hidden transition-all duration-300">
      <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl pointer-events-none pr-8"></div>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-450 rounded-lg">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-stone-800 dark:text-zinc-200">صندوق المحاكاة السريع</h3>
            <p className="text-[10px] text-stone-400 dark:text-zinc-500">مشاركة روابط أو نصوص وصور من تطبيقات أخرى</p>
          </div>
        </div>
        <div className="group relative">
          <HelpCircle className="w-4 h-4 text-stone-300 dark:text-zinc-650 cursor-pointer hover:text-stone-500" />
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 text-center bg-stone-900 text-white text-[10px] p-2 rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            أداة تفاعلية تعوّض غياب الإرسال الخارجي في متصفح Sandbox، قم بلصق أي شيء هنا وسيبدو كأنه تم إرساله من تطبيق آخر!
          </span>
        </div>
      </div>

      <form onSubmit={executeSimulatedShare} className="space-y-3">
        <div>
          <label className="block text-[10px] font-medium text-stone-500 dark:text-zinc-400 mb-1">
            العنوان المقترح للمحتوى الخارجي
          </label>
          <input
            type="text"
            value={simulatedTitle}
            onChange={(e) => setSimulatedTitle(e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900/40 text-stone-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="مثال: رابط مهم، اقتباس، ملاحظة عمل"
          />
        </div>

        <div>
          <label className="block text-[10px] font-medium text-stone-500 dark:text-zinc-400 mb-1">
            النص أو الرابط المراد حفظه
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="الصق نصوص، أكواد، أو روابط سريعة..."
            className="w-full h-18 text-xs font-sans p-2 rounded-lg border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900/40 text-stone-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none"
          />
        </div>

        <div className="flex gap-2 items-center">
          <label className="flex flex-1 items-center justify-center gap-1.5 py-1.5 border border-dashed border-stone-300 dark:border-zinc-700 hover:bg-stone-50 dark:hover:bg-zinc-900/30 rounded-lg cursor-pointer transition-colors text-ellipsis overflow-hidden">
            <ImageIcon className="w-3.5 h-3.5 text-stone-400" />
            <span className="text-[10px] font-medium text-stone-500 dark:text-zinc-400">
              {imageFile ? 'تم اختيار صورة ✓' : 'إرفاق صورة للمشاركة'}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>

          {imageFile && (
            <button
              type="button"
              onClick={() => setImageFile(null)}
              className="text-[10px] text-red-500 hover:text-red-700 px-1 font-medium bg-red-50 dark:bg-red-950/20 py-1.5 rounded-lg border border-red-100 dark:border-red-900/20"
            >
              إلغاء
            </button>
          )}
        </div>

        <div className="flex gap-1 justify-between items-center text-[10px] text-stone-400 dark:text-zinc-500">
          <span className="font-bold">مقتطفات تجريبية:</span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickPreset('quote')}
              className="bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-600 dark:text-zinc-300 px-1.5 py-0.5 rounded transition-all"
            >
              اقتباس
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('code')}
              className="bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-600 dark:text-zinc-300 px-1.5 py-0.5 rounded transition-all"
            >
              مقتطف دالة
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('recipe')}
              className="bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-600 dark:text-zinc-300 px-1.5 py-0.5 rounded transition-all"
            >
              رابط
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={!inputText.trim() && !imageFile}
          className={`w-full flex items-center justify-center gap-1.5 font-bold text-xs py-2 rounded-xl transition-all ${
            inputText.trim() || imageFile
              ? 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-md shadow-indigo-500/10'
              : 'bg-stone-100 dark:bg-zinc-900 text-stone-400 dark:text-zinc-650 cursor-not-allowed'
          }`}
        >
          {copiedSuccess ? (
            <>
              <Check className="w-3.5 h-3.5" />
              تمت المحاكاة والإضافة بنجاح!
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              محاكاة مشاركة خارجيّة الآن
            </>
          )}
        </button>
      </form>
    </div>
  );
}
