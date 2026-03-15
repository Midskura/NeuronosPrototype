import { useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";

interface NeuronRefreshButtonProps {
  onRefresh: () => Promise<void> | void;
  /** Tooltip text */
  label?: string;
  /** Size of the icon */
  size?: number;
}

/**
 * Reusable refresh button for module headers.
 * Spins while the refresh is in-flight.
 */
export function NeuronRefreshButton({ 
  onRefresh, 
  label = "Refresh data",
  size = 18 
}: NeuronRefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleClick = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      // Minimum spin duration for visual feedback
      setTimeout(() => setIsRefreshing(false), 400);
    }
  }, [onRefresh, isRefreshing]);

  return (
    <button
      onClick={handleClick}
      disabled={isRefreshing}
      title={label}
      className="flex items-center justify-center w-[36px] h-[36px] bg-white border border-[#E5E7EB] rounded-[7.5px] text-[#667085] hover:text-[#0F766E] hover:border-[#0F766E] hover:bg-[#F0FDF9] transition-colors disabled:opacity-50"
    >
      <RefreshCw 
        size={size} 
        className={isRefreshing ? "animate-spin" : ""} 
      />
    </button>
  );
}
