import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { EnvelopeIcon, LockSimpleIcon } from "@phosphor-icons/react";
import ButtonGoogle from "../components/buttonGoogle";
import { useChat } from "../context/ChatContext";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const { fetchUser, isLoading, setIsLoading } = useChat();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const isFormValid = Object.values(form).every((value) => value.trim() !== "");
  const isEmailFilled = form.email.trim() !== "";
  const isEmailErrored = error.toLowerCase().includes("email");
  const isPasswordFilled = form.password.trim() !== "";
  const isPasswordErrored = error.toLowerCase().includes("senha");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await api.post("/user/login", form);

      // Salva os tokens no localStorage
      localStorage.setItem("access_token", res.data.access_token);
      localStorage.setItem("refresh_token", res.data.refresh_token);

      // Atualiza os dados do usuário no contexto
      await fetchUser();
    } catch (err: any) {
      setIsLoading(false);
      if (err.response) {
        // Erro do backend (credenciais inválidas, etc.)
        setError(
          err.response.data?.message ||
            "Falha no login. Verifique suas credenciais."
        );
      } else if (err.request) {
        // Erro de conexão com o servidor
        setError("Não foi possível conectar ao servidor. Tente novamente.");
      } else {
        // Erro inesperado
        setError("Ocorreu um erro inesperado. Tente mais tarde.");
      }
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="bg-[#615EF0] w-[50%] h-screen max-md:w-0"></div>
      <div className="flex items-center justify-center w-[50%] max-md:w-full">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded space-y-4 w-[473px]"
        >
          <h1 className="text-xl text-[#615EF0] font-bold text-center">
            Acesse sua conta
          </h1>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          {/* Campo Email */}
          <section
            className={`w-full flex items-center gap-4 p-2 border rounded transition-colors duration-200 ${
              isEmailErrored
                ? "border-red-500"
                : isEmailFilled
                ? "border-[#615EF0]"
                : "border-[#464646]"
            }`}
          >
            <EnvelopeIcon
              size={20}
              color={
                isEmailErrored
                  ? "#ef4444"
                  : isEmailFilled
                  ? "#615EF0"
                  : "#464646"
              }
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="flex-1 outline-none"
              required
            />
          </section>

          {/* Campo Senha */}
          <section
            className={`w-full flex items-center gap-4 p-2 border rounded transition-colors duration-200 ${
              isPasswordErrored
                ? "border-red-500"
                : isPasswordFilled
                ? "border-[#615EF0]"
                : "border-[#464646]"
            }`}
          >
            <LockSimpleIcon
              size={20}
              color={
                isPasswordErrored
                  ? "#ef4444"
                  : isPasswordFilled
                  ? "#615EF0"
                  : "#464646"
              }
            />
            <input
              type="password"
              name="password"
              placeholder="Senha"
              value={form.password}
              onChange={handleChange}
              className="flex-1 outline-none"
              required
            />
          </section>

          {/* Botão Entrar */}
          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className={`w-full transition-colors duration-300 ${
              !isFormValid || isLoading
                ? "bg-[#8F8DFF] cursor-not-allowed"
                : "bg-[#615EF0] hover:bg-[#3e3ca0] cursor-pointer"
            } text-white p-2 rounded`}
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </button>

          <ButtonGoogle text="Entrar com o Google" />

          <div className="flex flex-col items-center">
            <span className="text-[#464646]">Não possui uma conta ainda?</span>
            <Link
              to={"/register"}
              className="text-[#615EF0] underline font-bold hover:text-[#3e3ca0] cursor-pointer"
            >
              Criar conta
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
