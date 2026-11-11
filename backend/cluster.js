/**
 * Kiran Charitable Trust - Multi-Instance Backend Cluster & Load Balancer
 * 
 * Utilizes Node.js native clustering with Round-Robin (SCHED_RR) scheduling.
 * Balances incoming HTTP/HTTPS and WebSocket requests across all available CPU cores.
 * Includes automated self-healing worker respawn on unexpected exits.
 */

const cluster = require('cluster');
const os = require('os');
const path = require('path');

// Enforce Round-Robin scheduling policy on OS socket level
if (cluster.schedulingPolicy !== undefined) {
    cluster.schedulingPolicy = cluster.SCHED_RR;
}

const numCPUs = os.cpus().length;
// Configure instance count: Clamp between 2 and max CPUs (default 4 instances for optimal concurrency)
const WORKERS = process.env.WORKERS ? parseInt(process.env.WORKERS, 10) : Math.min(Math.max(2, numCPUs), 4);

if (cluster.isPrimary || cluster.isMaster) {
    console.log(`================================================================`);
    console.log(`🚀 [KCT CLUSTER LOAD BALANCER] Primary Master PID: ${process.pid}`);
    console.log(`⚡ System Architecture: ${os.arch()} | CPUs Available: ${numCPUs}`);
    console.log(`🔄 Spawning ${WORKERS} Balanced Worker Instances (Round-Robin SCHED_RR)...`);
    console.log(`================================================================`);

    // Fork initial pool of workers
    for (let i = 0; i < WORKERS; i++) {
        const worker = cluster.fork();
        console.log(`[Primary] Dispatched Worker #${i + 1} (PID: ${worker.process.pid})`);
    }

    cluster.on('online', (worker) => {
        console.log(`✅ [Worker Online] PID: ${worker.process.pid} is ready to accept traffic`);
    });

    // Auto-Respawn Self-Healing Mechanism
    cluster.on('exit', (worker, code, signal) => {
        console.warn(`⚠️ [Worker Exited] PID: ${worker.process.pid} died (Code: ${code}, Signal: ${signal}). Auto-healing...`);
        const replacement = cluster.fork();
        console.log(`🔄 [Worker Respawned] New Worker PID: ${replacement.process.pid} launched in cluster`);
    });

    // Graceful Termination
    const shutdownCluster = () => {
        console.log(`\n🛑 [Primary] Master received shutdown signal. Terminating workers gracefully...`);
        for (const id in cluster.workers) {
            cluster.workers[id].kill('SIGTERM');
        }
        process.exit(0);
    };

    process.on('SIGINT', shutdownCluster);
    process.on('SIGTERM', shutdownCluster);

} else {
    // Worker processes execute the Express application server
    // All workers share the same network port (e.g. 5000) via kernel socket abstraction
    require('./server');
}
