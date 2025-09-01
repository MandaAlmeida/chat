import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../api";
import ButtonGoogle from "../components/buttonGoogle";
import {
  CalendarIcon,
  EnvelopeIcon,
  IdentificationCardIcon,
  LockSimpleIcon,
} from "@phosphor-icons/react";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    birth: "",
    password: "",
    passwordConfirmation: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const isFormValid = Object.values(form).every((value) => value.trim() !== "");

  const isNameFilled = form.name.trim() !== "";
  const isNameErrored = error.toLowerCase().includes("name");
  const isEmailFilled = form.email.trim() !== "";
  const isEmailErrored = error.toLowerCase().includes("email");
  const isPasswordFilled = form.password.trim() !== "";
  const isPasswordErrored = error.toLowerCase().includes("senha");
  const isPasswordConfirmFilled = form.passwordConfirmation.trim() !== "";
  const isPasswordConfirmErrored = error
    .toLowerCase()
    .includes("passwordConfirmation");
  const isDateFilled = form.birth.trim() !== "";
  const isDateErrored = error.toLowerCase().includes("birth");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.passwordConfirmation) {
      setError("As senhas precisam ser iguais");
      return;
    }
    try {
      await api.post("/user/register", form);
      navigate("/");
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Erro no registro");
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-[#615EF0] w-[50%] h-screen max-md:w-0"> </div>
      <div className="flex items-center justify-center w-[50%] max-md:w-full">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded space-y-4 w-[473px]"
        >
          <h1 className="text-xl font-bold text-center text-[#615EF0]">
            Crie sua conta
          </h1>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <section
            className={`
    w-full flex items-center gap-4 p-2 border rounded 
        ${
          isNameErrored
            ? "border-red-500"
            : isNameFilled
            ? "border-[#615EF0]"
            : "border-[#464646]"
        }`}
          >
            <IdentificationCardIcon
              size={20}
              color={
                isNameErrored ? "#ef4444" : isNameFilled ? "#615EF0" : "#464646"
              }
            />
            <input
              type="text"
              name="name"
              placeholder="Nome"
              value={form.name}
              onChange={handleChange}
              className="flex-1 outline-none"
              required
            />
          </section>
          <section
            className={`
    w-full flex items-center gap-4 p-2 border rounded 
        ${
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
          <section
            className={`
    w-full flex items-center gap-4 p-2 border rounded 
        ${
          isDateErrored
            ? "border-red-500"
            : isDateFilled
            ? "border-[#615EF0]"
            : "border-[#464646]"
        }`}
          >
            <CalendarIcon
              size={20}
              color={
                isDateErrored ? "#ef4444" : isDateFilled ? "#615EF0" : "#464646"
              }
            />
            <input
              type="date"
              name="birth"
              placeholder="Data de nascimento"
              value={form.birth}
              onChange={handleChange}
              className="flex-1 appearance-none outline-none"
              required
            />
          </section>
          <section
            className={`
    w-full flex items-center gap-4 p-2 border rounded 
        ${
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
          <section
            className={`
    w-full flex items-center gap-4 p-2 border rounded 
        ${
          isPasswordConfirmErrored
            ? "border-red-500"
            : isPasswordConfirmFilled
            ? "border-[#615EF0]"
            : "border-[#464646]"
        }`}
          >
            <LockSimpleIcon
              size={20}
              color={
                isPasswordConfirmErrored
                  ? "#ef4444"
                  : isPasswordConfirmFilled
                  ? "#615EF0"
                  : "#464646"
              }
            />
            <input
              type="password"
              name="passwordConfirmation"
              placeholder="Confirmar senha"
              value={form.passwordConfirmation}
              onChange={handleChange}
              className="flex-1 outline-none"
              required
            />
          </section>
          <button
            type="submit"
            className={`w-full transition ${
              !isFormValid
                ? "bg-[#8F8DFF] cursor-not-allowed"
                : "bg-[#615EF0] hover:bg-[#3e3ca0] cursor-pointer"
            } text-white p-2 rounded `}
          >
            Registrar
          </button>
          <ButtonGoogle text="Criar conta com o google" />
          <div className="flex flex-col items-center">
            <text className="text-[#464646]">Já possui uma conta?</text>
            <Link
              to={"/"}
              className="text-[#615EF0] underline font-bold  hover:text-[#3e3ca0] cursor-pointer"
            >
              Entrar na conta
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
