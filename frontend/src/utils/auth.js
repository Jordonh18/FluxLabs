// Temporary auth utility - replace with proper authentication later
export const getCurrentUserId = () => {
  // TODO: Replace with actual authentication logic
  // For now, return a default user ID
  return 1;
};

export const getCurrentUser = () => {
  // TODO: Replace with actual user data from JWT token or auth context
  return {
    id: 1,
    email: 'demo@fluxlabs.com',
    name: 'Demo User'
  };
};
