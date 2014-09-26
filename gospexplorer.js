
// author: Marcin Molenda <spamm@molenda.eu>
// since: 09/16/2014


var barPaddingHorizontal = 10;
var barPaddingVertical = 60;
var barWidth = 200;
var barHeight = 20;
var labelOffsetVertical = 10;
var labelOffsetHorizontal = 10;
var colorLightBrown = "#FFE5C9";
var colorMediumBrown = "rgb(201, 115, 68)";
var colorDarkBrown = "rgb(94, 33, 0)";
var colorWhite = "#FFF";

//Width and height
var w = 1200;
var h = (barHeight + barPaddingHorizontal) * 200;

var frequencyColors = {
    1: "#FFF",
    2: "#F5ECCE",
    3: "#F3E2A9",
    4: "#F5DA81",
}

d3.json("/data.json", function(dataset) {
    main(dataset);
});

function main(dataset) {
    // key - group ID
    // value - list of y indexes for each book 
    // 1: [0, null, null, null]
    // 2: [1, 0, 2, 1]
    var groupCoordinates = {};

    // Number of occcurrences for each group
    // for boxes' coloring
    // 1: 1
    // 2: 4
    var groupCount = {};


    // Filling in groupCoordinates and groupCount dictionaries
    for (var i=0; i<dataset.length; i++) {
        var book = dataset[i];
        for (var j=0; j<book.length; j++) {
            var div = book[j];
            for (var k=0; k<div.group.length; k++) {
                var group = div.group[k];
                if (groupCount[group] === undefined) {
                    groupCount[group] = 0
                }
                if (groupCoordinates[group] === undefined) {
                    groupCoordinates[group] = [null, null, null, null]
                }
                groupCount[group]++;
                groupCoordinates[group][i] = j;
            }
        };
    };
    // console.log(groupCount);
    // console.log(groupCoordinates);

    //Create SVG element
    var svg = d3.select("body")
        .append("svg")
        .attr("width", w)
        .attr("height", h);

    var drag = d3.behavior.drag().origin(function () {
        var g = this; //.parentNode;
        return {
            x: d3.transform(g.getAttribute("transform")).translate[0],
            y: d3.transform(g.getAttribute("transform")).translate[1]
        };
    }).on("drag", function (d, i) {
        var g = this; //.parentNode;
        translate = d3.transform(g.getAttribute("transform")).translate;
        x = d3.event.dx + translate[0],
        y = d3.event.dy + translate[1];

        // each group holds link ID (link-[0-3]) under "link" attr for matching paths
        var linkClass = d3.select(g).attr("link");
        var index = parseInt(linkClass.split("-")[1]);

        // adding to associated paths' coordinates    
        var paths = d3.selectAll("." + linkClass)[0];
        for (var i=0; i<paths.length; i++) {
            var path = d3.select(paths[i]);
            var originalCoords = path.attr("d");
            path.attr("d", movePathTip(index, path.attr("endpointIndex"), originalCoords, d3.event.dy));
        }

        // Only allow vertical movement
        d3.select(g).attr("transform", "translate(" + 0 + "," + y + ")");
        d3.event.sourceEvent.stopPropagation();
    });

    // each book consisting of boxes and texts is in separate group
    var groups = [];

    // paths are contained in different groups as:
    // 1. they shouldn't be moved along with other elements (just firs/last element of each path)
    // 2. groups for paths should be appended first to make boxes/texts overlay the paths
    var pathGroups = [];
    for (var index=0; index<dataset.length; index++) {
        pathGroups.push(svg.append("g"));

        groups.push(
            svg.append("g")
            .attr("link", "link-" + index)
            .call(drag)
            .attr("transform", "translate(0, 0)"));
    }

    // Drawing the boxes
    for (var index=0; index<dataset.length; index++) {
        groups[index]
            .selectAll("rect.i" + index)
            .data(dataset[index])
            .enter()
            .append("rect")
            .attr("x", function (d, i) {
                return barPaddingVertical + (index * (barWidth + barPaddingVertical));
            })
            .attr("y", function (d, i) {
                return i * (barHeight + barPaddingHorizontal);
            })
            .attr("width", barWidth)
            .attr("height", barHeight)
            .attr("group", function(d, i) {return d.group;})
            .attr("class", function (d, i) {
                var classes = [];
                // // Related boxes and paths belong to the same group;
                // // for highlighting purposes
                for (var i=0; i<d.group.length; i++) {
                    classes.push("grp-" + d.group[i]);
                }
                return classes.join(" ");
            })
            .attr("fill", function (d, i) {
                // for more than one group coloring according to one with highest number of occurencies
                var groupCounts = [];
                for(i=0; i<d.group.length; i++) {
                    groupCounts.push(groupCount[d.group[i]]);
                }
                return (d.group) ? frequencyColors[Math.max.apply(Math, groupCounts)] : colorWhite;
            })
            .style("stroke", colorLightBrown)
            .on("mouseover", function (d, i) {
                for(i=0; i<d.group.length; i++) {
                    d3.selectAll(".grp-" + d.group[i]).style("stroke", colorDarkBrown);
                    d3.selectAll(".grp-" + d.group[i]).style("stroke-width", 2);
                }
            })
            .on("mouseout", function (d, i) {
                var classes = [];
                for(i=0; i<d.group.length; i++) {
                    d3.selectAll(".grp-" + d.group[i]).style("stroke", colorLightBrown);
                    d3.selectAll(".grp-" + d.group[i]).style("stroke-width", 1);
                }
            });
    }

    // Adding text to the boxes
    for (var index=0; index<dataset.length; index++) {
        groups[index]
            .selectAll("text.i" + index)
            .data(dataset[index])
            .enter()
            .append("text")
            .text(function (d) {
                return truncate(d.title);
            })
            .attr("text-anchor", "left")
            .attr("x", function (d, i) {
                return barPaddingVertical + (index * (barWidth + barPaddingVertical)) + 5;
            })
            .attr("y", function (d, i) {
                return i * (barHeight + barPaddingHorizontal) + (barHeight * 0.65);
            })
            .attr("font-family", "sans-serif")
            .attr("font-size", "11px")
            .attr("fill", colorMediumBrown);
    }

    // Drawing the lines
    for (var index=0; index<dataset.length-1; index++) {
        pathGroups[index]
            .selectAll("path.i" + index)
            .data(dataset[index])
            .enter()
            .append("path")
            .attr("d", function (d, i) {
                // TODO: Multiple lines
                return lineFunction(getPathCoordinates(groupCoordinates, index, d, i))
            })
            .attr("class", function (d, i) {
                var classes = [];
                // // Related boxes and paths belong to the same group;
                // // for highlighting purposes
                for (var i=0; i<d.group.length; i++) {
                    classes.push("grp-" + d.group[i]);
                    var nc = getNextCoordinates(groupCoordinates, d.group[i], index);
                    // link-* for keeping track of paths ending on
                    // and starting on a certain boxes
                    classes.push("link-" + index);
                    if (nc) classes.push("link-" + nc["x"]);
                }
                return classes.join(" ");
            })
            .attr("endpointIndex", function(d, i) {
                // x index of a box to which the path is pointing to
                // TODO: Multiple lines; group[0] currently fixed
                nc = getNextCoordinates(groupCoordinates, d.group[0], index);
                return (nc) ? nc["x"] : index;
            })
            .style("stroke", colorLightBrown)
            .attr("fill", "none");
    }
}

