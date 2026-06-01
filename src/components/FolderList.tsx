import React, { useState } from 'react';
import { 
  Folder, BookOpen, Briefcase, Code, Lightbulb, 
  Heart, Compass, Anchor, Plus, X, Trash2, Edit3, Check, ShieldCheck
} from 'lucide-react';
import { Folder as FolderType, FOLDER_COLORS } from '../types';

interface FolderListProps {
  folders: FolderType[];
  selectedFolderId: string;
  onSelectFolder: (id: string) => void;
  onCreateFolder: (name: string, icon: string, color: string) => void;
  onUpdateFolder: (id: string, name: string, icon: string, color: string) => void;
  onDeleteFolder: (id: string) => void;
  noteCounts: Record<string, number>;
  safeFilesCount?: number;
}

const ICON_MAP: Record<string, any> = {
  Folder, BookOpen, Briefcase, Code, Lightbulb, Heart, Compass, Anchor
};

const ICON_OPTIONS = [
  { key: 'Folder', label: 'مجلد عام' },
  { key: 'BookOpen', label: 'دراسة' },
  { key: 'Briefcase', label: 'عمل' },
  { key: 'Code', label: 'برمجة/رابط' },
  { key: 'Lightbulb', label: 'أفكار' },
  { key: 'Heart', label: 'رغبات' },
  { key: 'Compass', label: 'استكشاف' },
  { key: 'Anchor', label: 'منوع' },
];

export default function FolderList({
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  noteCounts,
  safeFilesCount = 0,
}: FolderListProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isEditingId, setIsEditingId] = useState<string | null>(null);

  // Form State
  const [folderName, setFolderName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Folder');
  const [selectedColor, setSelectedColor] = useState('slate');

  const startCreate = () => {
    setFolderName('');
    setSelectedIcon('Folder');
    setSelectedColor('slate');
    setIsCreating(true);
    setIsEditingId(null);
  };

  const startEdit = (folder: FolderType) => {
    setFolderName(folder.name);
    setSelectedIcon(folder.icon);
    setSelectedColor(folder.color);
    setIsEditingId(folder.id);
    setIsCreating(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    if (isEditingId) {
      onUpdateFolder(isEditingId, folderName.trim(), selectedIcon, selectedColor);
      setIsEditingId(null);
    } else {
      onCreateFolder(folderName.trim(), selectedIcon, selectedColor);
      setIsCreating(false);
    }
    setFolderName('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-stone-800 dark:text-zinc-200 text-sm font-bold flex items-center gap-2">
          <span>المجلدات والفئات ({folders.length})</span>
        </h2>
        <button
          onClick={startCreate}
          className="text-stone-800 dark:text-zinc-200 hover:text-sky-600 dark:hover:text-sky-400 p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800/80 transition-colors"
          title="إنشاء مجلد جديد"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Form Area (Create / Edit Inline) */}
      {(isCreating || isEditingId) && (
        <form onSubmit={handleSubmit} className="p-3 bg-stone-50 dark:bg-zinc-900/60 rounded-xl border border-stone-200 dark:border-zinc-800 space-y-3 transition-all">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-extrabold text-[#0284c7]">
              {isEditingId ? 'تعديل بيانات المجلد' : 'مجلد جديد'}
            </h4>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setIsEditingId(null);
              }}
              className="text-stone-400 hover:text-stone-500 p-0.5 rounded"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <div>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="اسم المجلد (مثال: محتوى النشر)"
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-stone-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              required
              autoFocus
            />
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-[10px] font-bold text-stone-500 dark:text-zinc-400 mb-1">رمز المجلد</label>
            <div className="grid grid-cols-4 gap-1">
              {ICON_OPTIONS.map((item) => {
                const IconComponent = ICON_MAP[item.key] || Folder;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSelectedIcon(item.key)}
                    className={`p-1.5 rounded-lg flex flex-col items-center justify-center border transition-all ${
                      selectedIcon === item.key
                        ? 'bg-sky-50 dark:bg-sky-950 border-sky-450 text-sky-600 dark:text-sky-400 scale-105 shadow-xs'
                        : 'bg-white dark:bg-zinc-950/40 border-stone-200 dark:border-zinc-800 text-stone-450 dark:text-zinc-500 hover:bg-stone-50'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span className="text-[8px] mt-0.5 font-sans truncate w-full text-center">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Selector */}
          <div>
            <label className="block text-[10px] font-bold text-stone-500 dark:text-zinc-400 mb-1">لون السمة</label>
            <div className="flex flex-wrap gap-1.5">
              {FOLDER_COLORS.map((col) => (
                <button
                  key={col.value}
                  type="button"
                  onClick={() => setSelectedColor(col.value)}
                  className={`w-5 h-5 rounded-full ${col.bg} border-2 transition-all flex items-center justify-center ${
                    selectedColor === col.value ? 'scale-110 border-stone-800 dark:border-white' : 'border-transparent'
                  }`}
                  title={col.name}
                >
                  {selectedColor === col.value && <Check className="w-2.5 h-2.5 text-stone-800 dark:text-white" />}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-1.5 font-bold text-[11px] bg-sky-600 hover:bg-sky-500 text-white rounded-lg shadow-sm transition-colors"
          >
            {isEditingId ? 'حفظ التعديلات' : 'إضافة المجلد'}
          </button>
        </form>
      )}

      {/* Main Folder Navigation Items */}
      <div className="space-y-1">
        {/* Core All Folder */}
        <button
          onClick={() => onSelectFolder('all')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-right ${
            selectedFolderId === 'all'
              ? 'bg-stone-100 dark:bg-zinc-800 text-stone-900 dark:text-white shadow-xs'
              : 'text-stone-600 dark:text-zinc-400 hover:bg-stone-50 dark:hover:bg-zinc-900/30'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="p-1 px-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-md">
              <Compass className="w-3.5 h-3.5" />
            </div>
            <span>كل الملاحظات</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-stone-200/50 dark:bg-zinc-700 font-mono">
            {noteCounts['all'] || 0}
          </span>
        </button>

        {/* Regular folders */}
        {folders.map((folder) => {
          const IconComponent = ICON_MAP[folder.icon] || Folder;
          const isSelected = selectedFolderId === folder.id;
          const colorMeta = FOLDER_COLORS.find(c => c.value === folder.color) || FOLDER_COLORS[0];

          return (
            <div
              key={folder.id}
              className={`group flex items-center justify-between px-3 py-2 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-white dark:bg-[#1f1f23] text-stone-900 dark:text-white border-stone-200 dark:border-zinc-800 shadow-sm'
                  : 'text-stone-600 dark:text-zinc-400 border-transparent hover:bg-stone-50 dark:hover:bg-zinc-900/10'
              }`}
            >
              <button
                onClick={() => onSelectFolder(folder.id)}
                className="flex-1 flex items-center justify-between text-right"
              >
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-md ${colorMeta.bg} ${colorMeta.text}`}>
                    <IconComponent className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-xs">{folder.name}</span>
                </div>
                <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded-full bg-stone-100 dark:bg-zinc-800 font-mono">
                  {noteCounts[folder.id] || 0}
                </span>
              </button>

              {/* Action buttons (Visible on hover or if folder selected) */}
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startEdit(folder);
                  }}
                  className="p-1 hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-400 hover:text-stone-600 rounded"
                  title="تعديل"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFolder(folder.id);
                  }}
                  className="p-1 hover:bg-red-50 dark:hover:bg-red-950/30 text-stone-400 hover:text-red-500 rounded"
                  title="حذف"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Safe Folder */}
        <button
          onClick={() => onSelectFolder('safe_folder')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-right cursor-pointer ${
            selectedFolderId === 'safe_folder'
              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border border-emerald-150 dark:border-emerald-900/30'
              : 'text-stone-600 dark:text-zinc-400 hover:bg-stone-50 dark:hover:bg-zinc-900/10'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="p-1 px-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-md">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span>المجلد الآمن للملفات</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-150/40 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-200 font-mono">
            {safeFilesCount}
          </span>
        </button>

        {/* Recycle Bin Folder */}
        <button
          onClick={() => onSelectFolder('trash')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-right ${
            selectedFolderId === 'trash'
              ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border border-red-150 dark:border-red-900/30'
              : 'text-stone-500 hover:bg-stone-50 dark:hover:bg-zinc-900/30'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="p-1 px-1.5 bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-md">
              <Trash2 className="w-3.5 h-3.5" />
            </div>
            <span>سلة المحذوفات</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-150/40 dark:bg-red-900/30 text-red-700 dark:text-red-200 font-mono">
            {noteCounts['trash'] || 0}
          </span>
        </button>
      </div>
    </div>
  );
}
