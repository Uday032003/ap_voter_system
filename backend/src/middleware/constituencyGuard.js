import { dbService } from '../services/dbService.js';

export function requireConstituencyAccess(paramName = 'constituencyId') {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // Super Admin has universal access
    if (req.user.role === 'super_admin') {
      return next();
    }

    // Leaders must have explicit active approval
    if (req.user.role === 'leader') {
      const constituencyId = 
        req.params[paramName] || 
        req.query[paramName] || 
        (req.body && req.body[paramName]) ||
        req.headers['x-constituency-id'];

      if (!constituencyId) {
        return res.status(400).json({
          success: false,
          message: 'Constituency identifier is required to access this resource.'
        });
      }

      const hasAccess = await dbService.hasLeaderConstituencyAccess(req.user.id, constituencyId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: You do not have approved active access to this constituency.'
        });
      }

      req.constituencyId = constituencyId;
      return next();
    }

    // Commoners do not have administrative constituency access
    return res.status(403).json({
      success: false,
      message: 'Access restricted to authorized Leaders and Super Admins.'
    });
  };
}
