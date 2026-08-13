import { Toast } from "@base-ui/react/toast";

// A single, app-wide toast manager. Base UI's manager works outside React
// (it's just a subscribable store), so plain modules like modelActions.js
// can show toasts too, not just components.
export const toastManager = Toast.createToastManager();
