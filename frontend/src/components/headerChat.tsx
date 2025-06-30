import { DotsThreeVerticalIcon } from "@phosphor-icons/react";

type Props = {
    name: string;
    id?: string;
    status?: string;
}

export function HeaderChat({ name, id, status }: Props) {
    return (
        <header className="flex items-center justify-between p-6 border-b border-gray-300">
            <div className="flex flex-col">
                <h2 className="text-xl font-bold">{name}</h2>
                <section className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-[#68D391] rounded-full flex"></span>
                    <p className="text-[12px]">{status ? status : "Online"}</p>
                </section>

            </div>
            <button className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer bg-[#EFEFFD]"><DotsThreeVerticalIcon size={30} color="#615EF0" weight="bold" /></button>
        </header>
    )
}