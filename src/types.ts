export interface Folder {
  id: string;
  name: string;
  icon: string; // name of lucide-react icon
  color: string; // Tailwind color theme like 'red', 'blue', 'green', 'amber', 'purple', 'rose', 'slate'
  createdAt: string;
}

export interface Note {
  id: string;
  folderId: string; // 'all' (meaning root), or a specific Folder.id, or 'trash'
  title: string;
  content: string;
  image?: string; // base64 or photo URL
  color: string; // card preset background color index
  isPinned: boolean;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  order: number; // sort index for custom reordering
  bgType?: 'preset' | 'gradient' | 'image' | 'animated';
  bgGradient?: string; // preset gradient key
  bgImage?: string; // custom device background image base64
  bgAnimated?: string; // key of targeted animated background preset
  textColor?: string; // preset text color key
  reminderAt?: string; // ISO datetime string for alerting
  reminderNotified?: boolean; // tracking fired alarms
}

export interface SmartAISuggestion {
  originalText: string;
  result: string;
  action: 'summarize' | 'improve' | 'bullets' | 'tags';
  loading: boolean;
  error?: string;
}

export interface SafeFile {
  id: string;
  name: string;
  size: string;
  rawType: string;
  extension: string;
  category: 'documents' | 'images' | 'audio' | 'videos' | 'others';
  dataUrl: string;
  createdAt: string;
  updatedAt: string;
}

export const PRESET_COLORS = [
  { name: 'افتراضي', class: 'bg-stone-50 text-stone-900 border-stone-200 dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-800', value: 'stone' },
  { name: 'ياقوتي', class: 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-900/50', value: 'rose' },
  { name: 'فيروزي', class: 'bg-sky-50 text-sky-900 border-sky-200 dark:bg-sky-950/40 dark:text-sky-200 dark:border-sky-900/50', value: 'sky' },
  { name: 'زمردي', class: 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-900/50', value: 'emerald' },
  { name: 'عنبري', class: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900/50', value: 'amber' },
  { name: 'بنفسجي', class: 'bg-purple-50 text-purple-900 border-purple-200 dark:bg-purple-950/40 dark:text-purple-200 dark:border-purple-900/50', value: 'purple' },
  { name: 'نيلي', class: 'bg-indigo-50 text-indigo-900 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-200 dark:border-indigo-900/50', value: 'indigo' },
];

export const FOLDER_COLORS = [
  { name: 'رمادي أساسي', border: 'border-slate-300 dark:border-slate-700', text: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800', value: 'slate' },
  { name: 'أزرق طاقة', border: 'border-blue-300 dark:border-blue-700', text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-800', value: 'blue' },
  { name: 'أخضر هادئ', border: 'border-emerald-300 dark:border-emerald-700', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-800', value: 'emerald' },
  { name: 'برتقالي دافئ', border: 'border-amber-300 dark:border-amber-700', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-800', value: 'amber' },
  { name: 'أحمر لطيف', border: 'border-rose-300 dark:border-rose-700', text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-800', value: 'rose' },
  { name: 'بنفسجي ملكي', border: 'border-violet-300 dark:border-violet-700', text: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-800', value: 'violet' },
];

export const PRESET_GRADIENTS = [
  { name: 'شمس الغروب', class: 'bg-gradient-to-br from-amber-100 via-orange-50 to-rose-100 dark:from-amber-950/40 dark:via-zinc-900 dark:to-rose-950/40 border-amber-200 dark:border-amber-900/40', value: 'sunset' },
  { name: 'أعماق المحيط', class: 'bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 dark:from-sky-950/40 dark:via-zinc-900/50 dark:to-indigo-950/40 border-sky-200 dark:border-sky-900/40', value: 'ocean' },
  { name: 'شفق الغابة', class: 'bg-gradient-to-br from-emerald-100 via-teal-50 to-lime-150 dark:from-emerald-950/30 dark:via-zinc-905 dark:to-teal-900/30 border-emerald-200 dark:border-emerald-900/40', value: 'forest' },
  { name: 'سديم كوني', class: 'bg-gradient-to-br from-purple-100 via-fuchsia-100 to-indigo-100 dark:from-purple-950/40 dark:via-zinc-900 dark:to-indigo-950/40 border-purple-200 dark:border-purple-900/40', value: 'cosmic' },
  { name: 'حديقة الورد', class: 'bg-gradient-to-br from-rose-100 via-pink-50 to-purple-100 dark:from-rose-950/40 dark:via-zinc-900 dark:to-purple-950/40 border-rose-200 dark:border-rose-900/40', value: 'rosegarden' },
  { name: 'عاصفة نيون', class: 'bg-gradient-to-br from-fuchsia-200 via-indigo-100 to-sky-200 dark:from-fuchsia-950/30 dark:via-indigo-950/40 dark:to-sky-950/30 border-fuchsia-300 dark:border-fuchsia-900/35', value: 'neon' },
  { name: 'منتصف الليل', class: 'bg-gradient-to-br from-slate-200 to-slate-400 dark:from-slate-900 dark:to-zinc-950 border-slate-350 dark:border-slate-800', value: 'midnight' },
];

export const PRESET_TEXT_COLORS = [
  { name: 'تلقائي', class: '', value: 'default' },
  { name: 'رمادي فحمي داكن', class: 'text-stone-900 dark:text-stone-50', value: 'charcoal' },
  { name: 'أزرق طاقة زاهي', class: 'text-blue-700 dark:text-sky-400', value: 'blue' },
  { name: 'أخضر فستقي هادئ', class: 'text-emerald-700 dark:text-emerald-400', value: 'emerald' },
  { name: 'برتقالي شمسي دافئ', class: 'text-amber-600 dark:text-amber-400', value: 'amber' },
  { name: 'أحمر مرجاني ناصع', class: 'text-rose-700 dark:text-rose-400', value: 'rose' },
  { name: 'بنفسجي ملكي هادئ', class: 'text-purple-700 dark:text-purple-400', value: 'purple' },
];

