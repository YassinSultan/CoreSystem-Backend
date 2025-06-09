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
const contractRoutes = require('./routes/contractRoutes');
const supplyOrderRoutes = require('./routes/supplyOrderRoutes');
const materialRoutes = require('./routes/materialRoutes');
const abstractRoutes = require('./routes/abstractRoutes');
const confinementRoutes = require('./routes/confinementRoutes');
const paymentOrderRoutes = require('./routes/paymentOrderRoutes');
const panelsRoutes = require('./routes/panelsRoutes');
const reportsRoutes = require('./routes/reportsRoutes');


const globalErrorHandler = require('./middlewares/errorMiddleware');
const cors = require('cors');
const ApiError = require('./utils/apiError');

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
app.use("/api/v1/contract", contractRoutes);
app.use("/api/v1/supplyOrder", supplyOrderRoutes);
app.use("/api/v1/material", materialRoutes);
app.use("/api/v1/abstract", abstractRoutes);
app.use("/api/v1/confinement", confinementRoutes);
app.use("/api/v1/paymentOrder", paymentOrderRoutes);
app.use("/api/v1/panels", panelsRoutes);
app.use("/api/v1/reports", reportsRoutes);

app.all("*", (req, res, next) => {
    next(new ApiError(`لا يمكن الوصول لهذه الصفحة ${req.originalUrl}`, 400));
});

//Global error handling midleware for express
app.use(globalErrorHandler);

const port = process.env.PORT || 8000;
app.listen(port, () => {
    console.log(`app running on port ${port}`);
});