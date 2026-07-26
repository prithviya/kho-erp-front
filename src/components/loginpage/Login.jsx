import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setSession } from "../../utils/session";
import authService from "../../services/auth.service";
import { toast } from "react-toastify";
export default function Login() {
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const LoginBtn = async (e) => {
    e.preventDefault();
    try {
      const response = await authService.login({
        email,
        password
      });
      if (response.success) {
        setSession({
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          user: response.data.user
        });
        toast.success(
          `Welcome back, ${response.data.user.firstName}!`
        );
        navigate("/dashboard");
      }
      else {
        const data = await response.json();
        console.log(data);
      }
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <>
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="border border-[#333333]/20 rounded-xl p-8 shadow-sm">
            <h1 className="text-3xl font-semibold text-[#333333] text-center mb-8">
              Login
            </h1>
            <form className="space-y-5">
              <div>
                <label className="block text-sm text-[#333333] mb-2">
                  Username / Email
                </label>
                <input
                  type="text"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter username or email"
                  className="w-full border border-[#333333]/30 rounded-lg px-4 py-3 outline-none focus:border-[#333333] transition"
                />
              </div>
              <div>
                <label className="block text-sm text-[#333333] mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full border border-[#333333]/30 rounded-lg px-4 py-3 outline-none focus:border-[#333333] transition"
                />
              </div>
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="text-sm text-[#333333] hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <button
                type="submit"
                onClick={LoginBtn}
                className="w-full bg-[#333333] text-white py-3 rounded-lg hover:opacity-90 transition"
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      </div>
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h2 className="text-xl font-semibold text-[#333333] mb-4">
              Forgot Password
            </h2>
            <p className="text-[#333333] text-sm leading-6">
              Please connect with the <strong>Admin Contact Person</strong> to
              reset your password.
            </p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="bg-[#333333] text-white px-5 py-2 rounded-lg hover:opacity-90"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}