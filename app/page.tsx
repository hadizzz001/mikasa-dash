"use client";

import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";

export default function Home() {
  const { push } = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      username: event.currentTarget.username.value,
      password: event.currentTarget.password.value,
    };

    try {
      const { data } = await axios.post("/api/auth/login", payload);

      alert(JSON.stringify(data));
      window.location.replace("/dashboard");
    } catch (e) {
      const error = e as AxiosError;

      alert(error.message);
    }
  };

  return (



<>
  <style
    dangerouslySetInnerHTML={{
      __html: `
        body {
          background: black !important;
        }
      `,
    }}
  />

  <section className="h-screen flex items-center justify-center bg-black px-4">
    <div className="w-full max-w-md">
      {/* Logo Section */}
 

      {/* Form Section */}
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
        <h2 className="text-white text-center text-xl font-semibold mb-4">Login</h2>
        
        <form onSubmit={handleSubmit}>
          {/* Username Field */}
          <div className="mb-4">
            <input
              type="text"
              className="w-full rounded p-2 bg-gray-800 text-white outline-none border border-gray-700"
              id="username"
              name="username"
              placeholder="Username"
            />
          </div>

          {/* Password Field */}
          <div className="mb-4">
            <input
              type="password"
              className="w-full rounded p-2 bg-gray-800 text-white outline-none border border-gray-700"
              id="password"
              name="password"
              placeholder="Password"
            />
          </div>

          {/* Login Button */}
          <div className="text-center">
            <button
              type="submit"
              className="w-full bg-[#ab695d] text-white py-2 rounded-md hover:bg-[#924f48] transition"
            >
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
  <style
        dangerouslySetInnerHTML={{
          __html: "\n  #sidenavv{\n    display:none;\n} ",
        }}
      />
</>

  );
}