// src/App.tsx
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import { useMemo, useState, useEffect, useLayoutEffect, useRef, useCallback, memo } from "react";
import "../index.css";

/** ==== Tipler ==== */
type EntryType = "income" | "fixed" | "card" | "variable";
type Entry = {
  id: string;
  month: string; // "YYYY-MM"
  type: EntryType;
  title: string;
  amount: number;
  date?: string; // YYYY-MM-DD (seçilen aya ait)
  createdAt: number;
};
type MonthFile = {
  month: string; // "YYYY-MM"
  entries: Array<Omit<Entry, "month">>;
};

/** ==== Para formatı ==== */
const fmt = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});


/** ==== Yardımcı alt-bileşenler (tek dosyada dursun diye) ==== */
const AddRow = memo(function AddRow({ label, onAdd, baseMonth }: { label: string; onAdd: (t: string, a: number, d: string) => void; baseMonth: string }) {
  const [t, setT] = useState("");
  const [a, setA] = useState<string>("");
  const [d, setD] = useState<string>("");
  const dateRef = useRef<HTMLInputElement | null>(null);
  // baseMonth değişince tarihi o ayın 01'i yap
  useEffect(() => {
    setD(`${baseMonth}-01`);
  }, [baseMonth]);
  const [minDate, maxDate] = useMemo(() => {
    const [y, m] = baseMonth.split("-").map(Number);
    const last = new Date(y, m!, 0).getDate();
    const lastStr = String(last).padStart(2, "0");
    return [`${baseMonth}-01`, `${baseMonth}-${lastStr}`];
  }, [baseMonth]);
  const raw = a.trim().replace(",", ".");
  const parsed = parseFloat(raw);
  const canAdd = Boolean(t.trim()) && !Number.isNaN(parsed) && Boolean(d);
  const displayD = useMemo(() => {
    if (!d) return "gg/aa/yyyy";
    const [yy, mm, dd] = d.split("-");
    return `${dd.padStart(2, "0")}/${mm.padStart(2, "0")}/${yy}`;
  }, [d]);
  return (
    <div className="row" style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px auto", gap: "8px" }}>
      <input
        className="input"
        placeholder={`${label} adı`}
        value={t}
        onChange={(e) => setT(e.target.value)}
        aria-label={`${label} açıklaması`}
        aria-describedby={`${label}-help`}
      />
      <input
        className="input right"
        placeholder="Tutar"
        type="text"
        inputMode="decimal"
        pattern="[0-9]*[.,]?[0-9]*"
        value={a}
        onChange={(e) => setA(e.target.value)}
        aria-label="Tutar (TL)"
        aria-describedby="amount-help"
      />
      <div
        className="date-input-wrap"
        onClick={() => {
          const el = dateRef.current;
          if (!el) return;
          // Destekleniyorsa doğrudan aç
          (el as any).showPicker?.();
          // Yine de odak/klik gönder (tarayıcı uyumluluğu)
          el.focus();
          el.click();
        }}
      >
        <input
          className="input date-input"
          type="date"
          lang="en-GB"
          value={d}
          min={minDate}
          max={maxDate}
          onChange={(e) => setD(e.target.value)}
          onClick={() => {
            const el = dateRef.current;
            (el as any)?.showPicker?.();
          }}
          ref={dateRef}
          aria-label="Tarih seçin"
          aria-describedby="date-help"
        />
        <span className="date-display">{displayD}</span>
      </div>
      <button
        className="btn btn-add"
        disabled={!canAdd}
        style={{ width: "fit-content", whiteSpace: "nowrap" }}
        onClick={() => {
          const n = parsed;
          if (!canAdd) return;
          const rounded = Math.round(n * 100) / 100; // 2 ondalığa yuvarla
          onAdd(t.trim(), rounded, d);
          setT("");
          setA("");
          // tarihi aynı ayda bırak
        }}
        aria-label={`${label} ekle`}
        aria-describedby={!canAdd ? "add-help" : undefined}
      >
        Ekle
      </button>
    </div>
  );
});

const List = memo(function List({
  items,
  onRemove,
  onEdit,
  maxVisible,
  scrollHeight = 260,
}: {
  items: Entry[];
  onRemove: (id: string) => void;
  onEdit?: (id: string, title: string, amount: number, date?: string) => void;
  maxVisible?: number; // örn. 3 => 3'ten fazlaysa scroll
  scrollHeight?: number;
}) {
  const overflow = maxVisible !== undefined && items.length > maxVisible;
  const listRef = useRef<HTMLDivElement | null>(null);
  const [maxVisibleHeight, setMaxVisibleHeight] = useState<number | undefined>(undefined);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>("");
  const [editAmount, setEditAmount] = useState<string>("");
  const [editDate, setEditDate] = useState<string>("");
  const editDateRef = useRef<HTMLInputElement | null>(null);

  // maxVisible kadar öğenin yüksekliğini dinamik ölç
  useLayoutEffect(() => {
    if (!overflow || !listRef.current) {
      setMaxVisibleHeight(undefined);
      return;
    }
    const itemsEls = listRef.current.querySelectorAll<HTMLElement>(".item");
    const visibleCount = Math.min(maxVisible || 2, itemsEls.length);
    
    if (itemsEls.length >= visibleCount && visibleCount > 0) {
      const first = itemsEls[0];
      const last = itemsEls[visibleCount - 1];
      const desired = last.offsetTop + last.offsetHeight - first.offsetTop;
      setMaxVisibleHeight(desired);
    } else {
      setMaxVisibleHeight(listRef.current.scrollHeight);
    }
  }, [items.length, overflow, editingId, maxVisible]);

  return (
    <div
      ref={listRef}
      className={`list ${overflow ? "scroll-area" : ""}`}
      style={overflow ? { maxHeight: maxVisibleHeight ?? scrollHeight, overflowY: "auto", paddingRight: 4 } : undefined}
      role="list"
      aria-label="Kayıt listesi"
    >
      {items.map((e) => {
        const isEditing = editingId === e.id;
        if (isEditing) {
          // Tarih sınırları: öğenin kendi ayı
          const [y, m] = e.month.split("-").map(Number);
          const last = new Date(y, m!, 0).getDate();
          const lastStr = String(last).padStart(2, "0");
          const minDate = `${e.month}-01`;
          const maxDate = `${e.month}-${lastStr}`;
          const displayEditD = (() => {
            if (!editDate) return "gg/aa/yyyy";
            const [yy, mm, dd] = editDate.split("-");
            return `${dd.padStart(2, "0")}/${mm.padStart(2, "0")}/${yy}`;
          })();
          return (
            <div key={e.id} className="item editing" role="listitem" aria-label={`${e.title} düzenleniyor`}>
              <input
                className="input"
                placeholder="Başlık"
                value={editTitle}
                onChange={(ev) => setEditTitle(ev.target.value)}
                aria-label="Kayıt başlığı"
              />
              <input
                className="input right"
                placeholder="Tutar"
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                value={editAmount}
                onChange={(ev) => setEditAmount(ev.target.value)}
                aria-label="Kayıt tutarı (TL)"
              />
              <div
                className="date-input-wrap"
                onClick={() => {
                  const el = editDateRef.current;
                  if (!el) return;
                  (el as any).showPicker?.();
                  el.focus();
                  el.click();
                }}
              >
                <input
                  className="input date-input"
                  type="date"
                  lang="en-GB"
                  value={editDate}
                  min={minDate}
                  max={maxDate}
                  onChange={(ev) => setEditDate(ev.target.value)}
                  onClick={() => {
                    const el = editDateRef.current;
                    (el as any)?.showPicker?.();
                  }}
                  ref={editDateRef}
                  aria-label="Kayıt tarihini düzenle"
                />
                <span className="date-display">{displayEditD}</span>
              </div>
              <button
                className="btn btn-save"
                onClick={() => {
                  if (!onEdit) return setEditingId(null);
                  const raw = editAmount.trim().replace(",", ".");
                  const n = parseFloat(raw);
                  if (!editTitle || Number.isNaN(n)) return;
                  const rounded = Math.round(n * 100) / 100;
                  onEdit(e.id, editTitle, rounded, editDate);
                  setEditingId(null);
                }}
                aria-label={`${e.title} kaydını kaydet`}
              >
                Kaydet
              </button>
              <button 
                className="btn" 
                onClick={() => setEditingId(null)}
                aria-label="Düzenlemeyi iptal et"
              >
                İptal
              </button>
            </div>
          );
        }
        return (
          <div key={e.id} className="item" role="listitem">
            <div 
              title={e.title} 
              className="item-title"
              data-amount={fmt.format(e.amount)}
            >
              <span className="title-text">{e.title}</span>
              {e.date ? (
                <span className="pill pill-date">
                  {(() => {
                    const [yy, mm, dd] = e.date!.split("-");
                    return `${dd.padStart(2, "0")}/${mm.padStart(2, "0")}/${yy}`;
                  })()}
                </span>
              ) : null}
            </div>
            <div className="money right">{fmt.format(e.amount)}</div>
            {/* Tarih sütunu için yer tutucu (görünmez içerik) */}
            <div aria-hidden="true"></div>
            <button
              className="btn"
              onClick={() => {
                setEditingId(e.id);
                setEditTitle(e.title);
                setEditAmount(String(e.amount).replace(".", ","));
                setEditDate(e.date ?? `${e.month}-01`);
              }}
              aria-label={`${e.title} kaydını düzenle`}
            >
              Düzenle
            </button>
            <button 
              className="btn btn-danger" 
              onClick={() => onRemove(e.id)}
              aria-label={`${e.title} kaydını sil`}
            >
              Kaldır
            </button>
          </div>
        );
      })}
      {items.length === 0 && (
        <div 
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 8px',
            textAlign: 'center',
            color: 'var(--muted)',
            gap: '12px'
          }}
        >
          <div style={{ fontSize: '16px', fontWeight: '500' }}>Henüz kayıt yok</div>
          
        </div>
      )}
    </div>
  );
});

/** ==== Asıl Uygulama ==== */
export default function FinanceApp() {
  /** durum */
  const [month, setMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [entries, setEntries] = useState<Entry[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [showFiles, setShowFiles] = useState<boolean>(false);
  const [folderFiles, setFolderFiles] = useState<{ name: string; file: MonthFile }[]>([]);
  
  /** File System Access API durumu */
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [connectedFolder, setConnectedFolder] = useState<string>('');
  
  /** Loading states */
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  
  /** Confirmation dialog state */
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });
  

  /** Klavye kısayolları ve erişilebilirlik */
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ctrl/Cmd tuşu kontrolü
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 's':
            e.preventDefault();
            if (directoryHandle) {
              saveToFolder();
            } else {
              showNotification('⚠️ Önce bir klasör seçin! (Ctrl+S)', 'error', 3000);
            }
            break;
          case 'h':
            // Ctrl+H - Ana sayfa / Header'a odaklan
            e.preventDefault();
            const headerButton = document.querySelector('button[title*="Klasör"]') as HTMLElement;
            headerButton?.focus();
            break;
        }
      } else if (e.key === 'Escape') {
        // Escape - Aktif dialog'ları kapat
        if (confirmDialog.isOpen) {
          confirmDialog.onCancel?.();
        }
      }
    }
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [directoryHandle, month, entries, confirmDialog]);

  /** Ay değiştiğinde seçilen klasörden veri yükle */
  useEffect(() => {
    if (!directoryHandle) return;
    
    setIsLoading(true);
    setLoadingMessage('Veriler yükleniyor...');
    
    // Mevcut ayın verilerini temizle
    setEntries(prev => prev.filter(e => e.month !== month));
    setHasUnsavedChanges(false);
    
    // Seçilen klasörden ay dosyasını yükle
    loadMonthFromDirectory(month).then(monthFile => {
      if (monthFile) {
        setEntries(prev => {
          const merged = [...prev];
          for (const e of monthFile.entries) {
            merged.push({ ...e, month: monthFile.month } as Entry);
          }
          // Aynı id tekrar eklenmesin diye uniq yap
          const map = new Map<string, Entry>();
          for (const x of merged) map.set(x.id, x);
          return Array.from(map.values()).sort((a, b) => a.createdAt - b.createdAt);
        });
        console.log(`Veriler klasörden yüklendi: ${month}`);
      } else {
        console.log(`${month} için dosya bulunamadı`);
      }
    }).catch(error => {
      console.error('Dosya yükleme hatası:', error);
      showNotification(
        `⚠️ ${month} verisi yüklenemedi: ${error.message || 'Bilinmeyen hata'}`, 
        'error', 
        4000
      );
    }).finally(() => {
      setIsLoading(false);
      setLoadingMessage('');
    });
  }, [month, directoryHandle]);

  /** directoryHandle değiştiğinde klasördeki dosyaları yükle */
  useEffect(() => {
    if (directoryHandle) {
      setIsLoading(true);
      setLoadingMessage('Klasör dosyaları yükleniyor...');
      
      loadFilesFromDirectory().then(files => {
        setFolderFiles(files);
      }).catch(error => {
        console.error('Klasör dosya listesi yükleme hatası:', error);
        showNotification('⚠️ Klasör dosyaları yüklenemedi', 'error', 3000);
      }).finally(() => {
        setIsLoading(false);
        setLoadingMessage('');
      });
    } else {
      setFolderFiles([]);
    }
  }, [directoryHandle]);

  


  /** Filtre & toplamlar */
  const byType = (type: EntryType) => entries.filter((e) => e.month === month && e.type === type);
  const sum = (arr: Entry[]) => arr.reduce((a, b) => a + b.amount, 0);

  const incomes = useMemo(() => byType("income"), [entries, month]);
  const fixeds = useMemo(() => byType("fixed"), [entries, month]);
  const cards = useMemo(() => byType("card"), [entries, month]);
  const variables = useMemo(() => byType("variable"), [entries, month]);

  const totals = {
    income: sum(incomes),
    fixed: sum(fixeds),
    card: sum(cards),
    variable: sum(variables),
  };
  const totalExpense = totals.fixed + totals.card + totals.variable;
  const net = totals.income - totalExpense;

  /** Confirmation dialog helper */
  function showConfirmDialog(title: string, message: string, onConfirm: () => void, onCancel?: () => void) {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => {
        onCancel?.();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  }

  /** CRUD */
  const add = useCallback((type: EntryType, title: string, amount: number, date: string) => {
    const e: Entry = { id: crypto.randomUUID(), month, type, title, amount, date, createdAt: Date.now() };
    setEntries((prev) => [...prev, e]);
    setHasUnsavedChanges(true);
  }, [month]);
  
  const remove = useCallback((id: string) => {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;
    
    showConfirmDialog(
      '🗑️ Kayıt Sil',
      `"${entry.title}" kaydını silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz.`,
      () => {
        setEntries((prev) => prev.filter((x) => x.id !== id));
        setHasUnsavedChanges(true);
        showNotification('🗑️ Kayıt silindi', 'info', 2000);
      }
    );
  }, [entries]);
  
  const edit = useCallback((id: string, title: string, amount: number, date?: string) => {
    setEntries((prev) =>
      prev.map((x) => (x.id === id ? { ...x, title, amount, date: date !== undefined ? date : x.date } : x))
    );
    setHasUnsavedChanges(true);
  }, []);

  /** İçe aktarma: sağ paneldeki dosyaya basınca belleğe merge */
  const importMonthFile = useCallback((mf: MonthFile) => {
    setEntries((prev) => {
      const merged = [...prev];
      for (const e of mf.entries) merged.push({ ...e, month: mf.month } as Entry);
      const map = new Map<string, Entry>();
      for (const x of merged) map.set(x.id, x);
      return Array.from(map.values()).sort((a, b) => a.createdAt - b.createdAt);
    });
    // aktif ayı, import edilen aya çekmek istersen:
    setMonth(mf.month);
  }, []);
  
  // getCurrentMonthFile function removed since we're using localStorage

  /** File System Access - Klasörden JSON dosyalarını okuma */
  async function loadFilesFromDirectory(): Promise<{ name: string; file: MonthFile }[]> {
    if (!directoryHandle) return [];
    
    try {
      const files: { name: string; file: MonthFile }[] = [];
      
      // Klasördeki tüm dosyaları tara
      for await (const [name, handle] of (directoryHandle as any).entries()) {
        if (handle.kind === 'file' && name.endsWith('.json')) {
          try {
            const file = await handle.getFile();
            const content = await file.text();
            const monthFile = JSON.parse(content) as MonthFile;
            
            // Dosya geçerli MonthFile formatında mı kontrol et
            if (monthFile && monthFile.month && Array.isArray(monthFile.entries)) {
              // Dosya adından ay bilgisini çıkar (2025-08.json -> 2025-08)
              const monthMatch = name.match(/(\d{4}-\d{2})\.json$/);
              if (monthMatch) {
                files.push({ name: monthMatch[1], file: monthFile });
              } else {
                // Eğer dosya adı formatı uygun değilse, içeriğindeki month'u kullan
                files.push({ name: monthFile.month, file: monthFile });
              }
            }
          } catch (error) {
            console.warn(`Dosya okunamadı veya geçersiz format: ${name}`, error);
          }
        }
      }
      
      // Tarihe göre sırala (eski->yeni)
      files.sort((a, b) => a.name.localeCompare(b.name));
      return files;
    } catch (error) {
      console.error('Klasör okuma hatası:', error);
      return [];
    }
  }
  
  /** Belirli bir ay dosyasını klasörden oku */
  async function loadMonthFromDirectory(month: string): Promise<MonthFile | null> {
    if (!directoryHandle) return null;
    
    try {
      const fileHandle = await directoryHandle.getFileHandle(`${month}.json`);
      const file = await fileHandle.getFile();
      const content = await file.text();
      return JSON.parse(content) as MonthFile;
    } catch (error) {
      // Dosya bulunamazsa null dön
      return null;
    }
  }
  
  /** Bildirim göster helper fonksiyonu */
  function showNotification(message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000) {
    const colors = {
      success: '#10b981',
      error: '#ef4444', 
      info: '#3b82f6'
    };
    
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 1000;
      background: ${colors[type]}; color: white; padding: 12px 16px;
      border-radius: 8px; font-size: 14px; font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideInRight 0.3s ease-out;
      max-width: 320px; word-wrap: break-word;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
      setTimeout(() => notification.remove(), 300);
    }, duration - 300);
  }

  /** File System Access - Klasör seçme */
  async function selectFolder() {
    try {
      // File System Access API destekleniyorsa
      if ('showDirectoryPicker' in window) {
        const handle = await (window as any).showDirectoryPicker({
          mode: 'readwrite'
        });
        
        // İzin kontrolü
        const permission = await handle.requestPermission({ mode: 'readwrite' });
        if (permission !== 'granted') {
          showNotification('⚠️ Klasör yazma izni gerekli', 'error', 4000);
          return;
        }
        
        setDirectoryHandle(handle);
        setConnectedFolder(handle.name);
        showNotification(`📁 Klasör bağlandı: ${handle.name}`, 'success');
        
      } else {
        showNotification(
          '❌ File System Access API bu tarayıcıda desteklenmiyor.\nChrome, Edge veya yeni bir tarayıcı kullanın.', 
          'error', 
          5000
        );
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Kullanıcı iptal etti - sessiz geç
        console.log('Klasör seçimi iptal edildi');
      } else {
        console.error('Klasör seçimi hatası:', error);
        showNotification(
          `❌ Klasör seçim hatası: ${error.message || 'Bilinmeyen hata'}`, 
          'error', 
          4000
        );
      }
    }
  }
  
  /** File System Access - Dosyayı klasöre kaydet */
  async function saveToFolder() {
    if (!directoryHandle) {
      alert('Önce bir klasör seçin!');
      return;
    }
    
    setIsSaving(true);
    setLoadingMessage(`${month}.json kaydediliyor...`);
    
    try {
      const monthEntries = entries
        .filter((x) => x.month === month)
        .map(({ month: _m, ...rest }) => rest);
      const file: MonthFile = { month, entries: monthEntries };
      const content = JSON.stringify(file, null, 2);
      
      const fileHandle = await directoryHandle.getFileHandle(`${month}.json`, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      
      setHasUnsavedChanges(false);
      
      // Klasör dosya listesini güncelle
      const updatedFiles = await loadFilesFromDirectory();
      setFolderFiles(updatedFiles);
      
      showNotification(`💾 Dosya kaydedildi: ${month}.json`, 'success');
      
    } catch (error: any) {
      console.error('Dosya kaydetme hatası:', error);
      
      // Detaylı hata mesajları
      let errorMessage = '❌ Dosya kaydedilemedi';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = '🚫 Klasör yazma izni reddedildi';
      } else if (error.name === 'AbortError') {
        errorMessage = '⏸️ Kaydetme işlemi iptal edildi'; 
      } else if (error.name === 'QuotaExceededError') {
        errorMessage = '💾 Disk alanı yetersiz';
      } else if (error.message) {
        errorMessage = `❌ Hata: ${error.message}`;
      }
      
      showNotification(errorMessage, 'error', 4000);
    } finally {
      setIsSaving(false);
      setLoadingMessage('');
    }
  }


  return (
    <div className="container">
      {/* Skip Navigation Link */}
      <a href="#main-content" className="skip-link">
        Ana içeriğe geç
      </a>
      
      {/* Loading Overlay */}
      {(isLoading || isSaving) && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 17, 21, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(4px)'
          }}
        >
          <div 
            style={{
              background: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: 'var(--text)',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            <div 
              style={{
                width: '24px',
                height: '24px',
                border: '3px solid var(--border)',
                borderTop: '3px solid var(--ok)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}
            />
            {loadingMessage || 'İşlem yapılıyor...'}
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 17, 21, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            backdropFilter: 'blur(4px)'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              confirmDialog.onCancel?.();
            }
          }}
        >
          <div 
            style={{
              background: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '420px',
              width: '90%',
              color: 'var(--text)'
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>
              {confirmDialog.title}
            </h3>
            <p style={{ 
              margin: '0 0 24px 0', 
              lineHeight: '1.5',
              whiteSpace: 'pre-line',
              color: 'var(--muted)'
            }}>
              {confirmDialog.message}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                className="btn"
                onClick={confirmDialog.onCancel}
                style={{
                  background: 'var(--panel-2)',
                  border: '1px solid var(--border)'
                }}
              >
                İptal
              </button>
              <button 
                className="btn btn-danger"
                onClick={confirmDialog.onConfirm}
                style={{
                  background: '#dc2626',
                  color: 'white',
                  border: '1px solid #b91c1c'
                }}
              >
                Onayla
              </button>
            </div>
          </div>
        </div>
      )}
      
      <header className="card">
        <div className="row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              background: 'linear-gradient(135deg, var(--ok) 0%, #34d399 100%)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              boxShadow: '0 2px 8px rgba(62, 207, 142, 0.3)'
            }}>
              💰
            </div>
            <h2 style={{ margin: 0, fontWeight: '700' }}>Aylık Finans</h2>
          </div>
          <span 
            style={{ 
              fontSize: '12px', 
              color: 'var(--muted)', 
              cursor: 'help',
              padding: '6px 10px',
              background: 'var(--panel-2)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              marginLeft: '8px',
              transition: 'all 0.2s ease-in-out'
            }}
            title="Klavye Kısayolları:&#10;Ctrl+S: Kaydet&#10;Ctrl+H: Header'a odaklan&#10;Escape: Dialog kapat"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--panel)';
              e.currentTarget.style.borderColor = 'var(--ok)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--panel-2)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            ⌨️ Kısayollar
          </span>
          <input 
            className="input" 
            type="month" 
            value={month} 
            onChange={(e) => { 
              const newMonth = e.target.value;
              if (hasUnsavedChanges) {
                showConfirmDialog(
                  '⚠️ Kaydedilmemiş Değişiklikler',
                  `Mevcut aydaki değişiklikleriniz kaydedilmemiş.\n\n${newMonth} ayına geçmek istediğinizden emin misiniz?`,
                  () => {
                    setMonth(newMonth);
                    setHasUnsavedChanges(false);
                  }
                );
              } else {
                setMonth(newMonth);
              }
            }} 
            aria-label="Ay seçin"
          />
          
          {/* File System Access Butonları */}
          <button 
            className={`btn ${!connectedFolder ? 'btn-folder pulse' : ''}`}
            onClick={selectFolder}
            style={{ background: connectedFolder ? '#10b981' : '#B18A26', color: '#000', fontWeight: 'bold' }}
            title={connectedFolder ? `Bağlı: ${connectedFolder}` : 'Klasör seç'}
            aria-label={connectedFolder ? `Bağlı klasör: ${connectedFolder}` : 'Klasör bağla'}
          >
            {connectedFolder ? `📁 ${connectedFolder}` : '📁 Klasör Bağla'}
          </button>
          
          
          <button className="btn" onClick={() => setShowFiles((v) => !v)} style={{ marginLeft: 'auto' }}>
            {showFiles ? "Ay dosyalarını gizle" : "Ay dosyalarını göster"}
          </button>
          <button 
            className={`btn btn-save ${hasUnsavedChanges && !isSaving && directoryHandle ? 'pulse' : ''} ${!directoryHandle ? 'btn-save-inactive' : ''}`} 
            onClick={() => {
              if (directoryHandle) {
                saveToFolder();
              } else {
                showNotification('⚠️ Önce bir klasör seçin!', 'error', 3000);
              }
            }}
            disabled={isSaving || isLoading}
            style={{ 
              marginLeft: 8,
              background: directoryHandle ? (isSaving ? '#6b7280' : '#10b981') : '#6b7280',
              opacity: directoryHandle && !isSaving && !isLoading ? 1 : 0.6,
              cursor: isSaving || isLoading ? 'not-allowed' : 'pointer'
            }}
            title={
              isSaving ? 'Kaydediliyor...' : 
              isLoading ? 'Yükleniyor...' :
              directoryHandle ? 'Klasöre kaydet' : 'Önce bir klasör seçin'
            }
          >
            {isSaving ? '⏳ ' : directoryHandle ? '' : '⚠️ '} 
            {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </header>

      {/* 2 ana sütun grid - eşit yükseklikli kartlar */}
      <main 
        id="main-content"
        style={{ 
          display: "flex",
          flexDirection: "column",
          gap: 16,
          minHeight: "calc(100vh - 120px)" // Header'dan sonra kalan alanı kullan
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            gap: 16,
            alignItems: "stretch", // Kartların eşit yükseklik almasını sağla
            flex: 1
          }}
        >
        {/* SOL KOLON: Gelir ve Özet ayrı kartlar */}
        <div 
          style={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: 16,
            minHeight: "100%" // Parent'in tüm yüksekliğini kullan
          }}
        >
          {/* GELİR - Flex grow ile mevcut alanı kapla */}
          <section 
            className="card" 
            style={{ 
              marginBottom: 0, 
              flex: "1 1 auto", // Mevcut alanı kapla
              display: "flex",
              flexDirection: "column"
            }}
          >
            <h3 style={{ marginTop: 0 }}>💰 Gelir</h3>
            <AddRow baseMonth={month} label="Gelir" onAdd={(t, a, d) => add("income", t, a, d)} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <List items={incomes} onRemove={remove} onEdit={edit} maxVisible={7} />
            </div>
            <div className="right" style={{ marginTop: 8, fontWeight: 700 }}>
              Toplam: <span className="money">{fmt.format(totals.income)}</span>
            </div>
          </section>

          {/* ÖZET - Minimum yükseklik */}
          <section 
            className="card" 
            style={{ 
              marginBottom: 0,
              flex: "0 0 auto" // Minimum gerekli yüksekliği al
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>📊 Özet</h3>
              <div style={{ 
                fontSize: "1.3rem", 
                fontWeight: "bold", 
                color: net >= 0 ? "var(--ok)" : "var(--bad)",
                padding: "8px 16px",
                background: net >= 0 ? "rgba(62, 207, 142, 0.1)" : "rgba(239, 68, 68, 0.1)",
                border: `2px solid ${net >= 0 ? "var(--ok)" : "var(--bad)"}`,
                borderRadius: "8px",
                textAlign: "center",
                minWidth: "140px",
                boxShadow: `0 2px 8px ${net >= 0 ? "rgba(62, 207, 142, 0.2)" : "rgba(239, 68, 68, 0.2)"}`
              }}>
                <div style={{ fontSize: "0.8rem", fontWeight: "normal", opacity: 0.8, marginBottom: "2px" }}>
                  Net Bakiye
                </div>
                {fmt.format(net)}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div style={{ backgroundColor: "var(--panel-2)", padding: 8, borderRadius: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>Gelir:</div>
                  <div style={{ fontWeight: "bold", color: "var(--ok)" }}>{fmt.format(totals.income)}</div>
                </div>
              </div>
              <div style={{ backgroundColor: "var(--panel-2)", padding: 8, borderRadius: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>Toplam Gider:</div>
                  <div style={{ fontWeight: "bold", color: totalExpense > 0 ? "var(--bad)" : "var(--text)" }}>{fmt.format(totalExpense)}</div>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              <div style={{ backgroundColor: "var(--panel-2)", padding: 6, borderRadius: 4, fontSize: "0.9rem" }}>
                <div>Sabit Giderler</div>
                <div style={{ fontWeight: "bold" }}>{fmt.format(totals.fixed)}</div>
              </div>
              <div style={{ backgroundColor: "var(--panel-2)", padding: 6, borderRadius: 4, fontSize: "0.9rem" }}>
                <div>Kredi Kartı</div>
                <div style={{ fontWeight: "bold" }}>{fmt.format(totals.card)}</div>
              </div>
              <div style={{ backgroundColor: "var(--panel-2)", padding: 6, borderRadius: 4, fontSize: "0.9rem" }}>
                <div>Değişken Giderler</div>
                <div style={{ fontWeight: "bold" }}>{fmt.format(totals.variable)}</div>
              </div>
            </div>
            <div className="note" style={{ marginTop: 8, fontSize: "0.8rem" }}>Net = Gelir − (Sabit + Kart + Değişken)</div>
          </section>
        </div>

        {/* SAĞ KOLON: Tüm giderler tek kartta - sol kolon ile aynı yükseklik */}
        <section 
          className="card" 
          style={{ 
            marginBottom: 0,
            display: "flex",
            flexDirection: "column",
            minHeight: "100%" // Sol kolon ile eşit yükseklik
          }}
        >
          <h3>💸 Sabit Giderler</h3>
          <AddRow baseMonth={month} label="Sabit gider" onAdd={(t, a, d) => add("fixed", t, a, d)} />
          <List items={fixeds} onRemove={remove} onEdit={edit} maxVisible={2} />
          <div className="right" style={{ marginTop: 8, fontWeight: 700 }}>
            Toplam: <span className="money">{fmt.format(totals.fixed)}</span>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "16px 0" }} />

          <h3>💳 Kredi Kartı</h3>
          <AddRow baseMonth={month} label="Kart kalemi" onAdd={(t, a, d) => add("card", t, a, d)} />
          <List items={cards} onRemove={remove} onEdit={edit} maxVisible={2} />
          <div className="right" style={{ marginTop: 8, fontWeight: 700 }}>
            Toplam: <span className="money">{fmt.format(totals.card)}</span>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "16px 0" }} />

          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <h3>📦 Değişken Giderler</h3>
            <AddRow baseMonth={month} label="Değişken" onAdd={(t, a, d) => add("variable", t, a, d)} />
            <div style={{ flex: 1 }}>
              <List items={variables} onRemove={remove} onEdit={edit} maxVisible={2} />
            </div>
            <div className="right" style={{ marginTop: 8, fontWeight: 700 }}>
              Toplam: <span className="money">{fmt.format(totals.variable)}</span>
            </div>
          </div>
        </section>
        </div>

        {/* Alt kısım: Dosya kartı (ilk açılışta gizli) */}
        {showFiles && (
          <aside className="card" style={{ marginTop: 8 }}>
            <h3 style={{ marginTop: 0 }}>📁 Klasör Dosyaları</h3>
            {!directoryHandle && (
              <div 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px 16px',
                  textAlign: 'center',
                  color: 'var(--muted)',
                  gap: '12px'
                }}
              >
                <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                  Dosyaları görmek için<br />yukarıdan "📁 Klasör Bağla" butonuna tıklayın
                </div>
              </div>
            )}
            {directoryHandle && folderFiles.length === 0 && (
              <div 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px 16px',
                  textAlign: 'center',
                  color: 'var(--muted)',
                  gap: '12px'
                }}
              >
                <div style={{ fontSize: '36px', opacity: 0.4 }}>📄</div>
                <div style={{ fontSize: '16px', fontWeight: '500' }}>JSON dosyası bulunamadı</div>
                <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                  Seçilen klasörde hiç ay dosyası yok.<br />
                  İlk kaydınızı ekleyip "💾 Kaydet" ile dosya oluşturun.
                </div>
              </div>
            )}
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {folderFiles.map(({ name, file }) => (
                <li key={name} className="item" style={{ gridTemplateColumns: "1fr auto" }}>
                  <div title={`${name}.json`}>{name}.json</div>
                  <button className="btn" onClick={() => importMonthFile(file)}>İçe aktar</button>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </main>
    </div>
  );
}
