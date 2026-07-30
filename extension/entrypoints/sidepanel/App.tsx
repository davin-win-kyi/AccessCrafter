import DebugPanel from '../../components/DebugPanel';

export default function App() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '0.75rem', fontSize: '14px' }}>
      <h1 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>AccessCrafter</h1>
      <p style={{ color: '#666', marginTop: 0, marginBottom: '1rem' }}>
        Phase A: page modeling pipeline. The conversational authoring UI (Phase B)
        will replace/extend this panel.
      </p>
      <DebugPanel />
    </div>
  );
}
