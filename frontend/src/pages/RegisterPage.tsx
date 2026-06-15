import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api/auth";

type Props = {
  onAuth: (token: string) => void;
};

export default function RegisterPage({ onAuth }: Props) {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const data = await register(name, email, password);

      onAuth(data.token);
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      alert("No se pudo crear la cuenta");
    }
  }

  return (
    <main className="min-h-screen bg-[#111113] text-white flex items-center justify-center px-5">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-center text-4xl font-bold">
          Habi<span className="text-purple-500">tus</span>
        </h1>

        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nombre"
          className="w-full rounded-xl bg-white/10 px-4 py-3 outline-none"
        />

        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Correo"
          className="w-full rounded-xl bg-white/10 px-4 py-3 outline-none"
        />

        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Contraseña"
          className="w-full rounded-xl bg-white/10 px-4 py-3 outline-none"
        />

        <button
          type="submit"
          className="w-full rounded-xl bg-purple-600 py-3 font-semibold"
        >
          Crear cuenta
        </button>

        <Link to="/login" className="block text-center text-purple-400">
          Ya tengo cuenta
        </Link>
      </form>
    </main>
  );
}
