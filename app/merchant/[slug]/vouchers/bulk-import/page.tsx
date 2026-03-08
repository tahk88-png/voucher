'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function BulkImportPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const text = await file.text();
      const res = await fetch(`/api/merchant/${slug}/vouchers/bulk-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/csv' },
        body: text,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Import failed');
      }
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  // router is used for potential future navigation (e.g. after import)
  void router;

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '0 1rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href={`/merchant/${slug}/vouchers`} style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none' }}>
          &larr; Back to Vouchers
        </Link>
      </div>

      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        padding: '2rem',
      }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' }}>
          Bulk Import Vouchers
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Upload a CSV file to create multiple vouchers at once. Maximum 500 rows.
        </p>

        <div style={{
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          padding: '1rem',
          marginBottom: '1.5rem',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
        }}>
          <strong style={{ color: 'var(--text)', display: 'block', marginBottom: '0.5rem' }}>CSV Format:</strong>
          <code style={{ fontFamily: 'monospace' }}>type,value,currency,validFrom,validTo,codePrefix,usageLimitTotal</code>
          <br />
          <code style={{ fontFamily: 'monospace' }}>fixed_amount,1000,EUR,2026-03-01,2026-06-01,SPRING,100</code>
          <br /><br />
          <span>Types: <code>fixed_amount</code>, <code>percentage</code>, <code>credit_amount</code></span><br />
          <span>Value: minor units (e.g. 1000 = &euro;10.00) or basis points for %</span>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={e => setFile(e.target.files?.[0] || null)}
            style={{
              display: 'block',
              width: '100%',
              padding: '0.5rem',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-sm)',
              background: 'var(--bg)',
              color: 'var(--text)',
            }}
          />
        </div>

        {error && (
          <div style={{ color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--r-sm)', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {result && (
          <div style={{ color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--r-sm)', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
            Successfully imported {result.imported} vouchers as drafts.{' '}
            <Link href={`/merchant/${slug}/vouchers`} style={{ color: '#16a34a', fontWeight: 600 }}>View all</Link>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: !file || loading ? 'var(--border)' : 'var(--primary)',
            color: 'var(--text)',
            border: 'none',
            borderRadius: 'var(--r-md)',
            fontWeight: 600,
            cursor: !file || loading ? 'not-allowed' : 'pointer',
            fontSize: '0.95rem',
          }}
        >
          {loading ? 'Importing...' : 'Import Vouchers'}
        </button>
      </div>
    </div>
  );
}
