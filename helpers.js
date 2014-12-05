
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

