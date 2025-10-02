import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
// import Home from "./pages/Dashboard/Home";
import { ToastContainer } from 'react-toastify';
import { useAuthStore } from "./utilities/zendex/AuthStore";
import { useEffect } from "react";
import VerifyPage from "./pages/Sorban/VerifyPage";
import CertificatesPage from "./pages/Sorban/CertificatesPage.tsx";
import UsersPage from "./pages/Sorban/UsersPage.tsx";

export default function App() {

  const { token,updateToken, role} = useAuthStore();
  const dateRaw = localStorage.getItem("date");
  let diffDays: any;
  if(dateRaw){
    const storedDate = new Date(dateRaw);
    const now = new Date();
    const diffTime = now.getTime() - storedDate.getTime();
    diffDays = diffTime / (1000 * 60 * 60 * 24);
  }
  
  // const location = useLocation();

  useEffect(() => {
    console.log("Auth Called");
    console.log("Diff Days : ",diffDays);
    if(parseInt(diffDays) > 7 || !diffDays){
      updateToken("false","","");
    }else{
      console.log("Else Called");
      
      updateToken(localStorage.getItem("auth") || "false",localStorage.getItem("role") || "",localStorage.getItem("mail") || "");
    }
  }, [token,role]);

  return (
    <>
      <ToastContainer style={{zIndex: 99999999999}} />
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Dashboard Layout */}
          <Route element={<AppLayout />}>
            <Route index path="/" element={<VerifyPage />} />

            {/* Others Page */}
            {/* <Route path="/profile" element={<UserProfiles />} /> */}
            {/* <Route path="/calendar" element={<Calendar />} /> */}
            {/* <Route path="/blank" element={<Blank />} /> */}
            <Route path="/certificates" element={<CertificatesPage />} />
            <Route path="/users/ra" element={role == 'super_admin' ? <UsersPage /> : <Navigate to="/" replace />} />
            <Route path="/users/ca" element={role == 'super_admin' ? <UsersPage /> : <Navigate to="/" replace />} />

            {/* Forms */}
            {/* <Route path="/form-elements" element={<FormElements />} /> */}

            {/* Tables */}
            {/* <Route path="/basic-tables" element={<BasicTables />} /> */}

            {/* Ui Elements */}
            {/* <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} /> */}

            {/* Charts */}
            {/* <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} /> */}
          </Route>

          {/* Auth Layout */}
          {/* <Route path="/signin" element={<SignIn />} /> */}
          <Route path="/signin" element={token == 'false' ? <SignIn /> : <Navigate to="/" replace />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
