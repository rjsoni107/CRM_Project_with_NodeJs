import React from 'react';
import { createRoot } from 'react-dom/client';
import "./global";
import { BrowserRouter } from 'react-router-dom';
import Main from './components/main/Main';
import './index.css';
import { Provider } from 'react-redux';
import { store } from './redux/store';

const root = createRoot(document.getElementById('root'));
root.render(
    <Provider store={store}>
        <BrowserRouter>
            <Main />
        </BrowserRouter>
    </Provider>
);