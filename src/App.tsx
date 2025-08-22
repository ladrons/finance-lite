// src/App.tsx
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import { useMemo, useState, useEffect, useLayoutEffect, useRef } from "react";
import "./index.css";

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
function AddRow({ label, onAdd, baseMonth }: { label: string; onAdd: (t: string, a: number, d: string) => void; baseMonth: string }) {
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
      />
      <input
        className="input right"
        placeholder="Tutar"
        type="text"
        inputMode="decimal"
        pattern="[0-9]*[.,]?[0-9]*"
        value={a}
        onChange={(e) => setA(e.target.value)}
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
      >
        Ekle
      </button>
    </div>
  );
}

function List({
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
  const [twoRowHeight, setTwoRowHeight] = useState<number | undefined>(undefined);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>("");
  const [editAmount, setEditAmount] = useState<string>("");
  const [editDate, setEditDate] = useState<string>("");
  const editDateRef = useRef<HTMLInputElement | null>(null);

  // İki satır yüksekliğini dinamik ölç: 2+ öğe varsa ilk iki .item'ın toplam yüksekliği
  useLayoutEffect(() => {
    if (!overflow || !listRef.current) {
      setTwoRowHeight(undefined);
      return;
    }
    const itemsEls = listRef.current.querySelectorAll<HTMLElement>(".item");
    if (itemsEls.length >= 2) {
      const first = itemsEls[0];
      const second = itemsEls[1];
      const desired = second.offsetTop + second.offsetHeight - first.offsetTop;
      setTwoRowHeight(desired);
    } else {
      setTwoRowHeight(listRef.current.scrollHeight);
    }
  }, [items.length, overflow, editingId]);

  return (
    <div
      ref={listRef}
      className={`list ${overflow ? "scroll-area" : ""}`}
      style={overflow ? { maxHeight: twoRowHeight ?? scrollHeight, overflowY: "auto", paddingRight: 4 } : undefined}
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
            <div key={e.id} className="item editing">
              <input
                className="input"
                placeholder="Başlık"
                value={editTitle}
                onChange={(ev) => setEditTitle(ev.target.value)}
              />
              <input
                className="input right"
                placeholder="Tutar"
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                value={editAmount}
                onChange={(ev) => setEditAmount(ev.target.value)}
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
              >
                Kaydet
              </button>
              <button className="btn" onClick={() => setEditingId(null)}>İptal</button>
            </div>
          );
        }
        return (
          <div key={e.id} className="item">
            <div title={e.title} className="item-title">
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
            >
              Düzenle
            </button>
            <button className="btn btn-danger" onClick={() => onRemove(e.id)}>
              Kaldır
            </button>
          </div>
        );
      })}
      {items.length === 0 && <div className="note">Kayıt yok.</div>}
    </div>
  );
}

/** ==== Asıl Uygulama ==== */
export default function App() {
  /** durum */
  const [month, setMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [entries, setEntries] = useState<Entry[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [showFiles, setShowFiles] = useState<boolean>(false);
  const [folderFiles, setFolderFiles] = useState<{ name: string; file: MonthFile }[]>([]);
  
  /** File System Access API durumu */
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [connectedFolder, setConnectedFolder] = useState<string>('');
  

  /** Klavye kısayolları */
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ctrl/Cmd tuşu kontrolü
      if (!(e.ctrlKey || e.metaKey)) return;
      
      switch (e.key.toLowerCase()) {
        case 's':
          e.preventDefault();
          if (directoryHandle) {
            saveToFolder();
          } else {
            alert('Önce bir klasör seçin!');
          }
          break;
      }
    }
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [directoryHandle, month, entries]);

  /** Ay değiştiğinde seçilen klasörden veri yükle */
  useEffect(() => {
    if (!directoryHandle) return;
    
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
    });
  }, [month, directoryHandle]);

  /** directoryHandle değiştiğinde klasördeki dosyaları yükle */
  useEffect(() => {
    if (directoryHandle) {
      loadFilesFromDirectory().then(files => {
        setFolderFiles(files);
      }).catch(error => {
        console.error('Dosya yükleme hatası:', error);
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

  /** CRUD */
  function add(type: EntryType, title: string, amount: number, date: string) {
    const e: Entry = { id: crypto.randomUUID(), month, type, title, amount, date, createdAt: Date.now() };
    setEntries((prev) => [...prev, e]);
    setHasUnsavedChanges(true);
  }
  function remove(id: string) {
    setEntries((prev) => prev.filter((x) => x.id !== id));
    setHasUnsavedChanges(true);
  }
  function edit(id: string, title: string, amount: number, date?: string) {
    setEntries((prev) =>
      prev.map((x) => (x.id === id ? { ...x, title, amount, date: date !== undefined ? date : x.date } : x))
    );
    setHasUnsavedChanges(true);
  }

  /** İçe aktarma: sağ paneldeki dosyaya basınca belleğe merge */
  function importMonthFile(mf: MonthFile) {
    setEntries((prev) => {
      const merged = [...prev];
      for (const e of mf.entries) merged.push({ ...e, month: mf.month } as Entry);
      const map = new Map<string, Entry>();
      for (const x of merged) map.set(x.id, x);
      return Array.from(map.values()).sort((a, b) => a.createdAt - b.createdAt);
    });
    // aktif ayı, import edilen aya çekmek istersen:
    setMonth(mf.month);
  }
  
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
  
  /** File System Access - Klasör seçme */
  async function selectFolder() {
    try {
      // File System Access API destekleniyorsa
      if ('showDirectoryPicker' in window) {
        const handle = await (window as any).showDirectoryPicker();
        setDirectoryHandle(handle);
        setConnectedFolder(handle.name);
        
        // Bildirim göster
        const notification = document.createElement('div');
        notification.textContent = `📁 Klasör bağlandı: ${handle.name}`;
        notification.style.cssText = `
          position: fixed; top: 20px; right: 20px; z-index: 1000;
          background: #10b981; color: white; padding: 12px 16px;
          border-radius: 8px; font-size: 14px; font-weight: 500;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
      } else {
        alert('File System Access API bu tarayıcıda desteklenmiyor. Chrome/Edge kullanın.');
      }
    } catch (error) {
      console.error('Klasör seçimi iptal edildi:', error);
    }
  }
  
  /** File System Access - Dosyayı klasöre kaydet */
  async function saveToFolder() {
    if (!directoryHandle) {
      alert('Önce bir klasör seçin!');
      return;
    }
    
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
      
      // Bildirim göster
      const notification = document.createElement('div');
      notification.textContent = `💾 Dosya kaydedildi: ${month}.json`;
      notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 1000;
        background: #3b82f6; color: white; padding: 12px 16px;
        border-radius: 8px; font-size: 14px; font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      `;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    } catch (error) {
      console.error('Dosya kaydetme hatası:', error);
      alert('Dosya kaydedilemedi!');
    }
  }


  return (
    <div className="container">
      <header className="card">
        <div className="row">
          <h2 style={{ margin: 0 }}>📆 Aylık Finans</h2>
          <span 
            style={{ 
              fontSize: '12px', 
              color: '#6b7280', 
              cursor: 'help',
              padding: '4px 8px',
              background: '#f3f4f6',
              borderRadius: '4px',
              marginLeft: '8px'
            }}
            title="Klavye Kısayolları:&#10;Ctrl+S: Kaydet"
          >
            ⌨️ Kısayollar
          </span>
          <input className="input" type="month" value={month} onChange={(e) => { setMonth(e.target.value); setHasUnsavedChanges(true); }} />
          
          {/* File System Access Butonları */}
          <button 
            className="btn" 
            onClick={selectFolder}
            style={{ background: connectedFolder ? '#10b981' : '#6b7280' }}
            title={connectedFolder ? `Bağlı: ${connectedFolder}` : 'Klasör seç'}
          >
            {connectedFolder ? `📁 ${connectedFolder}` : '📁 Klasör Bağla'}
          </button>
          
          
          <button className="btn" onClick={() => setShowFiles((v) => !v)} style={{ marginLeft: 'auto' }}>
            {showFiles ? "Ay dosyalarını gizle" : "Ay dosyalarını göster"}
          </button>
          <button 
            className={`btn btn-save ${hasUnsavedChanges ? 'pulse' : ''}`} 
            onClick={() => {
              if (directoryHandle) {
                saveToFolder();
              } else {
                alert('Önce bir klasör seçin!');
              }
            }}
            style={{ 
              marginLeft: 8,
              background: directoryHandle ? (hasUnsavedChanges ? '#ef4444' : '#10b981') : '#6b7280',
              opacity: directoryHandle ? 1 : 0.6
            }}
            title={directoryHandle ? 'Klasöre kaydet' : 'Önce bir klasör seçin'}
          >
            {directoryHandle ? '💾' : '⚠️'} Kaydet
          </button>
        </div>
      </header>

      {/* 2 ana sütun grid; alt satırda Özet 2 sütunu span'ler */}
      <main style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            gap: 16,
            alignItems: "start",
          }}
        >
          {/* SOL KOLON: Gelir ve Özet ayrı kartlar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* GELİR */}
            <section className="card" style={{ marginBottom: 0, minHeight: 500 }}>
              <h3 style={{ marginTop: 0 }}>💰 Gelir</h3>
              <AddRow baseMonth={month} label="Gelir" onAdd={(t, a, d) => add("income", t, a, d)} />
              <List items={incomes} onRemove={remove} onEdit={edit} />
              <div className="right" style={{ marginTop: 8, fontWeight: 700 }}>
                Toplam: <span className="money">{fmt.format(totals.income)}</span>
              </div>
            </section>

            {/* ÖZET */}
            <section className="card" style={{ marginBottom: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <h3 style={{ margin: 0 }}>📊 Özet</h3>
                <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: net >= 0 ? "var(--ok)" : "var(--bad)" }}>
                  Net: {fmt.format(net)}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div style={{ backgroundColor: "var(--bg-alt)", padding: 8, borderRadius: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>Gelir:</div>
                    <div style={{ fontWeight: "bold", color: "var(--ok)" }}>{fmt.format(totals.income)}</div>
                  </div>
                </div>
                <div style={{ backgroundColor: "var(--bg-alt)", padding: 8, borderRadius: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>Toplam Gider:</div>
                    <div style={{ fontWeight: "bold", color: totalExpense > 0 ? "var(--bad)" : "var(--text)" }}>{fmt.format(totalExpense)}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                <div style={{ backgroundColor: "var(--bg-alt)", padding: 6, borderRadius: 4, fontSize: "0.9rem" }}>
                  <div>Sabit Giderler</div>
                  <div style={{ fontWeight: "bold" }}>{fmt.format(totals.fixed)}</div>
                </div>
                <div style={{ backgroundColor: "var(--bg-alt)", padding: 6, borderRadius: 4, fontSize: "0.9rem" }}>
                  <div>Kredi Kartı</div>
                  <div style={{ fontWeight: "bold" }}>{fmt.format(totals.card)}</div>
                </div>
                <div style={{ backgroundColor: "var(--bg-alt)", padding: 6, borderRadius: 4, fontSize: "0.9rem" }}>
                  <div>Değişken Giderler</div>
                  <div style={{ fontWeight: "bold" }}>{fmt.format(totals.variable)}</div>
                </div>
              </div>
              <div className="note" style={{ marginTop: 8, fontSize: "0.8rem" }}>Net = Gelir − (Sabit + Kart + Değişken)</div>
            </section>
          </div>

          {/* SAĞ KOLON: Tüm giderler tek kartta */}
          <section className="card" style={{ marginBottom: 0, alignSelf: "start" }}>
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

            <h3>📦 Değişken Giderler</h3>
            <AddRow baseMonth={month} label="Değişken" onAdd={(t, a, d) => add("variable", t, a, d)} />
            <List items={variables} onRemove={remove} onEdit={edit} maxVisible={2} />
            <div className="right" style={{ marginTop: 8, fontWeight: 700 }}>
              Toplam: <span className="money">{fmt.format(totals.variable)}</span>
            </div>
          </section>
        </div>

        {/* Alt kısım: Dosya kartı (ilk açılışta gizli) */}
        {showFiles && (
          <aside className="card" style={{ marginTop: 8 }}>
            <h3 style={{ marginTop: 0 }}>📁 Klasör Dosyaları</h3>
            {!directoryHandle && <div className="note">Dosyaları görmek için önce bir klasör seçin.</div>}
            {directoryHandle && folderFiles.length === 0 && <div className="note">Seçilen klasörde JSON dosyası bulunamadı.</div>}
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
