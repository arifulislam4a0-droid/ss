module.exports = (err, req, res, next) => {
  console.error(err);

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'অবৈধ টোকেন' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'টোকেনের মেয়াদ শেষ' });
  }

  if (err.code === 11000) {
    return res.status(400).json({ success: false, message: 'এই তথ্য আগে থেকেই রয়েছে' });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'সার্ভার সমস্যা হয়েছে'
  });
};
