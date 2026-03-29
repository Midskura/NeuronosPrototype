import { toast as sonnerToast } from "sonner@2.0.3";
import { Check, AlertTriangle, Info, AlertCircle } from "lucide-react";

// Icon colors use semantic fg tokens — readable on the white toast background.
const iconStyle = (tokenVar: string): React.CSSProperties => ({
  color: `var(${tokenVar})`,
  flexShrink: 0,
});

export const toast = {
  success: (message: string, options?: any) => {
    const opts = typeof options === "string" ? { description: options } : options || {};
    return sonnerToast.success(message, {
      icon: <Check size={16} strokeWidth={2.5} style={iconStyle("--theme-status-success-fg")} />,
      ...opts,
    });
  },
  error: (message: string, options?: any) => {
    const opts = typeof options === "string" ? { description: options } : options || {};
    return sonnerToast.error(message, {
      icon: <AlertCircle size={16} strokeWidth={2.5} style={iconStyle("--theme-status-danger-fg")} />,
      ...opts,
    });
  },
  info: (message: string, options?: any) => {
    const opts = typeof options === "string" ? { description: options } : options || {};
    return sonnerToast.info(message, {
      icon: <Info size={16} strokeWidth={2.5} style={iconStyle("--neuron-semantic-info")} />,
      ...opts,
    });
  },
  warning: (message: string, options?: any) => {
    const opts = typeof options === "string" ? { description: options } : options || {};
    return sonnerToast.warning(message, {
      icon: <AlertTriangle size={16} strokeWidth={2.5} style={iconStyle("--theme-status-warning-fg")} />,
      ...opts,
    });
  },
  loading: (message: string, options?: any) => {
    const opts = typeof options === "string" ? { description: options } : options || {};
    return sonnerToast.loading(message, { ...opts });
  },
  dismiss: (id?: string | number) => {
    return sonnerToast.dismiss(id);
  },
};
