export const planetChartData = {
	type: 'line',
	data: {
		labels: ['5m', '10m', '15m', '20m', '25m', '30m', '40m', '50m'],
		datasets: [
			{
				label: 'Number of Moons',
				data: [0, 0, 0, 0, 0, 0, 0, 0],
				fill: false,
				seq: '',
				backgroundColor: [
					'rgba(54,73,93,.5)',
				],
				borderColor: [
					'#36495d',
				],
				borderWidth: 3
			},
			{
				label: '응답시간',
				data: [0, 0, 0, 0, 0, 0, 0, 0],
				fill: false,
				seq: '',
				backgroundColor: [
					'rgba(134,229,127,.5)',
				],
				borderColor: [
					'#86E57F',
				],
				borderWidth: 3
			}
		]
	},
	options: {
		responsive: true,
		lineTension: 1,
		scales: {
			yAxes: [{
				ticks: {
					beginAtZero: true,
					padding: 25,
					min: 0,
					max: 600,
					stepSize: 100
				}
			}]
		}
	}
}

export default planetChartData;