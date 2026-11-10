const mongoose = require('mongoose');
const TrustMember = require('../models/TrustMember');
const User = require('../models/User');
const { memoryStore, persistMemoryStore } = require('../services/supabaseService');

async function test() {
  try {
    const id = 'KCT-MEM-1086';
    const strId = String(id).trim();
    const lowerId = strId.toLowerCase();
    let targetEmail = lowerId.includes('@') ? lowerId : '';

    console.log('mongoose readyState:', mongoose.connection.readyState);
    if (mongoose.connection.readyState >= 1) {
      let deleted = null;
      if (mongoose.Types.ObjectId.isValid(strId)) {
        deleted = await TrustMember.findByIdAndDelete(strId);
      }
      if (!deleted) {
        deleted = await TrustMember.findOneAndDelete({
          $or: [{ memberId: strId }, { email: lowerId }]
        });
      }
      if (deleted?.email) targetEmail = deleted.email.toLowerCase().trim();
      if (targetEmail) {
        await User.deleteMany({ email: targetEmail }).catch(() => {});
      }
    }

    if (!targetEmail) {
      const mMatch = (memoryStore.trust_members || []).find(m => m.memberId === strId || m._id === strId || m.id === strId || m.email?.toLowerCase() === lowerId);
      const pMatch = (memoryStore.profiles || []).find(p => p.id === strId || p._id === strId || p.email?.toLowerCase() === lowerId);
      targetEmail = (mMatch?.email || pMatch?.email || '').toLowerCase().trim();
    }

    console.log('targetEmail:', targetEmail);
    console.log('Done test successfully');
  } catch (err) {
    console.error('ERROR THROWN:', err);
  }
}

test();
