// moving average
function signalMovAvg(signal, idx, wind) {
    var cnt = 0;
    var sum = 0;
    for (var i = idx - Math.floor(wind/2); i < idx + Math.floor(wind/2); i++) {
        if (!Number.isNaN(signal[i]) && i != idx) {
            sum += signal[i];
            cnt++;
        }
    }
    return sum / cnt;
}

// moving standard deviation
function signalMovDev(signal, idx, wind, movAvg) {
    var cnt = 0;
    var sum = 0;
    for (var i = idx - Math.floor(wind/2); i < idx + Math.floor(wind/2); i++) {
        if (!Number.isNaN(signal[i]) && i != idx) {
            sum += (signal[i] - movAvg) * (signal[i] - movAvg);
            cnt++;
        }
    }
    return Math.sqrt(sum / cnt);
}

export function signalClean(signal, winLen) {
    const dev_cnt = 4;
    for (var i = 1; i < signal.length - 1; i++) {
        var avg = signalMovAvg(signal, i, winLen);
        var dev = signalMovDev(signal, i, winLen, avg);
        // check if value is outlier or invalid
        if (Math.abs(signal[i] - avg) > dev_cnt * dev || Number.isNaN(signal[i])) {
            if (Math.abs(signal[i - 1] - avg) > dev_cnt * dev || Number.isNaN(signal[i - 1])) {
                if (Math.abs(signal[i + 1] - avg) > dev_cnt * dev || Number.isNaN(signal[i + 1])) {
                    signal[i] = signal[i];      // all values are outliers, do nothing
                } else {
                    signal[i] = signal[i + 1];    // i+1 is not outlier
                }
            } else { // i-1 is not outlier
                if (Math.abs(signal[i + 1] - avg) > dev_cnt * dev || Number.isNaN(signal[i + 1])) {
                    signal[i] = signal[i - 1];    // i+1 is outlier
                } else { // neghbors are not outliers
                    signal[i] = 0.5 * (signal[i - 1] + signal[i + 1]); 
                }
            }
        }
    }
}