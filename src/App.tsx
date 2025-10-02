import { useState, useEffect } from "react";
import passManLogo from "./assets/passman-logo.svg";
import { FaMinus, FaPlus } from "react-icons/fa";

interface PasswordEntry {
  id: string;
  domain: string;
  password: string;
  favicon: string;
  createdAt: number;
}

function App() {
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [domain, setDomain] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
  const [showForm, setShowForm] = useState(false);

  // Load passwords from Chrome storage and get current tab domain
  useEffect(() => {
    // Load saved passwords
    chrome.storage.local.get(["passwords"], (result) => {
      if (result.passwords) {
        setPasswords(result.passwords);
      }
    });

    // Get current tab's domain
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        try {
          const url = new URL(tabs[0].url);
          setDomain(url.hostname);
        } catch (error) {
          console.error("Error parsing URL:", error);
        }
      }
    });
  }, []);

  // Save passwords to Chrome storage
  const savePasswords = (newPasswords: PasswordEntry[]) => {
    chrome.storage.local.set({ passwords: newPasswords });
    setPasswords(newPasswords);
  };

  // Get favicon URL for a domain
  const getFaviconUrl = (domain: string): string => {
    try {
      // Remove protocol if present
      const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      // Use multiple favicon services as fallback
      return `https://icons.duckduckgo.com/ip3/${cleanDomain}.ico`;
    } catch {
      return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
    }
  };

  // Add new password entry
  const addPassword = () => {
    if (!domain || !password) {
      alert("Please enter both domain and password");
      return;
    }

    const newEntry: PasswordEntry = {
      id: Date.now().toString(),
      domain: domain,
      password: password,
      favicon: getFaviconUrl(domain),
      createdAt: Date.now(),
    };

    const updatedPasswords = [...passwords, newEntry];
    savePasswords(updatedPasswords);
    setDomain("");
    setPassword("");
  };

  // Delete password entry
  const deletePassword = (id: string) => {
    const updatedPasswords = passwords.filter((p) => p.id !== id);
    savePasswords(updatedPasswords);
  };

  // Toggle password visibility
  const togglePasswordVisibility = (id: string) => {
    setShowPassword((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Copy password to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="w-96 max-h-[600px] bg-gray-50">
      {/* Header */}
      <div className="bg-sky-700 text-white p-4">
        <div className="flex flex-row justify-between items-start">
          <div>
            <div className="flex flex-row gap-1 items-center">
              <img src={passManLogo} alt="PassMan Logo" className="w-6 h-6 inline-block" />
              <h1 className="text-2xl font-bold">PassMan</h1>
            </div>
            <p className="text-sm opacity-90">Password Manager</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-sky-600 hover:bg-sky-800 text-white font-semibold py-2 px-3 rounded-lg transition text-sm"
            title={showForm ? "Hide form" : "Add password"}
          >
            {showForm ? <FaMinus /> : <FaPlus />}
          </button>
        </div>
      </div>

      {/* Add Password Form */}
      <div className={`p-4 bg-white shadow-md ${showForm ? '' : 'hidden'}`}>
        <h2 className="text-lg font-semibold mb-3">Add New Password</h2>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Domain (e.g., google.com)"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <button
            onClick={addPassword}
            className="bg-sky-700 text-white font-semibold py-2 px-4 rounded-lg hover:bg-sky-800 transition"
          >
            Add Password
          </button>
        </div>
      </div>

      {/* Password List */}
      <div className="p-4 overflow-y-auto max-h-[400px]">
        <h2 className="text-lg font-semibold mb-3">Saved Passwords ({passwords.length})</h2>
        {passwords.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No passwords saved yet</p>
            <p className="text-sm">Add your first password above</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {passwords.map((entry) => (
              <div
                key={entry.id}
                className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-center gap-3">
                  {/* Favicon */}
                  <img
                    src={entry.favicon}
                    alt={`${entry.domain} favicon`}
                    className="w-8 h-8 rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23999'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z'/%3E%3C/svg%3E";
                    }}
                  />

                  {/* Domain and Password */}
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{entry.domain}</div>
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="font-mono">
                        {showPassword[entry.id]
                          ? entry.password
                          : "•".repeat(entry.password.length)}
                      </span>
                      <button
                        onClick={() => togglePasswordVisibility(entry.id)}
                        className="text-sky-600 hover:text-sky-800 text-xs"
                      >
                        {showPassword[entry.id] ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => copyToClipboard(entry.password)}
                      className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition"
                      title="Copy password"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => deletePassword(entry.id)}
                      className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition"
                      title="Delete"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

