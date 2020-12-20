const memoize = (fn, cache = {}) => {
    return (...args) => {
        const cacheKey: string = [...args].join('-');

        if (undefined !== cache[cacheKey]) {
            return cache[cacheKey];
        }
        else {
            const result = fn(...args);
            cache[cacheKey] = result;
            return result;
        }
    };
};

export {
    memoize
};
