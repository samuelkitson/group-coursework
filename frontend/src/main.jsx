import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.scss";
const App = lazy(() => import("./App.jsx"));
import { Toaster } from "react-hot-toast";
import AppLoading from "./pages/AppLoading";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Toaster position="top-center" />
    <Suspense fallback={<AppLoading />}>
      <App />
    </Suspense>
  </StrictMode>,
);
