export const notFound = (_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
};
export const errorHandler = (error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
};
