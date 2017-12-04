/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
'use strict';

function EngineSchem() {
    this.basePower = 0;
    this.components =  { 
        Casing: { matCount: 0 },
        'Combustion Internals': {matCount: 0},
        'Mechanical Internals': {matCount: 0},
        Propeller: { matCount: 0 }
    };
    this.name = { case: '', head: '', prop: '', number: '' };
    this.name.toString = () => {
        return (this.name.case + ' ' + this.name.head + ' ' + this.name.prop + this.name.number);
    };
}

EngineSchem.Default = function() {
    var eng = new EngineSchem();
    eng.basePower = 50;
    eng.name.case = 'Ironforge';
    eng.name.head = 'Elite';
    eng.name.prop = 'H';
    eng.name.number = '1';
    eng.components.Casing.matCount = 200;
    eng.components['Combustion Internals'].matCount = 220;
    eng.components['Mechanical Internals'].matCount = 150;
    eng.components.Propeller.matCount = 100;
    return eng;
};

function EngineSet(id = '', count = 0) {
    this.id = id;
    this.count = count;
    this.slots = { 
        Casing: { material: 'Iron' , quality: 1 },
        'Combustion Internals': {material: 'Iron', quality: 1 },
        'Mechanical Internals': {material: 'Iron', quality: 1 },
        Propeller: { material: 'Iron', quality: 1 }
    };
}

Object.deepAssign = function(target, source) {
    var eKeys = Object.keys(target);
    for(var kk in eKeys) {
        if(typeof target[eKeys[kk]] === 'object')
            target[eKeys[kk]] = Object.assign(target[eKeys[kk]], source[eKeys[kk]]);
        else
            target[eKeys[kk]] = source[eKeys[kk]];
    }
    return target;
};

angular.module('waEngineCalc')
        .service('configManager', [
            '$window', '$rootScope',
            function ($window, $rootScope) {
                //alert(shortid.gen());
                this.materialProps = {};
                this.getShipConfig = () =>  {
                    $rootScope.$broadcast('shipConfig:status', 
                        this.shipConfigs[this.currentShipId] );
                };
                this.getEngineList = () => {
                    $rootScope.$broadcast('engineList:status', this.engineList);
                };
                this.addEngineSet = () => {
                    var es = new EngineSet(Object.keys(this.engineConfigs)[0], 2);
                    this.shipConfigs[this.currentShipId].engines.push(es);
                    /*$rootScope.$watch(() => { 
                            return this.shipConfigs[this.currentShipId].engines[this.shipConfigs[this.currentShipId].engines.length - 1].slots.Propeller;
                        },
                        (newVal, oldVal) => {
                            console.log('Engine Set changed ' + newVal);
                        }
                    );*/

                    this.getShipConfig();
                    return es;
                };
                this.getMaterialNames = () => {
                    $rootScope.$broadcast('materialNames:status', Object.keys(this.materialProps));
                };
                this.getEngineSchem = (scope, id) => {
                    scope.$broadcast('engineSchem:status',Object.deepAssign(new EngineSchem(), this.engineConfigs[id]));
                };
                this.removeEngineSet = (setId) => {
                    delete this.shipConfigs[this.currentShipId].engines.splice(setId, 1);
                    this.getShipConfig();
                };
                this.createEngineSchem = () => {
                    let id = shortid.gen();
                    let eng = EngineSchem.Default();
                    eng.id = id;
                    this.engineConfigs[id] = eng;
                    this.engineList.push(eng);
                    return eng;
                };
                this.createEngineSchemAtSet = (setId) => {
                    let eng = this.createEngineSchem();
                    if(eng) {
                        this.shipConfigs[this.currentShipId].engines[setId].id = eng.id;
                        this.getEngineList();
                        this.getShipConfig();
                        
                    }
                };
                //query material power boost table from Google spreadsheet
                sheetrock({
                    url: "https://docs.google.com/spreadsheets/d/1RBskFnl2LbcOv9Dr_eLbeUkFY8h8ZMVhwmT5opuGnNg/edit#gid=0",
                    query: "select B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W limit 12 offset 1",
                    callback: (error, options, response) => {
                        if(!error) {
                            for(var ii = 0; ii<response.rows.length; ii++){
                                var matName = response.rows[ii].cellsArray[0];
                                if(!this.materialProps[matName])
                                    this.materialProps[matName] = {};
                                this.materialProps[matName].unitMass = Number(response.rows[ii].cellsArray[1]);
                                this.materialProps[matName].comb = response.rows[ii].cellsArray.slice(2,12).map(Number);
                                this.materialProps[matName].prop = response.rows[ii].cellsArray.slice(12).map(Number);
                            }
                            this.getMaterialNames();
                            console.log('finished reading data from Spreadsheet');
                        }
                        else
                            alert(error);
                    }
                });
                //fetch the list of engines from persistant storage
                var storage = $window.localStorage.getItem('engineConfigs');
                if(!storage) {
                    this.engineConfigs = {};
                    this.engineConfigs[shortid.gen()] = EngineSchem.Default();
                    $window.localStorage.setItem('engineConfigs', JSON.stringify(this.engineConfigs));
                }
                else
                    this.engineConfigs = JSON.parse(storage);
                //build a list { id, schematicData } for each engine
                this.engineList = [];
                var eIds = Object.keys(this.engineConfigs);
                for(var ee in eIds) {
                    //deep merge of the EngineSchem-prototype with the JSON data
                    var engine = new EngineSchem();
                    Object.deepAssign(engine, this.engineConfigs[eIds[ee]]);
                    engine.id = eIds[ee];
                    this.engineList.push(engine);
                }
                //fetch the list of ship configurations from persistent storage
                storage = $window.localStorage.getItem('shipConfigs');
                if(!storage) {
                    this.shipConfigs = {};
                    this.currentShipId = shortid.gen();
                    this.shipConfigs[this.currentShipId] = 
                        { name: 'Example Ship',
                          engines: []
                        };
                    this.addEngineSet();
                    $window.localStorage.setItem('shipConfigs', JSON.stringify(this.shipConfigs));
                }
                else {
                    this.shipConfigs = JSON.parse(storage);
                    this.currentShipId = Object.keys(this.shipConfigs)[0];
                }
                $rootScope.$broadcast('shipConfig:status', 
                { id: Object.keys(this.shipConfigs)[0], config: this.shipConfigs[this.currentShipId] });
                
            }
        ]
    );


