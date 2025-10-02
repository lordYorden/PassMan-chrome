import PasswordActions from "./PasswordActions";
import type { PasswordEntry } from "../types";

interface PasswordItemProps {
  entry: PasswordEntry;
  isPasswordVisible: boolean;
  onToggleVisibility: () => void;
  onAutoFill: () => void;
  onCopy: () => void;
  onDelete: () => void;
}

function PasswordItem({
  entry,
  isPasswordVisible,
  onToggleVisibility,
  onAutoFill,
  onCopy,
  onDelete,
}: PasswordItemProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition">
      <div className="flex items-center gap-3">
        <img
          src={entry.favicon}
          alt={`${entry.domain} favicon`}
          className="w-8 h-8 rounded"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23999'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z'/%3E%3C/svg%3E";
          }}
        />

        {/* Username and Password */}
        <div className="flex-1">
          <div className="font-semibold text-gray-800">{entry.username}</div>
          <div className="text-sm text-gray-600 flex items-center gap-2">
            <span className="font-mono">
              {isPasswordVisible
                ? entry.password
                : "•".repeat(entry.password.length)}
            </span>
            <button
              onClick={onToggleVisibility}
              className="text-sky-600 hover:text-sky-800 text-xs"
            >
              {isPasswordVisible ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* Actions */}
        <PasswordActions
          onAutoFill={onAutoFill}
          onCopy={onCopy}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}

export default PasswordItem;
