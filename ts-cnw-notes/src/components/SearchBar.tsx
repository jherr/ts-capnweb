import { useState } from "react";

interface SearchBarProps {
  onSearch: (searchTerm: string) => void;
  placeholder?: string;
}

export function SearchBar({
  onSearch,
  placeholder = "Search notes...",
}: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  const handleClear = () => {
    setSearchTerm("");
    onSearch("");
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={searchTerm}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full px-4 py-3 pl-10 pr-10 bg-gray-800 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
        🔍
      </div>
      {searchTerm && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
        >
          ✕
        </button>
      )}
    </div>
  );
}
