import { useState, type KeyboardEvent } from "react";
import { ThemeToggleButton } from "../common/ThemeToggleButton";
import UserDropdown from "./UserDropdown";
import { Link } from "react-router";

export type ParsedCommand = {
  qty?: number;
  region?: string;
  typeEntry?: "IN" | "OUT";
  supplyCode?: string;
  date?: string; // yyyy-MM-dd
};

interface HeaderProps {
  onClick?: () => void;
  onToggle: () => void;
  // callback opcional ao executar um comando /adm
  onCommand?: (cmd: ParsedCommand) => void;
}

const Header: React.FC<HeaderProps> = ({ onClick, onToggle, onCommand }) => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const [command, setCommand] = useState("");

  const toggleApplicationMenu = () => {
    setApplicationMenuOpen((prev) => !prev);
  };

  // Parse do comando no formato:
  // /adm 120 /r GRU /te OUT /ts BTP /d 2025-01-10
  const parseCommand = (input: string): ParsedCommand | null => {
    const trimmed = input.trim();
    if (!trimmed.toLowerCase().startsWith("/adm")) return null;

    const tokens = trimmed.split(/\s+/); // separa por espaço
    const result: ParsedCommand = {};

    // Pega quantidade logo após /adm se for número
    if (tokens[1] && !tokens[1].startsWith("/")) {
      const qty = Number(tokens[1]);
      if (!Number.isNaN(qty)) {
        result.qty = qty;
      }
    }

    for (let i = 1; i < tokens.length; i++) {
      const t = tokens[i].toLowerCase();

      // /r GRU
      if (t === "/r" && tokens[i + 1]) {
        result.region = tokens[i + 1].toUpperCase();
      }

      // /te OUT | IN
      if (t === "/te" && tokens[i + 1]) {
        const te = tokens[i + 1].toUpperCase();
        if (te === "IN" || te === "OUT") {
          result.typeEntry = te;
        }
      }

      // /ts BTP
      if (t === "/ts" && tokens[i + 1]) {
        result.supplyCode = tokens[i + 1].toUpperCase();
      }

      // /d 2025-01-10 ou /D
      if ((t === "/d" || t === "/data") && tokens[i + 1]) {
        const d = tokens[i + 1];
        if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
          result.date = d;
        }
      }
    }

    return result;
  };

  const handleCommandKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const parsed = parseCommand(command);

      if (parsed && onCommand) {
        onCommand(parsed);
      }

      // se quiser limpar depois:
      // setCommand("");
    }
  };

  return (
    <header className="sticky top-0 flex w-full bg-white border-gray-200 z-99999 dark:border-[#1e1e1e] dark:bg-[#1e1e1e] lg:border-b">
      <div className="flex flex-col items-center justify-between grow lg:flex-row lg:px-6">
        <div className="flex items-center justify-between w-full gap-2 px-3 py-3 border-b border-gray-200 dark:border-[#1e1e1e] sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4">
          {/* Menu mobile */}
          <button
            className="block w-10 h-10 text-gray-500 lg:hidden dark:text-gray-400"
            onClick={onToggle}
          >
            {/* Hamburger Icon */}
            <svg
              className="block"
              width="16"
              height="12"
              viewBox="0 0 16 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z"
                fill="currentColor"
              />
            </svg>
          </button>

          {/* Botão sidebar desktop */}
          <button
            onClick={onClick}
            className="items-center justify-center hidden w-10 h-10 text-gray-500 border-gray-200 rounded-lg z-99999 dark:border-[#1e1e1e] lg:flex dark:text-gray-400 lg:h-11 lg:w-11 lg:border"
          >
            <svg
              className="hidden fill-current lg:block"
              width="16"
              height="12"
              viewBox="0 0 16 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z"
                fill=""
              />
            </svg>
          </button>

          {/* Logo mobile */}
          <Link to="/" className="lg:hidden">
            <img
              className="dark:hidden"
              src="/logo.png"
              alt="Logo"
            />
            <img
              className="hidden dark:block"
              src="/logo.png"
              alt="Logo"
            />
          </Link>

          {/* Botão app menu mobile */}
          <button
            onClick={toggleApplicationMenu}
            className="flex items-center justify-center w-10 h-10 text-gray-700 rounded-lg z-99999 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-[#1e1e1e] lg:hidden"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.99902 10.4951C6.82745 10.4951 7.49902 11.1667 7.49902 11.9951V12.0051C7.49902 12.8335 6.82745 13.5051 5.99902 13.5051C5.1706 13.5051 4.49902 12.8335 4.49902 12.0051V11.9951C4.49902 11.1667 5.1706 10.4951 5.99902 10.4951ZM17.999 10.4951C18.8275 10.4951 19.499 11.1667 19.499 11.9951V12.0051C19.499 12.8335 18.8275 13.5051 17.999 13.5051C17.1706 13.5051 16.499 12.8335 16.499 12.0051V11.9951C16.499 11.1667 17.1706 10.4951 17.999 10.4951ZM13.499 11.9951C13.499 11.1667 12.8275 10.4951 11.999 10.4951C11.1706 10.4951 10.499 11.1667 10.499 11.9951V12.0051C10.499 12.8335 11.1706 13.5051 11.999 13.5051C12.8275 13.5051 13.499 12.8335 13.499 12.0051V11.9951Z"
                fill="currentColor"
              />
            </svg>
          </button>

          {/* Search / Command bar (desktop) */}
          <div className="hidden lg:block">
            <div className="relative">
              <button className="absolute -translate-y-1/2 left-4 top-1/2">
                {/* ícone de busca */}
              </button>
              <input
                type="text"
                placeholder="Search or type command..."
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={handleCommandKeyDown}
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-white/3 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[430px]"
              />
              <button className="absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 px-[7px] py-[4.5px] text-xs -tracking-[0.2px] text-gray-500 dark:border-[#1e1e1e] dark:bg-white/3 dark:text-gray-400">
                <span> ⌘ </span>
                <span> K </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div
          className={`${
            isApplicationMenuOpen ? "flex" : "hidden"
          } items-center justify-between w-full gap-4 px-5 py-4 lg:flex shadow-theme-md lg:justify-end lg:px-0 lg:shadow-none`}
        >
          <div className="flex items-center gap-2 2xsm:gap-3">
            <ThemeToggleButton />
          </div>
          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

export default Header;
