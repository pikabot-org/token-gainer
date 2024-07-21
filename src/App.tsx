import { Routes, Route, Outlet, Link, useNavigate, redirect, useLocation } from 'react-router-dom';
import { useLogto, LogtoProvider, LogtoConfig, useHandleSignInCallback } from '@logto/react';
import { useState, useEffect } from "react";
import Pusher from "pusher-js"
import type { type } from 'os';

const config = {
  endpoint: import.meta.env.VITE_LOGTO_ENDPOINT || 'https://logto.dev',
  appId: import.meta.env.VITE_LOGTO_APP_ID || '',
  resources: [import.meta.env.VITE_LOGTO_RESOURCE || ''],
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
            <Route path="pusher" element={<PusherPage />} />
            <Route path="signout" element={<SignOut />} />
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
          <li>
            <Link to="/pusher">Pusher</Link>
          </li>
          <li>
            <Link to="/signout">Sign out</Link>
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

const SignOut = () => {
  const { signOut, isAuthenticated } = useLogto();

  if (!isAuthenticated) {
    return <div>Not signed in</div>;
  }

  return (
    <button onClick={() => signOut(location + "/")}>
      Sign Out
    </button>
  );
}

function Home() {
  return (
    <div>
      <h2>Home</h2>
    </div>
  );
}

type Event = {
  type: string,
  data: string
}

function PusherPage() {
  const { fetchUserInfo, isAuthenticated, getAccessToken } = useLogto();
  const [ channelName, setChannelName ] = useState<string>("");
  useEffect(() => {
    let loadPusher = async () => {
      if (isAuthenticated) {
        let user = await fetchUserInfo()
        console.log(user);
        console.log("Connecting to pusher");
        let token = await getAccessToken(import.meta.env.VITE_LOGTO_RESOURCE || "https://api.nevi.ai");
        const pusher = new Pusher(import.meta.env.VITE_PUSHER_APP_KEY || '', {
          cluster: "eu",
          authEndpoint: import.meta.env.VITE_PUSHER_AUTH_ENDPOINT || 'https://api.nevi.ai/pusher/auth',
          auth: {
            headers: {
              Authorization: "Bearer " + token,
            },
          },
        })
        let channelName = "private-" + user?.sub;
        console.log("Subscribing to channel " + channelName);
        const channel = pusher.subscribe(channelName);
        channel.bind("pusher:subscription_succeeded", () => {
          console.log("subscription_succeeded")
        })

        channel.bind_global(function (event: string, data: any) {
          let asJson = JSON.stringify(data); 
          console.log(`The event ${event} was triggered with data ${asJson}`);
        })
        setChannelName(channelName);
      }
    }

    loadPusher().catch((err) => {
      console.log(err)
    })
  }, [fetchUserInfo, isAuthenticated, getAccessToken]);

  return (
    <div>
      <h2>Pusher</h2>
      <p>Channel name: <code>{channelName}</code></p>
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


function Token() {
  const { getAccessToken, isAuthenticated } = useLogto();
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    const fetchToken = async () => {
      if (isAuthenticated) {
        const accessToken = await getAccessToken(import.meta.env.VITE_LOGTO_RESOURCE || "https://api.nevi.ai");
        setToken(accessToken || "");
      }
    };
    fetchToken();
  }, [getAccessToken]);

  return (
    <>
      <h2>Token</h2>
      <textarea value={token} readOnly style={{ width: "500px" }} />
      <br />
      <button onClick={() => navigator.clipboard.writeText(token)}>Copy</button>
    </>
  );
}