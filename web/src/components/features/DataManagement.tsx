// ============================================================================
// DataManagement Component
// Export/Import UI for offline-first data portability
// ============================================================================

import { useCallback, useRef, useState } from 'react';

import { db } from '../../db/schema';
import { useUserStore } from '../../stores/user.store';
import { useEventsStore } from '../../stores/events.store';
import { useRalphStore } from '../../stores/ralph.store';
import { useBouncerStore } from '../../stores/bouncer.store';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface ExportData {
  version: string;
  exportDate: string;
  format: 'chronos-export-v1';
  data: {
    userState: unknown;
    events: unknown[];
    goals: unknown[];
    interactions: unknown[];
    hypotheses: unknown[];
    patterns: unknown[];
    notifications: unknown[];
    voiceMemos: unknown[];
  };
  meta: {
    eventsCount: number;
    goalsCount: number;
    patternsCount: number;
  };
}

type ExportStatus = 'idle' | 'exporting' | 'success' | 'error';
type ImportStatus = 'idle' | 'importing' | 'success' | 'error';

// ----------------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------------

export function DataManagement() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle');
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // Export all data
  const handleExport = useCallback(async () => {
    setExportStatus('exporting');
    setStatusMessage('');

    try {
      // Gather all data from IndexedDB
      const [userState, events, interactions, hypotheses, patterns, notifications, voiceMemos] = await Promise.all([
        db.userState.get('default'),
        db.events.toArray(),
        db.interactions.toArray(),
        db.hypotheses.toArray(),
        db.patterns.toArray(),
        db.notifications.toArray(),
        db.voiceMemos.toArray(),
      ]);

      // Get goals from user state
      const goals = userState?.goals ?? [];

      const exportData: ExportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        format: 'chronos-export-v1',
        data: {
          userState: userState ?? null,
          events,
          goals,
          interactions,
          hypotheses,
          patterns,
          notifications,
          voiceMemos: voiceMemos.map((m) => ({
            ...m,
            // Don't export audio blob data, just metadata
            audioBlob: null,
          })),
        },
        meta: {
          eventsCount: events.length,
          goalsCount: goals.length,
          patternsCount: patterns.length,
        },
      };

      // Create blob and download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `chronos-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportStatus('success');
      setStatusMessage(
        `Exported ${events.length} events, ${goals.length} goals, ${patterns.length} patterns`
      );

      // Reset after 3 seconds
      setTimeout(() => {
        setExportStatus('idle');
        setStatusMessage('');
      }, 3000);
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus('error');
      setStatusMessage(String(error));
    }
  }, []);

  // Handle file selection for import
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('importing');
    setStatusMessage('');

    try {
      const text = await file.text();
      const importData: ExportData = JSON.parse(text);

      // Validate format
      if (importData.format !== 'chronos-export-v1') {
        throw new Error('Invalid export format. Please use a valid Chronos export file.');
      }

      // Confirm before overwriting
      const confirmed = confirm(
        `Import will add ${importData.meta.eventsCount} events, ${importData.meta.goalsCount} goals, and ${importData.meta.patternsCount} patterns. Existing data will be merged. Continue?`
      );

      if (!confirmed) {
        setImportStatus('idle');
        return;
      }

      // Import data
      const { data } = importData;

      // Import events (merge by externalId or add new)
      if (data.events?.length) {
        await db.events.bulkPut(data.events as never[]);
        useEventsStore.getState().loadFromDb();
      }

      // Import user state (merge goals, keep preferences)
      if (data.userState) {
        const currentState = await db.userState.get('default');
        const importedState = data.userState as { goals?: unknown[]; [key: string]: unknown };
        
        await db.userState.update('default', {
          ...currentState,
          goals: [
            ...(currentState?.goals ?? []),
            ...((importedState.goals ?? []) as never[]),
          ],
        });
        useUserStore.getState().loadFromDb();
      }

      // Import Ralph data
      if (data.interactions?.length) {
        await db.interactions.bulkPut(data.interactions as never[]);
      }
      if (data.hypotheses?.length) {
        await db.hypotheses.bulkPut(data.hypotheses as never[]);
      }
      if (data.patterns?.length) {
        await db.patterns.bulkPut(data.patterns as never[]);
      }
      useRalphStore.getState().loadFromDb();

      // Import notifications
      if (data.notifications?.length) {
        await db.notifications.bulkPut(data.notifications as never[]);
        useBouncerStore.getState().loadFromDb();
      }

      setImportStatus('success');
      setStatusMessage(
        `Imported ${data.events?.length ?? 0} events, ${(data.goals as unknown[])?.length ?? 0} goals`
      );

      // Reset after 3 seconds
      setTimeout(() => {
        setImportStatus('idle');
        setStatusMessage('');
      }, 3000);
    } catch (error) {
      console.error('Import failed:', error);
      setImportStatus('error');
      setStatusMessage(String(error));
    }

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Clear all data
  const handleClearAll = useCallback(async () => {
    try {
      // Delete all tables
      await db.delete();
      
      // Reinitialize database
      await db.open();

      // Reset stores
      localStorage.clear();
      
      // Reload page to reset everything
      window.location.reload();
    } catch (error) {
      console.error('Clear failed:', error);
      setStatusMessage(`Clear failed: ${String(error)}`);
    }
  }, []);

  return (
    <div className="rounded-lg border border-border bg-surface p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Data Management</h3>
        <p className="text-xs text-ink/60">
          Export your data for backup or import from another device
        </p>
      </div>

      {/* Export */}
      <div className="flex items-center justify-between py-2">
        <div>
          <span className="text-sm">Export all data</span>
          <p className="text-xs text-ink/50">Download a JSON backup of everything</p>
        </div>
        <button
          type="button"
          className="px-4 py-2 text-sm rounded bg-accent text-white hover:bg-accent/90 disabled:opacity-50 flex items-center gap-2"
          onClick={handleExport}
          disabled={exportStatus === 'exporting'}
        >
          {exportStatus === 'exporting' ? (
            <>
              <span className="animate-spin">⏳</span>
              Exporting...
            </>
          ) : exportStatus === 'success' ? (
            <>✓ Exported</>
          ) : (
            <>📥 Export</>
          )}
        </button>
      </div>

      {/* Import */}
      <div className="flex items-center justify-between py-2 border-t border-border pt-4">
        <div>
          <span className="text-sm">Import data</span>
          <p className="text-xs text-ink/50">Restore from a Chronos export file</p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileSelect}
          />
          <button
            type="button"
            className="px-4 py-2 text-sm rounded border border-border hover:bg-ink/5 disabled:opacity-50 flex items-center gap-2"
            onClick={() => fileInputRef.current?.click()}
            disabled={importStatus === 'importing'}
          >
            {importStatus === 'importing' ? (
              <>
                <span className="animate-spin">⏳</span>
                Importing...
              </>
            ) : importStatus === 'success' ? (
              <>✓ Imported</>
            ) : (
              <>📤 Import</>
            )}
          </button>
        </div>
      </div>

      {/* Status message */}
      {statusMessage && (
        <div
          className={`text-xs p-2 rounded ${
            exportStatus === 'error' || importStatus === 'error'
              ? 'bg-red-100 text-red-700'
              : 'bg-green-100 text-green-700'
          }`}
        >
          {statusMessage}
        </div>
      )}

      {/* Danger Zone */}
      <div className="border-t border-border pt-4 mt-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-red-600">Clear all data</span>
            <p className="text-xs text-ink/50">Permanently delete everything</p>
          </div>
          {showConfirmClear ? (
            <div className="flex gap-2">
              <button
                type="button"
                className="px-3 py-1.5 text-sm rounded border border-border hover:bg-ink/5"
                onClick={() => setShowConfirmClear(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-3 py-1.5 text-sm rounded bg-red-500 text-white hover:bg-red-600"
                onClick={handleClearAll}
              >
                Yes, delete everything
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="px-4 py-2 text-sm rounded border border-red-200 text-red-500 hover:bg-red-50"
              onClick={() => setShowConfirmClear(true)}
            >
              Clear Data
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
