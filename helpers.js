
// Function preparing input for path element
// accepts list of dictionaries containing x and y coords
// [{"x": 1, "y": 1}, {"x": 10, "y": 10}]
var lineFunction = d3.svg.line()
    .x(function (d) {
        return d.x;
    })
    .y(function (d) {
        return d.y;
    })
    .interpolate("linear");


function movePathTip(index, endpointIndex, originalCoords, dy) {
    var originalCoordsTrimmed = originalCoords.slice(1);
    var bits = originalCoordsTrimmed.split("L");

    if (index == 0) {
        var bit = bits[0].split(",");
        bit[1] = parseInt(bit[1]) + dy;
        bits[0] = bit.join(",");
    } else if (index == 3) {
        var bit = bits[bits.length-1].split(",");
        bit[1] = parseInt(bit[1]) + dy;
        bits[bits.length-1] = bit.join(",");
    } else {
        // first point
        var bitStart = bits[0].split(",");
        var bitStop = bits[bits.length-1].split(",");

        if (endpointIndex == index) {
            // path on the left - changing end point
            bitStop[1] = parseInt(bitStop[1]) + dy;
            bits[bits.length-1] = bitStop.join(",");
        } else {
            // path on the right - changing starting point
            bitStart[1] = parseInt(bitStart[1]) + dy;
            bits[0] = bitStart.join(",");
        }
    }
    return "M" + bits.join("L");
}

// Helper function for generating x,y pairs for paths.
// * Returns [{"x": 0, "y": 0}, {"x": 0, "y": 0}] if there's no path for certain group/index
// * Returns [{"x": n, "y": n}, {"x": n, "y": n}] if next element of the group is the nearest book
// * Returns [{"x": n, "y": n}, {..}, {..} {"x": n, "y": n}] (with two additional points in the middle)
//    if next element of the group is in the remote book thus the nearest book needs to be skipped
function getPathCoordinates(groupCoordinates, index, d, i) {
    // TODO: Multiple lines; group[0] currently fixed
    var nextCoordinates = getNextCoordinates(groupCoordinates, d.group, index);
    if (nextCoordinates == null) {
        return [{"x": -1, "y": -1}, {"x": -1, "y": -1}];
    }
    var x1 = (index + 1) * (barPaddingVertical + barWidth);
    var x2 = barPaddingVertical + ((nextCoordinates["x"]) * (barPaddingVertical + barWidth));
    var y1 = ((barHeight / 2) + (i * (barHeight + barPaddingHorizontal))) - (d.occurence * (barHeight + barPaddingHorizontal));
    var y2 = (barHeight / 2) + ((nextCoordinates["y"]) * (barHeight + barPaddingHorizontal));

    var pathCoordinates = [{"x": x1, "y": y1}, {"x": x2, "y": y2}];

    // bend the line by adding two additional points, if distance > 1
    // var distance = nextCoordinates["x"] - index;
    // if (distance > 1) {
    //     leftx = x1 + barPaddingVertical;
    //     lefty = y1 - (barHeight / 2) - (barPaddingHorizontal / 2);
    //     rightx = x2 - barPaddingVertical;
    //     righty = lefty;

    //     pathCoordinates = [
    //         pathCoordinates[0],
    //         {"x": leftx, "y": lefty},
    //         {"x": rightx, "y": righty},
    //         pathCoordinates[1]
    //     ]
    // }
    return pathCoordinates;
}

function getNextCoordinates(groupCoordinates, group, index) {
    var ret = null;
    if (index > 2) {
        return ret;
    }
    var nextCoordinates = groupCoordinates[group];
    for (var x=index+1; x<nextCoordinates.length; x++) {
        if (nextCoordinates[x] != null) {
            return {"x": x, "y": nextCoordinates[x]};
        }
    }
    return ret;
}

function truncate(string){
	var length = 30;
   if (string.length > length)
      return string.substring(0, length) + '...';
   else
      return string;
};

