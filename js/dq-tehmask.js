var buyoldCsvUrl = "csv/buy-old.csv",
	buyCsvUrl = 'csv/buy.csv',
	rentCsvUrl = 'csv/rent.csv';

var ostanTopoUrl = "topo/tehran-district-topo.json.txt"
var topoFeatureObject = "tehran-district-geo";

var locIdFieldInCsv = "district";
var timeFieldInCsv = "yearseason";
var locNameFieldInCsv = "region";

var attributeArray =[ ],
	_csvData = [];
	_provData = [];
	_oosData = [];

// current topology
var topoData = [];

var curOstanStyleSaved = "";

// current csv
var	csvData = [];

// map data
var mapData = [];

// WHOLE data (topo + csv) for (ostan + shahrestan)
var _buyoldCsvData = [],
	_buyCsvData = [],
	_rentCsvData = [],
	_ostanTopoData = [];
		
// selected (current) Ostan ID
var curLocID = "23"

// current year
var curTime = 13921;
		
var svg; // global variable for map svg
		
var slider = document.getElementsByClassName('timeSlider');
var tooltip;
var tooltip2;

// load external files (csv + topo)
queue()
	.defer(d3.csv, buyoldCsvUrl)
	.defer(d3.csv, buyCsvUrl)
	.defer(d3.csv, rentCsvUrl)
	.defer(d3.json, ostanTopoUrl)
	.await(DataReady);
	
function createElements() 
{
	createSlider('timeSlider');
	tooltip = d3.select("#main").append("div")
		.attr("class", "hidden tooltip");
	tooltip2 = d3.select("#lineChart").append("div")
		.attr("class", "hidden tooltip");
}
	
function DataReady(error, buyoldCsvData, buyCsvData, rentCsvData, ostanTopoData) {	
	if (error) throw error;

	// setting global variables
	_buyoldCsvData = flattenData(buyoldCsvData, locIdFieldInCsv, timeFieldInCsv);
	_buyCsvData = flattenData(buyCsvData, locIdFieldInCsv, timeFieldInCsv);
	_rentCsvData = flattenData(rentCsvData, locIdFieldInCsv, timeFieldInCsv);

	_ostanTopoData = ostanTopoData;
	window.onload = function() { createElements() ; subsetChanged(true); };
}

// This function is called once, in order to read all csv & topo files.
function filterData()
{
	var tempData = [];

	curValue = getRadioVal('valueSelector');
	csvData = (curValue == "buyold") ? _buyoldCsvData : (curValue == "buy" ? _buyCsvData : _rentCsvData);
	topoData = _ostanTopoData;
	locNameFieldInCsv = 'region';//'Code';
}

// This function is used to draw the map.
//
// Input: topoData     - the topoJson object used for drawing
//
function drawMap(topoData)
{
	var width = 1000, height = 600;
	var projection = d3.geo.mercator()
		.center([51.29, 35.7]) // 52, 32
		.scale(85000) // 2000
		.translate([330, height / 2])
		.precision(0);
	
	/*d3.selectAll("body svg.hidden")
		.remove();*/
				
	var path = d3.geo.path()
		.projection(projection);
	
	var pathSimplified = function(d) 
	{
		return path(d).replace(/(\.\d{1})\d+/g, '$1');
	}
	
	var map = d3.map();
	
	var quantize = d3.scale.quantize()
		.domain([100, 4000])
		.range(d3.range(11).map(function (i) { return "q" + i + "-11"}));		
								
	d3.selectAll("#main svg")
		.attr('class', 'hidden');
		
	ssvg = d3.select("#main loctype");
			
	// do not redraw if already drawn. just hide/show.
	if (!ssvg.empty())
	{
		ssvg.attr("class", "nothidden");
		return;
	}
			
	svg = d3.select("#main").append('svg')
		.attr('width', width)
		.attr('height', height)
		.attr('id', 'loctype')
		.attr('class', 'nothidden');
		
		//
	var topo = topojson.feature(topoData, topoData.objects[topoFeatureObject]);
					
	svg.append("g")
		.attr("class", "provinces")
		.selectAll('path')
			.data(topo.features)
		.enter().append('path')
		.attr('d', pathSimplified)
		.attr('class', 'province')
		.attr('locid', function(d) { return d.id; })
		.attr('toponame', function(d) { return d.properties.name; })
		.attr("pername", function(d) {
			return d.properties.name; })					
		.on("mousemove", function (d) {
			var mouse = d3.mouse(svg.node()).map(function (d) {
				return parseInt(d);
			});
			var selectedValue = getRadioVal("valueSelector");
			var scale = selectedValue.startsWith("buy") ? "میلیون ریال" : "هزار ریال";

			tooltip
				.classed('hidden', false)
				.style('left', mouse[0]+800)
				.style('top', mouse[1]+100)
				.html(this.getAttribute('toponame') + "<br>" + "متوسط قیمت " + numberWithCommas(Math.trunc(this.getAttribute('pop') )) + " " + scale);
			})
		.on("mouseout", function() {
			tooltip.classed('hidden', true);
		})
		.on("click", function(d) { 
			selectLocation(d.id);
		});		
	
	/*svg.selectAll('g.provinces').append("path")
		.attr("d", "M250,0L225,100L125,200Z")
		.style("fill", "blue")
		.classed('selected', true);
	*/
	timeChange(curTime);
	//window.onload = function() { timeChange(curTime); };
}

function activateCurOstan(locID) {
	oldOstans = d3.select(".nothidden path.selected");
	if (!oldOstans.empty())
	{
		oldOstans
			.classed('selected', false)
			//.style('stroke', null)
			//.style('stroke-width', null);
	}
	curOstan = d3.select(".nothidden [locid='"+locID+"']");
	curOstanStyle = curOstan.attr('style');
	curOstan
		.classed('selected', true);
		/*.attr('style', curOstanStyle.replace('fill', 'fill') + ';background:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAIUlEQVQIW2NkYGD4D8SMQAwD/2EcmASYRlEB04FTJYaZAMxBCQQo0O1/AAAAAElFTkSuQmCC) repeat;')
		*/
		//.attr('style', curOstanStyle + ';stroke: green; stroke-width: 3px');
		//.style('stroke', 'green')
		//.style('stroke-width', '3px');
}

function getSeasonName(i)
{
	var seasons = ['بهار', 'تابستان', 'پاییز', 'زمستان'];
	return seasons[i-1];
}

function formatTime(d)
{
	return Math.trunc(d/10).toString() + '-' + getSeasonName(d % 10);
}

function flattenData(aCsvData, idField, timeField)
{
	flattened = [];
	aCsvData.forEach(function (row) {
		rowFields = d3.entries(row);
		idFieldValue = rowFields.find(function(test) { return test.key == idField; } ).value;
		rowFields.forEach(function(col) {
			if (col.key != idField)
			{
				o = {};
				o[idField] = idFieldValue;
				o[timeField] = col.key;
				o["V"] = col.value / 1000;
				flattened.push(o);
			}
		});
	});
	return flattened;
}
		
function drawLineCharts()
{
	/* 
	  <div id="lineChart">
		<svg>
			<g transform margins>
				<g x axis>
				<g y axis>
				<g loc 00>
				<g loc 01>
				<g loc 05>
				...
			</g>
		</svg>
	</div>
	*/
	var margin = { top: 10, right: 20, bottom: 40, left: 20 };
	var width = 600 - margin.right - margin.left, 
		height = 600 - margin.top - margin.bottom;
				
	var x = d3.scale.ordinal()
		.rangeRoundBands([0, width-40]);

	var y = d3.scale.linear()
		.range([height - 40, 0]);

	var xAxis = d3.svg.axis()
		.scale(x)
		.orient("bottom")
		.tickFormat(formatTime)
		.tickPadding(5);

	var yAxis = d3.svg.axis()
		.scale(y)
		.orient("left");

	var line = d3.svg.line()
		.defined(function(d) { return +d["V"]; })
		.x(function(d) { return x(+d[timeFieldInCsv]) + x.rangeBand() / 2 })
		.y(function(d) { return y(+d["V"]) });
	
	color = d3.scale.ordinal()
		.domain(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', 
			'22'])//, '23', '24', '25', '26', '27', '28', '29', '30', '99'])
		.range(["red", "maroon", "yellow", "olive", "lime", 'green', 'aqua', 'teal', 'blue', 'navy', 'fuchsia', 'purple', 'salmon', 'crimson', 'khaki', 'forestgreen', 'darkgreen', 'pink', 'deeppink', 'silver', 'dimgray', 'gold', 'plum']);//, 'palegreen', 'skyblue', 'rosybrown', 'chocolate', 'azure', 'linen', 'deepskyblue', 'peachpuff', 'black'])
	aggregateField = getRadioVal('valueSelector');
	aggregateField = "V";
	
	selectedLocs = ['0'];
	d3.selectAll("path.selected")
		.each(function () {
			selectedLocs.push(this.getAttribute('locid'));
		});
	selectedLocs.sort(function(a, b) { return +a - b;});
	lineData = csvData.filter(function (d) { return selectedLocs.indexOf(d[locIdFieldInCsv]) >= 0; })
	
	x.domain(lineData.map(function(d) { return +d[timeFieldInCsv]; } )); //[13941, 13942, 13943, 13944]); //[1385, 1395]);
	valueDomain = lineData.slice(0);
	y.domain(d3.extent(valueDomain, function(d) { return +d["V"]; }));
	div = d3.selectAll("#lineChart");
	div
		.attr('width', width + margin.left + margin.right)
		.attr('height', height + margin.top + margin.bottom);
						
	svg = div.select('svg');
	
	if (svg.empty()) {
		svg = div.append('svg')
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom);
	}
		
	chart = svg.select('g');
	
	if (chart.empty()) {
		chart = svg.append("g")
			.attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');
	}
	
	// draw x axis
	var saxis = chart.selectAll('g.x.axis').data([1]);
	saxis.enter().append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + (height-20).toString()+ ")")
	  .append('text')
	saxis
		.call(xAxis);
		
	saxis.selectAll('g.x.axis .tick text')
		.attr('transform', 'translate(-10, 0) rotate(-90)')
		.style('text-anchor', 'end')

	// draw y axis
	var r = getRadioVal('valueSelector');
	persianField = r == "buy" ? "قیمت خرید هر مترمربع - میلیون ریال" : 
		( r == "rent" ? "اجاره هر مترمربع - هزار ریال" : "قیمت خرید هر مترمربع - میلیون ریال");
	saxis = chart.selectAll('g.y.axis').data([1]);
	saxis.enter().append("g")
		.attr("class", "y axis")
		.attr("transform", 'translate(15, 0)')
	.append("text")
		.attr('class', 'axistitle')
		.attr("transform", "rotate(-90)")
		.attr("y", 6)
		.attr("dy", "1em")
		.style("text-anchor", "end");
	
	saxis.selectAll('.axistitle')
		.text(persianField);
		
	saxis.transition()
		.duration(750)
		.call(yAxis);
	
	
	// each selected ostan has a "g" element, containing a "path"
	ostan = chart.selectAll('.ostan')
		.data(selectedLocs, function(d, i) { return +d; });
	
	ostan.exit().remove();
	
	newostans = ostan.enter(); 
	newostans.append('g')
		.attr('class', 'ostan')
		.append("path")
			.attr("class", "line")
			.attr('locid', this.__data__)
			.style('stroke', color)
			.on('click', function(d) { 
				locid = this.__data__;
				selectLocation(locid);
			})
/*				.attr("d", function(x) {
				data = lineData.filter(function(p) { return p[locIdFieldInCsv] == x; })
				data.sort(function (a, b) { return a[timeFieldInCsv] - b[timeFieldInCsv]; });
				return line(data); } );			
*/
	ostan.transition()
		.duration(750)
		.selectAll('.line')
			//.style('stroke', color)	
			.attr("d", function(x) {
				data = lineData.filter(function(p) { return p[locIdFieldInCsv] == x; });
				return line(data); } );

	// draw legend
	l = chart.selectAll('g.legend').data([1]).enter().append('g')
		.attr('class', 'legend')
		.attr('transform', 'translate(' + (width-50).toString() +  ', 0)');
	
	legend = chart.select('g.legend').selectAll('circle.legenditem')
		.data(selectedLocs, function(d, i) { return +d; });
	legend.exit().remove();
	legend.enter().append("circle")
		.attr('class', 'legenditem');
	legend	
		.style('fill', color)
		.style('display', 'none');
	legend.transition()
		.duration(750)
		.attr('cx', 0)
		.attr('cy', function (d, i) {
			data = lineData.filter(function(f) { return f[locIdFieldInCsv] == d;});
			data.sort(function(a, b) { return a[timeFieldInCsv] - b[timeFieldInCsv];});
			return +y(data[data.length-1][aggregateField]);})
		.attr('r', 3)
	
	// draw legend texts
	legendtext = chart.select('g.legend').selectAll('text.legenditem')
		.data(selectedLocs, function (d, i) { return +d; });
	legendtext.exit().remove();
	legendtext.enter().append('text')
		.attr('class', 'legenditem')
	legendtext
		.style('fill', color);
	legendtext.transition()
		.duration(750)
		.attr('x', 10)
		.attr('y', function(d, i) { 
//					return i*15; })
			data = lineData.filter(function(f) { return f[locIdFieldInCsv] == d;});
			data.sort(function(a, b) { return a[timeFieldInCsv] - b[timeFieldInCsv];});
			return +y(data[data.length-1][aggregateField]);})
		.text(function(d) { 
			row = lineData.find(function(x) { return x[locIdFieldInCsv] == d; });
		return formatDistrictName(row[locIdFieldInCsv]) });
	
	// draw opaque bar representing currently selected time 
	chart.selectAll('rect.timebar').data([1]).enter().append('rect')
		.attr('class', 'timebar');
	
	/*var g = 0;
	var drag = d3.behavior.drag()
		.on('dragstart', function(d, i) {
			g = +d3.select(this).attr('x');
		})
		.on('drag', function(d , i) {
			g += d3.event.dx;
			d3.select(this)
				.attr("transform", function(d,i){
					return "translate(" + g + ",0)"
				})
				.attr('curx', g);
		.on('dragend', function(d, i) {
			curx = d3.select(this).attr('curx');
			
			})
		});*/

	timebar = chart.selectAll('rect.timebar');
	timebar
		.attr('width', x.rangeBand() / 2)
		.attr('y', 0)
		.attr('height', height)
		//.call(drag);
	timebar.transition()
		.duration(750)
		.attr('x', x(curTime) + x.rangeBand() / 4)

	//draw data points (circles)
	allCircles = chart.selectAll('g.circles').data([1]).enter().append('g')
		.attr('class', 'circles');
	circ = chart.select('g.circles').selectAll('circle.dataPoint')
		.data(lineData, function(d) { return "{locid:" + d[locIdFieldInCsv] + ",time:" + d[timeFieldInCsv] + "}"; });
	circ.exit().remove();
	circ.enter().append('circle')
		.attr('class', 'dataPoint')
		.attr('r', 4)
		.style('z-index', 9998)
		.style('fill', 'white')
		.style('stroke-width', '2px')
		.style('stroke', function(d) { return color(d[locIdFieldInCsv]); })
		.on("mousemove", function (d) {
			var mouse = d3.mouse(chart.node()).map(function (d) {
				return parseInt(d);
			});
			var aggregateField = getRadioVal("valueSelector");
			var scale = aggregateField.startsWith("buy") ? "میلیون ریال" : "هزار ریال";
			tooltip2
				.classed('hidden', false)
				.style('left', mouse[0]+0)
				.style('top', mouse[1]+50)
				.html(formatDistrictName(this.__data__[locIdFieldInCsv]) + "<br>" + formatTime(d[timeFieldInCsv]) + "<br>" + numberWithCommas(Math.trunc(+d["V"])) + " " + scale);
		})
		.on("mouseout", function() {
			tooltip2.classed('hidden', true);
		});
	
	//
	circ.transition()
		.duration(750)
		.attr('cx', function(d) { return +x(d[timeFieldInCsv]) + x.rangeBand() / 2; })
		.attr('cy', function(d) { 
			return +y(d[aggregateField]); });
		//.attr('r', 6);//function(d) { return (d[timeFieldInCsv] == curTime) ? 6 : 3; })
	
	// draw bigger circles representing current time
	currentTimeData = lineData.filter(function (f) { return f[timeFieldInCsv] == curTime; });
	circles = chart.selectAll('g.circles').data([1]).enter().append('g')
		.attr('class', 'circles');
	circ = chart.select('g.circles').selectAll('circle.curTime')
		.data(currentTimeData, function(d, i) { return d[locIdFieldInCsv];}) //return "{locid:" + d[locIdFieldInCsv] + ",time:" + d[timeFieldInCsv] + "}";});
	circ.exit().remove();
	circ.enter().append('circle')
		.attr('class', 'curTime')
		/*.classed('dataPoint', true)
		.classed('curTime', function(d) { return d[timeFieldInCsv] == curTime; } )*/
		.attr('r', 4)
		.style('z-index', 9999)
		.style('fill', function(d) { return color(d[locIdFieldInCsv]); })
		.on("mousemove", function (d) {
			var mouse = d3.mouse(chart.node()).map(function (d) {
				return parseInt(d);
			});
			var aggregateField = getRadioVal("valueSelector");
			var scale = aggregateField.startsWith("buy") ? "میلیون ریال" : "هزار ریال";
			tooltip2
				.classed('hidden', false)
				.style('left', mouse[0]+0)
				.style('top', mouse[1]+50)
				.html(formatDistrictName(this.__data__[locIdFieldInCsv]) + "<br>" + formatTime(d[timeFieldInCsv]) + "<br>" + numberWithCommas(Math.trunc(+d["V"])) + " " + scale);
		})
		.on("mouseout", function() {
			tooltip2.classed('hidden', true);
		})
	
	circ.transition()
		.duration(750)
		.attr('cx', function(d) { return +x(d[timeFieldInCsv]) + x.rangeBand() / 2; })
		.attr('cy', function(d) { 
			return +y(d[aggregateField]); })
		/*		.attrTween("cx", function(d, i, a) { 
		var l = this.getTotalLength();
		return function interpol(t) {
			 var p = this.getPointAtLength(t*l);
			 return p.x;
		}*/

		//.attr('r', 6);//function(d) { return (d[timeFieldInCsv] == curTime) ? 6 : 3; })

	}

function drawBarChartLocComparison(locID)
{			
	var filteredData = [];
	var locType = 0;
	var motherId = "";
	var curMotherName = ""
	if (locID.length > 2) // shahrestan - show all shahrestans in the same ostan 
	{
		motherId = locID.substr(0, 2);
		filteredData = csvData.filter(function (p) { return p[locIdFieldInCsv].substr(0, 2) == motherId; });
		locType = 1;
		curMotherName = "استان " + d3.select('[locid="'+locID.substr(0, 2)+'"]').attr('toponame');
	}
	else  // ostan - show all ostans' aggregated data
	{
		motherId = 'iran';
		filteredData = csvData;
		locType = 0;
		curMotherName = "کل کشور";
	}			

	/*provData = _csvData.find(function(x) { return x.Code == d.id});
		colr = 255;
		colg = Math.round(255 - provData[value] / 3000 * 255);
		colb = Math.round(255 - provData[value] / 3000 * 255);
		stylecol = "fill: rgb(" + colr + ',' + colg + ',' + colb + ')'; 
		*/
		//stylecol = "fill: rgb(0, 0, 255)";
	var margin = {top: 10, right: 50, bottom: 50, left: 50},
		width = 600 - margin.left - margin.right,
		height = 230 - margin.top - margin.bottom;

	var x = d3.scale.ordinal()
		.rangeRoundBands([0, width], .3);

	var y = d3.scale.linear()
		.rangeRound([height, 0]);

	var yAxis = d3.svg.axis()
		.scale(y)
		.orient("left");

	var xAxis = d3.svg.axis()
		.scale(x)
		.ticks(0)//.ticks(10, "%");
		.orient("bottom")
	
	var barTitle = d3.select("#locCompare").selectAll('.barTitle').data([1]);
	barTitle.enter().append("div");
	
	barTitle			
		.attr('class', 'barTitle')
		.text(curMotherName);
	
	var svg = d3.select("#ostansvg");

	
	if (svg.attr('locid') != motherId)
	{
		// change in data. remove old elements.
			svg.selectAll("rect")
				.remove();
	}
	svg
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.attr('locid', motherId)
		
	
	svg = svg.selectAll('g').data([1]); // only 1 element is needed. first time append, next times update.
	
	svg.enter().append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
				  
	var selectedValue = getRadioVal("valueSelector");
	var aggregateField = selectedValue.replace("percent.", "");
				
	var oosData = d3.nest()
		.key(function (d) { return locType == 1 ? d[locIdFieldInCsv].substr(2, 2): d[locIdFieldInCsv]; })
		.rollup(function(d) {
			if (selectedValue.startsWith("percent"))
			// case 1: calculate percent
				return Math.trunc(100 * d3.sum(d, function(h) { return h[aggregateField]; }) 
					/ d3.sum(d, function (g) { return g["population.total"]; }));
				
			else
			// case 2:
				return d3.sum(d, function(h) { return h[aggregateField]; });
		}).entries(
			filteredData //csvData.filter(function (p) { return p.Code == d.id; } )
			);
		
	oosData.forEach(function (d) {
		d.loc = d.key;
		if (locType == 0) // ostan
		{					
			d.name = filteredData.find(function(u) { return u[locIdFieldInCsv] == d.key })[
			locNameFieldInCsv];
			d.selected = d.loc == locID;
		}
		else // shahrestan
		{
			d.name = filteredData.find(function(u) { return u[locIdFieldInCsv].substr(2, 2) == d.key})[locNameFieldInCsv];
			d.selected = (motherId + d.loc) == locID;
		}
		d.pop = d.values;
	});
	
	oosData.sort(function (a, b) { return b.pop - a.pop; });
	  
	x.domain(oosData.map(function(d) { return d.name; /*d3.select('[locid="' + d.loc + '"]').attr('toponame'); */}));
	y.domain([0, 1.2*d3.max(oosData, function(d) { return d.pop; })]);

	var axis = svg.selectAll("g.x.axis").data([1]);
	//axis.exit().remove();	
	axis.enter().append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0, " + (height + 20) + ")")
		.call(xAxis)
		.selectAll("text")
			.style("text-anchor", "middle")
			//.attr("transform", "rotate(-90)"
			.attr("dy", ".35em");
		
	axis
		.call(xAxis)
		.selectAll("text")
			.attr("transform", function(d) { return "rotate(-90,"+ this.getAttribute("x") + "," + this.getAttribute("y") + ") translate(25, 0)"; })
			.style("text-anchor", "end");
	axis
		.selectAll("line")
		.remove();

	/*axis.transition()
		.duration(750)
		.call(xAxis)
		.selectAll("text")
			.attr("transform", function(d) { return "rotate(-90,"+ this.getAttribute("x") + "," + this.getAttribute("y") + ")"; })
			.style("text-anchor", "end")
		.selectAll('line')
		.remove();
	*/
	
	axis = svg.selectAll("g.y.axis").data([1]);
	//axis.exit().remove();
	axis.enter().append("g")
		.attr("class", "y axis")
		//.attr("transform", "translate(0, " + -height + ")")
		//.call(yAxis)
		.selectAll("text")
		  //.attr("transform", "rotate(-90)")
		  .attr("y", 6)
		  .attr("dy", ".71em")
		  .style("text-anchor", "end")
		  .text("Population");
	  
	axis
		.call(yAxis);
		 
	var bars = svg.selectAll(".bar")
		.data(oosData, function(d) { return d.loc; });

	//bars.exit().remove();

	// create bars in the first place
	bars.enter().append("rect")
		.classed('bar', true)
		.attr("y", height)//function(d) {return y(d.name); })
		.attr("height", 0)//y.rangeBand())
		.attr("x", function(d) { return x(d.name); })
		.attr("width", x.rangeBand()) //0) //function(d) { return x(d.pop); })
		.attr("loc", function(d) { return d.loc; })
		.attr("locname", function(d) { return d.name;})
		.on('click', function(d) {
			var l = this.getAttribute('loc');
			if (locType == 1)
				l = motherId + l;
			selectLocation(l);
		})
		.on("mousemove", function (d) {
			var selectedValue = getRadioVal("valueSelector");
			var valueTag = selectedValue.startsWith("percent") ? "درصد" : "نفر";
			tooltip2
				.classed('hidden', false)
				.style('left', d3.event.pageX+15)
				.style('top', d3.event.pageY-35)
				.html(this.getAttribute('locname') + "<br>" + numberWithCommas(this.getAttribute('pop')) + " " + valueTag);
		})
		.on("mouseout", function() {
			tooltip2.classed('hidden', true)
		});
			
		// change without transition
		bars
			.classed('selected', function(d) { 
				return d.selected; })
			.attr('style', function(d) {
				return locType == 0 ?
					d3.select("[locid='"+ d.loc +"']").attr("style") 
					:  d3.select("[locid='"+ motherId + d.loc +"']").attr("style");
			})
			.attr("pop", function(d) { return d.pop;} )
		
		// change with transition
		bars.transition()
			.duration(750)
			.attr("y", function(d) { return y(d.pop); })
			.attr("height", function(d) { return height - y(d.pop); })
			.attr("x", function(d) { return x(d.name); });
		
	/*function type(d) {
	  d.pop = +d.pop;
	  return d;
	}*/

}

function timeChange(value)
{
	var aggregateField  = getRadioVal('valueSelector');
	var lowColor = aggregateField.startsWith('buy') ? "Beige" : "Azure" ;//  "#faf0e6"; // linen
	var highColor = aggregateField.startsWith('rent') ? "#DD0000": "SeaGreen"; // "#800000"
	var colorInterpolator = d3.interpolateRgb(lowColor, highColor);				
	
	// filter data by time-field
	maskanData = csvData.filter(function (p) { return p[timeFieldInCsv] == value; } );
	
	var x = d3.scale.linear()
		.range([0, 1])
		.domain([d3.min(csvData, function(d) { return +d["V"]; }), d3.max(csvData, function(d) { return +d["V"]; })]);
		
	d3.selectAll("path.province")
		.attr("style", function(d) {
			provData = maskanData.find(function(x) { return x[locIdFieldInCsv] == d.id});
			if (provData)
			{
			col = colorInterpolator(x(provData["V"]));
			return "fill: " + col;
			}
			else
				return "";
		})
		.attr("pop", function(d) {
			provData = maskanData.find(function(x) { return x[locIdFieldInCsv] == d.id});
			if (provData && provData["V"])
				return Math.round(provData["V"] * 100) / 100;
			else
				return "N/A";
		});
	curTime = value;
	//document.getElementById('timeSliderText').innerHTML = formatTime(curTime);
	drawLineCharts();	
}		

function drawBarCharts(locID)
{
	activateCurOstan(locID);
	drawLineChartLocComparison();
}

function selectLocation(newLocID)
{
	//selectOnMap(newLocID);
	/*if (curLocID != newLocID)
	{
		activateCurOstan(newLocID);
		drawBarCharts(newLocID);
		curLocID = newLocID;
	}*/
	toggleSelection(newLocID);
	drawLineCharts();
}

function toggleSelection(locID) {
	curOstan = d3.select("path[locid='" + locID + "']");
	if (!curOstan.empty())
	{
		curOstan.classed('selected', !curOstan.classed('selected'));
	}
}

function numberWithCommas(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}



function createSlider(divClassName)
{	
	function checkBigStep(value)
	{
		return value%4 ==0;
	}
	window.noUiSlider.create(slider[0], {
		start: 8,
		step: 1,
		connect: false,
		range: {
			'min': 0,
			'max': 18
		},
		pips: {
			mode: 'steps',
			//values: 6,
			density: 50,
			stepped: true,
			filter: function(value, type) { 
				return !checkBigStep(value) ? 2 : 1; },
			format: {
				to: function(value) { return checkBigStep(value) ? (1390 + Math.trunc((value)/4)) : ""; }, 
				from: function(value) { return (1390 + Math.trunc((value)/4) + "" + (value%4)+1); }
			}
		}
	});	
	slider[0].noUiSlider.on('change', function(values, handle) { 
		reformat = (1390 + Math.trunc((values[handle]) / 4) + "" + ((values[handle]%4)+1));
		timeChange(reformat); 
		});
	slider[0].noUiSlider.on('update', function(values, handle) { });
}

// header

function subsetChanged (redrawMap) {
	filterData();
	if (redrawMap)
	{
		drawMap(topoData);
		curLocID = "6";
	}
	timeChange(curTime);
}

function repValueChanged() {
	//console.log(valueSelector.value);
}

function getRadioVal(radioName) {
	var val;
	var radios = document.getElementsByName(radioName);

	for (var i = 0, length = radios.length; i < length; i++) {
		if (radios[i].checked) {
			// do whatever you want with the checked radio
			val = radios[i].value;
			// only one radio can be logically checked, don't check the rest
			break;
		}
	}
	return val;
}

// Return an array of the selected opion values
// select is an HTML select element
function getSelectValues (select) {
  var result = [];
  var options = select && select.options;
  var opt;

  for (var i=0, iLen=options.length; i<iLen; i++) {
	opt = options[i];

	if (opt.selected) {
	  result.push(opt.value || opt.text);
	}
  }
  return result;
}

function getSelectValues_(checkListID)
{
	var result = [];
	items = d3.selectAll(checkListID +" li input");
	items.each(function(d) { 
		if (this.checked)
			result.push(this.value || this.text);
	});
	
	return result;
}

function formatDistrictName(value)
{
	return value == "0" ? "متوسط شهر" : "منطقه " + value;
}