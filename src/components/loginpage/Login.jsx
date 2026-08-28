import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setSession } from "../../utils/session";
import authService from "../../services/auth.service";
import { toast } from "react-toastify";

export default function Login() {
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const LoginBtn = async (e) => {
    e.preventDefault();

    try {
      const response = await authService.login({
        email,
        password,
      });

      if (response.success) {
        setSession({
          user: response.data.user,
        });

        toast.success(`Welcome back, ${response.data.user.firstName}!`);
        navigate("/dashboard");
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold mb-8">Login</h1>

          <form onSubmit={LoginBtn} className="space-y-5">
            <div>
              <label className="block mb-2 text-gray-700">
                User Email
              </label>

              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter username or email"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-black outline-none"
              />
            </div>

            <div>
              <label className="block mb-2 text-gray-700">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-black outline-none"
              />
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="text-sm text-gray-600 hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800"
            >
              Login
            </button>
          </form>
        </div>
      </div>

      {/* Right Side - Background Image */}
      <div
        className="hidden lg:block w-1/2 bg-cover bg-left"
        style={{
          backgroundImage:
            "url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS1rZbW9GsXD5FRPlSliRR7rXnUvOTBAjlqgpdJNpfJ3mpi9xpK3I0bKvc&s=10')",
        }}
      />

      {/* Forgot Password Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-80">
            <h2 className="text-xl font-semibold mb-3">
              Forgot Password
            </h2>

            <p className="text-gray-600 mb-5">
              Please connect with the Admin Contact Person to reset your
              password.
            </p>

            <button
              onClick={() => setShowModal(false)}
              className="w-full bg-black text-white py-2 rounded-lg"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}