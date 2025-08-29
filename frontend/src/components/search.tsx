import { MagnifyingGlassIcon } from "@phosphor-icons/react";

interface SearchUsersProps {
  onSearch: (value: string) => void;
}

export default function SearchUsers({ onSearch }: SearchUsersProps) {
  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Pesquisar..."
        onChange={(e) => onSearch(e.target.value)}
        className="w-full p-2 border-none bg-[#F3F3F3] rounded"
      />
      <MagnifyingGlassIcon
        size={20}
        className="absolute right-3 top-3 text-gray-400"
      />
    </div>
  );
}
