"use client"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { loginUser } from "../redux/slice/loginSlice"
import { LoginCredentialsApi } from "../redux/api/loginApi"

const LoginPage = () => {
  const navigate = useNavigate()
  const { isLoggedIn, userData, error } = useSelector((state) => state.login); // Added error from state
  const dispatch = useDispatch();

  const [isDataLoading, setIsDataLoading] = useState(false)
  const [isLoginLoading, setIsLoginLoading] = useState(false)
  const [masterData, setMasterData] = useState({
    userCredentials: {}, // Object where keys are usernames and values are passwords
    userRoles: {} // Object where keys are usernames and values are roles
  })
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })
  const [toast, setToast] = useState({ show: false, message: "", type: "" })


  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoginLoading(true); // Add loading state
    dispatch(loginUser(formData));
  };

  useEffect(() => {
    if (isLoggedIn && userData) {
      localStorage.setItem('user-name', userData.user_name);
      localStorage.setItem('role', userData.role);
      navigate("/dashboard/admin")
    } else if (error) { // Add error handling
      showToast(error, "error");
      setIsLoginLoading(false); // Reset loading on error
    }
  }, [isLoggedIn, userData, error, navigate]); // Added error to dependencies


  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }



  const showToast = (message, type) => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" })
    }, 5000) // Toast duration
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="w-full max-w-md shadow-lg border border-blue-200 rounded-lg bg-white">
        <div className="space-y-1 p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-t-lg">
          <img
            src="/logo.png"
            alt="Company Logo"
            className="h-auto w-100 mr-3"
          />
          <h2 className="text-2xl font-bold text-blue-700 p-2 items-center justify-center" >Checklist & Delegation</h2>
          <div className="flex items-center justify-center mb-2">
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <label htmlFor="username" className="flex items-center text-blue-700">
              <i className="fas fa-user h-4 w-4 mr-2"></i>
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="Enter your username"
              required
              value={formData.username}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="flex items-center text-blue-700">
              <i className="fas fa-key h-4 w-4 mr-2"></i>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 -mx-4 -mb-4 mt-4 rounded-b-lg">
            <button
              type="submit"
              className="w-full py-2 px-4  gradient-bg text-white rounded-md font-medium gradient-bg:hover disabled:opacity-50"
              disabled={isLoginLoading || isDataLoading}
            >
              {isLoginLoading ? "Logging in..." : isDataLoading ? "Loading..." : "Login"}
            </button>
          </div>
        </form>
        <div className="fixed left-0 right-0 bottom-0 py-1 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center text-sm shadow-md z-10">
          <a
            href="https://www.botivate.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Powered by-<span className="font-semibold">Botivate</span>
          </a>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${toast.type === "success"
          ? "bg-green-100 text-green-800 border-l-4 border-green-500"
          : "bg-red-100 text-red-800 border-l-4 border-red-500"
          }`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default LoginPage
