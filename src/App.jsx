import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes/AppRoutes";
import { ToastContainer } from "react-toastify";
import { unlockNotificationSound } from "./utils/notificationSound";
import "./App.css";
import "react-toastify/dist/ReactToastify.css";

function AppContent() {
  useEffect(() => {
    const enableSound = () => {
      unlockNotificationSound();
      window.removeEventListener("pointerdown", enableSound, true);
      window.removeEventListener("keydown", enableSound, true);
    };

    window.addEventListener("pointerdown", enableSound, true);
    window.addEventListener("keydown", enableSound, true);
    return () => {
      window.removeEventListener("pointerdown", enableSound, true);
      window.removeEventListener("keydown", enableSound, true);
    };
  }, []);

  return (
    <>
      <AppRoutes />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
export default App;