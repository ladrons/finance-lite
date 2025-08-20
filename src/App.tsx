// src/App.tsx
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

/** ==== src/data içindeki tüm ay dosyalarını build-time'da yakala ==== */
/**
 * NOT: Ay dosyalarını `src/data/2025-08.json` gibi koy.
 * Yeni dosya eklediğinde Vite otomatik yakalar (yeniden derleme sırasında).
 */
const dataModules = import.meta.glob("../src/data/*.json", { eager: true }) as Record<
  string,
  MonthFile
>;

/** Yol -> "YYYY-MM" çıkar, listele */
function listMonthFiles(): { name: string; file: MonthFile }[] {
  const out: { name: string; file: MonthFile }[] = [];
  for (const [path, file] of Object.entries(dataModules)) {
    const m = path.match(/(\d{4}-\d{2})\.json$/)?.[1];
    if (m) out.push({ name: m, file });
  }
  // Eski->Yeni sırala
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

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
  const files = listMonthFiles(); // sağ panel listesi (src/data/..)

  /** Açılışta: localStorage'dan verileri yükle veya src/data'dan içe aktar */
  useEffect(() => {
    // Önce localStorage'dan kayıtlı verileri kontrol et
    const savedData = localStorage.getItem(`finance-lite-${month}`);
    
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        // localStorage'dan verileri yükle
        setEntries((prev) => {
          const merged = [...prev];
          for (const e of parsedData.entries) merged.push({ ...e, month: parsedData.month } as Entry);
          const map = new Map<string, Entry>();
          for (const x of merged) map.set(x.id, x);
          return Array.from(map.values()).sort((a, b) => a.createdAt - b.createdAt);
        });
        console.log(`Veriler localStorage'dan yüklendi: ${month}`);
      } catch (error) {
        console.error('localStorage verileri yüklenirken hata:', error);
      }
    } else {
      // localStorage'da veri yoksa dosyadan yükle
      const f = files.find((x) => x.name === month);
      if (f) {
        // tek seferlik merge (aynı id tekrar eklenmesin diye uniq yapıyoruz)
        setEntries((prev) => {
          const merged = [...prev];
          for (const e of f.file.entries) merged.push({ ...e, month: f.file.month } as Entry);
          const map = new Map<string, Entry>();
          for (const x of merged) map.set(x.id, x);
          return Array.from(map.values()).sort((a, b) => a.createdAt - b.createdAt);
        });
        console.log(`Veriler dosyadan yüklendi: ${month}`);
      }
    }
  }, [month]);  

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

  /** Bu ayı tek dosya olarak indir */
  function exportCurrentMonth() {
    // Önce kayıt işlemini yap
    saveChanges();
    
    // Sonra dosyayı indir
    const monthEntries = entries
      .filter((x) => x.month === month)
      .map(({ month: _m, ...rest }) => rest);
    const file: MonthFile = { month, entries: monthEntries };
    const blob = new Blob([JSON.stringify(file, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${month}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  
  /** Değişiklikleri kaydet - localStorage'a kaydeder */
  function saveChanges() {
    const monthEntries = entries
      .filter((x) => x.month === month)
      .map(({ month: _m, ...rest }) => rest);
    const file: MonthFile = { month, entries: monthEntries };
    
    try {
      // localStorage'a kaydet
      localStorage.setItem(`finance-lite-${month}`, JSON.stringify(file));
      console.log(`Veriler localStorage'a kaydedildi: ${month}`);
      setHasUnsavedChanges(false);
      
      // Kullanıcıya bildirim göster (sağ üst köşede)
      const saveNotification = document.createElement('div');
      saveNotification.textContent = 'Kaydedildi ✓';
      saveNotification.style.position = 'fixed';
      saveNotification.style.top = '20px';
      saveNotification.style.right = '20px';
      saveNotification.style.backgroundColor = 'var(--ok)';
      saveNotification.style.color = '#000';
      saveNotification.style.padding = '10px 15px';
      saveNotification.style.borderRadius = '4px';
      saveNotification.style.zIndex = '1000';
      saveNotification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
      document.body.appendChild(saveNotification);
      
      // 2 saniye sonra bildirimi kaldır
      setTimeout(() => {
        document.body.removeChild(saveNotification);
      }, 2000);
    } catch (error) {
      console.error('Veriler kaydedilirken hata oluştu:', error);
      alert('Kaydetme sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    }
  }

  return (
    <div className="container">
      <header className="card">
        <div className="row">
          <h2 style={{ margin: 0 }}>📆 Aylık Finans</h2>
          <input className="input" type="month" value={month} onChange={(e) => { setMonth(e.target.value); setHasUnsavedChanges(true); }} />
          <button className="btn" onClick={exportCurrentMonth}>Bu Ayı Dışa Aktar</button>
          <button className="btn" onClick={() => setShowFiles((v) => !v)} style={{ marginLeft: 'auto' }}>
            {showFiles ? "Ay dosyalarını gizle" : "Ay dosyalarını göster"}
          </button>
          <button 
            className={`btn btn-save ${hasUnsavedChanges ? 'pulse' : ''}`} 
            onClick={saveChanges}
            style={{ marginLeft: 8 }}
          >
            Kaydet
          </button>
          {/* <span className="note">Tek dosya/ay • src/data/*.json otomatik listelenir</span> */}
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
            <h3 style={{ marginTop: 0 }}>📁 src/data ay dosyaları</h3>
            {files.length === 0 && <div className="note">src/data klasörüne 2025-08.json gibi dosya ekle.</div>}
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {files.map(({ name, file }) => (
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
