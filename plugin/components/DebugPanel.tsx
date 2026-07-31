import { useState } from 'react';
import { modelCurrentPage } from '../lib/messaging';
import type { PageModel } from '../lib/types';

// Phase A verification surface: trigger Stage 1 modeling on the active tab
// and inspect the raw PageModel returned by the backend. Superseded by the
// real chat UI in later phases, but kept around for manual pipeline checks.
export default function DebugPanel() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [pageModel, setPageModel] = useState<PageModel | null>(null);

  async function handleModelPage() {
    setStatus('loading');
    setError(null);
    const response = await modelCurrentPage();
    if (response.ok) {
      setPageModel(response.pageModel);
      setStatus('idle');
    } else {
      setError(response.error);
      setStatus('error');
    }
  }

  return (
    <div>
      <button onClick={handleModelPage} disabled={status === 'loading'}>
        {status === 'loading' ? 'Modeling…' : 'Model this page'}
      </button>

      {error && (
        <p style={{ color: '#b00020', whiteSpace: 'pre-wrap' }}>{error}</p>
      )}

      {pageModel && (
        <div style={{ marginTop: '0.75rem' }}>
          <p>
            <strong>{pageModel.pageTitle}</strong> — {pageModel.pagePurpose}
          </p>
          <p style={{ color: '#666' }}>Task type: {pageModel.taskType}</p>
          <p style={{ color: '#666' }}>{pageModel.components.length} components detected</p>
          <pre
            style={{
              background: '#f5f5f5',
              padding: '0.75rem',
              borderRadius: '6px',
              overflowX: 'auto',
              maxHeight: '400px',
            }}
          >
            {JSON.stringify(pageModel, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
