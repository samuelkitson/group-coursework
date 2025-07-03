import api from '@/services/apiMiddleware';
import { useAuthStore } from '@/store/authStore';
import { useBoundStore } from '@/store/dataBoundStore';
import React, { useEffect } from 'react';
import { Spinner } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

function AuthCallback() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const resetDataStores = useBoundStore((state) => state.resetAll);
  let processing = false;

  const handleAuthCallback = async () => {
    // Stop API being called twice when running in dev mode
    if (processing) return;
    processing = true;
    // Extract query parameters from GitHub
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");
    const error = urlParams.get("error");
    if (error) {
      toast.error(`Sorry, login failed. Please try again.`);
      console.error(`OAuth login error: ${error}`);
      return navigate("/login");
    }
    if (!code || !state) {
      toast.error("Login with GitHub failed. Please try another method.");
      return navigate("/login");
    }
    // Start login flow
    api
      .post(`/api/auth/github/callback`, { code, state, }, { genericErrorToasts: true, })
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        resetDataStores();
        login(data.data);
        navigate("/dashboard");
      })
      .catch((error) => {
        return navigate("/login");
      });
  };

  useEffect(() => {
    handleAuthCallback();
  }, [navigate]);

  return (
    <>
      <div className="d-flex align-items-center">
        <Spinner animation="border" className="me-3" />
        <h5>Processing login...</h5>
      </div>
      <p className="text-muted mt-4">
        This might take a few moments.<br />If you think something's broken,
        click <a href="/login">here</a> to go back and try logging in again.
      </p>
    </>
  );
};

export default AuthCallback;
