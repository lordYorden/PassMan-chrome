interface PasswordFormProps {
  domain: string;
  username: string;
  password: string;
  onDomainChange: (value: string) => void;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
}

function PasswordForm({
  domain,
  username,
  password,
  onDomainChange,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
}: PasswordFormProps) {
  return (
    <div className="p-4 bg-white shadow-md">
      <h2 className="text-lg font-semibold mb-3">Add New Password</h2>
      <div className="flex flex-col gap-2">
        <input
          type="text"
          placeholder="Username or Email"
          value={username}
          onChange={(e) => onUsernameChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <input
          type="text"
          placeholder="Domain (e.g., google.com)"
          value={domain}
          onChange={(e) => onDomainChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <button
          onClick={onSubmit}
          className="bg-sky-700 text-white font-semibold py-2 px-4 rounded-lg hover:bg-sky-800 transition"
        >
          Add Password
        </button>
      </div>
    </div>
  );
}

export default PasswordForm;
