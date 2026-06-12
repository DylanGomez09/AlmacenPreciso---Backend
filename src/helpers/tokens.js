const crypto = require('crypto');
const supabase = require('../db');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function storeRefreshToken(userId, refreshToken, expiresAt) {
  const tokenHash = hashToken(refreshToken);

  const { error } = await supabase.from('refresh_tokens').insert({
    user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  if (error) {
    console.error('Error storing refresh token:', error);
  }
}

async function revokeRefreshToken(tokenHash) {
  const { error } = await supabase
    .from('refresh_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('token_hash', tokenHash);

  if (error) {
    console.error('Error revoking refresh token:', error);
  }
}

async function revokeAllUserRefreshTokens(userId) {
  const { error } = await supabase
    .from('refresh_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('revoked_at', null);

  if (error) {
    console.error('Error revoking user refresh tokens:', error);
  }
}

module.exports = {
  hashToken,
  storeRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
};
