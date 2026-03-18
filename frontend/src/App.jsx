import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "@/context/user.context";
import { Toaster } from "@/components/ui/toaster";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import "./index.css";

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </UserProvider>
  );
}
