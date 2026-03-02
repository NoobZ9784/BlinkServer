import { Component, OnInit, OnDestroy } from '@angular/core';
import { Chart } from 'angular-highcharts';
import { Subscription } from 'rxjs';
import { BasicService } from 'src/app/BasicService/basic.service';
import { TrafficChartShow } from 'src/app/models/TrafficChartShow';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  constructor(private bService: BasicService) {
    this.cpuRamChartInstanceSubscription = this.cpuRamChart.ref$.subscribe((chart) => { this.cpuRamChartInstance = chart; });
    this.settingsSubscription = bService.getSettingsObserver().subscribe((data: any) => { this.changeAppearance(data) })
  }

  settingsSubscription: Subscription

  changeAppearance(data: any) {
    let mainEl = (document.getElementById('dashboard') as HTMLElement);
    try {
      if (data.theme === 'D') {
        mainEl.classList.remove('dashboardl');
        mainEl.classList.add('dashboardd');
      } else {
        mainEl.classList.remove('dashboardd');
        mainEl.classList.add('dashboardl');
      }
    } catch (err) { }
  }
  ngOnInit(): void {
    let settings = this.bService.getBlinkSettings();
    let psudoChartData = this.bService.getServerTraffic();
    if (psudoChartData !== null) { this.chartData = psudoChartData }

    this.doCreateTrafficChartData();
    this.reloadInterval = settings.dashboardReloadTimeout;
    this.trafficReloadInterval = settings.trafficReloadInterval;
    this.changeAppearance(settings);
    this.loadCpuRamData();
    this.loadMachineInfo();
    this.loadFileLogs();

    this.trafficInterval = setInterval(() => { this.doCreateTrafficChartData(); }, this.trafficReloadInterval)
    this.timeInterval = setInterval(() => {
      this.loadCpuRamData();
      this.loadMemoryLogs();
    }, this.reloadInterval)
  }
  ngOnDestroy(): void {
    this.settingsSubscription.unsubscribe();
    this.cpuRamChartInstanceSubscription.unsubscribe();
    clearInterval(this.timeInterval);
    clearInterval(this.trafficInterval);
  }


  doCreateTrafficChartData() {
    this.bService.sendReceiveData('get-servers-traffic-Data', 'OK').then(
      (data: any) => {

        for (let chart of Object.keys(data)) {
          if (chart !== 'time' && chart !== 'date') {
            if (!this.chartData[chart]) {
              this.chartData[chart] = {
                totalTraffic: 0,
                data: []
              }
            }
            if (data[chart] > 0) { this.chartData[chart].totalTraffic += data[chart]; }
            this.chartData[chart].data.push({
              traffic: data[chart],
              time: data['time'],
              date: data['date']
            })
          }
        }
        this.tarrficChartSwitch(this.selectedChart);
        this.bService.setServerTraffic(this.chartData);

      },
      (err) => console.error,
    );
  }

  showChart: TrafficChartShow[] = [];
  chartTitle: string = 'Over all traffic';
  selectedChart = 'ALL';
  chartData: any = {};
  maxChartTraffic: number = 0;
  test() {
    console.log(this.showChart)
  }

  tarrficChartSwitch(selectedChart: string) {
    this.showChart = [];
    this.selectedChart = selectedChart;
    this.maxChartTraffic = 0;
    // alert(chart)
    if (selectedChart === 'ALL') {
      for (let chart of Object.keys(this.chartData)) {
        if (this.chartData[chart].totalTraffic > this.maxChartTraffic) { this.maxChartTraffic = this.chartData[chart].totalTraffic }
        let tempChart: TrafficChartShow = {
          time: `${this.chartData[chart].data[0].time} - ${this.chartData[chart].data[this.chartData[chart].data.length - 1].time}`,
          title: chart,
          traffic: this.chartData[chart].totalTraffic,
          date: `${this.chartData[chart].data[0].date} - ${this.chartData[chart].data[this.chartData[chart].data.length - 1].date}`
        }
        this.showChart.push(tempChart);
      }
      this.chartTitle = 'Over all traffic';
    }
    else {
      let ourChart = this.chartData[selectedChart];
      let readyToShowChart: TrafficChartShow[] = [];
      if (ourChart !== null) {
        for (let data of ourChart.data) {
          if (data.traffic > this.maxChartTraffic) { this.maxChartTraffic = data.traffic; }
          let tempChart: TrafficChartShow = {
            time: data.time,
            title: '',
            traffic: data.traffic,
            date: data.date
          }
          readyToShowChart.push(tempChart);
        }
        this.chartTitle = `${selectedChart} (Total : ${ourChart.totalTraffic} Reqs)`;
        this.showChart = readyToShowChart;
      } else {
        alert('chart not found');
      }
    }
  }

  getChartBartHight(traffic: number): number {
    if (traffic < 0) {
      return 0;
    } else {
      return (traffic / this.maxChartTraffic) * 100;
    }
  }




  machineInfo: any = null;
  timeInterval: any = null;
  trafficInterval: any = null;
  cpuRamTimeData: string[] = [];
  ramData: number[] = [];
  cpuData: number[] = [];
  private cpuRamChartInstance: Highcharts.Chart
  private cpuRamChartInstanceSubscription: Subscription;
  logsData: any = [
    { "level": "error", "message": "2024-04-03 21:20:55 : port: 8082 is occupied." },
    { "level": "info", "message": "2024-04-12 13:05:28 : Server with name testProject1 is running on port 3000" },
    { "level": "log", "message": "2024-04-12 13:05:33 : HTTP GET http://localhost:3000/" },
    { "level": "warn", "message": "2024-04-12 13:05:33 : HTTP GET http://localhost:3000/" },
  ];
  reloadInterval: number = 5000;
  trafficReloadInterval: number = 300000;

  cpuRamChart = new Chart({
    chart: {
      type: 'line'
    },
    title: {
      text: 'CPU and Ram usage'
    },
    credits: {
      enabled: false
    },
    xAxis: {
      categories: [] // X-axis categories
    },
    yAxis: {
      title: {
        text: 'Usage in %'
      },
      // Specify Y-axis values here
      min: 0, // Minimum value
      max: 100, // Maximum value
      tickInterval: 10, // Tick interval
      // Additional Y-axis properties
      labels: {
        formatter: function () {
          return this.value + '%'; // Format the Y-axis labels as percentage
        }
      }
    },
    series: [
      {
        name: 'CPU',
        data: []
      } as any,
      {
        name: 'RAM',
        data: []
      } as any,
    ]
  });


  // add point to chart serie
  loadCpuRamData() {
    this.bService.sendReceiveData('get-cpu-ram-stats', 'OK').then(
      (data: any) => {
        if (data.status) {
          this.cpuRamChartInstance.series[0].setData(data.data.cpuUtil);
          this.cpuRamChartInstance.series[1].setData(data.data.ramUtil);
          this.cpuRamChartInstance.xAxis[0].setCategories(data.data.time);
        }
      },
      (err) => console.error
    );
  }
  loadMachineInfo() {
    this.bService.sendReceiveData('get-machine-info', 'ok').then(
      (data: any) => {
        console.log(data);
        if (data.status) {
          this.machineInfo = data.data;
        }
      },
      (err) => console.error
    );
  }
  loadFileLogs() {
    this.bService.sendReceiveData('get-logs-from-file', 'OK').then(
      (data: any) => {
        if (data.status) { this.logsData = data.data; }
        else { this.bService.setShowMsg(data.error) }
      },
      (err) => console.error
    );
  }
  loadMemoryLogs() {
    this.bService.sendReceiveData('get-logs-from-memory', 'OK').then(
      (data: any) => {
        if (data.status) { data.data.forEach((log: any) => { this.logsData.push(log.meta); }); }
        else { this.bService.setShowMsg(data.error) }
      },
      (err) => console.error
    );
  }
  getReversedLogs() { return this.logsData.slice().reverse(); }

  getReversedData(data: any) { return data.slice().reverse(); }

  saveAsLogs() {
    this.bService.sendReceiveData('save-as-logs-data', this.logsData).then(
      (data: any) => {
        if (data.status) { this.bService.setShowMsg('Logs successfully saved') }
        else { this.bService.setShowMsg(data.error) }
      },
      (err) => console.error
    );
  }

  getObjectKeys(data: any): string[] { return Object.keys(data); }
}
