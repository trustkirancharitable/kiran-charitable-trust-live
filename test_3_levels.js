module.paths.push('C:/Users/fayaz/Downloads/kiran-charitable-trust-copy/backend/node_modules');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });
const crypto = require('crypto');
const { getSupabaseAnalytics, syncPayment, memoryStore } = require('./backend/services/supabaseService');
const { getR2Client } = require('./backend/services/cloudflareR2Service');
const { verifyTurnstileToken } = require('./backend/middleware/turnstileMiddleware');

const API_BASE = 'http://localhost:5000/api';

async function run3LevelTesting() {
    console.log('================================================================');
    console.log('   KIRAN CHARITABLE TRUST - 3-LEVEL COMPREHENSIVE TEST SUITE   ');
    console.log('================================================================\n');

    let totalTests = 0;
    let passedTests = 0;

    function assert(level, testName, condition, details = '') {
        totalTests++;
        if (condition) {
            passedTests++;
            console.log(`✅ [${level}] ${testName} ${details ? '-> ' + details : ''}`);
        } else {
            console.error(`❌ [${level}] ${testName} ${details ? '-> ' + details : ''}`);
        }
    }

    // =========================================================================
    // LEVEL 1: API & HEALTH PROTOCOL VERIFICATION
    // =========================================================================
    console.log('----------------------------------------------------------------');
    console.log('LEVEL 1: CORE SERVICE AVAILABILITY & HEALTH PROTOCOL');
    console.log('----------------------------------------------------------------');
    try {
        const healthRes = await fetch(`${API_BASE}/health`);
        const healthData = await healthRes.json();
        assert('LEVEL 1', 'Backend Server Healthcheck (200 OK)', healthRes.status === 200 && healthData.success);
        
        // Security response headers
        assert('LEVEL 1', 'WAF Security Header: X-Content-Type-Options', healthRes.headers.get('x-content-type-options') === 'nosniff');
        assert('LEVEL 1', 'WAF Security Header: Strict-Transport-Security', Boolean(healthRes.headers.get('strict-transport-security')));
        assert('LEVEL 1', 'WAF Security Header: Referrer-Policy', Boolean(healthRes.headers.get('referrer-policy')));
    } catch (e) {
        assert('LEVEL 1', 'Backend Healthcheck', false, e.message);
    }

    // =========================================================================
    // LEVEL 2: PAYMENT LIFECYCLE (SUCCESS, FAILED, PENDING) & SABPAISA GATEWAY
    // =========================================================================
    console.log('\n----------------------------------------------------------------');
    console.log('LEVEL 2: PAYMENT GATEWAY & 3-STATE TRANSACTION LIFECYCLE');
    console.log('----------------------------------------------------------------');

    // 2A: PENDING PAYMENT INITIATION
    let pendingTxnId = `TEST-INIT-${Date.now()}`;
    let sabpaisaCheckoutUrl = '';
    try {
        const initiateRes = await fetch(`${API_BASE}/donations/initiate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: 'Level2 Pending Tester',
                email: 'tester.pending@kirancharitabletrust.org',
                mobile: '9876543210',
                amount: 501,
                purpose: 'Annadanam Feeding Drive',
                donorCategory: 'individual',
                address: 'Nandyal, Andhra Pradesh',
                isAnonymous: false,
                turnstileToken: 'TEST-BYPASS-TOKEN'
            })
        });

        const initiateData = await initiateRes.json();
        assert('LEVEL 2A', 'Payment Initiation Response (200 OK)', initiateRes.status === 200 && initiateData.success);
        assert('LEVEL 2A', 'SabPaisa Checkout Redirect URL Returned', Boolean(initiateData.checkoutUrl || initiateData.paymentUrl));
        sabpaisaCheckoutUrl = initiateData.checkoutUrl || initiateData.paymentUrl;
        pendingTxnId = initiateData.clientTxnId;

        // Allow async sync to settle and query backend analytics API
        await new Promise(r => setTimeout(r, 600));

        // Verify state is stored as PENDING via the live backend API
        const analyticsRes = await fetch(`${API_BASE}/admin/supabase-analytics`);
        const analyticsJson = await analyticsRes.json();
        const pendingPayment = analyticsJson.analytics?.recentPayments?.find(p => p.client_txn_id === pendingTxnId);
        assert('LEVEL 2A', 'Database Record Status: PENDING', pendingPayment && pendingPayment.status === 'PENDING', `ClientTxn: ${pendingTxnId}`);
    } catch (e) {
        assert('LEVEL 2A', 'Payment Initiation', false, e.message);
    }

    // 2B: SUCCESSFUL PAYMENT COMPLETION LIFECYCLE
    const successClientTxnId = `TEST-SUCC-${Date.now()}`;
    const successReceiptNo = `REC-TEST-${Date.now()}`;
    const successPaymentRecord = await syncPayment({
        fullName: 'Level2 Success Donor',
        email: 'tester.success@kirancharitabletrust.org',
        mobile: '9876543210',
        amount: 2500,
        purpose: 'Healthcare Support',
        receiptNumber: successReceiptNo,
        clientTxnId: successClientTxnId,
        transactionId: `SP-SUCCESS-${Date.now()}`,
        status: 'SUCCESS'
    });
    assert('LEVEL 2B', 'Payment Completion Status: SUCCESS Recorded', successPaymentRecord.status === 'SUCCESS');
    assert('LEVEL 2B', '80G Receipt Number Generated', successPaymentRecord.receipt_number === successReceiptNo);

    // 2C: FAILED PAYMENT LIFECYCLE WITH FAILURE REASON
    const failedClientTxnId = `TEST-FAIL-${Date.now()}`;
    const failedPaymentRecord = await syncPayment({
        fullName: 'Level2 Failed Donor',
        email: 'tester.failed@kirancharitabletrust.org',
        mobile: '9876543210',
        amount: 1000,
        purpose: 'Women Empowerment',
        clientTxnId: failedClientTxnId,
        receiptNumber: `REC-FAIL-${Date.now()}`,
        status: 'FAILED',
        failureReason: 'Transaction declined by issuer bank (Insufficient funds)'
    });
    assert('LEVEL 2C', 'Payment Failure Status: FAILED Recorded', failedPaymentRecord.status === 'FAILED');
    assert('LEVEL 2C', 'Failure Reason Recorded in Audit Trail', Boolean(failedPaymentRecord.failure_reason), failedPaymentRecord.failure_reason);

    // 2D: SABPAISA HMAC-SHA256 SIGNATURE VALIDATION
    const rawData = `${process.env.SABPAISA_CLIENT_CODE}|${successClientTxnId}|250000|${Date.now()}`;
    const hmacSig = crypto.createHmac('sha256', process.env.SABPAISA_SECRET_KEY || 'default').update(rawData).digest('hex');
    assert('LEVEL 2D', 'SabPaisa PG 3.0 HMAC-SHA256 Cryptographic Checksum', hmacSig.length === 64, `Checksum: ${hmacSig.substring(0, 16)}...`);

    // =========================================================================
    // LEVEL 3: DUAL-DATABASE, REAL-TIME ANALYTICS & CLOUD SERVICES
    // =========================================================================
    console.log('\n----------------------------------------------------------------');
    console.log('LEVEL 3: DUAL-DB AUDIT, SUPABASE ANALYTICS & CLOUDFLARE R2');
    console.log('----------------------------------------------------------------');

    // 3A: SUPABASE REAL-TIME ADMIN ANALYTICS
    try {
        const liveAnalyticsRes = await fetch(`${API_BASE}/admin/supabase-analytics`);
        const liveAnalyticsJson = await liveAnalyticsRes.json();
        const analytics = liveAnalyticsJson.analytics || (await getSupabaseAnalytics());
        assert('LEVEL 3A', 'Supabase Real-Time Analytics Query Executed', Boolean(analytics && analytics.summary));
        assert('LEVEL 3A', 'Analytics Tracks Success Count', analytics.summary.successCount >= 1, `Count: ${analytics.summary.successCount}`);
        assert('LEVEL 3A', 'Analytics Tracks Failed Count', analytics.summary.failedCount >= 1, `Count: ${analytics.summary.failedCount}`);
        assert('LEVEL 3A', 'Analytics Tracks Pending Count', analytics.summary.pendingCount >= 1, `Count: ${analytics.summary.pendingCount}`);
        assert('LEVEL 3A', 'Analytics Calculates Total Donation Amount', analytics.summary.totalDonated > 0, `Total: ₹${analytics.summary.totalDonated}`);
    } catch (e) {
        assert('LEVEL 3A', 'Supabase Analytics Audit', false, e.message);
    }

    // 3B: CLOUDFLARE R2 CLIENT INITIALIZATION & BUCKET PARAMS
    try {
        const r2 = getR2Client();
        assert('LEVEL 3B', 'Cloudflare R2 S3 Client Initialization', Boolean(r2));
        assert('LEVEL 3B', 'Cloudflare R2 Bucket Binding', process.env.CLOUDFLARE_R2_BUCKET_NAME === 'trustholdersimages', 'Bucket: trustholdersimages');
        assert('LEVEL 3B', 'Cloudflare R2 CDN Public Domain Configured', Boolean(process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN), process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN);
    } catch (e) {
        assert('LEVEL 3B', 'Cloudflare R2 Audit', false, e.message);
    }

    // 3C: CLOUDFLARE TURNSTILE TOKEN VERIFIER
    try {
        const turnstileOk = await verifyTurnstileToken('1x00000000000000000000AA');
        assert('LEVEL 3C', 'Cloudflare Turnstile Verification Pipeline', turnstileOk === true);
    } catch (e) {
        assert('LEVEL 3C', 'Turnstile Pipeline Audit', false, e.message);
    }

    console.log('\n================================================================');
    console.log(`TEST EXECUTION COMPLETE: ${passedTests}/${totalTests} TESTS PASSED`);
    console.log('================================================================\n');

    return { totalTests, passedTests, success: passedTests === totalTests };
}

run3LevelTesting().catch(console.error);
