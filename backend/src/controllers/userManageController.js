const asyncHandler = require('../utils/asyncHandler');
const { paginated } = require('../utils/response');
const userManageService = require('../services/UserManageService');

exports.list = asyncHandler(async (req, res) => {
  const result = await userManageService.listWithOrders(req.query);
  paginated(res, result.items, result.pagination);
});
