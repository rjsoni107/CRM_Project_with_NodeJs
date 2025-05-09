import React from 'react';
import { createRoot } from 'react-dom/client';
import Main from './components/main/Main';
import "./global";
import { BrowserRouter } from 'react-router-dom';

const root = createRoot(document.getElementById('root'));
root.render(
    <BrowserRouter basename="/crm">
        <Main />
    </BrowserRouter>
);