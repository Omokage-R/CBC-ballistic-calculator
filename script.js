"use strict";

function yawCalc(dx, dz, cannonDirection, yawOffset) {

    let yaw;

    switch (cannonDirection) {
        case "north":
            yaw = (Math.atan2(-dx, -dz) * 180) / Math.PI;
            break;
        case "south":
            yaw = (Math.atan2(dx, dz) * 180) / Math.PI;
            break;
        case "east":
            yaw = (Math.atan2(-dz, dx) * 180) / Math.PI;
            break;
        case "west":
            yaw = (Math.atan2(dz, -dx) * 180) / Math.PI;
            break;
    }

    yaw = yaw - yawOffset;

    if (yaw > 180){
        yaw = yaw  - 360;
    }
    else if (yaw < -180) {
        yaw = yaw + 360;
    }

    let rotationDirection = yaw > -180 && yaw < 0 ? "Left" : yaw > 0 && yaw < 180 ? "Right" : "N/A";

    return { yaw: Math.abs(yaw).toFixed(2), rotationDirection};
}


function anglesFinder(V0, targetDistance, targetHeight, cannonLength, axisOffset, pitchRange) {

    let bestAngles = [];
    let toleranceRange = 2 + V0 / 100

    for (let [minAngle, maxAngle] of pitchRange) {
        let bestAngle = null;
        let minError = Infinity;
        let bestTimeInAir;

        for (let angleDeg = minAngle; angleDeg <= maxAngle; angleDeg += 0.01) { 
            
            let angleRad = (angleDeg * Math.PI) / 180;
            let Vx = (V0 / 20) * Math.cos(angleRad);
            let Vy = (V0 / 20) * Math.sin(angleRad);
            let heightOffset = cannonLength * Math.sin(angleRad)
            let horizontalDistance = targetDistance - (cannonLength * Math.cos(angleRad) + axisOffset);
            let timeInAir = Math.abs(Math.log(1 - horizontalDistance / (100 * Vx)) / Math.log(0.99));
            let verticalPosition = 100 * (Vy + 5) * (1 - (0.99 ** timeInAir)) - 5 * timeInAir
            
            
            if (Math.abs((targetHeight + heightOffset) - verticalPosition) < toleranceRange) { 
                let error = Math.abs(Math.abs(targetHeight - verticalPosition));
                if (error < minError) { 
                    minError = error;
                    bestAngle = angleDeg;
                    bestTimeInAir = timeInAir;
                    if (error < toleranceRange * 0.01) {
                        break;
                    }
                }
            }    
        }
        if (bestAngle !== null) bestAngles.push({ angle: bestAngle.toFixed(2), timeInAir: bestTimeInAir });
    }
    return bestAngles.length ? bestAngles : "Out of fire range";
}

function ballisticCalc(x0, y0, z0, x, y, z, cannonDirection, yawOffset, cannonLength, axisOffset, muzzleVelocity, pitchRange) {

    let dx = x - x0;
    let dz = z - z0;
    let targetDistance = Math.sqrt(dx ** 2 + dz ** 2);
    let targetHeight = y - y0;

    let angles = anglesFinder(muzzleVelocity, targetDistance, targetHeight, cannonLength, axisOffset, pitchRange);
    let { yaw, rotationDirection } = yawCalc(dx, dz, cannonDirection, yawOffset);
    let result = "";

    if (Array.isArray(angles)) {
        angles.forEach(({ angle, timeInAir }, index) => 
        {result += `Angle${index+1}: ${angle.toString().padStart(5," ")}°  Time in air: ${(timeInAir / 20).toFixed(2).toString().padStart(5," ")}s\n`;});
        result += `Yaw: ${yaw}°\nRotation Direction: ${rotationDirection}\n`;
    } else {
        result = angles;
    }
    return result;
}

function getInputNum(...ids){ //function for getting value from html
    let input = [];
    let id;
    for (id of ids){
        if (document.getElementById(id).value === ""){
            input.push(null);
        }
        else{
            input.push(Number(document.getElementById(id).value));
        }
    }
    return input;
}

function calculate() {
    let [x0, y0, z0, x, y, z, yawOffset, cannonLength, axisOffset] = 
      getInputNum("x0", "y0", "z0", "x", "y", "z", "yawOffset", "cannonLength", "axisOffset");
    let cannonDirection = document.getElementById("cannonDirection").value;

    let muzzleVelocity;
    switch (document.getElementById("muzzleVelocityType").value) {
        case "powderCharge":
            muzzleVelocity = getInputNum("muzzleVelocity") * 40;
            break;
        case "m/s":
            muzzleVelocity = getInputNum("muzzleVelocity");
            break;
    }

    let pitchRange;
    switch (document.getElementById("cannonType").value) {
        case "normal":
            pitchRange = [[-30,30],[30,60]];
            break;
        case "upsideDown":
            pitchRange = [[-90,0],[0,15]];
            break;
        case "noLimit":
            pitchRange = [[-90,30],[30,90]];
            break;
    }
  
    if ([x0, y0, z0, x, y, z, yawOffset, cannonLength, axisOffset, muzzleVelocity].some(value => value === null)){
        document.getElementById("output").innerText = "Need value input";
    }
    else if (cannonLength <= 1){
        document.getElementById("output").innerText = "Invalid cannon length";
    }
    else if (muzzleVelocity <= 1){
        document.getElementById("output").innerText = "Invalid muzzle velocity";
    }
    else if (yawOffset > 180 || yawOffset <-180){
        document.getElementById("output").innerText = "Invalid yaw offset";
    }
    else {
        let result = ballisticCalc(x0, y0, z0, x, y, z, cannonDirection, yawOffset, cannonLength, axisOffset, muzzleVelocity, pitchRange);
        document.getElementById("output").innerText = result;
    }
}