import { Routes, Route, Outlet, Link, useNavigate, redirect, useLocation } from 'react-router-dom';
import { useLogto, LogtoProvider, LogtoConfig,useHandleSignInCallback } from '@logto/react';
import { get } from 'http';

const config = {
  endpoint: import.meta.env.REACT_APP_LOGTO_ENDPOINT || 'https://logto.dev',
  appId: import.meta.env.REACT_APP_LOGTO_APP_ID || '',
  resources: [import.meta.env.REACT_APP_LOGTO_RESOURCE || ''],
  scopes: ['openid']
};

export default function App() {
  return (
    <LogtoProvider config={config}>
      <div>
        {/* Routes nest inside one another. Nested route paths build upon
            parent route paths, and nested route elements render inside
            parent route elements. See the note about <Outlet> below. */}
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="singin" element={<SignIn />} />
            <Route path="callback" element={<Callback />} />
            <Route path="token" element={<Token />} />
            <Route path="*" element={<NoMatch />} />
          </Route>
        </Routes>
      </div>
    </LogtoProvider>
  );
}

function Layout() {
  return (
    <div>
      {/* A "layout route" is a good place to put markup you want to
          share across all the pages on your site, like navigation. */}
      <nav>
        <ul>
          <li>
            <Link to="/singin">Sign in</Link>
          </li>
          <li>
            <Link to="/token">Token</Link>
          </li>
        </ul>
      </nav>
      <hr />
      <Outlet />
    </div>
  );
}

const Callback = () => {
  const { isLoading } = useHandleSignInCallback(() => {
    const navigate = useNavigate();
    navigate("/token");
  });

  if (isLoading) {
    return <div>Redirecting...</div>;
  }

  return <div>Callback</div>;
};

const SignIn = () => {
  const { signIn, isAuthenticated } = useLogto();

  if (isAuthenticated) {
    return <div>Signed in</div>;
  }
  let location = window.location.origin;
  return (
    <button onClick={() => signIn(location + "/callback")}>
      Sign In
    </button>
  );
};

function Home() {
  return (
    <div>
      <h2>Home</h2>
    </div>
  );
}

function About() {
  return (
    <div>
      <h2>About</h2>
    </div>
  );
}

function Dashboard() {
  return (
    <div>
      <h2>Dashboard</h2>
    </div>
  );
}

function NoMatch() {
  return (
    <div>
      <h2>Nothing to see here!</h2>
      <p>
        <Link to="/">Go to the home page</Link>
      </p>
    </div>
  );
}

import { useState, useEffect } from "react";

function Token() {
  const { getAccessToken, isAuthenticated } = useLogto();
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    const fetchToken = async () => {
      if (isAuthenticated) {
        const accessToken = await getAccessToken("https://api.nevi.ai");
        setToken(accessToken || "");
      }
    };
    fetchToken();
  }, [getAccessToken]);

  return (
    <>
      <h2>Token</h2>
      <textarea value={token} readOnly style={{width: "500px"}}/>
      <br />
      <button onClick={() => navigator.clipboard.writeText(token)}>Copy</button>
    </>
  );
}