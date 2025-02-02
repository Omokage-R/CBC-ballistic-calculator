function yawCalc(dx, dz, cannonDirection) {
    let yaw;

    switch (cannonDirection) {
        case "n":
            yaw = (Math.atan2(dx, -dz) * 180) / Math.PI;
            break;
        case "s":
            yaw = (Math.atan2(-dx, dz) * 180) / Math.PI;
            break;
        case "e":
            yaw = (Math.atan2(dz, dx) * 180) / Math.PI;
            break;
        case "w":
            yaw = (Math.atan2(-dz, -dx) * 180) / Math.PI;
            break;
        default:
            console.error("Invalid direction");
            return { yaw: "error", rotationDirection: "N/A" };
    }
    let rotationDirection = yaw > -180 && yaw < 0 ? "right" : yaw > 0 && yaw < 180 ? "left" : "N/A";

    return { yaw: Math.abs(yaw).toFixed(2), rotationDirection};
}

function anglesFinder(V0, targetDistance, targetHeight, cannonLength) {
    let bestAngles = [];

    for (let [minAngle, maxAngle] of [[-30, 31], [31, 61]]) {
        let bestAngle = null;
        let minError = Infinity;
        let timeInAir;

        for (let angleDeg = minAngle; angleDeg < maxAngle; angleDeg += 0.01) { //0.01°ずつ計算
            
            let angleRad = (angleDeg * Math.PI) / 180;
            let Vx = (V0 / 20) * Math.cos(angleRad);
            let Vy = (V0 / 20) * Math.sin(angleRad);
            let x = cannonLength * Math.cos(angleRad);
            let y = cannonLength * Math.sin(angleRad);
            let tick = 0;

            while (x < targetDistance + 10 && y > targetHeight - 50) {
                tick++; //1tickずつ時間を進める
                x += Vx;
                y += Vy;
                Vx *= 0.99; //水平の空気抵抗
                Vy = Vy * 0.99 - 0.05; //重力と空気抵抗

                if (Math.abs(x - targetDistance) < (2 + V0/100) && Math.abs(y - targetHeight) < (2 + V0/100)) { //範囲に入ったら記録を試行
                    let error = Math.abs(x - targetDistance) + Math.abs(y - targetHeight); //誤差はx,yのズレの合計
                    if (error < minError) { //最小誤差なら記録
                        minError = error;
                        bestAngle = angleDeg;
                        timeInAir = tick //弾着までの時間を記録
                    }
                    break;
                }
                if (tick > 10000) return "Too many calculations"; //無限ループ防止
            }
        }
        if (bestAngle !== null) bestAngles.push({ angle: bestAngle.toFixed(2), tick: timeInAir });
    }
    return bestAngles.length ? bestAngles : "Out of fire range";
}

function ballisticCalc(x0, y0, z0, x, y, z, cannonDirection, cannonLength, chargePower) {

    let dx = x - x0;
    let dz = z - z0;
    let targetDistance = Math.sqrt(dx ** 2 + dz ** 2);
    let targetHeight = y - y0;

    let angles = anglesFinder(chargePower, targetDistance, targetHeight, cannonLength);
    let { yaw, rotationDirection } = yawCalc(dx, dz, cannonDirection);
    let result = "";

    if (Array.isArray(angles)) {
        angles.forEach(({ angle, tick }, index) => {
            result += `angle${index+1}: ${angle}° ${tick / 20}s\n`;
        });
        result += `Yaw: ${yaw}° ${rotationDirection}\n`;
    } else {
        result = angles;
    }
    return result;
}


function calculate() {
    let x0 = Number(document.getElementById("x0").value);
    let y0 = Number(document.getElementById("y0").value);
    let z0 = Number(document.getElementById("z0").value);
    let x = Number(document.getElementById("x").value);
    let y = Number(document.getElementById("y").value);
    let z = Number(document.getElementById("z").value);
    let cannonDirection = document.getElementById("cannonDirection").value;
    let cannonLength = Number(document.getElementById("cannonLength").value);
    let chargePower = Number(document.getElementById("chargePower").value);
    console.log({x0,x,cannonLength,chargePower});
    let result = ballisticCalc(x0, y0, z0, x, y, z, cannonDirection, cannonLength, chargePower);
    document.getElementById("output").innerText = result;
    
}
