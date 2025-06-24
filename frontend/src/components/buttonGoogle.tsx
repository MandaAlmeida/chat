import { apiUrl } from "../api";
import google from "../assets/google.svg";


interface Props {
    text: string;
}

const handleGoogleLogin = () => {
    window.location.href = `${apiUrl}/user/google`;
};

export default function ButtonGoogle({ text }: Props) {
    return (
        <button type="button" onClick={handleGoogleLogin} className="w-full flex bg-amber-50 border border-[#615EF0]  hover:border-[#3e3ca0] text-white p-2 rounded cursor-pointer">
            <img src={google} alt="Imagem do google" />
            <text className="text-[#464646] flex-1 text-center hover:text-[#3e3ca0]">{text}</text>
        </button>
    );
}