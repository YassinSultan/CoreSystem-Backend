const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const dbConnection = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const fileRoutes = require('./routes/fileRoutes');
const companyRoutes = require('./routes/companyRoutes');
const outgoingLetterRoutes = require('./routes/outgoingLetterRoutes');
const incomingLetterRoutes = require('./routes/incomingLetterRoutes');
const estimateRoutes = require('./routes/estimateRoutes');
const globalErrorHandler = require('./middlewares/errorMiddleware');
const cors = require('cors');

dotenv.config({
    path: 'config.env'
});

// connect to db
dbConnection();

// express app
const app = express();
app.use(cors());
// middlewares
app.use(express.json());

if (process.env.NODE_ENV === 'development') {
    console.log('here');
    app.use(morgan('dev'));
    console.log(`${process.env.NODE_ENV} mode`);
}

// Mount Route
app.use('/api/v1/auth', authRoutes);
app.get('/uploads/*', fileRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/project", projectRoutes);
app.use("/api/v1/company", companyRoutes);
app.use("/api/v1/outgoingLetters", outgoingLetterRoutes);
app.use("/api/v1/incomingLetters", incomingLetterRoutes);
app.use("/api/v1/estimate", estimateRoutes);

app.all("*", (req, res, next) => {
    next(new ApiError(`لا يمكن الوصول لهذه الصفحة ${req.originalUrl}`, 400));
});

//Global error handling midleware for express
app.use(globalErrorHandler);

const port = process.env.PORT || 8000;
app.listen(port, () => {
    console.log(`app running on port ${port}`);
});