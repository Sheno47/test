const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

//This option can merge 2 different routes
const Router = express.Router({ mergeParams: true });

Router.use(authController.protect);

Router.route('/')
  .get(reviewController.getAllreviews)
  .post(
    authController.restricTo('user', 'admin'),
    reviewController.SetTourUserId,
    reviewController.createReview,
  );

Router.route('/:id')
  .delete(
    authController.restricTo('user', 'admin'),
    reviewController.deleteReview,
  )
  .patch(
    authController.restricTo('user', 'admin'),
    reviewController.updateReview,
  )
  .get(reviewController.getReview);

module.exports = Router;
