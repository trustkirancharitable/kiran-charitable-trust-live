const mongoose = require('mongoose');
const Donation = require('../models/Donation');
const TrustMember = require('../models/TrustMember');
const { memoryStore, getSupabase, fetchSupabasePayments, fetchSupabaseTrustMembers } = require('./supabaseService');

// In-memory cache for ultra-fast leaderboard retrieval
let cachedLeaderboard = {
    lastUpdated: null,
    month: '',
    allTimeTop: [],
    monthlyTop: [],
    stats: {
        totalDonationsEvaluated: 0,
        totalDonorsRanked: 0,
        topDonorAmount: 0
    }
};

/**
 * Normalizes donor key so distinct donors are never merged by shared test emails
 */
function getDonorKey(d) {
    const isAnon = d.isAnonymous || d.is_anonymous;
    if (isAnon) {
        return 'anon_' + ((d.email || d.phone || d.mobile || d._id || d.id || 'anonymous').toLowerCase().trim());
    }
    const rawName = (d.fullName || d.full_name || d.name || '').trim();
    if (rawName && rawName.toLowerCase() !== 'valued contributor') {
        return rawName.toLowerCase().replace(/[\s\-_.]+/g, '');
    }
    return (d.email || d.phone || d.mobile || 'anon').toLowerCase().trim();
}

/**
 * Core Auto-Ranking Algorithm
 * Aggregates all completed donations and verified trust member payments,
 * ranks donors from highest to lowest, and assigns podium spots.
 */
async function autoRankDonors() {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentMonthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

        const donorMap = new Map();
        const monthlyDonorMap = new Map();
        const processedReceipts = new Set();
        let dbSourceUsed = false;

        // 1. Ingest Supabase completed payments (Live Primary Database)
        try {
            const sbPayments = await fetchSupabasePayments();
            if (sbPayments && sbPayments.length > 0) {
                dbSourceUsed = true;
                sbPayments.forEach(p => {
                    const rawStatus = (p.status || '').toLowerCase();
                    if (rawStatus === 'completed' || rawStatus === 'success') {
                        const recKey = p.receipt_number || p.client_txn_id || p.transaction_id || p.id;
                        if (recKey && processedReceipts.has(recKey)) return;
                        if (recKey) processedReceipts.add(recKey);

                        const key = getDonorKey({
                            fullName: p.full_name,
                            email: p.email,
                            phone: p.mobile,
                            isAnonymous: p.is_anonymous
                        });
                        const name = p.is_anonymous ? 'Anonymous Well-Wisher' : (p.full_name || 'Valued Contributor');
                        const photo = p.profile_photo || '';
                        const amt = Number(p.amount) || 0;
                        const city = p.city || 'Guntur';
                        const state = p.state || 'Andhra Pradesh';
                        const purpose = p.purpose || 'General Philanthropy';
                        const createdAt = p.created_at || new Date();

                        if (!donorMap.has(key)) {
                            donorMap.set(key, {
                                name,
                                email: p.email || '',
                                phone: p.mobile || '',
                                photo,
                                city,
                                state,
                                purpose,
                                lastDonatedAt: createdAt,
                                totalDonated: 0,
                                count: 0,
                                isAnonymous: !!p.is_anonymous
                            });
                        }
                        const record = donorMap.get(key);
                        record.totalDonated += amt;
                        record.count += 1;
                        if (photo && !record.photo) record.photo = photo;
                        if (new Date(createdAt) > new Date(record.lastDonatedAt)) {
                            record.lastDonatedAt = createdAt;
                            if (purpose) record.purpose = purpose;
                        }

                        // Monthly
                        if (new Date(createdAt) >= startOfMonth) {
                            if (!monthlyDonorMap.has(key)) {
                                monthlyDonorMap.set(key, {
                                    name,
                                    photo,
                                    city,
                                    state,
                                    purpose,
                                    lastDonatedAt: createdAt,
                                    totalDonated: 0,
                                    count: 0,
                                    isAnonymous: !!p.is_anonymous
                                });
                            }
                            const mRec = monthlyDonorMap.get(key);
                            mRec.totalDonated += amt;
                            mRec.count += 1;
                        }
                    }
                });
            }

            const sbMembers = await fetchSupabaseTrustMembers();
            if (sbMembers && sbMembers.length > 0) {
                sbMembers.forEach(m => {
                    const key = getDonorKey({
                        fullName: m.name,
                        email: m.email,
                        phone: m.phone
                    });
                    const amt = Number(m.total_donated) || Number(m.donation_amount) || 0;
                    if (amt > 0 && !donorMap.has(key)) {
                        donorMap.set(key, {
                            name: m.name,
                            email: m.email || '',
                            phone: m.phone || '',
                            photo: m.profile_photo || '',
                            city: m.city || 'Guntur',
                            state: m.state || 'Andhra Pradesh',
                            purpose: 'Trust Membership',
                            lastDonatedAt: m.created_at || new Date(),
                            totalDonated: amt,
                            count: 1
                        });
                    }
                });
            }
        } catch (sbRankErr) {
            console.warn('Supabase ranking ingest notice:', sbRankErr.message);
        }

        // 2. Ingest MongoDB completed donations (Deduplicated against Supabase)
        if (mongoose.connection.readyState >= 1) {
            try {
                const donations = await Donation.find({ status: 'completed' })
                    .select('fullName email phone mobile amount profilePhoto isAnonymous createdAt address city state purpose receiptNumber transactionId clientTxnId')
                    .lean();

                donations.forEach(d => {
                    const recKey = d.receiptNumber || d.transactionId || d.clientTxnId || String(d._id);
                    if (recKey && processedReceipts.has(recKey)) return; // Skip if already counted from Supabase!
                    if (recKey) processedReceipts.add(recKey);

                    dbSourceUsed = true;
                    const key = getDonorKey(d);
                    const name = (d.isAnonymous || d.is_anonymous) ? 'Anonymous Well-Wisher' : (d.fullName || d.full_name || 'Valued Contributor');
                    const photo = d.profilePhoto || d.profile_photo || '';
                    const amt = Number(d.amount) || 0;
                    const city = d.city || (d.address ? d.address.split(',')[0].trim() : 'Guntur');
                    const state = d.state || 'Andhra Pradesh';
                    const purpose = d.purpose || 'General Trust Welfare';
                    const createdAt = d.createdAt || new Date();

                    if (!donorMap.has(key)) {
                        donorMap.set(key, { 
                            name, 
                            email: d.email || '',
                            phone: d.phone || d.mobile || '',
                            photo, 
                            city,
                            state,
                            purpose,
                            lastDonatedAt: createdAt,
                            totalDonated: 0, 
                            count: 0, 
                            isAnonymous: !!d.isAnonymous 
                        });
                    }
                    const record = donorMap.get(key);
                    record.totalDonated += amt;
                    record.count += 1;
                    if (photo && !record.photo) record.photo = photo;
                    if (new Date(createdAt) > new Date(record.lastDonatedAt)) {
                        record.lastDonatedAt = createdAt;
                        if (purpose) record.purpose = purpose;
                    }

                    // Monthly
                    if (new Date(d.createdAt) >= startOfMonth) {
                        if (!monthlyDonorMap.has(key)) {
                            monthlyDonorMap.set(key, { 
                                name, 
                                photo, 
                                city, 
                                state, 
                                purpose,
                                lastDonatedAt: createdAt,
                                totalDonated: 0, 
                                count: 0, 
                                isAnonymous: !!d.isAnonymous 
                            });
                        }
                        const mRec = monthlyDonorMap.get(key);
                        mRec.totalDonated += amt;
                        mRec.count += 1;
                    }
                });
            } catch (dbErr) {
                console.warn('Auto-rank MongoDB read notice:', dbErr.message);
            }
        }

        // 3. Fallback to Memory Store ONLY if live databases returned 0 records
        if (!dbSourceUsed && memoryStore && Array.isArray(memoryStore.payments)) {
            memoryStore.payments.forEach(p => {
                if (p.status === 'completed') {
                    const recKey = p.receiptNumber || p.receipt_number || p.transactionId || p.transaction_id || p.clientTxnId;
                    if (recKey && processedReceipts.has(recKey)) return;
                    if (recKey) processedReceipts.add(recKey);

                    const key = getDonorKey(p);
                    const name = (p.isAnonymous || p.is_anonymous) ? 'Anonymous Well-Wisher' : (p.fullName || p.full_name || 'Valued Contributor');
                    const amt = Number(p.amount) || 0;
                    const photo = p.profilePhoto || p.profile_photo || '';
                    const city = p.city || (p.address ? p.address.split(',')[0].trim() : 'Guntur');
                    const state = p.state || 'Andhra Pradesh';
                    const purpose = p.purpose || 'General Donation';
                    const createdAt = p.createdAt || new Date().toISOString();

                    if (!donorMap.has(key)) {
                        donorMap.set(key, { 
                            name, 
                            email: p.email || '',
                            phone: p.mobile || p.phone || '',
                            photo, 
                            city,
                            state,
                            purpose,
                            lastDonatedAt: createdAt,
                            totalDonated: 0, 
                            count: 0 
                        });
                    }
                    const r = donorMap.get(key);
                    r.totalDonated += amt;
                    r.count += 1;
                    if (photo && !r.photo) r.photo = photo;
                    if (new Date(createdAt) > new Date(r.lastDonatedAt)) {
                        r.lastDonatedAt = createdAt;
                        if (purpose) r.purpose = purpose;
                    }
                }
            });
        }

        // 3. Helper to determine Giving Society Tier
        const getTierDetails = (amount, rank) => {
            if (rank === 1) return { tierName: 'Chief Benefactor', tierBadge: 'Gold Champion', level: 1 };
            if (rank === 2) return { tierName: 'Platinum Benefactor', tierBadge: 'Silver Champion', level: 2 };
            if (rank === 3) return { tierName: 'Gold Pillar', tierBadge: 'Bronze Benefactor', level: 3 };
            if (amount >= 25000) return { tierName: 'Pillar Member', tierBadge: 'Pillar Member', level: 4 };
            if (amount >= 10000) return { tierName: 'Honorary Guardian', tierBadge: 'Honorary Guardian', level: 5 };
            if (amount >= 5000) return { tierName: 'Sustaining Champion', tierBadge: 'Sustaining Champion', level: 6 };
            if (amount >= 1000) return { tierName: 'Community Benefactor', tierBadge: 'Community Benefactor', level: 7 };
            return { tierName: 'Grassroots Supporter', tierBadge: 'Grassroots Supporter', level: 8 };
        };

        // 4. Sort and assign automated rankings across all donors
        const allDonorsArray = Array.from(donorMap.values())
            .sort((a, b) => b.totalDonated - a.totalDonated);

        const totalAmountDonated = allDonorsArray.reduce((sum, d) => sum + (d.totalDonated || 0), 0);
        const topDonorAmount = allDonorsArray[0]?.totalDonated || 0;

        const allRanked = allDonorsArray.map((donor, idx) => {
            const rank = idx + 1;
            const { tierName, tierBadge, level } = getTierDetails(donor.totalDonated, rank);
            const percentageOfTop = topDonorAmount > 0 ? Math.round((donor.totalDonated / topDonorAmount) * 100) : 0;

            return {
                rank,
                name: donor.name,
                email: donor.email || '',
                city: donor.city || 'Guntur',
                state: donor.state || 'Andhra Pradesh',
                purpose: donor.purpose || 'General Philanthropy',
                lastDonatedAt: donor.lastDonatedAt || new Date().toISOString(),
                photo: donor.photo || '',
                amount: donor.totalDonated,
                totalDonated: donor.totalDonated,
                count: donor.count || 1,
                tierName,
                tierBadge,
                tierLevel: level,
                percentageOfTop,
                podiumSpot: rank <= 3 ? rank : null
            };
        });

        // Top 10 High-Honor Donors
        const allTimeTop = allRanked.slice(0, 10);
        // All Other Ranked Donors (Ranks 11+)
        const honorsList = allRanked.slice(10);

        // Group donors by Tier
        const tiers = {
            pillars: allRanked.filter(d => d.totalDonated >= 25000),
            guardians: allRanked.filter(d => d.totalDonated >= 10000 && d.totalDonated < 25000),
            champions: allRanked.filter(d => d.totalDonated >= 5000 && d.totalDonated < 10000),
            benefactors: allRanked.filter(d => d.totalDonated >= 1000 && d.totalDonated < 5000),
            grassroots: allRanked.filter(d => d.totalDonated < 1000)
        };

        const monthlySorted = Array.from(monthlyDonorMap.values())
            .sort((a, b) => b.totalDonated - a.totalDonated)
            .map((donor, idx) => {
                const rank = idx + 1;
                const { tierName, tierBadge } = getTierDetails(donor.totalDonated, rank);
                return {
                    rank,
                    name: donor.name,
                    city: donor.city || 'Guntur',
                    state: donor.state || 'Andhra Pradesh',
                    purpose: donor.purpose || 'Monthly Giving',
                    lastDonatedAt: donor.lastDonatedAt || new Date().toISOString(),
                    photo: donor.photo || '',
                    amount: donor.totalDonated,
                    totalDonated: donor.totalDonated,
                    count: donor.count || 1,
                    tierName,
                    tierBadge: rank === 1 ? 'Monthly Leader' : rank === 2 ? 'Monthly Runner-Up' : rank === 3 ? 'Monthly Honor' : 'Monthly Contributor',
                    podiumSpot: rank <= 3 ? rank : null
                };
            });

        // 5. Update cached leaderboard
        cachedLeaderboard = {
            lastUpdated: new Date().toISOString(),
            month: currentMonthName,
            allTimeTop,
            honorsList,
            allDonors: allRanked,
            monthlyTop: monthlySorted.slice(0, 10),
            monthlyAll: monthlySorted,
            tiers: {
                pillarsCount: tiers.pillars.length,
                guardiansCount: tiers.guardians.length,
                championsCount: tiers.champions.length,
                benefactorsCount: tiers.benefactors.length,
                grassrootsCount: tiers.grassroots.length
            },
            stats: {
                totalDonationsEvaluated: donorMap.size,
                totalDonorsRanked: allRanked.length,
                totalAmountDonated,
                topDonorAmount,
                averageDonation: allRanked.length > 0 ? Math.round(totalAmountDonated / allRanked.length) : 0
            }
        };

        return cachedLeaderboard;
    } catch (err) {
        console.error('Error during auto-ranking donors:', err);
        return cachedLeaderboard;
    }
}

async function getCachedLeaderboard(forceRefresh = false) {
    const now = Date.now();
    const lastTime = cachedLeaderboard.lastUpdated ? new Date(cachedLeaderboard.lastUpdated).getTime() : 0;
    const ageMs = now - lastTime;
    
    // Refresh if forced, empty, or older than 10 seconds
    if (forceRefresh || !cachedLeaderboard.lastUpdated || !cachedLeaderboard.allTimeTop?.length || ageMs > 10000) {
        return await autoRankDonors();
    }
    return cachedLeaderboard;
}

// Initial auto-ranking on server load
setTimeout(() => {
    autoRankDonors().then(() => console.log('✓ Auto-Ranking Engine initialized with verified donor standings'));
}, 1500);

module.exports = {
    autoRankDonors,
    getCachedLeaderboard
};
