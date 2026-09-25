import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { WalletProvider } from "./components/WalletContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ConfigBanner from "./components/ConfigBanner";
import Home from "./pages/Home";
import Agreements from "./pages/Agreements";
import AgreementDetail from "./pages/AgreementDetail";
import Open from "./pages/Open";
import Account from "./pages/Account";
import Protocol from "./pages/Protocol";
import NotFound from "./pages/NotFound";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);
  return null;
}

function Layout() {
  return (
    <WalletProvider>
      <ScrollToTop />
      <Header />
      <ConfigBanner />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/agreements" element={<Agreements />} />
          <Route path="/agreements/:id" element={<AgreementDetail />} />
          <Route path="/open" element={<Open />} />
          <Route path="/account" element={<Account />} />
          <Route path="/protocol" element={<Protocol />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </WalletProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
