import React, { useState, useEffect } from 'react';

const Timer = ({ duration = 59, onResend }) => {
    const [counter, setCounter] = useState(duration);

    useEffect(() => {
        if (counter > 0) {
            const timer = setTimeout(() => setCounter((prev) => prev - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [counter]);

    const resendOtp = () => {
        setCounter(duration); // Reset timer
        onResend && onResend(); // Call the resend function if provided
    };

    const minutes = Math.floor(counter / 60);
    const seconds = counter % 60;

    return (
        <span id="timer">
            {counter > 0 ? (
                <span className='fw-700'><span className='fw-200 text-light-gray'>Resend OTP in</span> {minutes}:{seconds < 10 ? `0${seconds}` : seconds} </span>
            ) : (
                <button className="border-none bg-none underline" onClick={resendOtp} >
                    Resend OTP
                </button>
            )}
        </span>
    );
};

export default Timer;
