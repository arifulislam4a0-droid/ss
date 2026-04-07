module.exports = (req, res, next) => {
  res.status(404).json({ success: false, message: 'রুট পাওয়া যায়নি' });
};
