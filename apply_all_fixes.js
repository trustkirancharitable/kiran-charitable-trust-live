const fs = require('fs');
const path = require('path');

// ════════════════════════════════════════════════════════════
// 1. UPDATE backend/routes/admin.js (/payments route)
// ════════════════════════════════════════════════════════════
const adminRoutePath = path.join(__dirname, 'backend/routes/admin.js');
let adminRoute = fs.readFileSync(adminRoutePath, 'utf8');

const oldAdminPaymentsRegex = /\/\/ GET \/api\/admin\/payments[^\n]*\nrouter\.get\('\/payments', async \(req, res\) => \{[\s\S]*?return res\.json\(\{[\s\S]*?payments[\s\S]*?\}\);\s*\} catch \(err\) \{[\s\S]*?\}\s*\}\);/;

const newAdminPaymentsCode = `// GET /api/admin/payments — Payments and Transaction History (Normalized & Descending)
router.get('/payments', async (req, res) => {
    try {
        const { status, limit = 200, page = 1 } = req.query;
        let payments = [];
        let total = 0;

        // Collect from MongoDB if connected
        try {
            if (mongoose.connection.readyState === 1) {
                const filter = status && status !== 'all' ? { status } : {};
                payments = await Donation.find(filter).sort({ createdAt: -1 }).maxTimeMS(1000).lean();
            }
        } catch (e) {
            console.warn('DB payments fetch notice:', e.message);
        }

        // Merge with memoryStore / local_store records
        const storePayments = memoryStore.payments || [];
        const combined = [...payments];
        const existingTxns = new Set(combined.map(p => p.transactionId || p.clientTxnId || p.client_txn_id || String(p._id)));

        for (const sp of storePayments) {
            const tid = sp.transaction_id || sp.transactionId || sp.client_txn_id || sp.clientTxnId || sp.receipt_number || sp.receiptNumber;
            if (tid && !existingTxns.has(tid)) {
                existingTxns.add(tid);
                combined.push(sp);
            }
        }

        // Sort descending by date (NEWEST TRANSACTIONS ALWAYS AT TOP)
        combined.sort((a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0));

        // Normalize every record with both camelCase & snake_case
        const normalized = combined.map(p => {
            const rawStatus = (p.status || 'PENDING').toLowerCase();
            return {
                ...p,
                _id: p._id || p.id || p.client_txn_id || p.clientTxnId || \`pay_\${Date.now()}_\${Math.random().toString(36).slice(2, 7)}\`,
                fullName: p.fullName || p.full_name || p.name || 'Valued Philanthropist',
                full_name: p.full_name || p.fullName || p.name || 'Valued Philanthropist',
                email: p.email || '',
                mobile: p.mobile || p.phone || '',
                phone: p.phone || p.mobile || '',
                amount: Number(p.amount) || 0,
                purpose: p.purpose || 'General Donation',
                donorCategory: p.donorCategory || p.donor_category || 'general',
                donor_category: p.donor_category || p.donorCategory || 'general',
                paymentMethod: p.paymentMethod || p.payment_method || 'SabPaisa PG',
                payment_method: p.payment_method || p.paymentMethod || 'SabPaisa PG',
                transactionId: p.transactionId || p.transaction_id || p.clientTxnId || p.client_txn_id || '',
                transaction_id: p.transaction_id || p.transactionId || p.client_txn_id || p.clientTxnId || '',
                clientTxnId: p.clientTxnId || p.client_txn_id || p.transactionId || p.transaction_id || '',
                client_txn_id: p.client_txn_id || p.clientTxnId || p.transaction_id || p.transactionId || '',
                receiptNumber: p.receiptNumber || p.receipt_number || '',
                receipt_number: p.receipt_number || p.receiptNumber || '',
                status: rawStatus,
                failureReason: p.failureReason || p.failure_reason || '',
                createdAt: p.createdAt || p.created_at || new Date().toISOString(),
                created_at: p.created_at || p.createdAt || new Date().toISOString()
            };
        });

        // Filter by status if requested
        const filtered = (status && status !== 'all')
            ? normalized.filter(p => p.status === status.toLowerCase() || (status === 'success' && p.status === 'completed'))
            : normalized;

        total = filtered.length;
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.max(1, Number(limit));
        const skip = (pageNum - 1) * limitNum;
        const paginated = filtered.slice(skip, skip + limitNum);

        return res.json({
            success: true,
            total,
            page: pageNum,
            payments: paginated
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to fetch payments' });
    }
});`;

normAdmin = adminRoute.replace(/\r\n/g, '\n');
if (oldAdminPaymentsRegex.test(normAdmin)) {
    normAdmin = normAdmin.replace(oldAdminPaymentsRegex, newAdminPaymentsCode);
    fs.writeFileSync(adminRoutePath, normAdmin.replace(/\n/g, '\r\n'), 'utf8');
    console.log('✅ Updated backend/routes/admin.js payments route!');
} else {
    console.log('⚠️ oldAdminPaymentsRegex not matched, checking manually');
}

// ════════════════════════════════════════════════════════════
// 2. UPDATE backend/routes/donations.js (Include all donor params in failed redirect)
// ════════════════════════════════════════════════════════════
const donationsPath = path.join(__dirname, 'backend/routes/donations.js');
let donationsCode = fs.readFileSync(donationsPath, 'utf8');

const targetFailRedirect = "return sendBreakoutHtml(res, `${clientRedirectUrl}${targetPage}${querySep}status=failed&txnId=${encodeURIComponent(pgTxnNo || clientTxnId || '')}&txId=${encodeURIComponent(pgTxnNo || clientTxnId || '')}&amount=${encodeURIComponent(finalAmount)}&name=${encodeURIComponent(finalName)}&reason=${encodeURIComponent(failureReason)}${tokenQuery}`, 'failed');";
const replaceFailRedirect = "return sendBreakoutHtml(res, `${clientRedirectUrl}${targetPage}${querySep}status=failed&txnId=${encodeURIComponent(pgTxnNo || clientTxnId || '')}&txId=${encodeURIComponent(pgTxnNo || clientTxnId || '')}&clientTxnId=${encodeURIComponent(clientTxnId || '')}&amount=${encodeURIComponent(finalAmount)}&name=${encodeURIComponent(finalName)}&email=${encodeURIComponent(finalEmail || '')}&mobile=${encodeURIComponent(finalMobile || '')}&address=${encodeURIComponent(finalAddress || '')}&purpose=${encodeURIComponent(finalPurpose || '')}&reason=${encodeURIComponent(failureReason)}${tokenQuery}`, 'failed');";

if (donationsCode.includes(targetFailRedirect)) {
    donationsCode = donationsCode.replace(targetFailRedirect, replaceFailRedirect);
    fs.writeFileSync(donationsPath, donationsCode, 'utf8');
    console.log('✅ Updated backend/routes/donations.js failed redirect parameters!');
} else {
    console.log('⚠️ Failed redirect string not found in donations.js');
}

// ════════════════════════════════════════════════════════════
// 3. UPDATE frontend/src/pages/Donate.jsx (Pre-fill, Modal, Save Form)
// ════════════════════════════════════════════════════════════
const donateJsxPath = path.join(__dirname, 'frontend/src/pages/Donate.jsx');
let donateJsx = fs.readFileSync(donateJsxPath, 'utf8');

// A. Add FaTimes, FaExclamationTriangle, FaSyncAlt, FaUniversity to imports if not present
if (!donateJsx.includes('FaExclamationTriangle')) {
    donateJsx = donateJsx.replace(
        "FaRegCreditCard,",
        "FaRegCreditCard, FaExclamationTriangle, FaUniversity,"
    );
}

// B. Add state for failure modal
if (!donateJsx.includes('paymentFailureModal')) {
    donateJsx = donateJsx.replace(
        "const [receiptData, setReceiptData] = useState(null);",
        "const [receiptData, setReceiptData] = useState(null);\n    const [paymentFailureModal, setPaymentFailureModal] = useState(null);"
    );
}

// C. Update minimum amount validation to ₹5 with descriptive message
donateJsx = donateJsx.replace(
    /if\s*\(effectiveAmount\s*<\s*10\)\s*\{\s*return\s+toast\.error\('Please select or enter a valid contribution amount\.'\);\s*\}/g,
    "if (effectiveAmount < 5) {\n                return toast.error('Minimum online contribution amount is ₹5 (gateway minimum).');\n            }"
);

// D. Save form before redirecting to SabPaisa
const executePayTarget = "if (res.data?.success && res.data.checkoutUrl) {\n                window.location.href = res.data.checkoutUrl;\n                return;\n            }";
const executePayReplace = `if (res.data?.success && res.data.checkoutUrl) {
                try {
                    localStorage.setItem('kct_last_donation_form', JSON.stringify({
                        fullName,
                        mobileNumber,
                        email,
                        address,
                        panNumber,
                        effectiveAmount,
                        purpose
                    }));
                } catch (e) {}
                window.location.href = res.data.checkoutUrl;
                return;
            }`;

if (donateJsx.includes(executePayTarget)) {
    donateJsx = donateJsx.replace(executePayTarget, executePayReplace);
    console.log('✅ Added localStorage persistence before checkout redirect in Donate.jsx!');
}

// E. Handle status=failed and pre-fill form on mount
const searchParamsTarget = `        // Check if returning from payment gateway
        const status = searchParams.get('status');
        const txnId = searchParams.get('txnId') || searchParams.get('txId');
        if (status === 'success') {
            setReceiptData({
                receiptNo: 'KCT-80G-' + Date.now().toString().slice(-6),
                txnId: txnId || 'SP' + Date.now().toString().slice(-8),
                name: searchParams.get('name') || 'Generous Benefactor',
                amount: searchParams.get('amount') || selectedAmount,
                purpose: searchParams.get('purpose') || purpose,
                date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
                pan: searchParams.get('pan') || 'AAGTK5575Q'
            });
            toast.success('Donation completed successfully! 80G Tax Exemption Receipt generated.');
        }`;

const searchParamsReplace = `        // Check if returning from payment gateway
        const status = searchParams.get('status');
        const txnId = searchParams.get('txnId') || searchParams.get('txId');
        if (status === 'success') {
            setReceiptData({
                receiptNo: 'KCT-80G-' + Date.now().toString().slice(-6),
                txnId: txnId || 'SP' + Date.now().toString().slice(-8),
                name: searchParams.get('name') || 'Generous Benefactor',
                amount: searchParams.get('amount') || selectedAmount,
                purpose: searchParams.get('purpose') || purpose,
                date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
                pan: searchParams.get('pan') || 'AAGTK5575Q'
            });
            toast.success('Donation completed successfully! 80G Tax Exemption Receipt generated.');
        } else if (status === 'failed' || status === 'timeout' || status === 'cancelled') {
            // Restore details from query string or localStorage
            let restoredName = searchParams.get('name') || '';
            let restoredEmail = searchParams.get('email') || '';
            let restoredMobile = searchParams.get('mobile') || '';
            let restoredAddress = searchParams.get('address') || '';
            let restoredPurpose = searchParams.get('purpose') || '';
            let restoredAmt = Number(searchParams.get('amount') || 0);

            try {
                const saved = JSON.parse(localStorage.getItem('kct_last_donation_form') || '{}');
                if (!restoredName && saved.fullName) restoredName = saved.fullName;
                if (!restoredEmail && saved.email) restoredEmail = saved.email;
                if (!restoredMobile && saved.mobileNumber) restoredMobile = saved.mobileNumber;
                if (!restoredAddress && saved.address) restoredAddress = saved.address;
                if (saved.panNumber) setPanNumber(saved.panNumber);
                if (!restoredPurpose && saved.purpose) restoredPurpose = saved.purpose;
                if (!restoredAmt && (saved.effectiveAmount || saved.amount)) restoredAmt = Number(saved.effectiveAmount || saved.amount);
            } catch (e) {}

            if (restoredName) setFullName(restoredName);
            if (restoredEmail) setEmail(restoredEmail);
            if (restoredMobile) setMobileNumber(restoredMobile);
            if (restoredAddress) setAddress(restoredAddress);
            if (restoredPurpose) setPurpose(restoredPurpose);
            if (restoredAmt && restoredAmt >= 5) {
                if (presetAmounts.includes(restoredAmt)) {
                    setSelectedAmount(restoredAmt);
                    setIsCustomAmount(false);
                } else {
                    setIsCustomAmount(true);
                    setCustomAmountValue(restoredAmt);
                }
            }

            const rawReason = searchParams.get('reason') || 'Payment session timed out or was cancelled by the bank.';
            setPaymentFailureModal({
                name: restoredName,
                amount: restoredAmt || selectedAmount,
                reason: rawReason,
                txnId: txnId || searchParams.get('clientTxnId') || ''
            });
        }`;

let normDonateJsx = donateJsx.replace(/\r\n/g, '\n');
const normTarget = searchParamsTarget.replace(/\r\n/g, '\n');
const normReplace = searchParamsReplace.replace(/\r\n/g, '\n');

if (normDonateJsx.includes(normTarget)) {
    normDonateJsx = normDonateJsx.replace(normTarget, normReplace);
    console.log('✅ Added failed status handling and form pre-fill to Donate.jsx!');
} else {
    console.log('⚠️ searchParamsTarget not matched in Donate.jsx');
}

// F. Add modal markup before the closing tag of Donate
if (!normDonateJsx.includes('payment-failure-dialog-overlay')) {
    const modalMarkup = `
            {/* ════════════════════════════════════════════════════════════
                PAYMENT FAILED / TIMED OUT POPUP DIALOG BOX
               ════════════════════════════════════════════════════════════ */}
            {paymentFailureModal && (
                <div className="payment-failure-dialog-overlay" onClick={() => setPaymentFailureModal(null)}>
                    <div className="payment-failure-dialog-box" onClick={e => e.stopPropagation()}>
                        <button className="failure-close-btn" onClick={() => setPaymentFailureModal(null)} title="Close">
                            <FaTimes />
                        </button>
                        <div className="failure-dialog-icon">
                            <FaExclamationTriangle />
                        </div>
                        <h3 className="failure-dialog-title">Payment Unsuccessful / Timed Out</h3>
                        <p className="failure-dialog-desc">
                            Your payment session was not completed or timed out on the banking gateway.
                            We have safely restored all your contribution details below so you can retry seamlessly without re-typing.
                        </p>
                        <div className="failure-dialog-details">
                            <div className="failure-detail-row">
                                <span>Donor Name:</span>
                                <strong>{paymentFailureModal.name || fullName || 'Donor'}</strong>
                            </div>
                            <div className="failure-detail-row">
                                <span>Contribution Amount:</span>
                                <strong style={{ color: '#059669', fontSize: '16px' }}>₹{paymentFailureModal.amount || effectiveAmount}</strong>
                            </div>
                            <div className="failure-detail-row">
                                <span>Status / Reason:</span>
                                <span style={{ color: '#dc2626', fontWeight: 600 }}>{paymentFailureModal.reason}</span>
                            </div>
                            {paymentFailureModal.txnId && (
                                <div className="failure-detail-row">
                                    <span>Transaction Ref:</span>
                                    <code style={{ fontSize: '11px', color: '#64748b' }}>{paymentFailureModal.txnId}</code>
                                </div>
                            )}
                        </div>
                        <div className="failure-dialog-actions">
                            <button
                                type="button"
                                className="btn btn-primary failure-retry-btn"
                                onClick={() => {
                                    setPaymentFailureModal(null);
                                    setTimeout(() => {
                                        const formEl = document.querySelector('.donate-form-container') || document.querySelector('.donation-action-card');
                                        if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
                                    }, 100);
                                }}
                            >
                                <FaSyncAlt /> Retry Contribution Now
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary failure-bank-btn"
                                onClick={() => {
                                    setPaymentFailureModal(null);
                                    setPaymentMode('bank');
                                    setTimeout(() => {
                                        const bankEl = document.getElementById('direct-bank-details');
                                        if (bankEl) bankEl.scrollIntoView({ behavior: 'smooth' });
                                    }, 100);
                                }}
                            >
                                <FaUniversity /> Pay via Direct Bank NEFT / QR
                            </button>
                        </div>
                    </div>
                </div>
            )}
`;
    normDonateJsx = normDonateJsx.replace('        </div>\n    );\n}', modalMarkup + '        </div>\n    );\n}');
}

fs.writeFileSync(donateJsxPath, normDonateJsx.replace(/\n/g, '\r\n'), 'utf8');
console.log('✅ Saved updated Donate.jsx!');

// ════════════════════════════════════════════════════════════
// 4. UPDATE frontend/src/pages/Donate.css (Failure Dialog Styles)
// ════════════════════════════════════════════════════════════
const donateCssPath = path.join(__dirname, 'frontend/src/pages/Donate.css');
let donateCss = fs.readFileSync(donateCssPath, 'utf8');

if (!donateCss.includes('payment-failure-dialog-overlay')) {
    const dialogStyles = `
/* ════════════════════════════════════════════════════════════
   PAYMENT FAILED / TIMED OUT POPUP DIALOG
   ════════════════════════════════════════════════════════════ */
.payment-failure-dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(15, 23, 42, 0.75);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
    padding: 16px;
    animation: fadeIn 0.2s ease;
}

.payment-failure-dialog-box {
    background: #ffffff;
    border-radius: 18px;
    max-width: 480px;
    width: 100%;
    padding: 28px 24px;
    box-shadow: 0 20px 45px rgba(0, 0, 0, 0.22);
    position: relative;
    text-align: center;
    border: 2px solid #fee2e2;
    animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    box-sizing: border-box;
}

.failure-close-btn {
    position: absolute;
    top: 14px;
    right: 14px;
    background: #f1f5f9;
    border: none;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #64748b;
    font-size: 14px;
    transition: all 0.15s ease;
}

.failure-close-btn:hover {
    background: #fee2e2;
    color: #ef4444;
}

.failure-dialog-icon {
    width: 64px;
    height: 64px;
    background: #fef2f2;
    border: 2px solid #fecaca;
    color: #dc2626;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    margin: 0 auto 16px;
}

.failure-dialog-title {
    font-size: 20px;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 8px;
}

.failure-dialog-desc {
    font-size: 14px;
    color: #64748b;
    line-height: 1.5;
    margin: 0 0 18px;
}

.failure-dialog-details {
    background: #f8fafc;
    border: 1.5px solid #e2e8f0;
    border-radius: 12px;
    padding: 12px 16px;
    margin-bottom: 20px;
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.failure-detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13.5px;
    color: #334155;
}

.failure-detail-row span {
    color: #64748b;
}

.failure-dialog-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.failure-retry-btn {
    width: 100%;
    padding: 12px;
    font-size: 15px;
    font-weight: 750;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: #0F52BA;
    color: #ffffff;
    border-radius: 10px;
    border: none;
    cursor: pointer;
}

.failure-retry-btn:hover {
    background: #0b377b;
}

.failure-bank-btn {
    width: 100%;
    padding: 11px;
    font-size: 13.5px;
    font-weight: 650;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: #f8fafc;
    color: #1e293b;
    border: 1.5px solid #cbd5e1;
    border-radius: 10px;
    cursor: pointer;
}

.failure-bank-btn:hover {
    background: #f1f5f9;
}
`;
    donateCss += '\n' + dialogStyles;
    fs.writeFileSync(donateCssPath, donateCss, 'utf8');
    console.log('✅ Added payment failure dialog styles to Donate.css!');
}

// ════════════════════════════════════════════════════════════
// 5. UPDATE frontend/src/pages/Admin.jsx (Show full name & txn ID, increase page size to 10)
// ════════════════════════════════════════════════════════════
const adminJsxPath = path.join(__dirname, 'frontend/src/pages/Admin.jsx');
let adminJsx = fs.readFileSync(adminJsxPath, 'utf8');

// A. Increase page size from 5 to 10
adminJsx = adminJsx.replace(
    /filteredPayments\.slice\(\(paymentPage - 1\) \* 5, paymentPage \* 5\)/g,
    'filteredPayments.slice((paymentPage - 1) * 10, paymentPage * 10)'
);
adminJsx = adminJsx.replace(
    /Math\.ceil\(filteredPayments\.length \/ 5\)/g,
    'Math.ceil(filteredPayments.length / 10)'
);
adminJsx = adminJsx.replace(
    /Showing \{Math\.min\(\(paymentPage - 1\) \* 5 \+ 1, filteredPayments\.length\)\} - \{Math\.min\(paymentPage \* 5, filteredPayments\.length\)\}/g,
    'Showing {Math.min((paymentPage - 1) * 10 + 1, filteredPayments.length)} - {Math.min(paymentPage * 10, filteredPayments.length)}'
);

// B. Support full_name and client_txn_id fallbacks
adminJsx = adminJsx.replace(
    /const initials = \(p\.fullName \|\| 'Valued Donor'\)/g,
    "const initials = (p.fullName || p.full_name || 'Valued Donor')"
);
adminJsx = adminJsx.replace(
    /\{p\.fullName \|\| 'Valued Donor'\}/g,
    "{p.fullName || p.full_name || 'Valued Donor'}"
);
adminJsx = adminJsx.replace(
    /\{p\.clientTxnId \|\| p\.transactionId \|\| 'TXN-KCT'\}/g,
    "{p.clientTxnId || p.client_txn_id || p.transactionId || p.transaction_id || 'TXN-KCT'}"
);
adminJsx = adminJsx.replace(
    /\{p\.mobile && <div style=\{\{ fontSize: 11, color: '#94a3b8' \}\}>\{p\.mobile\}<\/div>\}/g,
    "{(p.mobile || p.phone) && <div style={{ fontSize: 11, color: '#94a3b8' }}>{p.mobile || p.phone}</div>}"
);

fs.writeFileSync(adminJsxPath, adminJsx, 'utf8');
console.log('✅ Updated Admin.jsx with full name, txn ID, and 10 items/page!');
