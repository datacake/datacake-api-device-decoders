// HELPER Convert a hex string to a byte array
function hexToBytes(hex) {
    for (var bytes = [], c = 0; c < hex.length; c += 2)
        bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
}

// Based on https://stackoverflow.com/a/37471538 by Ilya Bursov
function bytesToFloat(bytes) {
    // JavaScript bitwise operators yield a 32 bits integer, not a float.
    // Assume LSB (least significant byte first).
    var bits = bytes[3]<<24 | bytes[2]<<16 | bytes[1]<<8 | bytes[0];
    var sign = (bits>>>31 === 0) ? 1.0 : -1.0;
    var e = bits>>>23 & 0xff;
    var m = (e === 0) ? (bits & 0x7fffff)<<1 : (bits & 0x7fffff) | 0x800000;
    var f = sign * m * Math.pow(2, e - 150);
    return f;
}

function Decoder(topic, payload) {
    
    var bytes = hexToBytes(payload);
    
    if (bytes[0] == 0x7e) {
        
        var packetLength = bytes[3] >> 8 | bytes[2];
        var signal = bytes[9];
        var toggleOfDO = bytes[10];
        var digitalOutputStatus = bytes[11];
        
        var pt100ChannelA = bytesToFloat(bytes.slice(24, 28))
        var analogInput1 = bytesToFloat(bytes.slice(16,20))
        
        console.log(analogInput1);
        
        // Calibration Factor
        var callow = 1.031941;
        var calhigh = 1.023018;
        var caldelta = (callow - calhigh) / 16;
        var calfactor = (callow + (caldelta * (4 - analogInput1)));
        
        // Apply Calibration
        analogInput1 = analogInput1 * calfactor;
        
        console.log(analogInput1);
        
        return [
            {
                device: "84109e08-7e85-4f50-a0c6-2e7d0dc4f7f5", // Serial Number or Device ID
                field: "PAYLOAD",
                value: payload
            },
            {
                device: "84109e08-7e85-4f50-a0c6-2e7d0dc4f7f5", // Serial Number or Device ID
                field: "PT100_A",
                value: pt100ChannelA
            },
            {
                device: "84109e08-7e85-4f50-a0c6-2e7d0dc4f7f5", // Serial Number or Device ID
                field: "SIGNAL",
                value: signal
            },
            {
                device: "84109e08-7e85-4f50-a0c6-2e7d0dc4f7f5", // Serial Number or Device ID
                field: "ANALOG_INPUT_1",
                value: analogInput1
            },
        ];        
        
    } else {
        
        console.log("Error: Packet not starting with 0x7E")
    }
    
}

// 7E F4 25 00 0A 7A 80 57 62 11 03 01 D8 00 00 00 00 00 15 00 00 00 01 05(23) 00 00 00 009A99D941000000007E
// 7e f4 1d 00 0a 3d 04 79 63 0f 03 00 55 00 05 01 00 00 00 00 00 00 00 00 00 00 00 00 7e
// 7e f4 1d 00 0a f5 0f 79 63 10 03 00 55 00 05 01 00 00 00 00 00 00 00 00 9a 99 b9 41 7e
// 7e f4 1d 00 0a 2f 3a 79 63 10 03 00 55 00 05 01 33 33 cb 40 00 00 00 00 9a 99 b5 41 7e
