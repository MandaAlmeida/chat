import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import { EnvelopeIcon, EyeIcon, EyeSlashIcon, LockSimpleIcon } from '@phosphor-icons/react';
import ButtonGoogle from '../components/buttonGoogle';

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);


    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');

        if (token) {
            localStorage.setItem('token', token);
            window.history.replaceState({}, document.title, "/");
            navigate('/chat');
        }
    }, [location.search, navigate]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const isFormValid = Object.values(form).every(value => value.trim() !== '');
    const isEmailFilled = form.email.trim() !== '';
    const isEmailErrored = error.toLowerCase().includes('email');
    const isPasswordFilled = form.password.trim() !== '';
    const isPasswordErrored = error.toLowerCase().includes('senha');


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('/user/login', form);
            localStorage.setItem('access_token', res.data.access_token);
            localStorage.setItem('refresh_token', res.data.refresh_token);

            navigate('/chat');
        } catch (err) {
            setError('Login falhou!');
        }
    };

    return (
        <div className="flex min-h-screen">
            <div className='bg-[#615EF0] w-[50%] h-screen'> </div>
            <div className='flex items-center justify-center w-[50%]'>
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded space-y-4 w-[473px]">
                    <h1 className="text-xl text-[#615EF0] font-bold text-center">Acesse sua conta</h1>

                    {error && <div className="text-red-500 text-sm">{error}</div>}
                    <section
                        className={`
    w-full flex items-center gap-4 p-2 border rounded 
    ${isEmailErrored ? 'border-red-500' : isEmailFilled ? 'border-[#615EF0]' : 'border-[#464646]'}
  `}
                    >
                        <EnvelopeIcon size={20} color={isEmailErrored ? '#ef4444' : isEmailFilled ? '#615EF0' : '#464646'} />
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
                         ${isPasswordErrored ? 'border-red-500' : isPasswordFilled ? 'border-[#615EF0]' : 'border-[#464646]'}
                         `}
                    >
                        <LockSimpleIcon size={20} color={isPasswordErrored ? '#ef4444' : isPasswordFilled ? '#615EF0' : '#464646'} />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            placeholder="Senha"
                            value={form.password}
                            onChange={handleChange}
                            className="flex-1 outline-none"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="focus:outline-none"
                        >
                            {showPassword ? <EyeSlashIcon size={20} color="#464646" /> : <EyeIcon size={20} color="#464646" />}
                        </button>
                    </section>

                    <button type="submit" className={`w-full transition ${!isFormValid ? "bg-[#8F8DFF] cursor-not-allowed" : "bg-[#615EF0] hover:bg-[#3e3ca0] cursor-pointer"} text-white p-2 rounded `}>
                        Entrar
                    </button>

                    <ButtonGoogle text='Entrar como o google' />
                    <div className="flex flex-col items-center">
                        <text className="text-[#464646]">Não possui uma conta ainda?</text>
                        <Link to={'/register'} className="text-[#615EF0] underline font-bold  hover:text-[#3e3ca0] cursor-pointer">
                            Criar conta
                        </Link>
                    </div>

                </form >
            </div>
        </div >
    );
}
