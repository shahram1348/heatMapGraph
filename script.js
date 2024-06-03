const url = "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json";

const padding = 70;
const getMonthName = (monthIndex) => {
  const date = new Date();
  date.setMonth(monthIndex);
  return date.toLocaleString('en-US', { month: 'long' });
};

const div = d3.select('body')
  .append('div')
  .attr('class', 'tooltip')
  .attr('id', 'tooltip')
  .style('opacity', 0);

const tooltip = d3.select('#tooltip');

// Getting data as json file then convert it to array
const req = new XMLHttpRequest();
req.open("GET", url, true);

req.onload = () => {
  const data = JSON.parse(req.responseText);
  const callback = (data) => {
    console.log('data: ', data);
    data.monthlyVariance.forEach( (val) => val.month -= 1);
  }
callback(data);

const dataset = data.monthlyVariance;
const width = 5 * Math.ceil(dataset.length / 12);
const height = 33*12;

const xScale = d3
.scaleBand()
.domain(
  data.monthlyVariance.map( (val) => val.year ))
.range([0, width])
.padding(0);

const svg = d3.select('body')
  .append('svg')
  .attr('width', width + padding )
  .attr('height', height + 3*padding )
  .attr('class', 'graph')
  .append('g')
  .attr('transform', 'translate(' + padding + ',' + 2*padding + ')');

svg.append('text')
  .attr('id', 'title')
  .attr('x', width / 4)
  .attr('y', -padding)
  .attr('font-anchor', 'middle')
  .attr('font-size', '30px')
  .text('Heat Map Graph of Global Temperature')

  svg.append('text')
  .attr('id', 'description')
  .attr('x', width / 3)
  .attr('y', -padding / 2)
  .attr('font-anchor', 'middle')
  .attr('font-size', '20px')
  .text('1753-2015 Global Temperature Map')
const legendColors = ["rgb(69, 117, 180)",
  "rgb(116, 173, 209)",
  "rgb(171, 217, 233)",
  "rgb(224, 243, 248)",              
  "rgb(255, 255, 191)",
  "rgb(254, 224, 144)",
  "rgb(253, 174, 97)",
  "rgb(244, 109, 67)",
  "rgb(215, 48, 39)",
  "rgb(165, 0, 38)"];
const legendWidth = 400;
const legendHeight = 200 / legendColors.length;

const variance = data.monthlyVariance.map( (val) => val.variance );
const minTemp = data.baseTemperature + Math.min.apply(null, variance);
const maxTemp = data.baseTemperature + Math.max.apply(null, variance);

const legendThreshold = d3
.scaleThreshold()
.domain(
( (min, max, count) => {
let array = [];
const step = (max - min) / count;
const base = min;
for (let i = 1; i < count; i++) {
array.push(base + i * step);
}
return array;
})(minTemp, maxTemp, legendColors.length)
)
.range(legendColors);

const x = d3.scaleLinear()
.domain([0, 1])
.range([0, 240]);

const legendX = d3
.scaleLinear()
.domain([minTemp, maxTemp])
.range([0, legendWidth]);

const legendXAxis = d3
.axisBottom()
.scale(legendX)
.tickSize(10, 0)
.tickValues(legendThreshold.domain())
.tickFormat(d3.format('.1f'));

const legend = svg
.append('g')
.classed('legend', true)
.attr('id', 'legend')
.attr(
'transform',
'translate(' +
padding +
',' +
( height + 30 ) +
')'
)
.style('background-color', 'rgba(0, 0, 0, 0.1)') // Add a semi-transparent background
.style('border', '1px solid black'); // Add a border

legend
.append('g')
.selectAll('rect')
.data(
legendThreshold.range().map( (color) => {
const d = legendThreshold.invertExtent(color);
if (d[0] === null) {
d[0] = legendX.domain()[0];
}
if (d[1] === null) {
d[1] = legendX.domain()[1];
}
return d;
})
)
.enter()
.append('rect')
.style('fill',  (d) =>  legendThreshold(d[0]) )
.attr('x', d => legendX(d[0]))
.attr('y', 0)
.attr('width', d =>
d[0] && d[1] ? legendX(d[1]) - legendX(d[0]) : legendX(null)
)
.attr('height', legendHeight);

legend
.append('g')
.attr('transform', 'translate(' + 0 + ',' + legendHeight + ')')
.call(legendXAxis);

const xAxis = d3
  .axisBottom()
  .scale(xScale)
  .tickValues(
    xScale.domain().filter( (year) => year % 10 === 0  /* set ticks to years divisible by 10 */ ))
  .tickFormat( (year) => {
    const date = new Date(0);
    date.setUTCFullYear(year);
    const format = d3.utcFormat('%Y');
    return format(date);
  })
  .tickSize(10, 1);
const yScale = d3
  .scaleBand()
  // months
  .domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
  .rangeRound([0, height])
  .padding(0);

const yAxis = d3
  .axisLeft()
  .scale(yScale)
  .tickValues(yScale.domain())
  .tickFormat( (month) => {
    const date = new Date(0);
    date.setUTCMonth(month);
    const format = d3.utcFormat('%B');
    return format(date);
  })
  .tickSize(10, 1);

  svg.append("g")
    .attr('id', "x-axis")
    .attr("transform", "translate(0," + (height) + ")")
    .call(xAxis);

  svg.append("g")
    .attr('id', "y-axis")
    .attr("transform", "translate(0, 0)")
    .call(yAxis);

    svg
    .append("g")
    .attr('class', "map")
    .selectAll("rect")
    .data(dataset)
    .enter()
    .append("rect")
    .attr("class", "cell")
    .attr("width", (d) => xScale.bandwidth(d.year))
    .attr("height", (d) => yScale.bandwidth(d.month))
    .attr('x', (d) => xScale(d.year))
    .attr("y", (d) => yScale(d.month))
    .attr('data-month', (d) => d.month)
    .attr('data-year', (d) => d.year)
    .attr('data-temp', (d) => data.baseTemperature + d.variance)
    .attr('fill', (d) => {
      return legendThreshold(data.baseTemperature + d.variance);
        }
)
.on('mouseover',  (event, d) => {
  tooltip.style('opacity', 0.9);
  tooltip.attr('data-year', d.year);
  tooltip
    .html(
      d.year + '-' + getMonthName(d.month) + '<br />'
      + 'Average Temperature: ' + (d.variance + data.baseTemperature).toFixed(2) + '°C' + '<br />'
        + 'variance: ' +  d.variance.toFixed(2) + '°C')
    .style('left', (event.pageX + 10) + 'px')
    .style('top', (event.pageY - 28) + 'px');
})
.on('mouseout',  () => {
  tooltip.style('opacity', 0);
});

};

req.send();
