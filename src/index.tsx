import React from 'react';
import ReactDOM from 'react-dom/client';

import Deriv, { useAuthorize } from '@deriv-experiments/react'

const Dashboard = () => {
  const authorize = useAuthorize();

  return (
    <div>
      <h1>Dashboard</h1>

      {authorize
        ? (
          <>
            Logged in as {' '}
            <strong>{authorize.email}</strong>
          </> 
        )
        : (
          <button onClick={Deriv.login}>Login</button>
        )
      }

      <ul>
        <li>Dashboard</li>
        <li><a href="/reports/">Reports</a></li>
        <li><a href="/debug/">Debug</a></li>
      </ul>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('app'));

root.render(
  <Dashboard />
);
