/**
 * @param {import('../services/authService.js').CurrentUser | null | undefined} user
 * @returns {boolean}
 */
function canViewAnalytics(user) {
  return user?.role === 'ADMIN' || user?.role === 'VET'
}

export { canViewAnalytics }