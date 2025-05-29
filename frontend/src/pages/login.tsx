import axios from 'axios';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:3333/user/login', form);
            localStorage.setItem('token', res.data.token);
            navigate('/chat');
        } catch (err) {
            setError('Login falhou!');
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = 'http://localhost:3333/user/google';
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md space-y-4 w-80">
                <h1 className="text-xl font-bold text-center">Login</h1>

                {error && <div className="text-red-500 text-sm">{error}</div>}

                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Senha"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                />
                <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
                    Entrar
                </button>
                <button type="button" onClick={() => navigate('/register')} className="w-full bg-blue-300 text-white p-2 rounded hover:bg-blue-600">
                    Criar conta
                </button>
                <button type="button" onClick={handleGoogleLogin} className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600">
                    Entrar com Google
                </button>
            </form>
        </div>
    );
}
