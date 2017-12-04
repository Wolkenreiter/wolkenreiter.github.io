'use strict';

function EngineSchem() {
    this.baseStats = { power: 0 };
    this.components =  { 
        Casing: { matCount: 0 },
        'Combustion Internals': {matCount: 0},
        'Mechanical Internals': {matCount: 0},
        Propeller: { matCount: 0 }
    };
    this.name = { case: '', head: '', prop: '', number: 1 };
    this.name.toString = () => {
        return (this.name.case + ' ' + this.name.head + ' ' + this.name.prop + this.name.number);
    };
}

EngineSchem.Default = function() {
    var eng = new EngineSchem();
    eng.baseStats.power = 50;
    eng.name.case = 'Ironforge';
    eng.name.head = 'Elite';
    eng.name.prop = 'H';
    eng.name.number = 1;
    eng.components.Casing.matCount = 200;
    eng.components['Combustion Internals'].matCount = 220;
    eng.components['Mechanical Internals'].matCount = 150;
    eng.components.Propeller.matCount = 100;
    return eng;
};

// Declare app level module which depends on views, and components
angular.module('waEngineCalc', []).component('app', {
    templateUrl : 'app/app.template.html',
    controller: [ '$scope', '$window',
        function($scope, $window) {
            this.materialData = {};
            this.engineSetBeingEdited = '';
            var app = this;
            
            //entry in the list of currently stored ships
            this.ShipDesc = function () {
                this.id = shortid.gen();
                this.name = 'unnamed ship';
            };
            //an engine set consists of the id of an EngineSchem, the count of that engine 
            //and the actual material configuration for their components
            this.EngineSet = function () {
                this.setId = shortid.gen();
                this.engineId = app.engineList[0].id;
                this.count = 2;
                this.slots = { 
                    Casing: { material: 'Iron' , quality: 5 },
                    'Combustion Internals': {material: 'Iron', quality: 5 },
                    'Mechanical Internals': {material: 'Iron', quality: 5 },
                    Propeller: { material: 'Iron', quality: 5 }
                };
                this.getPower = () => {
                    try {
                        let schem = app.engineList.find((val) => { return val.id === this.engineId; }).schem;
                        return this.count * schem.baseStats.power 
                            * (1 + app.materialData[this.slots['Combustion Internals'].material].comb[this.slots['Combustion Internals'].quality - 1]
                            + app.materialData[this.slots.Propeller.material].prop[this.slots.Propeller.quality - 1]);
                    }
                    catch(e) {
                        return 0;
                    }
                };
                this.getMass = ()=> {
                    try {
                        let schem = app.engineList.find((val) => { return val.id === this.engineId; }).schem;
                        let compKeys = Object.keys(this.slots);
                        let mass = 0;
                        for(let ss in compKeys) 
                            mass += app.materialData[this.slots[compKeys[ss]].material].unitMass * schem.components[compKeys[ss]].matCount;
                        return this.count * mass;
                    }
                    catch(e) {
                        return 0;
                    }
                };
            };
            //the actual ship configuration
            this.ShipConfig = function () {
                this.engines = [];
                this.baseMass = '1000';
                this.addPower = '0';
                this.getPower = () => {
                    if(this.addPower.match('^[\\d\\(\\)\\+\\-\\*\\/\\.]+$'))
                        var power = eval(this.addPower);
                    else
                        var power = 0;
                    for(let ee in this.engines)  
                        power += this.engines[ee].getPower();
                    return power;
                };
                this.getMass = () => {
                    if(this.baseMass.match('^[\\d\\(\\)\\+\\-\\*\\/\\.]+$'))
                        var mass = eval(this.baseMass);
                    else
                        var mass = 0;
                    //let mass = this.baseMass;
                    for(let ee in this.engines)
                        mass+= this.engines[ee].getMass();
                    return mass;
                };
                this.getSpeed = () => {
                    return 50* Math.sqrt(2 * this.getPower()/this.getMass());
                };
            };
            
            this.ShipConfig.Default = function () {
                var c = new app.ShipConfig();
                c.engines = [new app.EngineSet()];
                return c;
            };
            //save the current ship configuration to local storage
            this.saveShipConfig = () => {
                console.log('saving ship config');
                $window.localStorage.setItem('ship:' + this.shipList[0].id, JSON.stringify(this.currentShip));
            };
            this.saveEngineList = () => {
                $window.localStorage.setItem('engines', JSON.stringify(this.engineList));
            };
            //add a new engine set to the current ship configuration
            this.addEngineSet = function () {
                app.currentShip.engines.push(new app.EngineSet());
                this.saveShipConfig();
            };
            this.getEngineSchemById = (schemId) => {
                try {
                    var schem = this.engineList.find((val) => {return val.id === schemId; }).schem;
                    return schem;
                }
                catch(e) {
                    console.log(e + ' : ' + schemId );
                }
            };
            $scope.$on('engineSet:remove', (event, args) => {
                try {
                    this.currentShip.engines.splice(this.currentShip.engines.findIndex((eSet) => { return eSet.setId === args.setId; } ), 1);
                    this.saveShipConfig();
                }
                catch(e) {
                    console.log(e);
                }
            });
            $scope.$on('engineSchem:create', (event, args) => {
                let engine = EngineSchem.Default();
                var engId = shortid.gen();
                //build a default list of engines
                this.engineList.push( { id: engId, schem: engine});
                this.saveEngineList();
                this.currentShip.engines.find((val) => { return val.setId === args.setId; }).engineId = engId;
                this.engineSetBeingEdited = args.setId;
            });
            $scope.$on('engineSchem:changed', (event, args) => {
                this.saveEngineList();
            });
            $scope.$on('engineSchem:startEdit', (event, args) => {
                this.engineSetBeingEdited = args.setId;
                console.log('start schematic editting: ' + args.setId);
            });
            $scope.$on('engineSchem:stopEdit', (event, args) => {
                this.engineSetBeingEdited = '';
            });
            $scope.$on('engineSet:changed', (even, args) => {
                this.saveShipConfig();
            });
            
            this.$onInit = () => {
                //fetch engine data from local storage
                console.log('init started');
                this.engineList = [];
                let storageData = $window.localStorage.getItem('engines');
                if(!storageData) {
                    let engine = EngineSchem.Default();
                    var engId = shortid.gen();
                    //build a default list of engines
                    this.engineList = [ { id: engId, schem: engine}];
                    $window.localStorage.setItem('engines', JSON.stringify(this.engineList));
                }
                else {
                    let engineDataList = JSON.parse(storageData);
                    for(let ee in engineDataList) {
                        this.engineList.push({id: engineDataList[ee].id, schem: _.merge (new EngineSchem(), engineDataList[ee].schem)});
                    }
                }
                storageData = $window.localStorage.getItem('ships');
                if(!storageData) {
                    let shipdesc = new this.ShipDesc();
                    this.shipList = [shipdesc];
                    this.currentShip = this.ShipConfig.Default();
                    $window.localStorage.setItem('ships', JSON.stringify(this.shipList));
                    $window.localStorage.setItem('ship:'+ shipdesc.id, JSON.stringify(this.currentShip));
                }
                else {
                    let shipDataList = JSON.parse(storageData);
                    this.shipList = shipDataList;

                    let storageShipData = $window.localStorage.getItem('ship:' + this.shipList[0].id);
                    if(!storageShipData) {
                        this.currentShip = app.ShipConfig.Default();
                        $window.localStorage.setItem('ship:'+ this.shipList[0].id, JSON.stringify(this.currentShip));
                    }
                    else {
                        this.currentShip =  _.merge(new this.ShipConfig(), JSON.parse(storageShipData));
                        for(let ee in this.currentShip.engines) {
                            this.currentShip.engines[ee] = _.merge(new this.EngineSet(), this.currentShip.engines[ee]);
                        }
                        console.log('Power: ' + this.currentShip.engines[0].getPower());
                    }
                }
                
                //query material power boost table from Google spreadsheet
                sheetrock({
                    url: "https://docs.google.com/spreadsheets/d/1RBskFnl2LbcOv9Dr_eLbeUkFY8h8ZMVhwmT5opuGnNg/edit#gid=0",
                    query: "select B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W limit 12 offset 1",
                    callback: (error, options, response) => {
                        if(!error) {
                            $scope.$apply( ()=> {
                                for(var ii = 0; ii<response.rows.length; ii++){
                                    var matName = response.rows[ii].cellsArray[0];
                                    if(!this.materialData[matName])
                                        this.materialData[matName] = {};
                                    this.materialData[matName].unitMass = Number(response.rows[ii].cellsArray[1]);
                                    this.materialData[matName].comb = response.rows[ii].cellsArray.slice(2,12).map(Number);
                                    this.materialData[matName].prop = response.rows[ii].cellsArray.slice(12).map(Number);
                                }
                                this.materialNames = Object.keys(this.materialData);
                            });
                            console.log('finished reading data from Spreadsheet');
                        }
                        else
                            alert(error);
                    }
                });
            };
        }
    ]
});

/*angular.module('waEngineCalc', [
  'ngRoute',
  'myApp.version'
]).
config(['$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {
  $locationProvider.hashPrefix('!');

  $routeProvider.otherwise({redirectTo: '/view1'});
}]);*/
