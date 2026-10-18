import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getLockoutRemainingMs } from "../services/authService";

/** Tela de login com mensagens de erro acessíveis e bloqueio temporário. */
export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lockedSeconds, setLockedSeconds] = useState(() =>
    Math.ceil(getLockoutRemainingMs() / 1000),
  );

  // Contagem regressiva enquanto o bloqueio estiver ativo.
  useEffect(() => {
    if (lockedSeconds <= 0) return undefined;
    const intervalId = setInterval(() => {
      setLockedSeconds(Math.ceil(getLockoutRemainingMs() / 1000));
    }, 500);
    return () => clearInterval(intervalId);
  }, [lockedSeconds]);

  const isLocked = lockedSeconds > 0;

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting || isLocked) return;

    setSubmitting(true);
    setError("");
    const result = await login(username, password);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      setPassword(""); // nunca mantém a senha digitada após falha
      setLockedSeconds(Math.ceil((result.lockedMs ?? 0) / 1000));
    }
    // Em caso de sucesso, o App troca automaticamente para o Dashboard.
  }

  return (
    <div className="login-wrapper">
      <form className="login-card glass" onSubmit={handleSubmit} noValidate>
        <h1>
          Previsão <span className="highlight">D+1</span>
        </h1>
        <p className="login-subtitle">Entre para acessar o painel da estação A707.</p>

        <label className="field">
          <span>Usuário</span>
          <input
            type="text"
            name="username"
            autoComplete="username"
            maxLength={64}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLocked}
            autoFocus
          />
        </label>

        <label className="field">
          <span>Senha</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            maxLength={128}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLocked}
          />
        </label>

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}
        {isLocked && (
          <div className="alert alert-warning" role="status">
            Acesso bloqueado por {lockedSeconds}s após várias tentativas.
          </div>
        )}

        <button type="submit" className="btn btn-block" disabled={submitting || isLocked}>
          {submitting ? "Verificando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
