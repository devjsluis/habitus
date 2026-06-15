import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../api/auth";

type Props = {
  onAuth: (token: string) => void;
};

export default function LoginPage({ onAuth }: Props) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const data = await login(email, password);

    onAuth(data.token);
    navigate("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#111113] text-white flex items-center justify-center px-5">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-4xl font-bold text-center">
          Habi<span className="text-purple-500">tus</span>
        </h1>

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Correo"
          className="w-full rounded-xl bg-white/10 px-4 py-3 outline-none"
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          className="w-full rounded-xl bg-white/10 px-4 py-3 outline-none"
        />

        <button
          type="submit"
          className="w-full rounded-xl bg-purple-600 py-3 font-semibold"
        >
          Iniciar sesión
        </button>

        <Link to="/register" className="block text-center text-purple-400">
          Crear cuenta
        </Link>
      </form>
    </main>
  );
}
