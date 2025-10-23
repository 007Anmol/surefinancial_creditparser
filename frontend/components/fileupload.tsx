import React, { useCallback, useRef, useState } from "react";

type UploadResult = {
    ok: boolean;
    status: number;
    body?: any;
    error?: string;
};

type FileWithMeta = {
    id: string;
    file: File;
    preview?: string;
    progress: number; // 0-100
    status: "idle" | "uploading" | "done" | "error" | "canceled";
    error?: string;
};

type FileUploadProps = {
    multiple?: boolean;
    accept?: string; // e.g. "image/*,application/pdf"
    maxSizeMB?: number; // per-file limit
    uploadUrl?: string;
    fieldName?: string; // name of file field in form-data
    headers?: Record<string, string>;
    autoUpload?: boolean;
    onUploadSuccess?: (file: File, result: UploadResult) => void;
    onUploadError?: (file: File, err: any) => void;
    onFilesChanged?: (files: File[]) => void;
    className?: string;
    style?: React.CSSProperties;
};

/**
 * Simple, accessible file upload component with drag-and-drop, previews for images,
 * per-file progress, cancel, and basic validation.
 *
 * Usage:
 * <FileUpload uploadUrl="/api/upload" accept="image/*" multiple />
 */
export default function FileUpload({
    multiple = false,
    accept,
    maxSizeMB = 10,
    uploadUrl = "/api/upload",
    fieldName = "file",
    headers = {},
    autoUpload = false,
    onUploadSuccess,
    onUploadError,
    onFilesChanged,
    className,
    style,
}: FileUploadProps) {
    const [items, setItems] = useState<FileWithMeta[]>([]);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const xhrs = useRef<Record<string, XMLHttpRequest | null>>({});

    const resetPreviews = (fileItems: FileWithMeta[]) => {
        // Cleanup object URLs when replacing items
        return fileItems.map((it) => {
            if (it.preview) URL.revokeObjectURL(it.preview);
            return { ...it, preview: undefined };
        });
    };

    const addFiles = useCallback(
        (files: FileList | File[]) => {
            const arr = Array.from(files);
            const validated: FileWithMeta[] = [];
            for (const f of arr) {
                const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
                if (maxSizeMB && f.size > maxSizeMB * 1024 * 1024) {
                    // attach an item with error state
                    validated.push({
                        id,
                        file: f,
                        preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
                        progress: 0,
                        status: "error",
                        error: `File exceeds ${maxSizeMB}MB limit`,
                    });
                    continue;
                }
                validated.push({
                    id,
                    file: f,
                    preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
                    progress: 0,
                    status: "idle",
                });
            }

            setItems((prev) => {
                const next = multiple ? [...prev, ...validated] : [...validated];
                onFilesChanged?.(next.map((i) => i.file));
                return next;
            });

            if (autoUpload) {
                // start upload for each valid item
                setTimeout(() => {
                    validated.forEach((it) => {
                        if (it.status === "idle") uploadFile(it);
                    });
                }, 50);
            }
        },
        [maxSizeMB, multiple, autoUpload, onFilesChanged]
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        addFiles(e.target.files);
        e.currentTarget.value = "";
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "copy";
    };

    const removeItem = (id: string) => {
        setItems((prev) => {
            const next = prev.filter((p) => {
                if (p.id === id && p.preview) URL.revokeObjectURL(p.preview);
                return p.id !== id;
            });
            onFilesChanged?.(next.map((i) => i.file));
            return next;
        });
        // cancel XHR if in progress
        const xhr = xhrs.current[id];
        if (xhr) {
            xhr.abort();
            xhrs.current[id] = null;
        }
    };

    const uploadFile = (item: FileWithMeta) => {
        if (item.status === "uploading") return;
        const id = item.id;
        setItems((prev) =>
            prev.map((p) => (p.id === id ? { ...p, status: "uploading", progress: 0, error: undefined } : p))
        );

        const form = new FormData();
        form.append(fieldName, item.file);

        const xhr = new XMLHttpRequest();
        xhrs.current[id] = xhr;

        xhr.upload.onprogress = (ev) => {
            if (!ev.lengthComputable) return;
            const percent = Math.round((ev.loaded / ev.total) * 100);
            setItems((prev) => prev.map((p) => (p.id === id ? { ...p, progress: percent } : p)));
        };

        xhr.onreadystatechange = () => {
            if (xhr.readyState !== 4) return;
            xhrs.current[id] = null;
            if (xhr.status >= 200 && xhr.status < 300) {
                let body: any = undefined;
                try {
                    body = JSON.parse(xhr.responseText || "{}");
                } catch {
                    body = xhr.responseText;
                }
                setItems((prev) => prev.map((p) => (p.id === id ? { ...p, status: "done", progress: 100 } : p)));
                onUploadSuccess?.(item.file, { ok: true, status: xhr.status, body });
            } else if (xhr.status === 0) {
                // aborted or network
                setItems((prev) => prev.map((p) => (p.id === id ? { ...p, status: "canceled", error: "Canceled" } : p)));
                onUploadError?.(item.file, new Error("Canceled or network error"));
            } else {
                setItems((prev) =>
                    prev.map((p) => (p.id === id ? { ...p, status: "error", error: `Upload failed (${xhr.status})` } : p))
                );
                onUploadError?.(item.file, { status: xhr.status, text: xhr.responseText });
            }
        };

        xhr.onerror = () => {
            xhrs.current[id] = null;
            setItems((prev) => prev.map((p) => (p.id === id ? { ...p, status: "error", error: "Upload error" } : p)));
            onUploadError?.(item.file, new Error("Upload error"));
        };

        xhr.open("POST", uploadUrl, true);
        Object.entries(headers || {}).forEach(([k, v]) => {
            try {
                xhr.setRequestHeader(k, v);
            } catch {
                // some headers cannot be set (e.g., Content-Type for FormData) — ignore
            }
        });
        xhr.send(form);
    };

    const uploadAll = () => {
        items.forEach((it) => {
            if (it.status === "idle" || it.status === "error") uploadFile(it);
        });
    };

    const cancelUpload = (id: string) => {
        const xhr = xhrs.current[id];
        if (xhr) xhr.abort();
        setItems((prev) => prev.map((p) => (p.id === id ? { ...p, status: "canceled" } : p)));
    };

    const clearAll = () => {
        items.forEach((it) => {
            if (it.preview) URL.revokeObjectURL(it.preview);
            const xhr = xhrs.current[it.id];
            if (xhr) xhr.abort();
            xhrs.current[it.id] = null;
        });
        setItems([]);
        onFilesChanged?.([]);
    };

    return (
        <div className={className} style={{ fontFamily: "system-ui, sans-serif", ...style }}>
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                role="region"
                aria-label="File drop area"
                style={{
                    border: "2px dashed #d0d7de",
                    borderRadius: 8,
                    padding: 16,
                    textAlign: "center",
                    cursor: "pointer",
                    background: "#fafbfc",
                }}
                onClick={() => inputRef.current?.click()}
            >
                <input
                    ref={inputRef}
                    type="file"
                    style={{ display: "none" }}
                    onChange={handleInputChange}
                    multiple={multiple}
                    accept={accept}
                />
                <div style={{ fontSize: 14, color: "#24292f" }}>
                    Drag & drop files here, or click to select
                    {accept ? ` (accepted: ${accept})` : ""}
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: "#57606a" }}>
                    {maxSizeMB ? `Max ${maxSizeMB}MB per file` : "No size limit"}
                </div>
            </div>

            {items.length > 0 && (
                <div style={{ marginTop: 12 }}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {items.map((it) => (
                            <div
                                key={it.id}
                                style={{
                                    width: 220,
                                    border: "1px solid #e1e4e8",
                                    borderRadius: 6,
                                    padding: 8,
                                    background: "#fff",
                                    display: "flex",
                                    gap: 8,
                                    alignItems: "center",
                                }}
                            >
                                {it.preview ? (
                                    <img
                                        src={it.preview}
                                        alt={it.file.name}
                                        style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 4 }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            width: 48,
                                            height: 48,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            background: "#f6f8fa",
                                            borderRadius: 4,
                                            color: "#57606a",
                                            fontSize: 12,
                                        }}
                                    >
                                        {it.file.type?.split("/")[0] || "file"}
                                    </div>
                                )}

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: "#24292f", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {it.file.name}
                                    </div>
                                    <div style={{ fontSize: 12, color: "#57606a" }}>{(it.file.size / 1024).toFixed(0)} KB</div>

                                    <div style={{ marginTop: 6 }}>
                                        <div
                                            style={{
                                                height: 6,
                                                background: "#e6edf3",
                                                borderRadius: 6,
                                                overflow: "hidden",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    height: "100%",
                                                    width: `${it.progress}%`,
                                                    background: it.status === "error" ? "#e55353" : "#2ea44f",
                                                    transition: "width 200ms linear",
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ marginTop: 6, display: "flex", gap: 6, alignItems: "center" }}>
                                        {it.status === "idle" && (
                                            <button
                                                type="button"
                                                onClick={() => uploadFile(it)}
                                                style={{
                                                    padding: "6px 8px",
                                                    fontSize: 12,
                                                    borderRadius: 6,
                                                    border: "1px solid #d0d7de",
                                                    background: "#ffffff",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Upload
                                            </button>
                                        )}

                                        {it.status === "uploading" && (
                                            <button
                                                type="button"
                                                onClick={() => cancelUpload(it.id)}
                                                style={{
                                                    padding: "6px 8px",
                                                    fontSize: 12,
                                                    borderRadius: 6,
                                                    border: "1px solid #d0d7de",
                                                    background: "#fff5f5",
                                                    color: "#cf222e",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Cancel
                                            </button>
                                        )}

                                        {it.status === "done" && (
                                            <span style={{ fontSize: 12, color: "#22863a" }}>Uploaded</span>
                                        )}

                                        {it.status === "error" && (
                                            <span style={{ fontSize: 12, color: "#cf222e" }}>{it.error ?? "Error"}</span>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => removeItem(it.id)}
                                            aria-label={`Remove ${it.file.name}`}
                                            style={{
                                                marginLeft: "auto",
                                                padding: "6px 8px",
                                                fontSize: 12,
                                                borderRadius: 6,
                                                border: "1px solid #d0d7de",
                                                background: "#ffffff",
                                                cursor: "pointer",
                                            }}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                        <button
                            type="button"
                            onClick={uploadAll}
                            style={{
                                padding: "8px 12px",
                                borderRadius: 6,
                                border: "1px solid #d0d7de",
                                background: "#0366d6",
                                color: "#fff",
                                cursor: "pointer",
                            }}
                        >
                            Upload All
                        </button>

                        <button
                            type="button"
                            onClick={clearAll}
                            style={{
                                padding: "8px 12px",
                                borderRadius: 6,
                                border: "1px solid #d0d7de",
                                background: "#ffffff",
                                cursor: "pointer",
                            }}
                        >
                            Clear
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}