import React from 'react';
import { createRoot } from 'react-dom/client';
import Main from './components/main/Main';
import "./global";

const root = createRoot(document.getElementById('root'));
root.render(
    <Main />
);