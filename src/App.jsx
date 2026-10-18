import Dashboard from "./components/Dashboard";
import LoginPage from "./components/LoginPage";
import { useAuth } from "./context/AuthContext";

/**
 * Raiz da aplicação: decide entre a tela de login e o dashboard.
 * O dashboard só é montado (e a API só é consultada) após autenticação.
 */
export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <div className="background-mesh" aria-hidden="true" />
      {isAuthenticated ? <Dashboard /> : <LoginPage />}
    </>
  );
}
