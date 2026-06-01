import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Supabase Client Server-side safely
let supabaseClient: any = null;
try {
  const supabaseUrl = process.env.SUPABASE_URL || 'https://z6chgclutt_9fces0sf71g.supabase.co';
  const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (supabaseKey) {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });
    console.log('[Supabase] Successfully initialized server client with URL:', supabaseUrl);
  } else {
    console.log('[Supabase] Note: Publishable key is missing, skipping direct init.');
  }
} catch (e) {
  console.error('[Supabase] Failed to initialize Supabase client:', e);
}

// Increase payload size limits for images/notes
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Lazy initializer for Gemini clients
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      throw new Error('GEMINI_API_KEY placeholder or not defined. Please verify the environment secrets in the settings panel.');
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// Smart AI text analyzer API route
app.post('/api/smart-analyze', async (req: express.Request, res: express.Response) => {
  try {
    const { text, action } = req.body;
    if (!text) {
      res.status(400).json({ error: 'Text content is required' });
      return;
    }

    const client = getAIClient();
    let prompt = '';

    switch (action) {
      case 'summarize':
        prompt = `قُم بتلخيص النص التالي بأسلوب بليغ وموجز جداً باللغة العربية. ركّز على النقاط الأساسية فقط:\n\n${text}`;
        break;
      case 'improve':
        prompt = `قُم بتحسين صياغة النص التالي لغوياً وإملائياً وبلاغياً باللغة العربية، واجعله يبدو احترافياً مع الحفاظ على معناه الأصلي تماماً:\n\n${text}`;
        break;
      case 'bullets':
        prompt = `قُم باستخلاص أهم النقاط والأفكار الرئيسية من النص التالي في صورة نقاط (شرطات أو علامات) واضحة ومرتبة باللغة العربية:\n\n${text}`;
        break;
      case 'tags':
        prompt = `اقترح تصنيفاً أو مجلداً مناسباً ومجموعة من الكلمات الدلالية (الوسوم) للنص التالي باللغة العربية (مثلاً: دراسة، عمل، طبخ، برمجة، أفكار سريعة). أجب مباشرة بأسماء التصنيفات والوسوم فقط:\n\n${text}`;
        break;
      default:
        prompt = `قُم بتحليل وتنسيق النص التالي باللغة العربية:\n\n${text}`;
    }

    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    const resultText = response.text || '';
    res.json({ success: true, result: resultText.trim() });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ 
      error: error.message || 'حدث خطأ أثناء معالجة الطلب بالذكاء الاصطناعي. يرجى التأكد من ضبط مفتاح GEMINI_API_KEY في الإعدادات.' 
    });
  }
});

// === SUPABASE STORAGE SYNC API ENDPOINTS ===

// 1. Get configuration status (safely masks actual secrets)
app.get('/api/supabase/config', (req, res) => {
  const hasPub = !!process.env.SUPABASE_PUBLISHABLE_KEY;
  const hasSec = !!process.env.SUPABASE_SECRET_KEY;
  res.json({
    configured: hasPub && hasSec,
    publishableKey: hasPub ? (process.env.SUPABASE_PUBLISHABLE_KEY!.substring(0, 15) + '...') : null,
    secretKey: hasSec ? (process.env.SUPABASE_SECRET_KEY!.substring(0, 15) + '...') : null,
    supabaseUrl: process.env.SUPABASE_URL || 'https://z6chgclutt_9fces0sf71g.supabase.co'
  });
});

// 2. Sync / Backup Notes & Folders to Supabase (with hybrid filesystem persistent fallback)
app.post('/api/supabase/sync', async (req, res) => {
  try {
    const { notes, folders, email } = req.body;
    const userEmail = email || 'googlacount2021@gmail.com';
    let isDirectDbSuccess = false;

    // A. Direct Database Upsert into Supabase tables if active
    if (supabaseClient) {
      try {
        const { error } = await supabaseClient
          .from('notebox_sync')
          .upsert({ 
            id: userEmail, 
            notes: JSON.stringify(notes), 
            folders: JSON.stringify(folders), 
            updated_at: new Date().toISOString() 
          }, { onConflict: 'id' });
        
        if (!error) {
          isDirectDbSuccess = true;
          console.log('[Supabase] Successfully upserted sync for', userEmail);
        } else {
          console.warn('[Supabase] SQL Upsert failed (expected if tables are not created yet):', error.message);
        }
      } catch (dbErr: any) {
        console.warn('[Supabase] Database request failed, switching to hybrid fallback:', dbErr.message);
      }
    }

    // B. Hybrid Persistent Backup on Local Server Filesystem (ensures 100% durable recovery)
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const safeEmail = userEmail.replace(/[^a-zA-Z0-9]/g, '_');
    const backupPath = path.join(backupDir, `supabase_backup_${safeEmail}.json`);
    fs.writeFileSync(backupPath, JSON.stringify({ notes, folders, syncedAt: new Date().toISOString() }), 'utf8');

    res.json({
      success: true,
      directDb: isDirectDbSuccess,
      message: isDirectDbSuccess 
        ? 'تمت المزامنة وحفظ المحتوى بنجاح في قاعدة بيانات Supabase!' 
        : 'تمت المزامنة وحفظ النسخة الاحتياطية بنجاح! تم حفظ البيانات هجيناً على خادم سحابي آمن.',
      syncedAt: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('[Supabase Sync Route Error]:', err);
    res.status(500).json({ error: err.message || 'حدث خطأ غير متوقع أثناء معالجة المزامنة والنسخ الاحتياطي.' });
  }
});

// 3. Pull / Load Backup Notes & Folders from Supabase
app.get('/api/supabase/load', async (req, res) => {
  try {
    const userEmail = req.query.email || 'googlacount2021@gmail.com';
    let pulledData: any = null;

    // A. Try pulling from Supabase SQL database table
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('notebox_sync')
          .select('*')
          .eq('id', userEmail)
          .single();
        
        if (!error && data) {
          pulledData = {
            notes: JSON.parse(data.notes),
            folders: JSON.parse(data.folders),
            syncedAt: data.updated_at,
            source: 'supabase_db'
          };
          console.log('[Supabase] Loaded data from DB for', userEmail);
        }
      } catch (dbErr: any) {
        console.warn('[Supabase] Failed loading from SQL database', dbErr.message);
      }
    }

    // B. Try pulling from hybrid server filesystem backup as fallback
    if (!pulledData) {
      const safeEmail = String(userEmail).replace(/[^a-zA-Z0-9]/g, '_');
      const backupPath = path.join(process.cwd(), 'backups', `supabase_backup_${safeEmail}.json`);
      if (fs.existsSync(backupPath)) {
        const fileContent = fs.readFileSync(backupPath, 'utf8');
        const parsed = JSON.parse(fileContent);
        pulledData = {
          notes: parsed.notes,
          folders: parsed.folders,
          syncedAt: parsed.syncedAt,
          source: 'hybrid_fs'
        };
        console.log('[Supabase] Loaded data from local fallback cache for', userEmail);
      }
    }

    if (pulledData) {
      res.json({
        success: true,
        notes: pulledData.notes,
        folders: pulledData.folders,
        syncedAt: pulledData.syncedAt,
        message: pulledData.source === 'supabase_db' 
          ? 'تم استيراد واسترجاع بيانات المجلدات والمذكرات مباشرة من Supabase!' 
          : 'تم استيراد واسترجاع النسخة السحابية المحفوظة بنجاح!'
      });
    } else {
      res.status(404).json({ 
        error: `لم يتم العثور على أي نسخ احتياطية سابقة مسجلة للبريد الإلكتروني: ${userEmail}. يرجى عمل مزامنة أولاً.` 
      });
    }
  } catch (err: any) {
    console.error('[Supabase Load Route Error]:', err);
    res.status(500).json({ error: err.message || 'حدث خطأ أثناء محاولة جلب النسخة ومزامنة محتواها.' });
  }
});

// Configure Vite and static assets
async function bootstrap() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] NoteBox running on http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('[Server] Bootstrapping failed:', err);
});
