import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import {createMuiTheme, responsiveFontSizes, ThemeProvider} from '@material-ui/core/styles';


let theme = createMuiTheme({
    palette: {
        default:{
            main:'#9e9e9e'
        },
        primary: {
            main: '#09306B',
        },
        secondary: {
            main: '#BAA22B',
        },
        warning: {
            main: '#DE946A',
        },
        info: {
            main: '#05199C'
        },
        neutral: {
            main: 'rgba(0, 0, 0, 0.55)',
            dark: 'rgba(0, 0, 0, 0.81)',
            light: 'rgba(0, 0, 0, 0.05)'
        }
    },
    typography: {
        fontFamily: [
            'Montserrat',
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
            '"Apple Color Emoji"',
            '"Segoe UI Emoji"',
            '"Segoe UI Symbol"',
        ].join(','),
    }
});

theme = responsiveFontSizes(theme);

ReactDOM.render(
    <React.StrictMode>
        <ThemeProvider theme={theme}>
            <App/>
        </ThemeProvider>
    </React.StrictMode>,
    document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
