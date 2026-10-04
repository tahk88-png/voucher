'use client';

import { useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Download, FileUp } from 'lucide-react';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import { showError, showSuccess } from '@/lib/toast-helpers';
import { apiErrorMessage } from '@/lib/api-error-message';
import { parseVoucherCsv, VOUCHER_CSV_COLUMNS, VOUCHER_CSV_SAMPLE, type VoucherCsvRow } from '@/lib/voucher-csv';
import { describeVoucherValue, formatDisplayDate } from '@/lib/voucher-display';
import { useMerchantSettings } from '../../_components/merchant-settings-context';

export default function BulkImportPage() {
  const { slug } = useParams<{ slug: string }>();
  const { defaultCurrency } = useMerchantSettings();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<VoucherCsvRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [imported, setImported] = useState<number | null>(null);

  const handleFile = async (file: File | null) => {
    setImported(null);
    setRows([]);
    setErrors([]);
    setFileName(file?.name ?? null);
    if (!file) return;
    // Parse in the browser so dates use the merchant's own time zone and
    // mistakes are shown per row before anything is created.
    const result = parseVoucherCsv(await file.text(), { defaultCurrency, dayBoundary: 'local' });
    setRows(result.rows);
    setErrors(result.errors);
  };

  const downloadSample = () => {
    const blob = new Blob([VOUCHER_CSV_SAMPLE + '\n'], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'voucher-import-sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (rows.length === 0 || errors.length > 0) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/merchant/${slug}/vouchers/bulk-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rows),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(apiErrorMessage(data, `Import failed (error ${res.status}).`));
      const n = Number(data.imported) || 0;
      setImported(n);
      showSuccess(`Imported ${n} ${n === 1 ? 'voucher' : 'vouchers'} as drafts.`);
      setRows([]);
      setFileName(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4 min-w-0">
      <Link href={`/merchant/${slug}/vouchers`} className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
        &larr; Back to vouchers
      </Link>

      <WarmCard padding="lg" className="bg-[var(--surface)] border border-[var(--border)]">
        <h1 className="text-2xl font-semibold text-[var(--text)]">Import vouchers from a spreadsheet</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Upload a CSV file (up to 500 rows). Every voucher is created as a draft, so nothing goes live until you
          publish it.
        </p>

        <div className="mt-5 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-[var(--text)]">Columns</h2>
            <WarmButton type="button" size="sm" variant="outline" onClick={downloadSample}>
              <Download className="h-4 w-4" /> Download sample CSV
            </WarmButton>
          </div>
          <ul className="mt-3 space-y-1.5 text-[var(--text-muted)]">
            {VOUCHER_CSV_COLUMNS.map((col) => (
              <li key={col.name} className="break-words">
                <code className="font-mono text-[var(--text)]">{col.name}</code>
                {col.required ? ' (required)' : ' (optional)'}: {col.help}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[var(--text-muted)]">
            Separate columns with commas or semicolons. If you use commas, put decimal amounts in quotes
            (&quot;4,50&quot;) or use a dot (4.50).
          </p>
        </div>

        <div className="mt-5">
          <label
            htmlFor="csv-file"
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--r-md)] border-2 border-dashed border-[var(--border)] bg-[var(--bg)] px-4 py-6 text-center hover:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--ring)]"
          >
            <FileUp className="h-6 w-6 text-[var(--text-muted)]" />
            <span className="text-sm font-medium text-[var(--text)] break-all">
              {fileName ?? 'Choose a CSV file'}
            </span>
            <span className="text-xs text-[var(--text-muted)]">
              {fileName ? 'Click to choose a different file' : 'Click to browse'}
            </span>
            <input
              ref={inputRef}
              id="csv-file"
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(e) => handleFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>

        {errors.length > 0 && (
          <div role="alert" className="mt-4 rounded-[var(--r-sm)] border border-l-4 border-[var(--border)] border-l-[color:var(--danger)] bg-[var(--surface)] p-3 text-sm text-[var(--text)]">
            <p className="font-medium">Fix these rows and upload the file again:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {errors.slice(0, 20).map((err) => (
                <li key={err} className="break-words">{err}</li>
              ))}
            </ul>
            {errors.length > 20 && <p className="mt-2">…and {errors.length - 20} more.</p>}
          </div>
        )}

        {rows.length > 0 && errors.length === 0 && (
          <div className="mt-4 text-sm">
            <p className="font-medium text-[var(--text)]">
              Ready to import {rows.length} {rows.length === 1 ? 'voucher' : 'vouchers'}:
            </p>
            <ul className="mt-2 max-h-60 space-y-1 overflow-y-auto text-[var(--text-muted)]">
              {rows.slice(0, 50).map((row, i) => (
                <li key={i} className="break-words">
                  {row.name ? `${row.name}: ` : ''}
                  {describeVoucherValue(row)}, {formatDisplayDate(row.validFrom)} – {formatDisplayDate(row.validTo)}
                  {row.usageLimitTotal ? `, up to ${row.usageLimitTotal} uses` : ''}
                </li>
              ))}
              {rows.length > 50 && <li>…and {rows.length - 50} more.</li>}
            </ul>
          </div>
        )}

        {imported !== null && (
          <div role="status" className="mt-4 rounded-[var(--r-sm)] border border-l-4 border-[var(--border)] border-l-[color:var(--success)] bg-[var(--surface)] p-3 text-sm text-[var(--text)]">
            Imported {imported} {imported === 1 ? 'voucher' : 'vouchers'} as drafts.{' '}
            <Link href={`/merchant/${slug}/vouchers`} className="font-semibold underline">
              View vouchers
            </Link>
          </div>
        )}

        <WarmButton
          type="button"
          className="mt-5 w-full"
          onClick={handleUpload}
          disabled={loading || rows.length === 0 || errors.length > 0}
        >
          {loading ? 'Importing...' : rows.length > 0 ? `Import ${rows.length} ${rows.length === 1 ? 'voucher' : 'vouchers'}` : 'Import vouchers'}
        </WarmButton>
      </WarmCard>
    </div>
  );
}
