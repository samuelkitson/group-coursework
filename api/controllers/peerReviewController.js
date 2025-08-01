const { Types } = require("mongoose");
const peerReviewModel = require("../models/peerReview");
const assignmentModel = require("../models/assignment");
const checkinModel = require("../models/checkin");
const { checkAssignmentRole, checkTeamRole } = require("../utility/auth");
const { InvalidParametersError } = require("../errors/errors");
const { checkInReminderEmails } = require("../utility/emails");
const { format } = require("date-fns/format");

const findStudentsNotSubmitted = async (peerReviewId) => {
  const peerReview = await peerReviewModel.findById(peerReviewId).lean();
  if (!peerReview)
    throw new GenericNotFoundError("Peer review not found.");
  const assignment = await assignmentModel.findById(peerReview.assignment).populate("students", "_id email").select("students").lean();
  if (!assignment)
    throw new Error("Assignment not found.");
  const assignmentStudents = assignment?.students ?? [];
  const checkinsSubmitted = await checkinModel.find({ peerReview: peerReviewId, reviewer: { $in: assignmentStudents }}).select("reviewer").lean();
  const submittedStudentIds = checkinsSubmitted.map(c => c.reviewer.toString()) ?? [];
  const unsubmittedStudents = assignmentStudents.filter(s => !submittedStudentIds.includes(s._id.toString()));
  return { totalStudents: assignmentStudents.length, submittedCount: submittedStudentIds.length, unsubmittedCount: unsubmittedStudents.length, unsubmittedStudents };
};

exports.getPeerReviewStructure = async (req, res) => {
  await checkAssignmentRole(req.query.assignment, req.session.userId, "supervisor/lecturer");
  const query = { assignment: new Types.ObjectId(req.query.assignment), };
  if (req.query.pastOnly)
    query.periodEnd = { $lte: new Date() };
  if (req.query.futureOnly)
    query.periodStart = { $gte: new Date() };
  if (req.query.ignoreNone)
    query.type = { $in: ["simple", "full"] };
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

exports.sendReminderEmails = async (req, res) => {
  if (!Types.ObjectId.isValid(req.params.peerReview))
    throw new InvalidObjectIdError("The provided peer review ID is invalid.");
  // Try to fetch the peer review so we can check the assignment
  const peerReview = await peerReviewModel.findById(req.params.peerReview);
  if (!peerReview)
    throw new GenericNotFoundError("The peer review could not be found.");
  const deadlineDate = format(peerReview.periodEnd, "EEEE do MMMM yyyy");
  const userRole = await checkAssignmentRole(peerReview.assignment, req.session.userId, "lecturer");
  const { totalStudents, unsubmittedCount, unsubmittedStudents } = await findStudentsNotSubmitted(peerReview._id);
  const assignment = await assignmentModel.findById(peerReview.assignment).select("name").lean();
  const recipients = unsubmittedStudents.map(s => s?.email).filter(e => e != null);
  checkInReminderEmails({ recipients, staffUserEmail: req.session.email, assignmentName: assignment.name, deadlineDate, });
  return res.json({ message: `Reminder emails sent to ${unsubmittedCount} out of ${totalStudents} students.`})
};
