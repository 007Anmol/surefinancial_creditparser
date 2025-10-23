import React, { useMemo, useState } from "react";

export type TransactionType = "credit" | "debit";
export type TransactionStatus = "posted" | "pending" | "failed";

export interface Transaction {
    id: string | number;
    date: string; // ISO date string
    description: string;
    amount: number; // positive value; type distinguishes credit/debit
    currency?: string; // e.g. "USD"
    type: TransactionType;
    status?: TransactionStatus;
    meta?: Record<string, unknown>;
}

type SortKey = "date" | "description" | "amount" | "status";
type SortDirection = "asc" | "desc";

interface Props {
    transactions: Transaction[];
    pageSize?: number;
    initialSort?: { key: SortKey; direction?: SortDirection };
    onEdit?: (tx: Transaction) => void;
    onDelete?: (tx: Transaction) => void;
}

function formatCurrency(value: number, currency = "USD") {
    try {
        return new Intl.NumberFormat(undefined, {
            style: "currency",
            currency,
            maximumFractionDigits: 2,
        }).format(value);
    } catch {
        return `${currency} ${value.toFixed(2)}`;
    }
}

function formatDate(iso: string) {
    try {
        const d = new Date(iso);
        return d.toLocaleDateString();
    } catch {
        return iso;
    }
}

export default function TransactionTable({
    transactions,
    pageSize = 10,
    initialSort = { key: "date", direction: "desc" },
    onEdit,
    onDelete,
}: Props) {
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(0);
    const [sortKey, setSortKey] = useState<SortKey>(initialSort.key);
    const [sortDir, setSortDir] = useState<SortDirection>(
        initialSort.direction ?? "asc"
    );

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return transactions;
        return transactions.filter((t) => {
            return (
                t.description.toLowerCase().includes(q) ||
                (t.status ?? "").toLowerCase().includes(q) ||
                String(t.amount).includes(q) ||
                new Date(t.date).toLocaleDateString().toLowerCase().includes(q)
            );
        });
    }, [transactions, query]);

    const sorted = useMemo(() => {
        const copy = [...filtered];
        copy.sort((a, b) => {
            let res = 0;
            if (sortKey === "date") {
                res = new Date(a.date).getTime() - new Date(b.date).getTime();
            } else if (sortKey === "amount") {
                res = a.amount - b.amount;
            } else if (sortKey === "description") {
                res = a.description.localeCompare(b.description);
            } else if (sortKey === "status") {
                res = (a.status ?? "").localeCompare(b.status ?? "");
            }
            return sortDir === "asc" ? res : -res;
        });
        return copy;
    }, [filtered, sortKey, sortDir]);

    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
    const pageSafe = Math.min(page, totalPages - 1);

    const pageItems = sorted.slice(pageSafe * pageSize, pageSafe * pageSize + pageSize);

    function toggleSort(key: SortKey) {
        if (key === sortKey) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
    }

    return (
        <div style={{ width: "100%", maxWidth: 1000, margin: "0 auto" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input
                    aria-label="Search transactions"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setPage(0);
                    }}
                    placeholder="Search description, status, amount, date..."
                    style={{
                        flex: 1,
                        padding: "8px 10px",
                        borderRadius: 6,
                        border: "1px solid #ddd",
                    }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                    <button
                        onClick={() => {
                            setQuery("");
                            setPage(0);
                        }}
                        style={{
                            padding: "8px 10px",
                            borderRadius: 6,
                            border: "1px solid #ddd",
                            background: "#fff",
                            cursor: "pointer",
                        }}
                        type="button"
                    >
                        Clear
                    </button>
                </div>
            </div>

            <table
                style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    background: "#fff",
                    boxShadow: "0 0 0 1px rgba(0,0,0,0.04)",
                }}
            >
                <thead>
                    <tr style={{ textAlign: "left", fontSize: 13 }}>
                        <th
                            style={{ padding: "10px", cursor: "pointer", userSelect: "none" }}
                            onClick={() => toggleSort("date")}
                        >
                            Date {sortKey === "date" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                        </th>
                        <th
                            style={{ padding: "10px", cursor: "pointer", userSelect: "none" }}
                            onClick={() => toggleSort("description")}
                        >
                            Description{" "}
                            {sortKey === "description" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                        </th>
                        <th
                            style={{
                                padding: "10px",
                                textAlign: "right",
                                cursor: "pointer",
                                userSelect: "none",
                            }}
                            onClick={() => toggleSort("amount")}
                        >
                            Amount {sortKey === "amount" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                        </th>
                        <th
                            style={{ padding: "10px", cursor: "pointer", userSelect: "none" }}
                            onClick={() => toggleSort("status")}
                        >
                            Status {sortKey === "status" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                        </th>
                        <th style={{ padding: "10px" }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {pageItems.length === 0 ? (
                        <tr>
                            <td colSpan={5} style={{ padding: 20, textAlign: "center", color: "#666" }}>
                                No transactions
                            </td>
                        </tr>
                    ) : (
                        pageItems.map((t) => (
                            <tr key={t.id} style={{ borderTop: "1px solid #f0f0f0" }}>
                                <td style={{ padding: 12, verticalAlign: "top", width: 140 }}>
                                    <div style={{ fontSize: 13 }}>{formatDate(t.date)}</div>
                                    <div style={{ fontSize: 12, color: "#666" }}>{new Date(t.date).toLocaleTimeString()}</div>
                                </td>
                                <td style={{ padding: 12 }}>
                                    <div style={{ fontWeight: 600 }}>{t.description}</div>
                                    {t.meta && (
                                        <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                                            {Object.entries(t.meta)
                                                .slice(0, 3)
                                                .map(([k, v]) => `${k}: ${String(v)}`)
                                                .join(" • ")}
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: 12, textAlign: "right", verticalAlign: "top" }}>
                                    <div
                                        style={{
                                            color: t.type === "debit" ? "#b00020" : "#0a7a00",
                                            fontWeight: 700,
                                        }}
                                    >
                                        {t.type === "debit" ? "-" : "+"}
                                        {formatCurrency(Math.abs(t.amount), t.currency)}
                                    </div>
                                </td>
                                <td style={{ padding: 12, verticalAlign: "top" }}>
                                    <span
                                        style={{
                                            padding: "4px 8px",
                                            borderRadius: 999,
                                            background:
                                                t.status === "posted"
                                                    ? "#e6f7ea"
                                                    : t.status === "pending"
                                                    ? "#fff7e6"
                                                    : "#fdecea",
                                            color:
                                                t.status === "posted" ? "#0a7a00" : t.status === "pending" ? "#a06b00" : "#a00000",
                                            fontSize: 12,
                                        }}
                                    >
                                        {t.status ?? "unknown"}
                                    </span>
                                </td>
                                <td style={{ padding: 12, verticalAlign: "top" }}>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        {onEdit && (
                                            <button
                                                onClick={() => onEdit(t)}
                                                type="button"
                                                style={{
                                                    padding: "6px 10px",
                                                    borderRadius: 6,
                                                    border: "1px solid #ddd",
                                                    background: "#fff",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Edit
                                            </button>
                                        )}
                                        {onDelete && (
                                            <button
                                                onClick={() => onDelete(t)}
                                                type="button"
                                                style={{
                                                    padding: "6px 10px",
                                                    borderRadius: 6,
                                                    border: "1px solid #f2dede",
                                                    background: "#fff",
                                                    color: "#a00000",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 12,
                }}
            >
                <div style={{ color: "#555", fontSize: 13 }}>
                    Showing {sorted.length === 0 ? 0 : pageSafe * pageSize + 1}-
                    {Math.min((pageSafe + 1) * pageSize, sorted.length)} of {sorted.length}
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                    <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={pageSafe === 0}
                        style={{
                            padding: "8px 10px",
                            borderRadius: 6,
                            border: "1px solid #ddd",
                            background: pageSafe === 0 ? "#fafafa" : "#fff",
                            cursor: pageSafe === 0 ? "not-allowed" : "pointer",
                        }}
                    >
                        Prev
                    </button>
                    <div style={{ alignSelf: "center", fontSize: 13 }}>
                        Page {pageSafe + 1} / {totalPages}
                    </div>
                    <button
                        type="button"
                        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                        disabled={pageSafe >= totalPages - 1}
                        style={{
                            padding: "8px 10px",
                            borderRadius: 6,
                            border: "1px solid #ddd",
                            background: pageSafe >= totalPages - 1 ? "#fafafa" : "#fff",
                            cursor: pageSafe >= totalPages - 1 ? "not-allowed" : "pointer",
                        }}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}