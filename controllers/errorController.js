const AppError = require('./../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFields = (err) => {
  // const value = err.keyValue.match(/(["'])(\\?.)*?\1/)[0];
  // const message = `Duplicate field value(s): ${value}. Please try different value(s)!`;
  const message = `Duplicate field value: ${err.keyValue.name}. Please use another value.`;

  return new AppError(message, 400);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    err,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } //everything that is not marked operational
  else {
    console.error('💥 Error! 💥', err);
    res.status(err.statusCode).json({
      //status code is always 500
      status: err.status, //status is always "error"
      message: `There was an error, it's a problem from the server side! :(: /n The error is ${err}`,
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500; //500 because of mongoose or something else. (unknown)
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') sendErrorDev(err, res);
  else if (process.env.NODE_ENV === 'production') {
    let error = Object.create(err);
    if (err.name === 'CastError') error = handleCastErrorDB(err);
    if (err.code === 11000) error = handleDuplicateFields(err);
    sendErrorProd(error, res);
    //sendErrorProd(error, res);
  }
};
