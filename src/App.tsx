import { useState, useEffect } from "react";
import passManLogo from "./assets/passman-logo.svg";
import { FaMinus, FaPlus } from "react-icons/fa";
import PasswordForm from "./components/PasswordForm";
import PasswordItem from "./components/PasswordItem";

interface PasswordEntry {
  id: string;
  domain: string;
  username: string;
  password: string;
  favicon: string;
  createdAt: number;
}

function App() {
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [domain, setDomain] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
  const [showForm, setShowForm] = useState(false);

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
    if (!domain || !username || !password) {
      alert("Please enter domain, username, and password");
      return;
    }

    const newEntry: PasswordEntry = {
      id: Date.now().toString(),
      domain: domain,
      username: username,
      password: password,
      favicon: getFaviconUrl(domain),
      createdAt: Date.now(),
    };

    const updatedPasswords = [...passwords, newEntry];
    savePasswords(updatedPasswords);
    setDomain("");
    setUsername("");
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

  // Auto-fill credentials on the current page
  const autoFillCredentials = async (entry: PasswordEntry) => {
    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.id) {
        alert("Could not find active tab");
        return;
      }

      // Send message to content script to fill the form
      chrome.tabs.sendMessage(
        tab.id,
        {
          action: "autofill",
          domain: entry.domain,
          username: entry.username,
          password: entry.password,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            alert("Could not auto-fill. Make sure you're on a page with a login form.");
            console.error(chrome.runtime.lastError);
          } else if (response?.success) {
            // Optional: Show success feedback
            console.log("Auto-filled successfully!");
          } else {
            alert(response?.message || "Could not find login fields on this page");
          }
        }
      );
    } catch (error) {
      console.error("Error auto-filling:", error);
      alert("An error occurred while trying to auto-fill");
    }
  };

  return (
    <div className="w-96 max-h-[600px] bg-gray-50">
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

      <PasswordForm
        domain={domain}
        username={username}
        password={password}
        showForm={showForm}
        onDomainChange={setDomain}
        onUsernameChange={setUsername}
        onPasswordChange={setPassword}
        onSubmit={addPassword}
      />

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
              <PasswordItem
                key={entry.id}
                entry={entry}
                isPasswordVisible={showPassword[entry.id] || false}
                onToggleVisibility={() => togglePasswordVisibility(entry.id)}
                onAutoFill={() => autoFillCredentials(entry)}
                onCopy={() => copyToClipboard(entry.password)}
                onDelete={() => deletePassword(entry.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

