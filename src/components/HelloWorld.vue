<template>
	<v-container>
	<input type="text" v-model="txtURL" name="txturl" ref="txtURL" placeholder="URL을 입력해주세요.">
	<input type="button" value="저장" @click="insertURL"/>
	<input type="button" value="조회" @click="selectURL" :disabled="validated == 1"/>
	<ul style="padding-left:0px;">
		<li v-for="(item, index) in items" v-bind:key="index" style="list-style:none;" >
			<canvas v-bind:id="'url_list'+(index+1)" height="70px" ></canvas>
		</li>
	</ul>
	
	<br/>
    <div id="app">
		<ul>
        <li v-for="item in items" v-bind:key="item.seq">
		  <input type="text_none" v-model="item.seq" ref="arrSeq" readonly>
          <input type="text_list" v-model="item.txtURL" ref="arrURL" >
		  <input type="text_list_w70" v-if="item.status==200" style="color:green" v-model="item.status" ref="arrStatus" readonly>
		  <input type="text_list_w70" v-else style="color:red" v-model="item.status" ref="arrStatus" readonly>
		  <input type="button1" value="수정" @click="updateURL(item.seq, item.txtURL)"/>
          <input type="button1" value="삭제" @click="deleteURL(item.seq)"/>
        </li>
      </ul>
	  <div id="dvResult"></div>
		<br/>
		<div id="dvURLstatus"></div>
    </div>	
	</v-container>
</template>

<script>
import Chart from 'chart.js'
import planetChartData from './chart-data.js'
const {ipcRenderer} = window.require('electron')
var cron = require('node-cron');
var myChart;
var myChart1;
var myChart2;
// second minute hour day-of-month month day-of-week
cron.schedule('*/180 * * * *', function(){
	console.log('timing 요청')
	var start = new Date().getTime()
  ipcRenderer.send("insert_url_timing", "timing query 요청", start);
});

var config = {
	type: 'line',
	data: {
		labels: ['5m', '10m', '15m', '20m', '25m', '30m', '40m', '50m'],
		datasets: []
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
window.onload = function(){
}
  export default { 
    name: 'local',
    data() {
      return {
		items: [],
		arr: [],
		seq: '',
		txtURL: '',
		status: '',
		initInt: 0,
		test: 0,
		index: 0,
		validated: 0,
		//planetChartData: planetChartData,
		//config: config,
		arrconfig: []
      }
    },
    methods: {
      selectURL () {
		  this.validated = 1
        ipcRenderer.send("select_url_list", "select query 요청");
	  },
	  insertURL () {
		var start = new Date().getTime()
		ipcRenderer.send("insert_url_list", "insert query 요청", this.txtURL, start);
	  },
	  deleteURL (seq) {
		ipcRenderer.send("delete_url_list", "delete query 요청", seq);
	  },
	  updateURL (seq, url) {
		ipcRenderer.send("update_url_list", "update query 요청", seq, url);
	  },
	  createChart(chartId, chartData, first) {
		const ctx = document.getElementById(chartId);
		const myChart = new Chart(ctx, {
			type: chartData.type,
			data: chartData.data,
			options: chartData.options,
		});
		if(first==true){
			console.log('--------------------업데이트------------------')
            myChart.data.datasets[0].data= planetChartData.data.datasets[0].data
            myChart.update();
		}else{
            //console.log(myChart.data);
		}
	  }
	},
	beforeMount() {
		//this.selectURL()
	},
	mounted() {
		ipcRenderer.on('succes_select_list', (event, arg, status) => {
			this.items.splice(0,)
			var data = JSON.parse(arg).recordset
			for(var i = 0; i < data.length; i++){
				this.items.push({seq: data[i].seq, txtURL: data[i].user_url, status : data[i].url_status})
			}
		});
		ipcRenderer.on('succes_select_timing', (event, arg, oldArrLength) => {
			 var data = JSON.parse(arg).recordset

console.log('!!',data)
			var newDataset1 = {
				label: data[0].url_host,
				borderColor : ['#FF00DD'],
				backgroundColor : ['#FF00DD'],
				data: [0,0,0,0,0,0,0,0,0,0],
				fill: false,
				borderWidth: 3
			}

			var newDataset2 = {
				label: '응답시간',
				borderColor : ['#1DDB16'],
				backgroundColor : ['#1DDB16'],
				data: [0,0,0,0,0,0,0,0,0,0],
				fill: false,
				borderWidth: 3
			}

			for(var i = 0; i < data.length; i++){
				newDataset1.data[i] = data[i].url_status;
				newDataset2.data[i] = data[i].url_total;
			}

			var config2 = {
				type: 'line',
				data: {
					labels: ['5m', '10m', '15m', '20m', '25m', '30m', '35m', '40m'],
					datasets: []
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
			//this.arrconfig.push({config: config2})
			this.arrconfig[this.initInt] = {config: config2}

			// chart에 newDataset 푸쉬
			this.arrconfig[this.initInt].config.data.datasets = []
			this.arrconfig[this.initInt].config.data.datasets.push(newDataset1)
			this.arrconfig[this.initInt].config.data.datasets.push(newDataset2)
			
			const ctx = document.getElementById('url_list'+(this.initInt+1))
			// if(myChart != null){
			// 	myChart.arrconfig[this.initInt-1].config.data.datasets[0].data = newDataset1.data
			// 	myChart.arrconfig[this.initInt-1].config.data.datasets[1].data = newDataset2.data
			// 	myChart.update()
			// }
			myChart = new Chart(ctx, this.arrconfig[this.initInt].config)
			myChart.update()
			
			this.initInt++			
			if(this.initInt == oldArrLength){
				this.initInt = 0
			}
			
			//조회 버튼 disabled
			this.validated = 0
			

			// for(var k = this.arr.length; k<this.arr.length+1; k++){
			// 	if(this.arr[k-1].useyn == 'N'){
			// 		console.log(k)
			// 		this.arr[k-1].useyn = 'Y'
			// 		const ctx = document.getElementById('url_list'+k)
			// 		setTimeout(() => {
			// 			myChart = new Chart(ctx, this.arrconfig[this.initInt].config)
			// 			myChart.update()
			// 		//this.createChart(ctx, this.arrconfig[this.initInt].config, true) 
			// 		this.initInt++
			// 		}, 100);
					
			// 	}else{

			// 	}
			// }
		
// if(this.test == 0){
// 			console.log('실행1')
// 			planetChartData.data.datasets[0].label = data[0].url_host
// 			planetChartData.data.datasets[0].seq = data[0].url_code
// 			planetChartData.data.datasets[0].data = [0,0,0,0,0,0,0,0,0,0]
// 			planetChartData.data.datasets[1].data = [0,0,0,0,0,0,0,0,0,0]
// 			console.log('label',planetChartData.data.datasets[0].label)

// 			for(var i = 0; i < data.length; i++){
// 				planetChartData.data.datasets[0].data[i] = data[i].url_status
// 				planetChartData.data.datasets[1].data[i] = data[i].url_loading
// 			}
// 			//console.log(planetChartData.data.datasets[0].data)
// 			if(oldArrLength > this.arr.length){
// 				this.arr.push({seq: data[0].url_code, url: '', isuseyn: 'N'})
// 			}

// 			const ctx = document.getElementById('url_list1')
// 			setTimeout(() => {
// 				myChart1 = new Chart(ctx, planetChartData)
// 				myChart1.update()	
// 			}, 100);
// 			this.initInt++
// 			// if(this.arr[this.arr.length-1].isuseyn == 'N'){
// 			// 	this.arr[this.arr.length-1].url = 'url_list'+(this.arr.length)
// 			// 	this.arr[this.arr.length-1].isuseyn = 'Y'
// 			// 	//const ctx = document.getElementById('url_list1')
// 			// 	console.log('여기1')
// 			// 	myChart1.update()
// 			// 	//myChart1 = new Chart(ctx, planetChartData)
// 			// 	//this.createChart(this.arr[this.arr.length-1].url, planetChartData, false);
// 			// } else {
// 			// 	this.arr[this.initInt].url = 'url_list'+(this.initInt+1)
// 			// 	console.log('여기2')
// 			// 	myChart1.update()
// 			// 	//this.createChart(this.arr[this.initInt].url, planetChartData, true);
// 			// 	this.initInt++
// 			// }

// 			if(this.initInt == oldArrLength){
// 				this.initInt = 0
// 			}
// 			this.test++

// } else {
// 		/*-----------------------------------------------------------------------*/	
// 		console.log('실행2')
// 			var newDataset1 = {
// 				label: data[0].url_host,
// 				borderColor : 'rgba(54,73,93,.5)',
// 				backgroundColor : '#36495d',
// 				data: [0,0,0,0,0,0,0,0,0,0],
// 				fill: false,
// 				borderWidth: 3
// 			}

// 			var newDataset2 = {
// 				label: '응답시간',
// 				borderColor : 'rgba(134,229,127,.5)',
// 				backgroundColor : '#86E57F',
// 				data: [0,0,0,0,0,0,0,0,0,0],
// 				fill: false,
// 				borderWidth: 3
// 			}

// 			//이전 데이터 초기화
// 			config.data.datasets = [];

// 			for(var i = 0; i < data.length; i++){
// 				newDataset1.data[i] = data[i].url_status
// 				newDataset2.data[i] = data[i].url_loading
// 			}
			
// 			// chart에 newDataset 푸쉬
// 			config.data.datasets.push(newDataset1);
// 			config.data.datasets.push(newDataset2);
	
// 			setTimeout(() => {
// 				const ctx = document.getElementById('url_list2')
// 				myChart2 = new Chart(ctx, config)
// 				myChart2.update()
// 			}, 100);
			
// 			this.test = 0
// }
			
		});
		ipcRenderer.on('succes_insert', (event, arg) => {
			const ctx = document.getElementById('url_list'+this.arrconfig.length)
			ctx.style.display = 'block'
			this.selectURL()
			document.getElementById("dvResult").innerHTML = arg
		});
		ipcRenderer.on('succes_delete', (event, arg) => {
			//삭제버튼 클릭시 마지막 차트, 배열 삭제 후 다시 차트를 그린다
			const ctx = document.getElementById('url_list'+this.arrconfig.length)
			ctx.style.display = 'none'
			this.arrconfig.splice(this.arrconfig.length-1,1)
			myChart = new Chart(ctx, config)
			myChart.destroy()
			this.selectURL()
			document.getElementById("dvResult").innerHTML = arg
		});
		ipcRenderer.on('succes_update', (event, arg) => {
			this.selectURL()
			document.getElementById("dvResult").innerHTML = arg
		});
	},
  }
</script>


<style>
	input {
		margin: 5px 0;
		box-sizing: border-box;
	}
	input[type="text"] {
		padding: 10px 20px;
		border: solid 2px #D2691E;
		border-radius: 8px;
	}
  	input[type="text_none"] {
		display: none;
	}
	input[type="text_list"] {
		border: solid 2px #D2691E;
		border-radius: 8px;
		text-align: center;
	}
	input[type="text_list_w70"] {
		border: solid 2px #D2691E;
		border-radius: 8px;
		text-align: center;
		width: 70px;
	}
	input[type="button"] {
		padding: 10px 20px;
		margin-left: 10px;
		border: solid 2px rgb(162, 177, 192);
		background-color: rgb(162, 177, 192);
		border-radius: 8px;
	}
  input[type="button1"] {
		padding: 5px 10px;
    width: 70px;
    height: 30px;
		border: solid 2px black;
		background-color: rgb(162, 177, 192);
		border-radius: 8px;
    text-align: center;
	}
</style>