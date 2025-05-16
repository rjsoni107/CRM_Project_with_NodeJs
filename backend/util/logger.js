
const timeLog = (...args) => {
    const now = new Date();
    const timestamp = now.toLocaleString('en-US', {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
    console.log(timestamp, ...args);
};
module.exports = { timeLog };