import { useState, useEffect } from "react";
import passManLogo from "./assets/passman-logo.svg";
import { FaMinus, FaPlus } from "react-icons/fa";
import PasswordForm from "./components/PasswordForm";
import PasswordItem from "./components/PasswordItem";
import SavePrompt from "./components/SavePrompt";
import MasterPasswordPrompt from "./components/MasterPasswordPrompt";
import {
  encryptPasswordEntry,
  decryptPasswordEntry,
  createPasswordVerifier,
  verifyMasterPassword,
  type EncryptedData,
} from "./utils/crypto";
import type { PasswordEntry } from "./types";

interface StoredPasswordEntry {
  id: string;
  encryptedData: EncryptedData;
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

  // Master password state
  const [isLocked, setIsLocked] = useState(true);
  const [isSetup, setIsSetup] = useState(false);
  const [masterPassword, setMasterPassword] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | undefined>(undefined);

  // Check if master password is set up
  useEffect(() => {
    //Load saved passwords from separate storage keys
    chrome.storage.local.get(null, (result) => {
      //Check for pending credentials from form submission
      if (result["_pending"]) {
        console.log(
          "[PassMan] Found pending credentials:",
          result["_pending"]
        );
        const pending = result["_pending"] as PendingCredentials;
        //Only show if captured within the last 5 minutes
        const age = Date.now() - pending.timestamp;

        if (age < 5 * 60 * 1000) {
          setPendingCredentials(pending);
        } else {
          //Clear old pending credentials
          chrome.storage.local.remove("_pending");
        }
      }
    }

    chrome.storage.local.get(["masterPasswordVerifier"], (result) => {
      if (!result.masterPasswordVerifier) {
        setIsSetup(true);
        setIsLocked(true);
      } else {
        setIsSetup(false);
        setIsLocked(true);
      }
    });
    
  }, []);

  // Load and decrypt passwords when unlocked
  useEffect(() => {
    if (!isLocked && masterPassword) {
      loadPasswords();
    }
    
  }, [isLocked, masterPassword]);

  // Get current tab's domain on mount
  useEffect(() => {
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

  // Handle master password setup or unlock
  const handleMasterPasswordSubmit = async (password: string) => {
    setAuthError(undefined);

    if (isSetup) {
      // Setup: Create new master password
      try {
        const verifier = await createPasswordVerifier(password);
        chrome.storage.local.set({ masterPasswordVerifier: verifier }, () => {
          setMasterPassword(password);
          setIsLocked(false);
          setIsSetup(false);
        });
      } catch (error) {
        setAuthError("Failed to create master password");
      }
    } else {
      // Unlock: Verify master password
      chrome.storage.local.get(["masterPasswordVerifier"], async (result) => {
        if (!result.masterPasswordVerifier) {
          setAuthError("Master password not set up");
          return;
        }

        const isValid = await verifyMasterPassword(
          result.masterPasswordVerifier,
          password
        );
        if (isValid) {
          setMasterPassword(password);
          setIsLocked(false);
          setAuthError(undefined);
        } else {
          setAuthError("Incorrect master password");
        }
      });
    }
  };

  // Load and decrypt passwords
  const loadPasswords = async () => {
    if (!masterPassword) return;

    chrome.storage.local.get(null, async (result) => {
      const loadedPasswords: PasswordEntry[] = [];

      // Filter and load only password entries (keys starting with "p")
      for (const key of Object.keys(result)) {
        if (key.startsWith("p") && key !== "p") {
          try {
            const stored: StoredPasswordEntry = result[key];
            const decrypted = await decryptPasswordEntry(
              stored.encryptedData,
              masterPassword
            );

            loadedPasswords.push({
              id: stored.id,
              domain: decrypted.domain,
              username: decrypted.username,
              password: decrypted.password,
              favicon: stored.favicon,
              createdAt: stored.createdAt,
            });
          } catch (error) {
            console.error(`Failed to decrypt password ${key}:`, error);
          }
        }
      }

      // Sort by creation date (newest first)
      loadedPasswords.sort((a, b) => b.createdAt - a.createdAt);
      setPasswords(loadedPasswords);
    });
  };

  // Save passwords to Chrome storage (encrypted)
  const savePasswords = async (newPasswords: PasswordEntry[]) => {
    if (!masterPassword) return;

    // Create an object with separate keys for each password
    const storageData: { [key: string]: StoredPasswordEntry } = {};

    for (const entry of newPasswords) {
      try {
        const encryptedData = await encryptPasswordEntry(
          {
            domain: entry.domain,
            username: entry.username,
            password: entry.password,
          },
          masterPassword
        );

        storageData[`p${entry.id}`] = {
          id: entry.id,
          encryptedData,
          favicon: entry.favicon,
          createdAt: entry.createdAt,
        };
      } catch (error) {
        console.error(`Failed to encrypt password ${entry.id}:`, error);
      }
    }

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
    chrome.storage.local.remove("_pending");
    chrome.action.setBadgeText({ text: "" });
    setPendingCredentials(null);
  };

  //Dismiss pending credentials prompt
  const dismissPendingCredentials = () => {
    chrome.storage.local.remove("_pending");
    chrome.action.setBadgeText({ text: "" });
    setPendingCredentials(null);
  };

  return (
    <div className="w-96 min-h-[600px] bg-gray-50">
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
            <p className="text-sm opacity-90">The password manager from hell</p>
          </div>
          {!isLocked && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-sky-600 hover:bg-sky-800 text-white font-semibold py-2 px-3 rounded-lg transition text-sm"
              title={showForm ? "Hide form" : "Add password"}
            >
              {showForm ? <FaMinus /> : <FaPlus />}
            </button>
          )}
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

      {/* Master Password Prompt */}
      {isLocked && (
        <MasterPasswordPrompt
          isSetup={isSetup}
          onSubmit={handleMasterPasswordSubmit}
          error={authError}
        />
      )}

      {(showForm && !isLocked) && <PasswordForm
        domain={domain}
        username={username}
        password={password}
        onDomainChange={setDomain}
        onUsernameChange={setUsername}
        onPasswordChange={setPassword}
        onSubmit={addPassword}
      />}


      {!isLocked && (<div className="p-4 overflow-y-auto max-h-[400px]">
        <h2 className="text-lg font-semibold mb-3">
          Saved Passwords ({passwords.length})
        </h2>
        {passwords.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-xl">No passwords saved yet</p>
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
      </div>)}
    </div>
  );
}

export default App;
