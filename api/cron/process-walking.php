<?php
// CLI worker to advance active walkers by one step per tick.
// Usage:
//   php process-walking.php            # run a single tick
//   php process-walking.php --daemon   # run continuously, sleeping 2s between ticks

declare(ticks=1);

if (php_sapi_name() !== 'cli') {
    fwrite(STDERR, "This script is intended to be run from CLI only.\n");
    exit(1);
}

$daemon = in_array('--daemon', $argv, true);

// Config
define('DB_HOST', getenv('GAME_DB_HOST') ?: 'db');
define('DB_PORT', getenv('GAME_DB_PORT') ?: 3306);
define('DB_NAME', getenv('GAME_DB_NAME') ?: 'regnum_nostalgia');
define('DB_USER', getenv('GAME_DB_USER') ?: 'regnum_user');
define('DB_PASS', getenv('GAME_DB_PASS') ?: 'regnum_pass');
$tickSeconds = 2;

function getDB() {
    static $db = null;
    if ($db === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME . ';charset=utf8mb4';
        $db = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]);
    }
    return $db;
}

function processOnce() {
    $db = getDB();
    $now = time();

    // Fetch active walkers (only those actively walking) with player speed multiplier
    $stmt = $db->prepare("
        SELECT w.walker_id, w.user_id, w.positions, w.current_index, p.speed_multiplier
        FROM walkers w
        JOIN players p ON w.user_id = p.user_id
        WHERE w.status = 'walking'
    ");
    $stmt->execute();
    $walkers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($walkers)) {
        echo "No active walkers.\n";
        return;
    }

    $updatePlayerStmt = $db->prepare('UPDATE players SET x = ?, y = ?, last_active = ? WHERE user_id = ?');
    $updateWalkerStmt = $db->prepare('UPDATE walkers SET current_index = ?, updated_at = ? WHERE walker_id = ?');
    $finishWalkerStmt = $db->prepare('UPDATE walkers SET current_index = ?, updated_at = ?, finished_at = ?, status = ? WHERE walker_id = ?');

    foreach ($walkers as $w) {
        $walkerId = $w['walker_id'];
        $userId = $w['user_id'];
        $positions = json_decode($w['positions'], true);
        $current = (int)$w['current_index'];
        $speedMultiplier = isset($w['speed_multiplier']) ? (float)$w['speed_multiplier'] : 1.0;

        if (!is_array($positions) || count($positions) === 0) {
            // nothing to do: mark finished so it won't be processed again
            $db->beginTransaction();
            try {
                $finishWalkerStmt->execute([0, $now, $now, 'done', $walkerId]);
                $db->commit();
                echo "Walker {$walkerId} had no positions — marked finished.\n";
            } catch (Exception $e) {
                $db->rollBack();
                fwrite(STDERR, "Failed to mark walker {$walkerId} finished: " . $e->getMessage() . "\n");
            }
            continue;
        }

        // Calculate how many steps to advance based on speed multiplier
        // Speed is rounded to nearest integer: 1.5x becomes 2 steps/tick, 2.5x becomes 3 steps/tick
        // This provides discrete speed tiers while avoiding fractional position tracking
        $stepsToAdvance = max(1, (int)round($speedMultiplier));
        $nextIndex = $current + $stepsToAdvance;
        
        if ($nextIndex >= count($positions)) {
            // finish: move player to final position and retain walker (mark as at final index)
            $finalIndex = count($positions) - 1;
            $final = $positions[$finalIndex];
            $x = (int)$final[0]; $y = (int)$final[1];
            $db->beginTransaction();
            try {
                $updatePlayerStmt->execute([$x, $y, $now, $userId]);
                $finishWalkerStmt->execute([$finalIndex, $now, $now, 'done', $walkerId]);
                $db->commit();
                echo "Walker {$walkerId} completed and marked finished for user {$userId}.\n";
            } catch (Exception $e) {
                $db->rollBack();
                fwrite(STDERR, "Failed to finalize walker {$walkerId}: " . $e->getMessage() . "\n");
            }
            continue;
        }

        $pos = $positions[$nextIndex];
        $x = (int)$pos[0]; $y = (int)$pos[1];

        $db->beginTransaction();
        try {
            $updatePlayerStmt->execute([$x, $y, $now, $userId]);
            $updateWalkerStmt->execute([$nextIndex, $now, $walkerId]);
            $db->commit();
            echo "Walker {$walkerId} advanced to index {$nextIndex} (speed x{$speedMultiplier}) for user {$userId} ({$x},{$y}).\n";
        } catch (Exception $e) {
            $db->rollBack();
            fwrite(STDERR, "Failed to advance walker {$walkerId}: " . $e->getMessage() . "\n");
        }
    }
}

// Main loop
do {
    processOnce();
    if ($daemon) {
        sleep($tickSeconds);
    }
} while ($daemon);

exit(0);
