import React, { useState } from 'react';
import { Note, PRESET_COLORS, Folder, PRESET_GRADIENTS, PRESET_TEXT_COLORS } from '../types';
import { 
  Pin, Copy, Trash, RotateCcw, ArrowUp, ArrowDown, FolderInput,
  Image as ImageIcon, Calendar, Share2, Bell
} from 'lucide-react';

export function renderTextWithStyledLinks(text: string) {
  if (!text) return text;
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, index) => {
    if (part.match(/^https?:\/\/[^\s]+/)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 underline font-semibold transition-colors duration-150 break-all inline-block hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

interface NoteCardProps {
  key?: string | number;
  note: Note;
  folders: Folder[];
  currentFolderId: string;
  onSelect: (note: Note) => void;
  onPinToggle: (id: string) => void;
  onDeleteToggle: (id: string) => void;
  onPermanentDelete: (id: string) => void;
  onMoveToFolder: (noteId: string, folderId: string) => void;
  onMoveOrder: (noteId: string, direction: 'up' | 'down') => void;
  onShare?: (note: Note) => void;
  isGridView?: boolean;
}

export default function NoteCard({
  note,
  folders,
  currentFolderId,
  onSelect,
  onPinToggle,
  onDeleteToggle,
  onPermanentDelete,
  onMoveToFolder,
  onMoveOrder,
  onShare,
  isGridView = true,
}: NoteCardProps) {
  const [copied, setCopied] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);

  const cardColorObj = PRESET_COLORS.find(c => c.value === note.color) || PRESET_COLORS[0];
  const noteFolder = folders.find(f => f.id === note.folderId);

  // Background and text style solver
  const getNoteClassesAndStyles = () => {
    let bgClass = '';
    let textClass = 'text-stone-900 dark:text-white';
    let subtitleClass = 'text-stone-600 dark:text-zinc-400';

    if (note.bgType === 'gradient' && note.bgGradient) {
      const grad = PRESET_GRADIENTS.find(g => g.value === note.bgGradient);
      bgClass = grad ? grad.class : cardColorObj.class;
    } else if (note.bgType === 'image' && note.bgImage) {
      bgClass = 'relative text-stone-900 dark:text-white border-stone-250 dark:border-zinc-805';
    } else {
      bgClass = cardColorObj.class;
    }

    if (note.textColor && note.textColor !== 'default') {
      const tc = PRESET_TEXT_COLORS.find(t => t.value === note.textColor);
      if (tc) {
        textClass = tc.class;
        subtitleClass = `${tc.class} opacity-80`;
      }
    }

    return { bgClass, textClass, subtitleClass };
  };

  const { bgClass, textClass, subtitleClass } = getNoteClassesAndStyles();

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${note.title}\n\n${note.content}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = new Date(note.updatedAt).toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
  }) + ' - ' + new Date(note.updatedAt).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  if (!isGridView) {
    return (
      <div
        onClick={() => onSelect(note)}
        className={`group relative rounded-2xl border p-4 shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between overflow-hidden z-0 ${bgClass} ${
          note.isPinned ? 'ring-1 ring-sky-500/30' : ''
        }`}
      >
        {note.bgType === 'image' && note.bgImage && (
          <>
            <div 
              className="absolute inset-0 -z-20 scale-105"
              style={{
                backgroundImage: `url(${note.bgImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <div className="absolute inset-0 bg-stone-105/90 dark:bg-zinc-950/90 -z-10 mix-blend-normal" />
          </>
        )}
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          {note.image && (
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-100 dark:bg-zinc-950 border border-stone-200/20 shrink-0">
              <img
                src={note.image}
                alt={note.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
          
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {note.isPinned && (
                <span className="bg-sky-150/80 dark:bg-sky-950/80 p-0.5 rounded text-sky-600 dark:text-sky-300 animate-pulse" title="مُثبّتة في الأعلى">
                  <Pin className="w-3 h-3 fill-current" />
                </span>
              )}
              {noteFolder && (
                <span className="text-[9px] bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 px-1.5 py-0.5 rounded font-bold">
                  {noteFolder.name}
                </span>
              )}
              <h3 className={`font-extrabold text-xs truncate ${textClass}`}>
                {note.title || <span className="text-stone-400 dark:text-zinc-500 italic">ملاحظة بلا عنوان</span>}
              </h3>
            </div>
            <p className={`text-[11px] line-clamp-1 whitespace-pre-wrap leading-relaxed ${subtitleClass}`}>
              {note.content ? note.content.replace(/\n+/g, ' ') : <span className="text-stone-400 dark:text-zinc-650 italic">لا يوجد محتوى نصي...</span>}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <div className="text-[9px] text-stone-400 dark:text-zinc-500 flex items-center gap-1 font-mono">
                <Calendar className="w-2.5 h-2.5" />
                {formattedDate}
              </div>
              {note.reminderAt && (
                <div className="text-[9px] bg-amber-100 dark:bg-amber-950/70 text-amber-850 dark:text-amber-300 font-extrabold px-1.5 py-0.5 rounded flex items-center gap-1 leading-none shadow-xs">
                  <Bell className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400 animate-swing" />
                  <span>تذكير: {new Date(note.reminderAt).toLocaleString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action icons row inside list */}
        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center bg-stone-200/10 dark:bg-zinc-850/30 p-1 rounded-xl" onClick={(e) => e.stopPropagation()}>
          {/* Order control arrows */}
          {!note.isDeleted && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveOrder(note.id, 'up');
                }}
                className="p-1 hover:bg-stone-200/50 dark:hover:bg-zinc-850/50 text-stone-400 hover:text-stone-800 dark:hover:text-zinc-200 rounded transition cursor-pointer"
                title="نقل للأعلى"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveOrder(note.id, 'down');
                }}
                className="p-1 hover:bg-stone-200/50 dark:hover:bg-zinc-850/50 text-stone-400 hover:text-stone-800 dark:hover:text-zinc-200 rounded transition cursor-pointer"
                title="نقل للأسفل"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              
              {/* Change Folder */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFolderModal(!showFolderModal);
                  }}
                  className="p-1 hover:bg-stone-200/50 dark:hover:bg-zinc-850/50 text-stone-450 hover:text-stone-800 dark:hover:text-zinc-200 rounded transition cursor-pointer"
                  title="تغيير المجلد"
                >
                  <FolderInput className="w-3.5 h-3.5" />
                </button>
                {showFolderModal && (
                  <div className="absolute top-full left-0 mt-1 w-36 bg-white dark:bg-zinc-900 border border-stone-250 dark:border-zinc-800 rounded-xl shadow-xl z-20 py-1 cursor-default text-right">
                    <div className="text-[9px] px-2 py-1 text-stone-400 font-extrabold border-b border-stone-100 dark:border-zinc-800">انقل إلى:</div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveToFolder(note.id, 'all');
                        setShowFolderModal(false);
                      }}
                      className="w-full text-right px-2.5 py-1.5 text-[11px] hover:bg-stone-50 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300 block font-bold cursor-pointer"
                    >
                      بلا فئة
                    </button>
                    {folders.map(f => (
                      <button
                        key={f.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveToFolder(note.id, f.id);
                          setShowFolderModal(false);
                        }}
                        className="w-full text-right px-2.5 py-1.5 text-[11px] hover:bg-stone-50 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300 block font-medium truncate cursor-pointer"
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <button
            onClick={handleCopy}
            className={`p-1 hover:bg-stone-250/20 rounded transition cursor-pointer ${copied ? 'text-emerald-500' : 'text-stone-450'}`}
            title="نسخ فوري للنص"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {onShare && !note.isDeleted && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare(note);
              }}
              className="p-1 hover:bg-stone-250/20 text-stone-450 hover:text-sky-600 rounded transition cursor-pointer"
              title="تصدير ونشر الملاحظة"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          )}

          {note.isDeleted ? (
            <>
              <button
                onClick={() => onDeleteToggle(note.id)}
                className="p-1 text-sky-600 hover:text-sky-800 hover:bg-sky-50 dark:hover:bg-sky-950/20 rounded transition cursor-pointer"
                title="استعادة الملاحظة"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onPermanentDelete(note.id)}
                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition cursor-pointer"
                title="حذف نهائي"
              >
                <Trash className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onPinToggle(note.id)}
                className={`p-1 rounded transition cursor-pointer ${note.isPinned ? 'text-sky-500' : 'text-stone-400 hover:text-stone-600'}`}
                title="تثبيت في الأعلى"
              >
                <Pin className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDeleteToggle(note.id)}
                className="p-1 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-[#ff0000]/10 rounded transition cursor-pointer"
                title="نقل لسلة المهملات"
              >
                <Trash className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onSelect(note)}
      className={`group relative rounded-2xl border p-4 shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden z-0 ${bgClass} ${
        note.isPinned ? 'ring-1 ring-sky-500/30' : ''
      }`}
    >
      {note.bgType === 'image' && note.bgImage && (
        <>
          <div 
            className="absolute inset-0 -z-20 scale-105"
            style={{
              backgroundImage: `url(${note.bgImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0 bg-stone-105/90 dark:bg-zinc-950/90 -z-10 mix-blend-normal" />
        </>
      )}
      {/* Top action row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          {note.isPinned && (
            <span className="bg-sky-150/80 dark:bg-sky-950/80 p-1 rounded-lg text-sky-600 dark:text-sky-300 animate-pulse" title="مُثبّتة في الأعلى">
              <Pin className="w-3.5 h-3.5 fill-current" />
            </span>
          )}
          {noteFolder && (
            <span className="text-[10px] bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 px-2 py-0.5 rounded-md font-bold">
              {noteFolder.name}
            </span>
          )}
          {note.reminderAt && (
            <span className="flex items-center gap-1 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-md text-[9px] font-extrabold animate-pulse" title="يوجد تنبيه مفعّل">
              <Bell className="w-2.5 h-2.5" />
              <span>منبه</span>
            </span>
          )}
        </div>

        {/* Action Widgets */}
        <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Order control arrows (only visible if not in trash) */}
          {!note.isDeleted && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveOrder(note.id, 'up');
                }}
                className="p-1 hover:bg-stone-200/50 dark:hover:bg-zinc-800/50 text-stone-450 hover:text-stone-800 rounded transition"
                title="نقل للأعلى"
              >
                <ArrowUp className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveOrder(note.id, 'down');
                }}
                className="p-1 hover:bg-stone-200/50 dark:hover:bg-zinc-800/50 text-stone-450 hover:text-stone-800 rounded transition"
                title="نقل للأسفل"
              >
                <ArrowDown className="w-3 h-3" />
              </button>
            </>
          )}

          {/* Transfer folder list popup click (only active nodes) */}
          {!note.isDeleted && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFolderModal(!showFolderModal);
                }}
                className="p-1 hover:bg-stone-200/50 dark:hover:bg-zinc-800/50 text-stone-450 hover:text-stone-800 rounded transition"
                title="تغيير المجلد"
              >
                <FolderInput className="w-3.5 h-3.5" />
              </button>
              {showFolderModal && (
                <div className="absolute top-full left-0 mt-1 w-36 bg-white dark:bg-zinc-900 border border-stone-250 dark:border-zinc-800 rounded-xl shadow-xl z-20 py-1 cursor-default text-right">
                  <div className="text-[9px] px-2 py-1 text-stone-400 font-extrabold border-b border-stone-100 dark:border-zinc-800">انقل إلى:</div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveToFolder(note.id, 'all');
                      setShowFolderModal(false);
                    }}
                    className="w-full text-right px-2.5 py-1.5 text-[11px] hover:bg-stone-50 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300 block font-bold"
                  >
                    بلا فئة
                  </button>
                  {folders.map(f => (
                    <button
                      key={f.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveToFolder(note.id, f.id);
                        setShowFolderModal(false);
                      }}
                      className="w-full text-right px-2.5 py-1.5 text-[11px] hover:bg-stone-50 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300 block font-medium truncate"
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleCopy}
            className={`p-1 hover:bg-stone-250/20 rounded transition ${copied ? 'text-emerald-500' : 'text-stone-450'}`}
            title="نسخ فوري للنص"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {onShare && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare(note);
              }}
              className="p-1 hover:bg-stone-250/20 text-stone-450 hover:text-sky-600 rounded transition"
              title="تصدير ونشر الملاحظة"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Note Thumbnail and Content */}
      <div className="flex-1 space-y-2 select-none">
        {note.image && (
          <div className="w-full h-28 rounded-xl overflow-hidden mb-2 bg-stone-100 dark:bg-zinc-950 relative border border-stone-200/20">
            <img
              src={note.image}
              alt={note.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-2 right-2 p-1 bg-stone-900/60 backdrop-blur-md rounded-lg text-white">
              <ImageIcon className="w-3 h-3" />
            </div>
          </div>
        )}

        <h3 className={`font-extrabold text-sm line-clamp-1 ${textClass}`}>
          {note.title || <span className="text-stone-400 dark:text-zinc-500 italic">ملاحظة بلا عنوان</span>}
        </h3>
        
        <p className={`text-xs line-clamp-3 whitespace-pre-wrap leading-relaxed ${subtitleClass}`}>
          {note.content ? renderTextWithStyledLinks(note.content) : <span className="text-stone-400 dark:text-zinc-650 italic">لا يوجد محتوى نصي...</span>}
        </p>
      </div>

      {/* Footer Meta Row */}
      <div className="mt-3 pt-2.5 border-t border-stone-200/50 dark:border-zinc-800/50 flex items-center justify-between text-[10px] text-stone-400 dark:text-zinc-500">
        <span className="flex items-center gap-2 font-mono flex-wrap">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formattedDate}
          </span>
          {note.reminderAt && (
            <span className="text-[9px] text-amber-600 dark:text-amber-400 flex items-center gap-0.5 font-bold" title="وقت التنبيه">
              🔔 {new Date(note.reminderAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </span>

        {/* Trash Actions or Standard Active Toggle */}
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {note.isDeleted ? (
            <>
              <button
                onClick={() => onDeleteToggle(note.id)}
                className="p-1 text-sky-600 hover:text-sky-800 hover:bg-sky-50 dark:hover:bg-sky-950/20 rounded transition"
                title="استعادة الملاحظة"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  onPermanentDelete(note.id);
                }}
                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition"
                title="حذف نهائي"
              >
                <Trash className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onPinToggle(note.id)}
                className={`p-1 rounded transition ${note.isPinned ? 'text-sky-500' : 'text-stone-400 hover:text-stone-600'}`}
                title="تثبيت"
              >
                <Pin className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDeleteToggle(note.id)}
                className="p-1 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-[#ff0000]/10 rounded transition"
                title="نقل لسلة المهملات"
              >
                <Trash className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
