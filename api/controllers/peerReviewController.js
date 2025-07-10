const { Types } = require("mongoose");
const peerReviewModel = require("../models/peerReview");
const { checkAssignmentRole } = require("../utility/auth");
const { InvalidParametersError } = require("../errors/errors");

exports.getPeerReviewStructure = async (req, res) => {
  await checkAssignmentRole(req.query.assignment, req.session.userId, "supervisor/lecturer");
  const query = { assignment: new Types.ObjectId(req.query.assignment), };
  if (req.query.pastOnly)
    query.periodEnd = { $lte: new Date() };
  if (req.query.futureOnly)
    query.periodStart = { $gte: new Date() };
  // Extract all peer review points for this assignment
  const peerReviews = await peerReviewModel
    .find(query)
    .sort({ periodStart: 1, })
    .lean();
  return res.json({ peerReviews });
};

/**
 * This method is designed to take in a complete list of the peer review points
 * for a specific assignment and update the peerReview collection to match. It
 * first deletes all peer review documents for that assignment. Then it iterates
 * through in order, adding back in each peer review point in turn - reusing
 * supplied IDs where provided. This keeps consistency with other collections.
 */
exports.updatePeerReviewsByAssignment = async (req, res) => {
  await checkAssignmentRole(req.body.assignment, req.session.userId, "lecturer");
  // Delete all of the peer reviews for this assignment
  const assignmentId = new Types.ObjectId(req.body.assignment);
  const deleteQuery = { assignment: assignmentId, };
  const deletedIDs = (await peerReviewModel.find(deleteQuery, { _id: 1 }).lean()).map(p => p._id.toString());
  await peerReviewModel.deleteMany(deleteQuery);
  // If no peer review data passed, just assume the user wanted to delete them all
  if (!req.body.peerReviews || req.body.peerReviews.length === 0)
    return res.json({message: "All peer review points have been removed for this assignment."});
  // Insert the new peer reviews into the database
  const peerReviewsToInsert = [];
  for (const peerReview of req.body.peerReviews) {
    const newPeerReview = {};
    // If an existing ObjectID is provided, check its validity
    if (peerReview._id) {
      if (!Types.ObjectId.isValid(peerReview._id))
        throw new InvalidObjectIdError("The provided team ID is invalid.");
      // Check that the provided ObjectID actually appeared before. If not, just
      // generate a new ObjectID for it.
      if (deletedIDs.includes(peerReview._id))
        newPeerReview._id = peerReview._id;
    }
    newPeerReview.assignment = assignmentId;
    newPeerReview.periodStart = new Date(peerReview.periodStart) ?? new Date();
    newPeerReview.periodEnd = new Date(peerReview.periodEnd) ?? new Date();
    newPeerReview.type = peerReview.type ?? "simple";
    if (newPeerReview.type === "full") {
      newPeerReview.questions = peerReview.questions ?? [];
    }
    peerReviewsToInsert.push(newPeerReview);
  }
  try {
    const insertResult = await peerReviewModel.insertMany(peerReviewsToInsert);
    if (insertResult.length === peerReviewsToInsert.length) {
      return res.json({message: "Peer review points updated successfully."});
    } else {
      throw new InvalidParametersError("Something went wrong updating the peer reviews. Please try again.");
    }
  } catch (ValidationError) {
    throw new InvalidParametersError("The provided peer review object is invalid. Please try again."); 
  }
};
