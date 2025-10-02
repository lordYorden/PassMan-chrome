import { FaCheck, FaTimes } from "react-icons/fa";

interface SavePromptProps {
  domain: string;
  username: string;
  onSave: () => void;
  onDismiss: () => void;
}

function SavePrompt({ domain, username, onSave, onDismiss }: SavePromptProps) {
  return (
    <div className="bg-sky-50 border-2 border-sky-700 rounded-lg p-4 mt-4 mb-4 mx-4 shadow-md">
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="text-lg font-semibold text-sky-900 mb-1">
            Save Login Details?
          </h3>
          <p className="text-sm text-gray-600">
            A login form was detected on <strong>{domain}</strong>
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Username: <strong>{username}</strong>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSave}
            className="flex-1 bg-sky-700 text-white font-semibold py-2 px-4 rounded-lg hover:bg-sky-800 transition flex items-center justify-center gap-2"
          >
            <FaCheck />
            Save
          </button>          <button
            type="button"
            onClick={onDismiss}
            className="flex-1 bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-400 transition flex items-center justify-center gap-2"
          >
            <FaTimes />
            Not Now
          </button>        </div>
      </div>
    </div>
  );
}

export default SavePrompt;
