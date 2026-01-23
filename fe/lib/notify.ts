import { toast } from "@/components/ui/toast";

export const notify = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message, 5000), // 5s duration for errors
  warning: (message: string) => toast.warning(message),
  info: (message: string) => toast.info(message),
};
