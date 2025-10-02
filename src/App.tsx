import { useState, useEffect } from "react";
import passManLogo from "./assets/passman-logo.svg";
import { FaMinus, FaPlus } from "react-icons/fa";
import PasswordForm from "./components/PasswordForm";
import PasswordItem from "./components/PasswordItem";
import SavePrompt from "./components/SavePrompt";

interface PasswordEntry {
  id: string;
  domain: string;
  username: string;
  password: string;
  favicon: string;
  createdAt: number;
}

interface PendingCredentials {
  domain: string;
  username: string;
  password: string;
  timestamp: number;
}

function App() {
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [domain, setDomain] = useState("");
  const [favicon, setFavicon] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [showForm, setShowForm] = useState(false);
  const [pendingCredentials, setPendingCredentials] =
    useState<PendingCredentials | null>(null);

  useEffect(() => {
    //Load saved passwords from separate storage keys
    chrome.storage.local.get(null, (result) => {
      const loadedPasswords: PasswordEntry[] = [];

      //Filter and load only password entries (keys starting with "p" but not "pendingCredentials")
      Object.keys(result).forEach((key) => {
        if (key.startsWith("p") && key !== "pendingCredentials") {
          loadedPasswords.push(result[key]);
        }
      });

      //Sort by creation date (newest first)
      loadedPasswords.sort((a, b) => b.createdAt - a.createdAt);
      setPasswords(loadedPasswords);

      //Check for pending credentials from form submission
      if (result.pendingCredentials) {
        console.log(
          "[PassMan] Found pending credentials:",
          result.pendingCredentials
        );
        const pending = result.pendingCredentials as PendingCredentials;
        //Only show if captured within the last 5 minutes
        const age = Date.now() - pending.timestamp;

        if (age < 5 * 60 * 1000) {
          setPendingCredentials(pending);
        } else {
          //Clear old pending credentials
          chrome.storage.local.remove("pendingCredentials");
        }
      } else {
      }
    });

    //Get current tab's domain
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        try {
          const url = new URL(tabs[0].url);
          setDomain(url.hostname);
          setFavicon(tabs[0].favIconUrl || getFaviconUrl(url.hostname));
        } catch (error) {
          console.error("Error parsing URL:", error);
        }
      }
    });
  }, []);

  //Save passwords to Chrome storage (each entry separately)
  const savePasswords = (newPasswords: PasswordEntry[]) => {
    //Create an object with separate keys for each password
    const storageData: { [key: string]: PasswordEntry } = {};
    newPasswords.forEach((entry) => {
      storageData[`p${entry.id}`] = entry;
    });

    chrome.storage.local.set(storageData);
    setPasswords(newPasswords);
  };

  //Get favicon URL for a domain
  const getFaviconUrl = (domain: string): string => {
    try {
      //Remove protocol if present
      const cleanDomain = domain
        .replace(/^https?:\/\//, "")
        .replace(/\/.*$/, "");
      //Use multiple favicon services as fallback
      return `https://icons.duckduckgo.com/ip3/${cleanDomain}.ico`;
    } catch {
      return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
    }
  };

  //Add new password entry
  const addPassword = () => {
    if (!domain || !username || !password) {
      alert("Please enter domain, username, and password");
      return;
    }

    const newEntry: PasswordEntry = {
      id: crypto.randomUUID(),
      domain: domain,
      username: username,
      password: password,
      favicon: favicon || getFaviconUrl(domain),
      createdAt: Date.now(),
    };

    const updatedPasswords = [...passwords, newEntry];
    savePasswords(updatedPasswords);
    setDomain("");
    setUsername("");
    setPassword("");
  };

  //Delete password entry
  const deletePassword = (id: string) => {
    //Remove the specific password entry from storage
    chrome.storage.local.remove(`p${id}`);

    const updatedPasswords = passwords.filter((p) => p.id !== id);
    setPasswords(updatedPasswords);
  };

  //Toggle password visibility
  const togglePasswordVisibility = (id: string) => {
    setShowPassword((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  //Copy password to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  //Auto-fill credentials on the current page
  const autoFillCredentials = async (entry: PasswordEntry) => {
    try {
      //Get the active tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab.id) {
        alert("Could not find active tab");
        return;
      }

      //Send message to content script to fill the form
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
            alert(
              "Could not auto-fill. Make sure you're on a page with a login form."
            );
            console.error(chrome.runtime.lastError);
          } else if (response?.success) {
            //Optional: Show success feedback
          } else {
            alert(
              response?.message || "Could not find login fields on this page"
            );
          }
        }
      );
    } catch (error) {
      console.error("Error auto-filling:", error);
      alert("An error occurred while trying to auto-fill");
    }
  };

  //Save pending credentials
  const savePendingCredentials = () => {
    if (!pendingCredentials) return;

    const newEntry: PasswordEntry = {
      id: crypto.randomUUID(),
      domain: pendingCredentials.domain,
      username: pendingCredentials.username,
      password: pendingCredentials.password,
      favicon: favicon || getFaviconUrl(pendingCredentials.domain),
      createdAt: Date.now(),
    };

    const updatedPasswords = [newEntry, ...passwords];
    savePasswords(updatedPasswords);

    //Clear pending credentials and badge
    chrome.storage.local.remove("pendingCredentials");
    chrome.action.setBadgeText({ text: "" });
    setPendingCredentials(null);
  };

  //Dismiss pending credentials prompt
  const dismissPendingCredentials = () => {
    chrome.storage.local.remove("pendingCredentials");
    chrome.action.setBadgeText({ text: "" });
    setPendingCredentials(null);
  };

  return (
    <div className="w-96 max-h-[600px] bg-gray-50">
      <div className="bg-sky-700 text-white p-4">
        <div className="flex flex-row justify-between items-start">
          <div>
            <div className="flex flex-row gap-1 items-center">
              <img
                src={passManLogo}
                alt="PassMan Logo"
                className="w-6 h-6 inline-block"
              />
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

      {pendingCredentials && (
        <SavePrompt
          domain={pendingCredentials.domain}
          username={pendingCredentials.username}
          onSave={savePendingCredentials}
          onDismiss={dismissPendingCredentials}
        />
      )}

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
        <h2 className="text-lg font-semibold mb-3">
          Saved Passwords ({passwords.length})
        </h2>
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
