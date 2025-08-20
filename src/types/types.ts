export type EntryType = "income" | "fixed" | "card" | "variable";

export interface Entry {
    id: string;
    month: string;          // "YYYY-MM"
    type: EntryType;
    title: string;
    amount: number;
    createdAt: number;
}

export type MonthFile = {
    month: string;
    entries: Omit<Entry, "month">[];
};
