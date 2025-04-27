import jwt from 'jsonwebtoken';

export const generateEmailToken = (userId, email) => {
  return jwt.sign({ userId, email, type: 'verify' }, process.env.EMAIL_SECRET, { expiresIn: '15m' });
};

export const generateLoginToken = (user) => {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
};
