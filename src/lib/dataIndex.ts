// Vite özelliği: src/data/*.json eşleşen TÜM dosyaları modül olarak içe al
// eager:true => build-time'da hemen import et; JSON otomatik parse edilir
const modules = import.meta.glob("../data/*.json", { eager: true });

// { name: "2025-08", file: MonthFile } listesi üret
export type MonthFile = {
    month: string;
    entries: Array<{
        id: string; type: "income" | "fixed" | "card" | "variable";
        title: string; amount: number; createdAt: number;
    }>;
};

export function listMonthFiles(): { name: string; file: MonthFile }[] {
    const out: { name: string; file: MonthFile }[] = [];
    for (const [path, mod] of Object.entries(modules)) {
        // path örn: ../data/2025-08.json
        const name = path.match(/([\d]{4}-[\d]{2})\.json$/)?.[1];
        if (!name) continue;
        out.push({ name, file: mod as unknown as MonthFile });
    }
    // isimlere göre sırala (eskiden yeniye)
    out.sort((a, b) => a.name.localeCompare(b.name));
    return out;
}
