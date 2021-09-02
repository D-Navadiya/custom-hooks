import {useState} from 'react';

import helpers from './helpers';
import useInterval from './useInterval';

type UseTimerParams = {
    onExpire?: () => void;
    autoStart?: boolean;
    stopTimerTimestamp?: number;
};

const DEFAULT_DELAY = 1000;

// adds consistency to seconds count
const toNearestWholeSecond = (timestamp: number) =>
    Math.floor(timestamp / 1000) * 1000;

const getTimeFromSeconds = (rawSeconds: number) => {
    const totalSeconds = Math.ceil(rawSeconds);
    const seconds = Math.floor(totalSeconds % 60);

    return {
        timerSeconds: seconds,
        zeroPaddedSeconds: helpers.padZero(seconds),
    };
};

const getSecondsFromExpiry = (expiryTimestamp?: number) => {
    if (expiryTimestamp) {
        const roundedOffExpiryTimestamp = toNearestWholeSecond(expiryTimestamp);
        const now = new Date().getTime();
        const millisecondsDistance = roundedOffExpiryTimestamp - now;
        if (millisecondsDistance > 0) {
            return millisecondsDistance / 1000;
        }
    }
    return 0;
};

const getDelayFromExpiryTimestamp = (expiryTimestamp?: number) => {
    if (expiryTimestamp) {
        const roundedOffExpiryTimestamp = toNearestWholeSecond(expiryTimestamp);
        const seconds = getSecondsFromExpiry(roundedOffExpiryTimestamp);
        const extraMilliseconds = Math.floor(
            (seconds - Math.floor(seconds)) * 1000,
        );
        return extraMilliseconds > 0 ? extraMilliseconds : DEFAULT_DELAY;
    }
    return DEFAULT_DELAY;
};

const useTimer = ({
    onExpire,
    stopTimerTimestamp,
    autoStart = false,
}: UseTimerParams) => {
    const [expiryTimestamp, setExpiryTimestamp] = useState(stopTimerTimestamp);
    const [seconds, setSeconds] = useState(
        getSecondsFromExpiry(expiryTimestamp),
    );
    const [isTimerRunning, setIsTimerRunning] = useState(autoStart);
    const [delay, setDelay] = useState<number | null>(
        getDelayFromExpiryTimestamp(expiryTimestamp),
    );

    function handleExpire() {
        onExpire && onExpire();
        setIsTimerRunning(false);
        setDelay(null);
    }

    function startTimer(newExpiryTimestamp: number, newAutoStart = true) {
        setDelay(getDelayFromExpiryTimestamp(newExpiryTimestamp));
        setIsTimerRunning(newAutoStart);
        setExpiryTimestamp(newExpiryTimestamp);
        setSeconds(getSecondsFromExpiry(newExpiryTimestamp));
    }

    // function initiateTimer() {
    //     setSeconds(getSecondsFromExpiry(expiryTimestamp));
    //     setIsTimerRunning(true);
    // }

    useInterval(
        () => {
            if (delay !== DEFAULT_DELAY) {
                setDelay(DEFAULT_DELAY);
            }
            const secondsValue = getSecondsFromExpiry(expiryTimestamp);
            setSeconds(secondsValue);
            if (secondsValue <= 0) {
                handleExpire();
            }
        },
        isTimerRunning ? delay : null,
    );

    return {
        ...getTimeFromSeconds(seconds),
        // initiateTimer,
        startTimer,
        isTimerRunning,
    };
};

export default useTimer;
