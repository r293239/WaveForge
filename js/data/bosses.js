// ============================================
// WAVEFORGE - Boss Weapon Definitions
// ============================================

const BOSS_WEAPONS = {
    DAGGER: {
        name: 'Shadow Dagger',
        type: 'melee', meleeType: 'pierce',
        baseDamage: 25, attackSpeed: 2.0, range: 150,
        swingColor: '#8B0000', swingAngle: 45,
        animation: 'daggerStab',
        trailColor: '#FF0000', bladeColor: '#8B0000',
        hiltColor: '#4A0404', sparkleColor: '#FF4444',
        pierceCount: 3,
        description: 'Quick stabbing attacks'
    },
    WAR_HAMMER: {
        name: 'Crusher',
        type: 'melee', meleeType: 'aoe',
        baseDamage: 40, attackSpeed: 0.8, range: 180,
        swingColor: '#8B4513', swingAngle: 360,
        animation: 'hammerSmash',
        trailColor: '#FF4500', headColor: '#696969',
        handleColor: '#8B4513',
        shockwaveColor: '#FF4500', shockwaveIntensity: 2.5,
        description: 'Massive AOE slam'
    },
    SCYTHE: {
        name: 'Soul Reaper',
        type: 'melee', meleeType: 'aoe',
        baseDamage: 35, attackSpeed: 1.2, range: 250,
        swingColor: '#4B0082', swingAngle: 270,
        animation: 'scytheSwing',
        trailColor: '#9400D3', bladeColor: '#4B0082',
        handleColor: '#2F4F4F', edgeColor: '#FF00FF',
        sparkleColor: '#FF69B4',
        dashRange: 500, dashSpeed: 15, lifeSteal: 0.15,
        description: 'Dashing scythe slash with lifesteal'
    },
    VOID_BLADE: {
        name: 'Void Blade',
        type: 'melee', meleeType: 'aoe',
        baseDamage: 50, attackSpeed: 1.5, range: 300,
        swingColor: '#1a1a2e', swingAngle: 360,
        animation: 'voidSlash',
        trailColor: '#4a4a9a', bladeColor: '#0f0f1f',
        edgeColor: '#6a0dad', sparkleColor: '#9b59b6',
        teleportRange: 400, voidZoneDamage: 20, voidZoneDuration: 4000,
        description: 'Teleporting slash with void zones'
    }
};
