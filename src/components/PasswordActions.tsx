interface PasswordActionsProps {
  onAutoFill: () => void;
  onCopy: () => void;
  onDelete: () => void;
}

function PasswordActions({ onAutoFill, onCopy, onDelete }: PasswordActionsProps) {
  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={onAutoFill}
        className="text-xs bg-sky-600 text-white px-2 py-1 rounded hover:bg-sky-700 transition"
        title="Auto-fill on current page"
      >
        Fill
      </button>
      <button
        onClick={onCopy}
        className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition"
        title="Copy password"
      >
        Copy
      </button>
      <button
        onClick={onDelete}
        className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition"
        title="Delete"
      >
        Delete
      </button>
    </div>
  );
}

export default PasswordActions;
