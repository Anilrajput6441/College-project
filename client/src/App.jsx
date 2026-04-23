import Sidebar from "./components/Sidebar";
import Router from "./Router";
import { useLocation } from "react-router-dom";

function App() {
  const { pathname } = useLocation();
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  return (
    <div className="min-h-screen flex">
      {!isAuthPage && (
        <div>
          <Sidebar />
        </div>
      )}
      <div className={isAuthPage ? "flex-1" : "lg:ml-64 flex-1"}>
        <Router />
      </div>
    </div>
  );
}

export default App;
