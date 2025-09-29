interface ConnectionStatusProps {
  isConnected: boolean;
  isConnecting: boolean;
  connectionStatus: string;
  error: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function ConnectionStatus({
  isConnected,
  isConnecting,
  connectionStatus,
  error,
  onConnect,
  onDisconnect,
}: ConnectionStatusProps) {
  const getStatusColor = () => {
    if (error) return "text-red-400";
    if (isConnected) return "text-green-400";
    if (isConnecting) return "text-yellow-400";
    return "text-gray-400";
  };

  const getStatusIcon = () => {
    if (isConnecting) return "🔄";
    if (isConnected) return "✅";
    if (error) return "❌";
    return "⚪";
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-600 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getStatusIcon()}</span>
          <div>
            <div className={`font-semibold ${getStatusColor()}`}>
              {connectionStatus}
            </div>
            {error && <div className="text-red-400 text-sm mt-1">{error}</div>}
          </div>
        </div>

        <div className="flex space-x-2">
          {!isConnected && !isConnecting && (
            <button
              onClick={onConnect}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Connect
            </button>
          )}
          {isConnected && (
            <button
              onClick={onDisconnect}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Disconnect
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
