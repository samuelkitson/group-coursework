import api from "@/services/apiMiddleware";
import { useAuthStore } from "@/store/authStore";
import { useBoundStore } from "@/store/dataBoundStore";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function ResumeLogin() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
    const resetDataStores = useBoundStore((state) => state.resetAll);

  const resumeLogin = () => {
    api
      .get("/api/auth/refresh")
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        resetDataStores();
        login(data.data);
        navigate("/dashboard");
      })
      .catch((error) => {
        navigate("/login");
        console.log(error);
      });
  };

  useEffect(resumeLogin, [navigate]);

  return (
    <div>
      <h3>Loading session....</h3>
      <p>This should only take a second or two.</p>
    </div>
  );
}

export default ResumeLogin;
