import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";

const Homepage = lazy(() => import("../pages/Homepage"));
const Signuppage = lazy(() => import("../pages/Signuppage"));
const Loginpage = lazy(() => import("../pages/Loginpage"));
const Notespage = lazy(() => import("../pages/Notespage"));

export default function AllRoutes() {
  return (
    <Suspense fallback={<div role="status">Loading page...</div>}>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/register" element={<Signuppage />} />
        <Route path="/login" element={<Loginpage />} />
        <Route
          path="/notes"
          element={
            <PrivateRoute>
              <Notespage />
            </PrivateRoute>
          }
        />
      </Routes>
    </Suspense>
  );
}