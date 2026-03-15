import { toast as sonnerToast } from "sonner@2.0.3";
import { Check, AlertTriangle, Info, AlertCircle } from "lucide-react";

// Custom toast with icons matching JJB Group design
// Supports both (message, description) signature and (message, options) signature
export const toast = {
  success: (message: string, options?: any) => {
    const opts = typeof options === 'string' ? { description: options } : options || {};
    return sonnerToast.success(message, {
      icon: <Check size={16} />,
      ...opts,
    });
  },
  error: (message: string, options?: any) => {
    const opts = typeof options === 'string' ? { description: options } : options || {};
    return sonnerToast.error(message, {
      icon: <AlertTriangle size={16} />,
      ...opts,
    });
  },
  info: (message: string, options?: any) => {
    const opts = typeof options === 'string' ? { description: options } : options || {};
    return sonnerToast.info(message, {
      icon: <Info size={16} />,
      ...opts,
    });
  },
  warning: (message: string, options?: any) => {
    const opts = typeof options === 'string' ? { description: options } : options || {};
    return sonnerToast.warning(message, {
      icon: <AlertCircle size={16} />,
      ...opts,
    });
  },
  loading: (message: string, options?: any) => {
    const opts = typeof options === 'string' ? { description: options } : options || {};
    return sonnerToast.loading(message, {
      ...opts,
    });
  },
  dismiss: (id?: string | number) => {
    return sonnerToast.dismiss(id);
  }
};
