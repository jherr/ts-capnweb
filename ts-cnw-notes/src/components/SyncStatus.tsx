import type { SyncStatus as SyncStatusType } from "@/db-collections";

interface SyncStatusProps {
  isConnected: boolean;
  isConnecting: boolean;
  syncStats: {
    total: number;
    synced: number;
    pending: number;
    syncing: number;
    offline: number;
    error: number;
  };
}

export function SyncStatus({
  isConnected,
  isConnecting,
  syncStats,
}: SyncStatusProps) {
  const getConnectionColor = () => {
    if (isConnecting) return "bg-yellow-400";
    if (isConnected) return "bg-green-400 animate-pulse";
    return "bg-red-400";
  };

  const getConnectionText = () => {
    if (isConnecting) return "Connecting...";
    if (isConnected) return "Connected";
    return "Offline";
  };

  const hasPendingSync =
    syncStats.pending > 0 || syncStats.syncing > 0 || syncStats.offline > 0;

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
      <h3 className="text-sm font-semibold text-gray-400 mb-3">Sync Status</h3>

      {/* Connection Status */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-700">
        <span className="text-sm text-gray-300">Connection</span>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${getConnectionColor()}`} />
          <span className="text-sm text-gray-300">{getConnectionText()}</span>
        </div>
      </div>

      {/* Sync Stats */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300">Total Notes</span>
          <span className="text-sm font-medium text-white">
            {syncStats.total}
          </span>
        </div>

        {syncStats.synced > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-400">✓ Synced</span>
            <span className="text-sm font-medium text-green-400">
              {syncStats.synced}
            </span>
          </div>
        )}

        {syncStats.syncing > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-400">⟳ Syncing</span>
            <span className="text-sm font-medium text-blue-400">
              {syncStats.syncing}
            </span>
          </div>
        )}

        {syncStats.pending > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-yellow-400">⏱ Pending</span>
            <span className="text-sm font-medium text-yellow-400">
              {syncStats.pending}
            </span>
          </div>
        )}

        {syncStats.offline > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-orange-400">📴 Offline</span>
            <span className="text-sm font-medium text-orange-400">
              {syncStats.offline}
            </span>
          </div>
        )}

        {syncStats.error > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-red-400">⚠ Error</span>
            <span className="text-sm font-medium text-red-400">
              {syncStats.error}
            </span>
          </div>
        )}
      </div>

      {hasPendingSync && isConnected && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-xs text-gray-400">Background sync active</p>
        </div>
      )}
    </div>
  );
}
