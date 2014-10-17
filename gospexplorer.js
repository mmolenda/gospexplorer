
// author: Marcin Molenda <spamm@molenda.eu>
// since: 09/16/2014


var barPaddingHorizontal = 10;
var barPaddingVertical = 90;
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

d3.json("/data2.json", function(dataset) {
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


    function moveBook(index, eventOffset, offset) {
        d3.select("g#grp-" + index).attr("transform", "translate(" + 0 + "," + (eventOffset + offset) + ")");

        // adding to associated paths' coordinates    
        var paths = d3.selectAll(".link-" + index)[0];
        for (var i=0; i<paths.length; i++) {
            var path = d3.select(paths[i]);
            path.attr("d", movePathTip(index, path.attr("endpointIndex"), path.attr("d"), eventOffset));
            path.attr("translate", parseInt(path.attr("translate")) + eventOffset);
            // console.log(path.attr("translate"), eventOffset, "---", offset, eventOffset);
        }
    }

    function resetPaths(index) {
        var paths = d3.selectAll(".link-" + index)[0];
        for (var i=0; i<paths.length; i++) {
            var path = d3.select(paths[i]);
            var translate = path.attr("translate");
            console.log(translate);
            path.attr("d", movePathTip(index, path.attr("endpointIndex"), path.attr("d"), -translate));
            path.attr("translate", 0);
        }
    }

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
        // var paths = d3.selectAll(".link-" + index)[0];
        // for (var i=0; i<paths.length; i++) {
        //     var path = d3.select(paths[i]);
        //     var originalCoords = path.attr("d");
        //     path.attr("d", movePathTip(index, path.attr("endpointIndex"), originalCoords, d3.event.dy));
        // }

        // Only allow vertical movement
        moveBook(index, d3.event.dy, translate[1]);
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
            .attr("id", "grp-" + index)
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
            .on("mouseover", boxMouseOver)
            .on("mouseout", boxMouseOut)
            .on("click", function(d, i) {
                // adjust other books to clicked one by group
                for (var book=0; book<dataset.length; book++) {
                    d3.select("g#grp-" + book).attr("transform", "translate(0,0)");
                    // resetPaths(book);
                    var index = groupCoordinates[d.group][book];
                    // do not touch current book and books that don't contain the group
                    if (d.book == book || index == null) { continue; }
                    var diff = (i - index) * (barHeight + barPaddingHorizontal);
                    d3.select("g#grp-" + book).attr("transform", "translate(0," + diff + ")");
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
                return truncate(d.ref + " " + d.title);
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
            .attr("fill", colorMediumBrown)
            .on("mouseover", boxMouseOver)
            .on("mouseout", boxMouseOut); 
    }

    function boxMouseOver(d, i) {
        for(i=0; i<d.group.length; i++) {
            d3.selectAll(".grp-" + d.group[i]).style("stroke", colorDarkBrown);
            d3.selectAll(".grp-" + d.group[i]).style("stroke-width", 2);
        }
    }

    function boxMouseOut(d, i) {
        var classes = [];
        for(i=0; i<d.group.length; i++) {
            d3.selectAll(".grp-" + d.group[i]).style("stroke", colorLightBrown);
            d3.selectAll(".grp-" + d.group[i]).style("stroke-width", 1);
        }
    }

    // Drawing the lines

    // Other than in case of boxes and texts, dataset for lines must be slightly modified
    // because list of groups is in this case used not as source for single object's (boxe's, text's) properties
    // but to generate separate objects. Thus we translate this:
    //     {"title": "Wnieb", "group": [9]},
    //     {"title": "Post", "group": [4]},
    //     {"title": "W1", "group": [10, 11]}
    // into
    //     {"title": "Wnieb", "group": 9, "occurence": 0},
    //     {"title": "Post", "group": 4, "occurence": 0},
    //     {"title": "W1", "group": 10, "occurence": 0}
    //     {"title": "W1", "group": 11, "occurence": 1}
    //
    // So for each group a separate object is created. Occurence property indicates
    // the consecutive number of object appearing in the same group. It is used to 
    // rewind the index so multiple lines can originate from the same point.
    // index<dataset.length-1 - omitting last column as no line originates from it
    datasetUnfolded = []
    for (index=0; index<dataset.length-1; index++) {
        var book = dataset[index];
        var bookUnfolded = [];
        for (i=0; i<book.length; i++) {
            var div = book[i];
            for (j=0; j<div.group.length; j++) {
                bookUnfolded.push({"title": div.title,
                                   "group": div.group[j],
                                   "occurence": j,
                                   "ref": div.ref,
                                   "book": div.book
                                  });
            }
        }
        datasetUnfolded.push(bookUnfolded);
    }

    // Drawing actual lines using unfolded dataset
    for (var index=0; index<datasetUnfolded.length; index++) {
        // as number of unfold items is higher than number of boxes, 
        // counter has to be rewind for extra occurrences
        var dataIndex = -1;
        pathGroups[index]
            .selectAll("path.i" + index)
            .data(datasetUnfolded[index])
            .enter()
            .append("path")
            .attr("translate", 0)
            .attr("d", function (d, i) {
                if (d.occurence < 1) {dataIndex++;}
                var lineCoordinates = lineFunction(getPathCoordinates(groupCoordinates, index, d, dataIndex))
                return lineCoordinates;
            })
            .attr("class", function (d) {
                var classes = [];
                // // Related boxes and paths belong to the same group;
                // // for highlighting purposes
                classes.push("grp-" + d.group);
                var nc = getNextCoordinates(groupCoordinates, d.group, index);
                // link-* for keeping track of paths ending on
                // and starting on a certain boxes
                classes.push("link-" + index);
                if (nc) classes.push("link-" + nc["x"]);
                return classes.join(" ");
            })
            .attr("endpointIndex", function(d) {
                // x index of a box to which the path is pointing to
                // TODO: Multiple lines; group[0] currently fixed
                nc = getNextCoordinates(groupCoordinates, d.group, index);
                return (nc) ? nc["x"] : index;
            })
            .style("stroke", colorLightBrown)
            .attr("fill", "none");
    }


    // var paths = d3.selectAll("path.grp-2")[0];
    // var path = d3.select(paths[0]);
    // // path.attr("dupa", 1);
    // path.attr("transform", "skewY(2)");

}