import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import { useBoundStore } from "@/store/dataBoundStore";
import toast from "react-hot-toast";

/*
  API interceptor.
  Use this instead of calling .get/.post on axios directly. This interceptor
  will automatically detect invalidated session, invalid roles, etc and show the
  relevant toasts to the user. You can optionally disable the toasts for
  specific requests by passing a second option object to the e.g. get() call.

  sessionErrorToasts: default true
  genericErrorToasts: default true
  successToasts: default false
*/
const api = axios.create();
var lastExpiryAlert = 0;

// Capture config parameters to disable toasts for specific requests
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error),
);

// axios interceptor captures session status codes and logs out where necessary
api.interceptors.response.use(
  (response) => {
    const successToasts = response.config?.successToasts ?? false;
    if (successToasts && response.data?.message)
      toast.success(response.data?.message);
    return response;
  },
  (error) => {
    const sessionErrorToasts = error.config?.sessionErrorToasts ?? true;
    const genericErrorToasts = error.config?.genericErrorToasts ?? true;

    if (error.response) {
      if (
        error.response.status === 401 &&
        error.response.data?.code === "SESSION-INVALID"
      ) {
        // This error code means the session has expired and the user should be logged out
        console.warn(
          "API middleware detected invalid session and forced logout",
        );
        useAuthStore.getState().logout();
        useBoundStore.getState().resetAll();
        const resendExpiryAlert = Date.now() - lastExpiryAlert > 5000;
        if (sessionErrorToasts && resendExpiryAlert) {
          toast.error(
            "Your session has expired. Please log in again to confirm your identity.",
          );
          lastExpiryAlert = Date.now();
        }
        return Promise.reject(error);
      } else if (
        error.response &&
        error.response.status === 403 &&
        error.response.data?.code === "INCORRECT-ROLE"
      ) {
        // Session is still valid but the user's role is incorrect for this operation
        console.warn("API middleware detected incorrect role for API call");
      }
      if (genericErrorToasts)
        toast.error(
          error.response.data?.message ??
            "Something went wrong. Please try again.",
        );
    } else if (error?.message === "Network Error") {
      toast.error(
        "A network error occurred. Please check your internet connection and try again.",
      );
    }
    return Promise.reject(error);
  },
);

export default api;
