const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:80,http://localhost')
    .split(',')
    .map(origin => origin.trim());

const corsOptions = {
    origin: function (origin, callback) {
        // Cho phép requests không có origin (mobile apps, curl, Postman...)
        if (!origin) return callback(null, true);
        // Exact match from env/defaults
        if (allowedOrigins.includes(origin)) return callback(null, true);
        // Allow all Vercel preview/production URLs
        if (/\.vercel\.app$/.test(origin)) return callback(null, true);
        console.warn(`⚠️ CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

module.exports = { corsOptions, allowedOrigins };
