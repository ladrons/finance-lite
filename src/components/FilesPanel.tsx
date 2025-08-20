import { listMonthFiles } from "../lib/dataIndex";
import type { MonthFile } from "../lib/dataIndex";

export default function FilesPanel({ onImport }: {
    onImport: (mf: MonthFile) => void;
}) {
    const files = listMonthFiles(); // build-time'da toplanmış liste
    return (
        <aside className="card" style={{ position: "sticky", top: 16 }}>
            <h3 style={{ marginTop: 0 }}>📁 data/ ay dosyaları</h3>
            {files.length === 0 && <div className="note">src/data içinde dosya yok.</div>}
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {files.map(({ name, file }) => (
                    <li key={name} className="item" style={{ gridTemplateColumns: "1fr auto" }}>
                        <div title={name}>{name}.json</div>
                        <button className="btn" onClick={() => onImport(file)}>İçe aktar</button>
                    </li>
                ))}
            </ul>
            <div className="note" style={{ marginTop: 8 }}>
                Yeni ay eklemek için <code>src/data/2025-09.json</code> dosyası oluşturman yeter.
            </div>
        </aside>
    );
}
