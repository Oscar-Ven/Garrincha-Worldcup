-- Performance indexes for hot query paths
-- Safe: CREATE INDEX adds indexes without modifying data

-- User access token lookup (magic link auth)
CREATE INDEX "User_accessTokenHash_idx" ON "User"("accessTokenHash");

-- User center memberships (leaderboard filtering)
CREATE INDEX "User_centerId_idx" ON "User"("centerId");
CREATE INDEX "User_competitionCenterId_idx" ON "User"("competitionCenterId");

-- User nationality filter (leaderboard by nationality)
CREATE INDEX "User_nationality_idx" ON "User"("nationality");

-- Prediction user lookup (leaderboard aggregation, dashboard)
CREATE INDEX "Prediction_userId_idx" ON "Prediction"("userId");

-- Match status filter (active/live/final match queries)
CREATE INDEX "Match_status_idx" ON "Match"("status");
