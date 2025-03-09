import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./layouts/Layout.jsx";
import MainPage from "./pages/MainPage.jsx";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<MainPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
